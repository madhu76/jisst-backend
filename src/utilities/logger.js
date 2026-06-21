'use strict';

/**
 * Structured logger (Pino). Writes JSON lines to stdout, which Vercel captures.
 * This is intentionally tiny and dependency-light so it adds negligible overhead.
 */

let logger;
try {
  const pino = require('pino');
  logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    base: { service: 'jisst-backend', env: process.env.NODE_ENV || 'development' },
  });
} catch (e) {
  // Fallback so the app never depends on the logger being installed.
  const write = (level) => (obj, msg) =>
    console.log(JSON.stringify({ level, ts: Date.now(), msg: msg || obj, ...(typeof obj === 'object' ? obj : {}) }));
  logger = { info: write('info'), warn: write('warn'), error: write('error'), debug: write('debug') };
}

module.exports = logger;
