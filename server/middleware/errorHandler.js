const errorHandler = (err, req, res, next) => {
  console.error('SERVER_ERROR:', err.stack || err.message);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected server error occurred.';

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || null,
    // stack trace omitted in production
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;
