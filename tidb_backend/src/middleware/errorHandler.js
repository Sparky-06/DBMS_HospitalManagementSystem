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

  // 1. MySQL / TiDB duplicate key entry
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

  // 2. MySQL / TiDB foreign key reference not found (parent does not exist)
  if (err.errno === 1452 || err.errno === 1216 || err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'FOREIGN_KEY_VIOLATION',
        message: 'Cannot create or update record because the referenced parent record does not exist.',
        details: err.sqlMessage ? [err.sqlMessage] : []
      }
    });
  }

  // 3. MySQL / TiDB foreign key constraint failed on delete/update (child records exist)
  if (err.errno === 1451 || err.errno === 1217 || err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'FOREIGN_KEY_CONFLICT',
        message: 'Cannot delete or update record because dependent child records exist.',
        details: err.sqlMessage ? [err.sqlMessage] : []
      }
    });
  }

  // 4. MySQL / TiDB check constraint violated (e.g., Salary >= 0, Capacity > 0)
  if (err.errno === 3819 || err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'CONSTRAINT_VIOLATION',
        message: 'A database check constraint was violated (e.g. value must be positive).',
        details: err.sqlMessage ? [err.sqlMessage] : []
      }
    });
  }

  // 5. TiDB Cloud Authentication / Connection Error
  const isAccessDenied = err.errno === 1045 || 
    err.code === 'ER_ACCESS_DENIED_ERROR' || 
    (err.sqlMessage && err.sqlMessage.includes('Access denied')) ||
    (err.message && err.message.includes('Access denied'));

  if (isAccessDenied) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'DB_CONNECTION_ERROR',
        message: 'Database authentication failed. Please verify your DB_HOST, DB_USER, DB_PASSWORD, and DB_PORT in tidb_backend/.env.',
        details: err.sqlMessage ? [err.sqlMessage] : (err.message ? [err.message] : [])
      }
    });
  }

  // 6. Explicit status codes or custom application errors
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
