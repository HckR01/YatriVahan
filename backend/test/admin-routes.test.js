import assert from "node:assert/strict";
import test from "node:test";
import { hashAdminPassword } from "../src/lib/admin-auth.js";

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY = "test-anon-key-not-a-real-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key-not-a-real-key";
process.env.ADMIN_USERNAME = "test-admin";
process.env.ADMIN_PASSWORD_HASH = hashAdminPassword("test-password-only");
process.env.LOG_LEVEL = "silent";
const { createApp } = await import("../src/app.js");
const { supabaseAdmin } = await import("../src/config/supabase.js");

test("admin API rejects anonymous/forged sessions and invalid credentials; login and logout work", async () => {
  const server = createApp().listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1/admin`;
  const post = (body) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  try {
    assert.equal((await fetch(`${base}/users`)).status, 401);
    assert.equal((await fetch(`${base}/users/00000000-0000-4000-8000-000000000001/verification`, { ...post({ verified: true }), method: "PATCH" })).status, 401);
    assert.equal((await fetch(`${base}/users`, { headers: { Authorization: "Bearer supabase-user-jwt" } })).status, 401);
    assert.equal((await fetch(`${base}/login`, post({ username: "test-admin", password: "wrong" }))).status, 401);
    assert.equal((await fetch(`${base}/login`, post({ username: "wrong", password: "test-password-only" }))).status, 401);
    const login = await fetch(`${base}/login`, post({ username: "test-admin", password: "test-password-only" }));
    assert.equal(login.status, 200);
    const { data } = await login.json();
    const headers = { Authorization: `Bearer ${data.token}` };
    assert.equal((await fetch(`${base}/session`, { headers })).status, 200);
    // Stub only this test process: no production users or database records are changed.
    const originalFrom = supabaseAdmin.from;
    const profile = { id: "00000000-0000-4000-8000-000000000001", role: "rider", is_verified: false };
    const updates = [];
    supabaseAdmin.from = table => {
      assert.equal(table, "profiles");
      const builder = {
        select() { return builder; }, eq() { return builder; },
        update(value) { updates.push(value); Object.assign(profile, value); return builder; },
        async maybeSingle() { return { data: { ...profile }, error: null }; },
        async single() { return { data: { ...profile }, error: null }; },
      };
      return builder;
    };
    try {
      const approve = await fetch(`${base}/users/${profile.id}/verification`, { ...post({ verified: true }), method: "PATCH", headers: { ...headers, "Content-Type": "application/json" } });
      assert.equal(approve.status, 200);
      assert.deepEqual(updates[0], { is_verified: true, role: "both" });
      assert.equal((await approve.json()).data.isVerified, true);
      const revoke = await fetch(`${base}/users/${profile.id}/verification`, { ...post({ verified: false }), method: "PATCH", headers: { ...headers, "Content-Type": "application/json" } });
      assert.equal(revoke.status, 200);
      assert.deepEqual(updates[1], { is_verified: false });
      assert.equal((await revoke.json()).data.isVerified, false);
    } finally { supabaseAdmin.from = originalFrom; }
    assert.equal((await fetch(`${base}/users/not-a-uuid/verification`, { ...post({ verified: true }), method: "PATCH", headers: { ...headers, "Content-Type": "application/json" } })).status, 422);
    assert.equal((await fetch(`${base}/logout`, { method: "POST", headers })).status, 200);
    assert.equal((await fetch(`${base}/session`, { headers })).status, 401);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
