import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { env } from "../config/env.js";
import { supabaseAdmin } from "../config/supabase.js";
import { logger } from "../config/logger.js";
import { createAdminSessions, verifyAdminPassword } from "../lib/admin-auth.js";
import { asyncHandler } from "../lib/async-handler.js";
import { AppError, assertDatabase, notFound, unauthorized } from "../lib/errors.js";
import { sendData } from "../lib/http.js";
import { validate } from "../middleware/validate.js";

export const adminRouter = Router();
const sessions = createAdminSessions();
const fields = "id, full_name, phone, bio, role, is_verified, created_at";
adminRouter.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });

adminRouter.post("/login", rateLimit({
  windowMs: 15 * 60_000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false,
  message: { success: false, error: { message: "Too many login attempts. Try again in 15 minutes." } },
}), validate({ body: z.object({ username: z.string().min(1).max(100), password: z.string().min(1).max(256) }).strict() }), (req, res, next) => {
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD_HASH) {
    return next(new AppError("Admin login is not configured on this backend", 503, "ADMIN_NOT_CONFIGURED"));
  }
  const { username, password } = req.validated.body;
  const correctPassword = verifyAdminPassword(password, env.ADMIN_PASSWORD_HASH);
  if (username !== env.ADMIN_USERNAME || !correctPassword) return next(unauthorized("Invalid admin credentials"));
  sendData(res, sessions.issue());
});

adminRouter.use((req, _res, next) => {
  const token = req.headers.authorization?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!sessions.valid(token)) return next(unauthorized("Admin session expired. Please sign in again."));
  req.adminToken = token;
  next();
});
adminRouter.get("/session", (_req, res) => sendData(res, { authenticated: true }));
adminRouter.post("/logout", (req, res) => { sessions.revoke(req.adminToken); sendData(res, { loggedOut: true }); });
adminRouter.get("/users", validate({ query: z.object({ page: z.coerce.number().int().min(1).max(100000).default(1) }) }), asyncHandler(async (req, res) => {
  const page = req.validated.query.page;
  const result = await supabaseAdmin.from("profiles").select(fields, { count: "exact" })
    .order("created_at", { ascending: false }).range((page - 1) * 25, page * 25 - 1);
  const users = assertDatabase(result, "Unable to load verification queue") ?? [];
  const ids = users.map(user => user.id);
  const vehicles = ids.length ? assertDatabase(await supabaseAdmin.from("vehicles")
    .select("id, owner_id, make, model, color, registration_number, vehicle_type, active")
    .in("owner_id", ids), "Unable to load vehicles") : [];
  sendData(res, { users: users.map(user => ({ ...user, vehicles: vehicles.filter(vehicle => vehicle.owner_id === user.id) })), total: result.count, page });
}));
adminRouter.patch("/users/:userId/verification", validate({
  params: z.object({ userId: z.uuid() }),
  body: z.object({ verified: z.boolean(), role: z.enum(["driver", "both"]).optional() }).strict(),
}), asyncHandler(async (req, res) => {
  const { userId } = req.validated.params;
  const { verified, role } = req.validated.body;
  const existing = assertDatabase(await supabaseAdmin.from("profiles").select("role").eq("id", userId).maybeSingle(), "Unable to load user");
  if (!existing) throw notFound("User");
  const saved = assertDatabase(await supabaseAdmin.from("profiles").update({
    is_verified: verified,
    ...(verified && { role: role ?? (existing.role === "rider" ? "both" : existing.role) }),
  }).eq("id", userId).select(fields).single(), "Unable to update verification");
  logger.info({ admin: env.ADMIN_USERNAME, targetUserId: userId, verified, role: saved.role }, "Admin verification updated");
  sendData(res, saved);
}));
