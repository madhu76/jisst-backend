'use strict';

/**
 * Telemetry: error capture (GlitchTip via Sentry SDK) + activity events (Loki via
 * the HomeServer ingest gateway).
 *
 * Design goals (per requirements):
 *   1. Must NEVER slow down or break a user request. Every network call here is
 *      fire-and-forget with a short timeout and swallowed errors.
 *   2. Must survive the HomeServer being down. If the gateway/Sentry is
 *      unreachable, we simply drop the event and move on.
 *   3. Must work on Vercel serverless, where the function can freeze right after
 *      the response is sent. We use @vercel/functions `waitUntil` (when present)
 *      to let background sends finish without delaying the response.
 */

const logger = require('./logger');

const ENV = process.env.NODE_ENV || 'development';
const SENTRY_DSN = process.env.SENTRY_DSN || '';
const INGEST_URL = (process.env.INGEST_URL || '').replace(/\/+$/, '');
const INGEST_TOKEN = process.env.INGEST_TOKEN || '';
const INGEST_TIMEOUT_MS = parseInt(process.env.INGEST_TIMEOUT_MS || '1500', 10);

// ── Background work helper (Vercel-safe) ──────────────────────────────────────
let waitUntil = (p) => {
  if (p && typeof p.catch === 'function') p.catch(() => {});
};
try {
  const vf = require('@vercel/functions');
  if (vf && typeof vf.waitUntil === 'function') {
    waitUntil = (p) => {
      try {
        vf.waitUntil(p);
      } catch (e) {
        if (p && typeof p.catch === 'function') p.catch(() => {});
      }
    };
  }
} catch (e) {
  /* not on Vercel — detached promises are fine for a long-lived server */
}

// ── Sentry / GlitchTip ────────────────────────────────────────────────────────
let Sentry = null;
function initSentry() {
  if (!SENTRY_DSN) {
    logger.info({ feature: 'sentry' }, 'SENTRY_DSN not set — error capture disabled');
    return;
  }
  try {
    Sentry = require('@sentry/node');
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: ENV,
      tracesSampleRate: 0,
      // Keep payloads small and avoid blocking shutdown.
      maxBreadcrumbs: 20,
    });
    logger.info({ feature: 'sentry' }, 'Sentry/GlitchTip initialized');
  } catch (e) {
    Sentry = null;
    logger.warn({ feature: 'sentry', err: e.message }, 'Sentry init failed — continuing without it');
  }
}

function captureException(err, context) {
  try {
    if (!Sentry) return;
    Sentry.withScope((scope) => {
      if (context && context.email) scope.setUser({ email: context.email });
      if (context && context.extra) scope.setExtras(context.extra);
      if (context && context.tags) scope.setTags(context.tags);
      Sentry.captureException(err);
    });
  } catch (e) {
    /* never throw from telemetry */
  }
}

function captureMessage(message, level, context) {
  try {
    if (!Sentry) return;
    Sentry.withScope((scope) => {
      if (context && context.email) scope.setUser({ email: context.email });
      if (context && context.extra) scope.setExtras(context.extra);
      Sentry.captureMessage(message, level || 'info');
    });
  } catch (e) {
    /* noop */
  }
}

/** Flush Sentry in the background so it doesn't delay the response. */
function flush() {
  try {
    if (Sentry && typeof Sentry.flush === 'function') {
      waitUntil(Sentry.flush(2000).catch(() => {}));
    }
  } catch (e) {
    /* noop */
  }
}

// ── Activity events -> ingest gateway -> Loki ─────────────────────────────────
function postEvent(event) {
  if (!INGEST_URL) return Promise.resolve();
  if (typeof fetch !== 'function') return Promise.resolve();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), INGEST_TIMEOUT_MS);

  return fetch(`${INGEST_URL}/server`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${INGEST_TOKEN}`,
    },
    body: JSON.stringify(event),
    signal: controller.signal,
  })
    .catch((err) => {
      // HomeServer down / slow / unreachable — drop silently.
      logger.debug({ feature: 'ingest', err: err && err.message }, 'telemetry post failed (ignored)');
    })
    .finally(() => clearTimeout(timer));
}

/**
 * Record an activity event. Non-blocking: schedules the send in the background.
 * @param {string} type  e.g. 'http_request' | 'audit' | 'error'
 * @param {object} fields arbitrary structured fields (route, status, email, ...)
 */
function track(type, fields) {
  try {
    const event = Object.assign({ type, ts: Date.now() }, fields || {});
    waitUntil(postEvent(event));
  } catch (e) {
    /* noop */
  }
}

// ── Process-level safety nets ─────────────────────────────────────────────────
function installProcessHandlers() {
  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason && reason.message }, 'unhandledRejection');
    captureException(reason instanceof Error ? reason : new Error(String(reason)), {
      tags: { kind: 'unhandledRejection' },
    });
  });
  process.on('uncaughtException', (err) => {
    logger.error({ err: err && err.message }, 'uncaughtException');
    captureException(err, { tags: { kind: 'uncaughtException' } });
  });
}

module.exports = {
  initSentry,
  installProcessHandlers,
  captureException,
  captureMessage,
  track,
  flush,
};
