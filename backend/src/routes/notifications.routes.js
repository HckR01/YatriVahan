import { Router } from "express";
import * as controller from "../controllers/notification.controller.js";
import { asyncHandler } from "../lib/async-handler.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  listNotificationsQuery,
  notificationIdParams,
} from "../validation/notifications.js";

export const notificationsRouter = Router();
notificationsRouter.use(authenticate);

notificationsRouter.get(
  "/",
  validate({ query: listNotificationsQuery }),
  asyncHandler(controller.list),
);
notificationsRouter.patch("/read-all", asyncHandler(controller.markAllRead));
notificationsRouter.patch(
  "/:notificationId/read",
  validate({ params: notificationIdParams }),
  asyncHandler(controller.markRead),
);

