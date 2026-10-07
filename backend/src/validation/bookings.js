import { z } from "zod";
import { idParams, locationSchema, paginationSchema } from "./common.js";

export const bookingStatuses = ["pending", "confirmed", "cancelled", "completed"];

export const createBookingBody = z
  .object({
    seats: z.coerce.number().int().min(1).max(8).default(1),
    pickup: locationSchema.optional(),
    dropoff: locationSchema.optional(),
    notes: z.string().trim().max(1000).nullable().optional(),
  })
  .strict();

export const bookingIdParams = idParams("bookingId");

export const listBookingsQuery = z
  .object({
    status: z.enum(bookingStatuses).optional(),
    role: z.enum(["passenger", "driver"]).default("passenger"),
    ...paginationSchema,
  })
  .strict();

export const updateBookingStatusBody = z
  .object({ status: z.enum(bookingStatuses) })
  .strict();

export const cancelBookingBody = z
  .object({ reason: z.string().trim().max(500).optional() })
  .strict();

