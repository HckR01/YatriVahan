import { Router } from "express";
import * as controller from "../controllers/vehicle.controller.js";
import { asyncHandler } from "../lib/async-handler.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createVehicleBody,
  updateVehicleBody,
  vehicleIdParams,
} from "../validation/vehicles.js";

export const vehiclesRouter = Router();
vehiclesRouter.use(authenticate);

vehiclesRouter.get("/mine", asyncHandler(controller.list));
vehiclesRouter.post("/", validate({ body: createVehicleBody }), asyncHandler(controller.create));
vehiclesRouter.patch(
  "/:vehicleId",
  validate({ params: vehicleIdParams, body: updateVehicleBody }),
  asyncHandler(controller.update),
);
vehiclesRouter.delete(
  "/:vehicleId",
  validate({ params: vehicleIdParams }),
  asyncHandler(controller.remove),
);

