import { Router } from "express";
import * as controller from "../controllers/group.controller.js";
import { asyncHandler } from "../lib/async-handler.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createGroupBody,
  createMessageBody,
  groupIdParams,
  joinGroupBody,
  listGroupsQuery,
  listMessagesQuery,
} from "../validation/groups.js";

export const groupsRouter = Router();

groupsRouter.get(
  "/",
  optionalAuthenticate,
  validate({ query: listGroupsQuery }),
  asyncHandler(controller.list),
);
groupsRouter.post(
  "/",
  authenticate,
  validate({ body: createGroupBody }),
  asyncHandler(controller.create),
);
groupsRouter.get(
  "/:groupId",
  optionalAuthenticate,
  validate({ params: groupIdParams }),
  asyncHandler(controller.detail),
);
groupsRouter.post(
  "/:groupId/members/me",
  authenticate,
  validate({ params: groupIdParams, body: joinGroupBody }),
  asyncHandler(controller.join),
);
groupsRouter.delete(
  "/:groupId/members/me",
  authenticate,
  validate({ params: groupIdParams }),
  asyncHandler(controller.leave),
);
groupsRouter.get(
  "/:groupId/messages",
  authenticate,
  validate({ params: groupIdParams, query: listMessagesQuery }),
  asyncHandler(controller.messages),
);
groupsRouter.post(
  "/:groupId/messages",
  authenticate,
  validate({ params: groupIdParams, body: createMessageBody }),
  asyncHandler(controller.postMessage),
);

