import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getAccessToken } from "../lib/supabase";

// Events only invalidate results. REST remains the authority for available seats.
export function useSearchRefresh(refresh, enabled = true) {
  const callback = useRef(refresh);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    callback.current = refresh;
  }, [refresh]);
  useEffect(() => {
    if (!enabled) return;
    let disposed = false,
      socket,
      pending;
    const schedule = () => {
      clearTimeout(pending);
      pending = setTimeout(() => {
        if (!disposed) callback.current();
      }, 350);
    };
    const poll = setInterval(schedule, 30000);
    window.addEventListener("focus", schedule);
    getAccessToken()
      .then((token) => {
        if (disposed || !token) return;
        socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
          path: import.meta.env.VITE_SOCKET_PATH || "/socket.io",
          auth: (done) => {
            getAccessToken()
              .then((current) => done({ token: current }))
              .catch(() => done({}));
          },
          reconnectionDelayMax: 5000,
        });
        socket.on("connect", () => {
          socket.emit("search:subscribe", {}, (ack) => {
            if (!disposed && ack?.ok) {
              setConnected(true);
              schedule();
            }
          });
        });
        socket.on("search:changed", schedule);
        socket.on("disconnect", () => setConnected(false));
        socket.on("connect_error", () => setConnected(false));
      })
      .catch(() => {});
    return () => {
      disposed = true;
      clearInterval(poll);
      clearTimeout(pending);
      window.removeEventListener("focus", schedule);
      socket?.disconnect();
    };
  }, [enabled]);
  return connected;
}
