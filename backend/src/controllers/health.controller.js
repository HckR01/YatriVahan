import { supabaseAdmin } from "../config/supabase.js";
import { AppError } from "../lib/errors.js";
import { sendData } from "../lib/http.js";

export function health(_req, res) {
  return sendData(res, {
    status: "ok",
    service: "yatri-vahan-backend",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  });
}

export async function readiness(_req, res) {
  const { error } = await supabaseAdmin
    .from("profiles")
    .select("id", { head: true, count: "exact" })
    .limit(1);
  if (error) throw new AppError("Database is not ready", 503, "NOT_READY");
  return sendData(res, { status: "ready", timestamp: new Date().toISOString() });
}

