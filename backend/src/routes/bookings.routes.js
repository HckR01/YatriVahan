import { Router } from "express";
import * as controller from "../controllers/booking.controller.js";
import { asyncHandler } from "../lib/async-handler.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  bookingIdParams,
  cancelBookingBody,
  listBookingsQuery,
  updateBookingStatusBody,
} from "../validation/bookings.js";

export const bookingsRouter = Router();
bookingsRouter.use(authenticate);

bookingsRouter.get("/", validate({ query: listBookingsQuery }), asyncHandler(controller.list));
bookingsRouter.get(
  "/:bookingId",
  validate({ params: bookingIdParams }),
  asyncHandler(controller.detail),
);
bookingsRouter.patch(
  "/:bookingId/status",
  validate({ params: bookingIdParams, body: updateBookingStatusBody }),
  asyncHandler(controller.setStatus),
);
bookingsRouter.post(
  "/:bookingId/cancel",
  validate({ params: bookingIdParams, body: cancelBookingBody }),
  asyncHandler(controller.cancel),
);

