import "dotenv/config";
import { z } from "zod";

const booleanFromEnv = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  CLIENT_ORIGINS: z.string().default("http://localhost:5173"),
  TRUST_PROXY: booleanFromEnv,
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  SUPABASE_URL: z.url(),
  SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  SOCKET_LOCATION_MIN_INTERVAL_MS: z.coerce.number().int().min(250).max(60_000).default(1000),
  SOCKET_MAX_CONNECTIONS_PER_USER: z.coerce.number().int().min(1).max(20).default(5),
  REQUIRE_DRIVER_VERIFICATION: z.enum(["true", "false"]).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const fields = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
  throw new Error(`Invalid backend environment configuration: ${fields}`);
}

if (parsed.data.NODE_ENV === "production" && parsed.data.REQUIRE_DRIVER_VERIFICATION === "false") {
  throw new Error("REQUIRE_DRIVER_VERIFICATION cannot be false in production");
}

export const env = Object.freeze({
  ...parsed.data,
  clientOrigins: parsed.data.CLIENT_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  requireDriverVerification:
    parsed.data.NODE_ENV === "production" || parsed.data.REQUIRE_DRIVER_VERIFICATION === "true",
});

