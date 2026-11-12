const config = require('../config');

function notFoundHandler(req, res) {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
}

// Must be registered last. Known errors (HttpError) keep their message; anything else is a 500.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: status >= 500 ? 'Something went wrong on our side. Please try again.' : err.message,
    ...(config.isProd || status < 500 ? {} : { detail: err.message })
  });
}

module.exports = { notFoundHandler, errorHandler };
