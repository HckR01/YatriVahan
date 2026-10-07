import { z } from "zod";
import { idParams } from "./common.js";

export const profileIdParams = idParams("profileId");

export const searchDriversQuery = z
  .object({
    location: z.string().trim().min(1).max(200).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export const updateProfileBody = z
  .object({
    fullName: z.string().trim().min(2).max(100).optional(),
    phone: z.string().trim().min(7).max(20).nullable().optional(),
    avatarUrl: z.url().nullable().optional(),
    bio: z.string().trim().max(500).nullable().optional(),
    emergencyContact: z
      .object({
        name: z.string().trim().min(2).max(100),
        phone: z.string().trim().min(7).max(20),
        relationship: z.string().trim().max(50).optional(),
      })
      .nullable()
      .optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, "At least one profile field is required");

