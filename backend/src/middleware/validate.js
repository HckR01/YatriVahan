import { AppError } from "../lib/errors.js";

export const validate = (schemas) => (req, _res, next) => {
  const validated = {};

  for (const [source, schema] of Object.entries(schemas)) {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: [source, ...issue.path].join("."),
        message: issue.message,
      }));
      return next(new AppError("Request validation failed", 422, "VALIDATION_ERROR", details));
    }
    validated[source] = result.data;
  }

  req.validated = { ...(req.validated ?? {}), ...validated };
  next();
};

