import assert from "node:assert/strict";
import test from "node:test";
import { hashAdminPassword, verifyAdminPassword, createAdminSessions } from "../src/lib/admin-auth.js";

test("salted admin hashes verify only the right password", () => {
  const first = hashAdminPassword("test-password-only");
  assert.notEqual(first, hashAdminPassword("test-password-only"));
  assert.equal(verifyAdminPassword("test-password-only", first), true);
  assert.equal(verifyAdminPassword("wrong-password", first), false);
  assert.equal(verifyAdminPassword("anything", "invalid"), false);
});
test("admin sessions expire, revoke and reject forged or user tokens", () => {
  let clock = 100;
  const sessions = createAdminSessions({ now: () => clock, ttlMs: 1000 });
  const first = sessions.issue();
  assert.equal(sessions.valid(first.token), true);
  assert.equal(sessions.valid("a".repeat(64)), false);
  assert.equal(sessions.valid("supabase-user-jwt"), false);
  assert.equal(sessions.valid(undefined), false);
  sessions.revoke(first.token);
  assert.equal(sessions.valid(first.token), false);
  const second = sessions.issue();
  clock = second.expiresAt;
  assert.equal(sessions.valid(second.token), false);
});
