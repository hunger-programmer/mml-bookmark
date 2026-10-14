export type ErrorFields = Record<string, string>;

/**
 * Thrown by services and route helpers; `apiHandler` turns it into the error body.
 * Services never build an HTTP response.
 */
export class AppError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message: string,
    readonly fields?: ErrorFields,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message = "The request is not valid.", fields?: ErrorFields) {
    super("validation_failed", 422, message, fields);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Sign in to continue.") {
    super("unauthorized", 401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You can't do that.") {
    super("forbidden", 403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found.") {
    super("not_found", 404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "This conflicts with existing data.", code = "conflict") {
    super(code, 409, message);
  }
}

export class RateLimitedError extends AppError {
  constructor(
    message = "Too many requests. Try again later.",
    readonly retryAfterSeconds?: number,
  ) {
    super("rate_limited", 429, message);
  }
}
