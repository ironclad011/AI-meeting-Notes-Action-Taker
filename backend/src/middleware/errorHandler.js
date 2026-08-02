/**
 * Centralized error handler middleware.
 * Ensures consistent API response shape: { success: false, error: { message } }
 * Never leaks stack traces or sensitive database details to clients.
 */
const errorHandler = (err, req, res, next) => {
  // Log error details internally
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  const statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode;
  const message = err.isPublic ? err.message : (err.statusCode ? err.message : 'An unexpected error occurred on the server.');

  res.status(statusCode).json({
    success: false,
    error: {
      message: message || 'An error occurred processing your request.',
    },
  });
};

module.exports = errorHandler;
