const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = status < 500 ? err.message : 'Internal server error';
  if (status >= 500) console.error(err);
  res.status(status).json({ error: message });
}

module.exports = { asyncHandler, errorHandler };
