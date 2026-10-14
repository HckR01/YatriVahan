import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { io as connect } from "socket.io-client";
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY = "test-anon-key-not-a-real-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key-not-a-real-key";
process.env.LOG_LEVEL = "silent";
const { supabaseAuth } = await import("../src/config/supabase.js");
const { configureSocket } = await import("../src/socket/index.js");
const { notifyRideSearch } = await import("../src/services/search-events.js");

test("authenticated search subscriptions receive invalidations; anonymous clients are rejected", {timeout: 10000}, async () => {
  const old = supabaseAuth.auth.getUser;
  supabaseAuth.auth.getUser = async () => ({data:{user:{id:"search-test-user"}},error:null});
  const server = createServer();
  const io = configureSocket(server);
  await new Promise(resolve => server.listen(0,"127.0.0.1",resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const anonymous = connect(url,{transports:["websocket"],reconnection:false});
  const client = connect(url,{auth:{token:"test-token"},transports:["websocket"],reconnection:false,autoConnect:false});
  try {
    await new Promise(resolve => anonymous.once("connect_error",resolve));
    const ready = new Promise((resolve,reject) => {client.once("connect",resolve);client.once("connect_error",reject);});
    client.connect(); await ready;
    const ack = await new Promise(resolve => client.emit("search:subscribe",{},resolve));
    assert.equal(ack.ok,true);
    const event = new Promise(resolve => client.once("search:changed",resolve));
    notifyRideSearch(io);
    assert.deepEqual(await event,{refresh:true});
  } finally { anonymous.disconnect();client.disconnect();await new Promise(resolve => io.close(resolve));supabaseAuth.auth.getUser=old; }
});
