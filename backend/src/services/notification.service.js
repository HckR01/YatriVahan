import { supabaseAdmin } from "../config/supabase.js";
import { camelizeKeys } from "../lib/case.js";
import { assertDatabase, notFound } from "../lib/errors.js";
import { getPagination, paginationMeta } from "../lib/http.js";
import { logger } from "../config/logger.js";

export async function createNotification(input, io) {
  const result = await supabaseAdmin
    .from("notifications")
    .insert({
      user_id: input.userId,
      type: input.type ?? "general",
      title: input.title,
      message: input.message,
      data: input.data ?? {},
    })
    .select("*")
    .single();
  const notification = assertDatabase(result, "Unable to create notification");
  io?.to(`user:${input.userId}`).emit("notification:new", camelizeKeys(notification));
  return notification;
}

export async function createNotificationBestEffort(input, io) {
  try {
    return await createNotification(input, io);
  } catch (error) {
    logger.warn({ err: error, userId: input.userId, type: input.type }, "notification delivery failed");
    return null;
  }
}

export async function listNotifications(userId, query) {
  const { from, to } = getPagination(query.page, query.limit);
  let builder = supabaseAdmin
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (query.unreadOnly) builder = builder.is("read_at", null);
  const result = await builder.range(from, to);
  const data = assertDatabase(result, "Unable to load notifications") ?? [];
  return { data, meta: paginationMeta(query.page, query.limit, result.count) };
}

export async function markNotificationRead(userId, notificationId) {
  const result = await supabaseAdmin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();
  const notification = assertDatabase(result, "Unable to mark notification as read");
  if (!notification) throw notFound("Notification");
  return notification;
}

export async function markAllNotificationsRead(userId) {
  const result = await supabaseAdmin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null)
    .select("id");
  const rows = assertDatabase(result, "Unable to mark notifications as read") ?? [];
  return { updated: rows.length };
}

