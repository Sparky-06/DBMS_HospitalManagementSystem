/**
 * Standardized Central Error Handling Middleware
 * Intercepts application and database errors and formats them into the canonical contract envelope.
 */

// 404 Not Found Middleware
function notFoundHandler(req, res, next) {
  return res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Resource not found: ${req.method} ${req.originalUrl}`,
      details: []
    }
  });
}

// Global Error Handler
function errorHandler(err, req, res, next) {
  // If response headers already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  // 1. MySQL duplicate key entry
  if (err.errno === 1062 || err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_KEY',
        message: 'A record with the specified identifier or unique constraint already exists.',
        details: err.sqlMessage ? [err.sqlMessage] : []
      }
    });
  }

  // 2. MySQL foreign key reference not found (parent does not exist)
  if (err.errno === 1452 || err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'FOREIGN_KEY_VIOLATION',
        message: 'Cannot create or update record because the referenced parent record does not exist.',
        details: []
      }
    });
  }

  // 3. MySQL foreign key constraint failed on delete/update (child records exist)
  if (err.errno === 1451 || err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'FOREIGN_KEY_CONFLICT',
        message: 'Cannot delete or update record because dependent child records exist.',
        details: []
      }
    });
  }

  // 4. MySQL check constraint violated (e.g., Salary >= 0, Capacity > 0)
  if (err.errno === 3819 || err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'CONSTRAINT_VIOLATION',
        message: 'A database check constraint was violated (e.g. value must be positive).',
        details: []
      }
    });
  }

  // 5. Explicit status codes or custom application errors
  const statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);
  const errorCode = err.code && typeof err.code === 'string' && !err.code.startsWith('ER_') 
    ? err.code 
    : (statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR');

  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: err.message || 'An unexpected internal error occurred.',
      details: err.details || []
    }
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
