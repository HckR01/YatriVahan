import assert from "node:assert/strict";
import test from "node:test";
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY = "test-anon-key-not-a-real-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key-not-a-real-key";
process.env.LOG_LEVEL = "silent";
const { supabaseAdmin } = await import("../src/config/supabase.js");
const { searchRides } = await import("../src/services/ride.service.js");
const { notifyRideSearch } = await import("../src/services/search-events.js");

test("search returns persisted stops in travel order without one query per ride", async () => {
  const old = supabaseAdmin.from;
  const calls = [];
  supabaseAdmin.from = (table) => {
    calls.push(table);
    const data = table === "rides" ? [{id:"r1"},{id:"r2"}] : [{ride_id:"r1",name:"Pipili",stop_order:1},{ride_id:"r1",name:"Uttara",stop_order:2}];
    const q = { select(){return q;}, order(){return q;}, eq(){return q;}, in(){return q;}, range(){return q;}, then(resolve){return Promise.resolve({data,error:null,count:2}).then(resolve);} };
    return q;
  };
  try {
    const result = await searchRides({page:1,limit:20});
    assert.deepEqual(result.data[0].stops.map(n=>n.name),["Pipili","Uttara"]);
    assert.deepEqual(result.data[1].stops,[]);
    assert.equal(calls.filter(t=>t === "ride_stops").length,1);
  } finally { supabaseAdmin.from = old; }
});
test("search invalidation contains no personal or booking data", () => {
  let emitted;
  notifyRideSearch({to(room){ assert.equal(room,"ride-search"); return {emit(event,payload){emitted={event,payload};}};}});
  assert.deepEqual(emitted,{event:"search:changed",payload:{refresh:true}});
});
