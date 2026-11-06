// Shared error type: services throw it, the global handler turns it into a JSON response
class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

module.exports = ApiError;
