import { z } from "zod";
import { idParams } from "./common.js";

const fields = {
  make: z.string().trim().min(2).max(60),
  model: z.string().trim().min(1).max(80),
  color: z.string().trim().min(2).max(40),
  registrationNumber: z.string().trim().min(4).max(30).transform((value) => value.toUpperCase()),
  seats: z.coerce.number().int().min(1).max(12),
  vehicleType: z.enum(["bike", "auto", "hatchback", "sedan", "suv", "van", "other"]),
  photoUrl: z.url().nullable().optional(),
  active: z.boolean().optional(),
};

export const createVehicleBody = z.object(fields).strict();
export const updateVehicleBody = z
  .object(Object.fromEntries(Object.entries(fields).map(([key, schema]) => [key, schema.optional()])))
  .strict()
  .refine((body) => Object.keys(body).length > 0, "At least one vehicle field is required");
export const vehicleIdParams = idParams("vehicleId");

