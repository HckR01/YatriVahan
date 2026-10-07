import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashAdminPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyAdminPassword(password, hash) {
  if (!/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(hash ?? "")) return false;
  const [salt, expected] = hash.split(":");
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(expected, "hex"));
}

// Only token digests live on the server. Restarting the server invalidates sessions.
export function createAdminSessions({ ttlMs = 60 * 60_000, now = Date.now } = {}) {
  const sessions = new Map();
  const digest = (token) => createHash("sha256").update(token).digest("hex");
  function prune() {
    for (const [key, expires] of sessions) if (expires <= now()) sessions.delete(key);
  }
  return {
    issue() {
      prune();
      if (sessions.size >= 1000) sessions.delete(sessions.keys().next().value);
      const token = randomBytes(32).toString("hex");
      const expiresAt = now() + ttlMs;
      sessions.set(digest(token), expiresAt);
      return { token, expiresAt };
    },
    valid(token) {
      prune();
      return typeof token === "string" && /^[a-f0-9]{64}$/.test(token) && sessions.has(digest(token));
    },
    revoke(token) { if (typeof token === "string") sessions.delete(digest(token)); },
  };
}
