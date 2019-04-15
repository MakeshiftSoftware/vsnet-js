class BaseError extends Error {
  constructor(message = 'Something went wrong') {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  json() {
    return {
      type: this.type,
      message: this.message,
      errors: this.errors,
      fields: this.fields,
    };
  }
}

class UniqueViolationError extends BaseError {
  constructor(fields) {
    super('Unique constraint violation');
    this.type = 'UniqueConstraintViolation';
    this.responseCode = 409;
    this.fields = fields;
  }
}

class NotFoundError extends BaseError {
  constructor() {
    super('Not found');
    this.type = 'NotFound';
    this.responseCode = 404;
  }
}

class UnauthorizedError extends BaseError {
  constructor() {
    super('Unauthorized');
    this.type = 'Unauthorized';
    this.responseCode = 401;
  }
}

class BadRequestError extends BaseError {
  constructor(message, errors) {
    super('Bad request');
    this.type = 'BadRequest';
    this.responseCode = 400;
    this.errors = errors;
  }
}

module.exports = {
  UniqueViolationError,
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
};
