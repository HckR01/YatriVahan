import { z } from "zod";
import { dateOnly, idParams, paginationSchema } from "./common.js";

export const groupIdParams = idParams("groupId");

export const createGroupBody = z
  .object({
    name: z.string().trim().min(3).max(100),
    originName: z.string().trim().min(2).max(200),
    destinationName: z.string().trim().min(2).max(200),
    travelDate: dateOnly,
    preferredTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/, "Use HH:mm format"),
    maxMembers: z.coerce.number().int().min(2).max(100).default(8),
    description: z.string().trim().max(1000).nullable().optional(),
    isPrivate: z.boolean().default(false),
    joinCode: z.string().trim().min(4).max(40).optional(),
  })
  .strict();

export const listGroupsQuery = z
  .object({
    origin: z.string().trim().min(1).max(200).optional(),
    destination: z.string().trim().min(1).max(200).optional(),
    travelDate: dateOnly.optional(),
    joined: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
    ...paginationSchema,
  })
  .strict();

export const listMessagesQuery = z
  .object({ ...paginationSchema })
  .strict();

export const createMessageBody = z
  .object({ message: z.string().trim().min(1).max(2000) })
  .strict();

export const joinGroupBody = z
  .object({ joinCode: z.string().trim().min(4).max(40).optional() })
  .strict();

