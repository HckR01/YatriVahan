import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import * as rideController from "../controllers/ride.controller.js";
import * as bookingController from "../controllers/booking.controller.js";
import { asyncHandler } from "../lib/async-handler.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createBookingBody } from "../validation/bookings.js";
import {
  acceptRideBody,
  cancelRideBody,
  createRideBody,
  createRideRequestBody,
  locationUpdateBody,
  rideIdParams,
  searchRidesQuery,
  updateDestinationBody,
  updateRideStatusBody,
} from "../validation/rides.js";

export const ridesRouter = Router();

const locationLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many location updates" } },
});

ridesRouter.get(
  "/search",
  optionalAuthenticate,
  validate({ query: searchRidesQuery }),
  asyncHandler(rideController.search),
);
ridesRouter.get("/mine", authenticate, asyncHandler(rideController.mine));
ridesRouter.post(
  "/requests",
  authenticate,
  validate({ body: createRideRequestBody }),
  asyncHandler(rideController.createRequest),
);
ridesRouter.post(
  "/",
  authenticate,
  validate({ body: createRideBody }),
  asyncHandler(rideController.create),
);
ridesRouter.get(
  "/:rideId",
  optionalAuthenticate,
  validate({ params: rideIdParams }),
  asyncHandler(rideController.detail),
);
ridesRouter.post(
  "/:rideId/bookings",
  authenticate,
  validate({ params: rideIdParams, body: createBookingBody }),
  asyncHandler(bookingController.create),
);
ridesRouter.post(
  "/:rideId/join",
  authenticate,
  validate({ params: rideIdParams, body: createBookingBody }),
  asyncHandler(bookingController.join),
);
ridesRouter.post(
  "/:rideId/accept",
  authenticate,
  validate({ params: rideIdParams, body: acceptRideBody }),
  asyncHandler(rideController.accept),
);
ridesRouter.patch(
  "/:rideId/status",
  authenticate,
  validate({ params: rideIdParams, body: updateRideStatusBody }),
  asyncHandler(rideController.setStatus),
);
ridesRouter.post(
  "/:rideId/cancel",
  authenticate,
  validate({ params: rideIdParams, body: cancelRideBody }),
  asyncHandler(rideController.cancel),
);
ridesRouter.patch(
  "/:rideId/destination",
  authenticate,
  validate({ params: rideIdParams, body: updateDestinationBody }),
  asyncHandler(rideController.setDestination),
);
ridesRouter.get(
  "/:rideId/location",
  authenticate,
  validate({ params: rideIdParams }),
  asyncHandler(rideController.latestLocation),
);
ridesRouter.post(
  "/:rideId/location",
  authenticate,
  locationLimiter,
  validate({ params: rideIdParams, body: locationUpdateBody }),
  asyncHandler(rideController.updateLocation),
);

