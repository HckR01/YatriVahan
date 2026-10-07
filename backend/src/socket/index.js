import { Server } from "socket.io";
import { z } from "zod";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { supabaseAuth } from "../config/supabase.js";
import { camelizeKeys } from "../lib/case.js";
import { AppError, unauthorized } from "../lib/errors.js";
import { readBearerToken } from "../middleware/auth.js";
import { assertGroupMember, assertRideParticipant } from "../services/access.service.js";
import { createMessage } from "../services/group.service.js";
import {
  saveRideLocation,
  updateDestination,
  updateRideStatus,
} from "../services/ride.service.js";
import { locationSchema, uuid } from "../validation/common.js";
import { locationUpdateBody, rideStatuses } from "../validation/rides.js";

const rideRoomSchema = z.object({ rideId: uuid }).strict();
const groupRoomSchema = z.object({ groupId: uuid }).strict();
const locationEventSchema = locationUpdateBody.extend({ rideId: uuid });
const destinationEventSchema = z
  .object({ rideId: uuid, destination: locationSchema })
  .strict();
const tripStatusEventSchema = z
  .object({ rideId: uuid, status: z.enum(rideStatuses) })
  .strict();
const groupMessageEventSchema = z
  .object({ groupId: uuid, message: z.string().trim().min(1).max(2000) })
  .strict();

function socketToken(socket) {
  const value = socket.handshake.auth?.token;
  if (typeof value !== "string") return null;
  return readBearerToken(value) ?? value.trim();
}

function socketError(error) {
  if (error instanceof AppError) {
    return { code: error.code, message: error.message, details: error.details };
  }
  return { code: "INTERNAL_ERROR", message: "Realtime operation failed" };
}

function parse(schema, payload) {
  const result = schema.safeParse(payload);
  if (result.success) return result.data;
  throw new AppError(
    "Realtime event validation failed",
    422,
    "VALIDATION_ERROR",
    result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  );
}

function onEvent(socket, eventName, handler) {
  socket.on(eventName, async (payload = {}, acknowledgement) => {
    const ack = typeof acknowledgement === "function" ? acknowledgement : () => {};
    try {
      const data = await handler(payload);
      ack({ ok: true, data: camelizeKeys(data) });
    } catch (error) {
      logger.warn({ err: error, eventName, userId: socket.data.user?.id }, "socket event rejected");
      const response = { ok: false, error: socketError(error) };
      ack(response);
      if (typeof acknowledgement !== "function") socket.emit("server:error", response.error);
    }
  });
}

export function configureSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        const allowed = !origin || env.clientOrigins.includes("*") || env.clientOrigins.includes(origin);
        callback(allowed ? null : new Error("Origin is not allowed by CORS"), allowed);
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
    maxHttpBufferSize: 100_000,
    pingInterval: 25_000,
    pingTimeout: 20_000,
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60_000,
      skipMiddlewares: false,
    },
  });

  const userConnections = new Map();

  io.use(async (socket, next) => {
    try {
      const token = socketToken(socket);
      if (!token) throw unauthorized("A Supabase access token is required for realtime access");
      const { data, error } = await supabaseAuth.auth.getUser(token);
      if (error || !data.user) throw unauthorized("The realtime access token is invalid or expired");
      const count = userConnections.get(data.user.id) ?? 0;
      if (count >= env.SOCKET_MAX_CONNECTIONS_PER_USER) {
        throw new AppError("Too many realtime connections", 429, "CONNECTION_LIMIT");
      }
      socket.data.user = data.user;
      socket.data.locationUpdates = new Map();
      next();
    } catch (error) {
      const wrapped = new Error(error.message ?? "Unauthorized");
      wrapped.data = socketError(error);
      next(wrapped);
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.user.id;
    userConnections.set(userId, (userConnections.get(userId) ?? 0) + 1);
    socket.join(`user:${userId}`);

    onEvent(socket, "ride:join", async (payload) => {
      const { rideId } = parse(rideRoomSchema, payload);
      const ride = await assertRideParticipant(rideId, userId);
      await socket.join(`ride:${rideId}`);
      io.to(`ride:${rideId}`).emit("presence:updated", {
        scope: "ride",
        id: rideId,
        userId,
        state: "joined",
      });
      return { rideId, status: ride.status };
    });

    onEvent(socket, "ride:leave", async (payload) => {
      const { rideId } = parse(rideRoomSchema, payload);
      await socket.leave(`ride:${rideId}`);
      socket.to(`ride:${rideId}`).emit("presence:updated", {
        scope: "ride",
        id: rideId,
        userId,
        state: "left",
      });
      return { rideId };
    });

    onEvent(socket, "location:update", async (payload) => {
      const { rideId, ...location } = parse(locationEventSchema, payload);
      const lastUpdate = socket.data.locationUpdates.get(rideId) ?? 0;
      if (Date.now() - lastUpdate < env.SOCKET_LOCATION_MIN_INTERVAL_MS) {
        throw new AppError("Location updates are arriving too quickly", 429, "RATE_LIMITED");
      }
      const saved = await saveRideLocation(rideId, userId, location, io);
      socket.data.locationUpdates.set(rideId, Date.now());
      return saved;
    });

    onEvent(socket, "destination:update", async (payload) => {
      const { rideId, destination } = parse(destinationEventSchema, payload);
      return updateDestination(rideId, userId, destination, io);
    });

    onEvent(socket, "trip:status", async (payload) => {
      const { rideId, status } = parse(tripStatusEventSchema, payload);
      return updateRideStatus(rideId, userId, status, io);
    });

    onEvent(socket, "group:join", async (payload) => {
      const { groupId } = parse(groupRoomSchema, payload);
      await assertGroupMember(groupId, userId);
      await socket.join(`group:${groupId}`);
      io.to(`group:${groupId}`).emit("presence:updated", {
        scope: "group",
        id: groupId,
        userId,
        state: "joined",
      });
      return { groupId };
    });

    onEvent(socket, "group:leave", async (payload) => {
      const { groupId } = parse(groupRoomSchema, payload);
      await socket.leave(`group:${groupId}`);
      socket.to(`group:${groupId}`).emit("presence:updated", {
        scope: "group",
        id: groupId,
        userId,
        state: "left",
      });
      return { groupId };
    });

    onEvent(socket, "group:message", async (payload) => {
      const { groupId, message } = parse(groupMessageEventSchema, payload);
      return createMessage(groupId, userId, message, io);
    });

    socket.on("disconnect", () => {
      const remaining = Math.max(0, (userConnections.get(userId) ?? 1) - 1);
      if (remaining === 0) userConnections.delete(userId);
      else userConnections.set(userId, remaining);
    });
  });

  return io;
}

