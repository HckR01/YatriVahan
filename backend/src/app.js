import { randomUUID } from "node:crypto";
import compression from "compression";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import hpp from "hpp";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { health, readiness } from "./controllers/health.controller.js";
import { asyncHandler } from "./lib/async-handler.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";
import { apiRouter } from "./routes/index.js";

export function isOriginAllowed(origin) {
  return !origin || env.clientOrigins.includes("*") || env.clientOrigins.includes(origin);
}

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  if (env.TRUST_PROXY) app.set("trust proxy", 1);

  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.headers["x-request-id"] || randomUUID(),
      customProps: (req) => ({ userId: req.user?.id }),
    }),
  );
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(
    cors({
      origin(origin, callback) {
        callback(isOriginAllowed(origin) ? null : new Error("Origin is not allowed by CORS"), isOriginAllowed(origin));
      },
      credentials: true,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Authorization", "Content-Type", "X-Request-ID"],
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false, limit: "100kb" }));
  app.use(hpp());

  app.get("/health", health);
  app.get("/api/v1/health", health);
  app.get("/api/v1/ready", asyncHandler(readiness));

  app.use(
    "/api/v1",
    rateLimit({
      windowMs: 15 * 60_000,
      limit: 500,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        success: false,
        error: { code: "RATE_LIMITED", message: "Too many requests; please try again shortly" },
      },
    }),
    apiRouter,
  );

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

