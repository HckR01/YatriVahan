import { z } from "zod";
import {
  booleanQuery,
  dateOnly,
  dateTime,
  idParams,
  latitude,
  locationSchema,
  longitude,
  paginationSchema,
  uuid,
} from "./common.js";

export const rideTypes = ["carpool", "private", "on_demand"];
export const rideStatuses = [
  "draft",
  "scheduled",
  "searching",
  "accepted",
  "arriving",
  "in_progress",
  "completed",
  "cancelled",
];

const stopSchema = locationSchema.extend({
  stopOrder: z.coerce.number().int().min(1),
  eta: dateTime.optional(),
});

const rideFields = {
  origin: locationSchema,
  destination: locationSchema,
  departureTime: dateTime,
  seatsTotal: z.coerce.number().int().min(1).max(12),
  pricePerSeat: z.coerce.number().min(0).max(1_000_000).optional(),
  estimatedFare: z.coerce.number().min(0).max(10_000_000).optional(),
  distanceKm: z.coerce.number().min(0).max(100_000).optional(),
  durationMinutes: z.coerce.number().int().min(1).max(100_000).optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  womenOnly: z.boolean().default(false),
  allowLuggage: z.boolean().default(true),
  vehicleId: uuid.nullable().optional(),
  stops: z.array(stopSchema).max(20).default([]),
};

export const createRideBody = z
  .object({
    rideType: z.enum(rideTypes).default("carpool"),
    ...rideFields,
  })
  .strict();

export const createRideRequestBody = z
  .object({
    rideType: z.enum(["private", "on_demand"]).default("on_demand"),
    ...rideFields,
    seatsTotal: z.coerce.number().int().min(1).max(12).default(1),
  })
  .strict();

export const searchRidesQuery = z
  .object({
    origin: z.string().trim().min(1).max(200).optional(),
    destination: z.string().trim().min(1).max(200).optional(),
    departureDate: dateOnly.optional(),
    departureAfter: dateTime.optional(),
    departureBefore: dateTime.optional(),
    seats: z.coerce.number().int().min(1).max(12).default(1),
    rideType: z.enum(rideTypes).optional(),
    status: z.enum(rideStatuses).optional(),
    womenOnly: booleanQuery,
    maxPrice: z.coerce.number().min(0).optional(),
    ...paginationSchema,
  })
  .strict();

export const rideIdParams = idParams("rideId");

export const updateRideStatusBody = z
  .object({ status: z.enum(rideStatuses) })
  .strict();

export const cancelRideBody = z
  .object({ reason: z.string().trim().max(500).optional() })
  .strict();

export const acceptRideBody = z
  .object({ vehicleId: uuid.optional() })
  .strict();

export const updateDestinationBody = z
  .object({ destination: locationSchema })
  .strict();

export const locationUpdateBody = z
  .object({
    lat: latitude,
    lng: longitude,
    heading: z.coerce.number().min(0).max(360).nullable().optional(),
    speed: z.coerce.number().min(0).max(500).nullable().optional(),
    accuracy: z.coerce.number().min(0).max(100_000).nullable().optional(),
  })
  .strict();

