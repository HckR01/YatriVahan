import { sendData } from "../lib/http.js";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notification.service.js";

export async function list(req, res) {
  const result = await listNotifications(req.user.id, req.validated.query);
  return sendData(res, result.data, { meta: result.meta });
}

export async function markRead(req, res) {
  return sendData(
    res,
    await markNotificationRead(req.user.id, req.validated.params.notificationId),
  );
}

export async function markAllRead(req, res) {
  return sendData(res, await markAllNotificationsRead(req.user.id));
}

