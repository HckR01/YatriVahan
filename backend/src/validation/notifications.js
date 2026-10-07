import { z } from "zod";
import { idParams, paginationSchema } from "./common.js";

export const notificationIdParams = idParams("notificationId");

export const listNotificationsQuery = z
  .object({
    unreadOnly: z.enum(["true", "false"]).transform((value) => value === "true").default(false),
    ...paginationSchema,
  })
  .strict();

