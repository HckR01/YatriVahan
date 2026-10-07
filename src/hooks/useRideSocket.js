import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getAccessToken } from "../lib/supabase";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export const useRideSocket = (rideId) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [live, setLive] = useState({ location: null, destination: null, status: null, booking: null });

  useEffect(() => {
    if (!rideId) return undefined;
    let disposed = false;
    let socket;

    const connect = async () => {
      const token = await getAccessToken();
      if (disposed) return;
      socket = io(SOCKET_URL, {
        path: import.meta.env.VITE_SOCKET_PATH || "/socket.io",
        auth: token ? { token } : {},
        transports: ["websocket", "polling"],
        reconnectionDelayMax: 5000,
      });
      socketRef.current = socket;
      socket.on("connect", () => {
        setConnected(true);
        socket.emit("ride:join", { rideId });
      });
      socket.on("disconnect", () => setConnected(false));
      socket.on("connect_error", () => setConnected(false));
      socket.on("location:updated", (data) => {
        if (!data?.rideId || String(data.rideId) === String(rideId)) setLive((current) => ({ ...current, location: data.location || data }));
      });
      socket.on("destination:updated", (data) => {
        if (!data?.rideId || String(data.rideId) === String(rideId)) setLive((current) => ({ ...current, destination: data.destination || data }));
      });
      socket.on("trip:status_updated", (data) => {
        if (!data?.rideId || String(data.rideId) === String(rideId)) setLive((current) => ({ ...current, status: data.status }));
      });
      socket.on("ride:booking_updated", (data) => setLive((current) => ({ ...current, booking: data })));
    };
    connect();

    return () => {
      disposed = true;
      if (socket) {
        socket.emit("ride:leave", { rideId });
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [rideId]);

  const emit = (event, payload, acknowledgement) => socketRef.current?.emit(event, { rideId, ...payload }, acknowledgement);
  return { connected, live, emit };
};

export const useGroupSocket = (groupId, onMessage) => {
  const callbackRef = useRef(onMessage);
  useEffect(() => {
    callbackRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!groupId) return undefined;
    let socket;
    let disposed = false;
    getAccessToken().then((token) => {
      if (disposed) return;
      socket = io(SOCKET_URL, { auth: token ? { token } : {} });
      socket.on("connect", () => socket.emit("group:join", { groupId }));
      socket.on("group:message_created", (data) => {
        if (!data?.groupId || String(data.groupId) === String(groupId)) callbackRef.current?.(data.message || data);
      });
    });
    return () => {
      disposed = true;
      if (socket) {
        socket.emit("group:leave", { groupId });
        socket.disconnect();
      }
    };
  }, [groupId]);
};
