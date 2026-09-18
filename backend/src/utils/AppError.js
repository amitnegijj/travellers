/**
 * An error the API knows how to answer with. `code` is the vocabulary the
 * error middleware maps to a status; anything thrown that isn't an AppError
 * is treated as a bug and answered with a flat 500.
 */
export class AppError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }
}
