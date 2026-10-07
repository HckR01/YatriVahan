import { AppError } from "../lib/errors.js";

export function notFoundHandler(req, _res, next) {
  next(new AppError(`Route ${req.method} ${req.originalUrl} was not found`, 404, "ROUTE_NOT_FOUND"));
}

export function errorHandler(error, req, res, _next) {
  const status = Number.isInteger(error.status) ? error.status : 500;
  const code = error.code ?? "INTERNAL_ERROR";
  const message = status < 500 ? error.message : "An unexpected error occurred";

  if (status >= 500) {
    req.log?.error({ err: error, requestId: req.id }, "request failed");
  } else {
    req.log?.warn({ err: error, requestId: req.id }, "request rejected");
  }

  const body = {
    success: false,
    error: { code, message },
    requestId: req.id,
  };
  if (error.details) body.error.details = error.details;
  if (error instanceof AppError && error.expose && error.cause && process.env.NODE_ENV !== "production") {
    body.error.cause = error.cause.message;
  }

  res.status(status).json(body);
}

