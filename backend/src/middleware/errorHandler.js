const { validationResult } = require('express-validator');

// ─── Validation Result Handler ────────────────────────────────────────────────
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Cast Error (bad MongoDB ObjectId) ────────────────────────────────────────
const handleCastError = (err) => {
  return {
    statusCode: 400,
    message: `Invalid ${err.path}: ${err.value}. Please provide a valid ID.`,
  };
};

// ─── Duplicate Key Error ──────────────────────────────────────────────────────
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  return {
    statusCode: 409,
    message: `"${value}" already exists for field "${field}". Please use a different value.`,
  };
};

// ─── Mongoose Validation Error ────────────────────────────────────────────────
const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return {
    statusCode: 422,
    message: messages.join('. '),
  };
};

// ─── JWT Errors ───────────────────────────────────────────────────────────────
const handleJWTError = () => ({
  statusCode: 401,
  message: 'Invalid token. Please log in again.',
});

const handleJWTExpiredError = () => ({
  statusCode: 401,
  message: 'Your session has expired. Please log in again.',
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong on the server.';

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
  }

  // Transform known error types
  if (err.name === 'CastError') {
    const formatted = handleCastError(err);
    statusCode = formatted.statusCode;
    message = formatted.message;
  } else if (err.code === 11000) {
    const formatted = handleDuplicateKeyError(err);
    statusCode = formatted.statusCode;
    message = formatted.message;
  } else if (err.name === 'ValidationError') {
    const formatted = handleValidationError(err);
    statusCode = formatted.statusCode;
    message = formatted.message;
  } else if (err.name === 'JsonWebTokenError') {
    const formatted = handleJWTError();
    statusCode = formatted.statusCode;
    message = formatted.message;
  } else if (err.name === 'TokenExpiredError') {
    const formatted = handleJWTExpiredError();
    statusCode = formatted.statusCode;
    message = formatted.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// ─── 404 Not Found Handler ────────────────────────────────────────────────────
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

// ─── Async Error Wrapper ──────────────────────────────────────────────────────
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, notFound, handleValidationErrors, asyncHandler };
