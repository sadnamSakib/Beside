const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const status = error.status || "error";
  const message = error.message || "Something went wrong";
  res.status(statusCode).json({
    status,
    message,
  });
};

module.exports = errorHandler;
