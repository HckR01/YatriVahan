import { createServer } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { configureSocket } from "./socket/index.js";

const app = createApp();
const httpServer = createServer(app);
const io = configureSocket(httpServer);
app.set("io", io);

httpServer.listen(env.PORT, () => {
  logger.info({ port: env.PORT, environment: env.NODE_ENV }, "YatriVahan API listening");
});

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "graceful shutdown started");

  const forceTimer = setTimeout(() => {
    logger.fatal("graceful shutdown timed out");
    process.exit(1);
  }, 10_000);
  forceTimer.unref();

  io.close(() => {
    httpServer.close((error) => {
      clearTimeout(forceTimer);
      if (error) {
        logger.error({ err: error }, "HTTP server shutdown failed");
        process.exit(1);
      }
      logger.info("graceful shutdown complete");
      process.exit(0);
    });
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (error) => {
  logger.error({ err: error }, "unhandled promise rejection");
});
process.on("uncaughtException", (error) => {
  logger.fatal({ err: error }, "uncaught exception");
  shutdown("uncaughtException");
});

