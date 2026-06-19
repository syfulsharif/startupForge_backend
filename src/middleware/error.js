const errorHandler = (err, req, res, next) => {
  console.error('[Error Handled]:', err.stack || err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // Mongoose duplicate key error (11000)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate field value entered: '${field}'. Value must be unique.`;
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map(val => val.message);
  }

  // Mongoose Bad Object ID (CastError)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Resource not found with id of '${err.value}'`;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};

export default errorHandler;
