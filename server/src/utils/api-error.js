// Kelas error kustom ber-status code — dilempar dari service/controller
export default class ApiError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}
