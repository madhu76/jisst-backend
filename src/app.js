const express = require('express');
const app = express();
const cors = require('cors')
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const data = require('./author/data.routes');
const mongoose = require('./db/connection'); //DB connection
const { sendMail } = require('./utilities/emailService');
const logger = require('./utilities/logger');
const telemetry = require('./utilities/telemetry');

telemetry.initSentry();
telemetry.installProcessHandlers();

app.use(cors());

// Best-effort decode of the user's email from the Bearer token for logging only.
// Never throws and never affects the request/response.
function peekEmail(req) {
  try {
    const bearer = req.headers.authorization;
    if (!bearer) return '';
    const token = bearer.split(' ')[1];
    if (!token) return '';
    const decoded = jwt.decode(token, { complete: true });
    return (decoded && decoded.payload && decoded.payload.email) || '';
  } catch (e) {
    return '';
  }
}

// Activity tracking: emit one structured event per request once the response is
// sent. Fully non-blocking — it runs on the 'finish' event, after the user has
// already received their response.
app.use((req, res, next) => {
  const requestId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    try {
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      const email = peekEmail(req);
      const route = (req.baseUrl || '') + ((req.route && req.route.path) || req.path || '');
      const fields = {
        requestId,
        method: req.method,
        path: req.originalUrl ? req.originalUrl.split('?')[0] : req.path,
        route,
        status: res.statusCode,
        durationMs: Math.round(durationMs * 100) / 100,
        email,
        id: req.params && req.params.id,
        ip: req.headers['x-forwarded-for'] || req.ip,
        userAgent: req.headers['user-agent'],
      };
      telemetry.track('http_request', fields);
      if (res.statusCode >= 500) {
        logger.error(fields, 'request failed');
        telemetry.captureMessage(`HTTP ${res.statusCode} ${req.method} ${route}`, 'error', {
          email,
          extra: fields,
        });
        telemetry.flush();
      }
    } catch (e) {
      /* never let logging affect the request */
    }
  });

  next();
});

app.get('/', (req, res) => {
  res.json({
    "message": "Hello from eps"
  })
});
app.use(
  '/author',
  data,
);

// Global error handler — captures thrown / next(err) errors with stack traces.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  try {
    logger.error({ err: err && err.message, requestId: req && req.requestId }, 'unhandled error');
    telemetry.captureException(err, { email: peekEmail(req), extra: { requestId: req && req.requestId } });
    telemetry.flush();
  } catch (e) {
    /* noop */
  }
  if (res.headersSent) return next(err);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;

