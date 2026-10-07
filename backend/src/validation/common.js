import { z } from "zod";

export const uuid = z.uuid();

export const latitude = z.coerce.number().min(-90).max(90);
export const longitude = z.coerce.number().min(-180).max(180);

export const locationSchema = z.object({
  name: z.string().trim().min(2).max(200),
  lat: latitude,
  lng: longitude,
});

export const optionalLocationSchema = locationSchema.partial().refine(
  (value) => Object.keys(value).length === 0 || Boolean(value.name),
  { message: "A location name is required when coordinates are supplied" },
);

export const dateTime = z.string().refine(
  (value) => !Number.isNaN(Date.parse(value)),
  "Must be a valid ISO date-time",
);

export const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must use YYYY-MM-DD format");

export const booleanQuery = z
  .enum(["true", "false"])
  .transform((value) => value === "true")
  .optional();

export const paginationSchema = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const idParams = (name) => z.object({ [name]: uuid });

