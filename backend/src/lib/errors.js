export class AppError extends Error {
  constructor(message, status = 500, code = "INTERNAL_ERROR", details) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.expose = status < 500;
  }
}

export const badRequest = (message, details) =>
  new AppError(message, 400, "BAD_REQUEST", details);

export const unauthorized = (message = "Authentication is required") =>
  new AppError(message, 401, "UNAUTHORIZED");

export const forbidden = (message = "You do not have permission to do that") =>
  new AppError(message, 403, "FORBIDDEN");

export const notFound = (resource = "Resource") =>
  new AppError(`${resource} not found`, 404, "NOT_FOUND");

export const conflict = (message) => new AppError(message, 409, "CONFLICT");

export function fromSupabase(error, fallbackMessage = "Database operation failed") {
  if (!error) return null;

  if (error.code === "23505") {
    return conflict("A record with these details already exists");
  }
  if (error.code === "23503" || error.code === "23514" || error.code === "22P02") {
    return badRequest("The supplied data violates a database constraint");
  }
  if (error.code === "PGRST116") {
    return notFound();
  }

  const wrapped = new AppError(fallbackMessage, 500, "DATABASE_ERROR");
  wrapped.cause = error;
  return wrapped;
}

export function assertDatabase(result, fallbackMessage) {
  if (result.error) throw fromSupabase(result.error, fallbackMessage);
  return result.data;
}

