import { Router } from "express";
import * as controller from "../controllers/profile.controller.js";
import { asyncHandler } from "../lib/async-handler.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  profileIdParams,
  searchDriversQuery,
  updateProfileBody,
} from "../validation/profiles.js";

export const profilesRouter = Router();

profilesRouter.get("/drivers", validate({ query: searchDriversQuery }), asyncHandler(controller.drivers));
profilesRouter.get("/me", authenticate, asyncHandler(controller.me));
profilesRouter.patch(
  "/me",
  authenticate,
  validate({ body: updateProfileBody }),
  asyncHandler(controller.updateMe),
);
profilesRouter.delete("/me", authenticate, asyncHandler(controller.deleteMe));
profilesRouter.get(
  "/:profileId",
  validate({ params: profileIdParams }),
  asyncHandler(controller.publicProfile),
);

