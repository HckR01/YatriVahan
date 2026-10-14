import test from "node:test";
import assert from "node:assert/strict";
import { routeOptions, routeCatalog } from "../src/lib/routeCatalog.js";
import { rankMatches, indiaDeparture } from "../src/lib/matching.js";

test("workbook imports 28 routes with ordered nonempty nodes", () => {
  assert.equal(routeCatalog.length, 28);
  assert.ok(
    routeCatalog.every(
      (r) => r.nodes.length > 1 && r.nodes.every((n) => n.name && n.district),
    ),
  );
});
test("route variants remain separate and can be selected in reverse", () => {
  const options = routeOptions("Konark", "Cuttack");
  assert.equal(options.length, 2);
  assert.ok(options.some((r) => r.nodes.some((n) => n.name === "Pipili")));
  assert.ok(options.some((r) => r.nodes.some((n) => n.name === "Niali")));
  const reverse = routeOptions("Cuttack", "Konark");
  assert.deepEqual(reverse[0].nodes, options[0].nodes.slice().reverse());
});
test("Nimapara alias selects Nimapada route nodes", () => {
  assert.ok(routeOptions("Nimapara", "Bhubaneswar").length);
});
test("mid-route search only matches the selected road variant", () => {
  const time = indiaDeparture("2030-01-01", "09:00");
  const rides = routeOptions("Konark", "Cuttack").map((r) => ({
    id: r.id,
    rideType: "carpool",
    status: "scheduled",
    origin: r.nodes[0],
    destination: r.nodes.at(-1),
    stops: r.nodes.slice(1, -1).map((n, i) => ({ ...n, stopOrder: i + 1 })),
    departureTime: time,
    seatsAvailable: 3,
    pricePerSeat: 200,
  }));
  const request = {
    origin: { name: "Pipili" },
    destination: { name: "Cuttack" },
    departureTime: time,
    seatsTotal: 1,
  };
  const found = rankMatches(rides, request, { now: Date.parse("2029-01-01") });
  assert.equal(found.length, 1);
  assert.match(found[0].id, /pipili/);
  assert.equal(
    rankMatches(
      rides,
      { ...request, origin: request.destination, destination: request.origin },
      { now: Date.parse("2029-01-01") },
    ).length,
    0,
  );
});

test("Astarang routes retain both road variants", () => {
  const routes = routeOptions("Astarang", "Bhubaneswar");
  assert.equal(routes.length, 2);
  assert.ok(routes.some(r => r.nodes.some(n => n.name === "Pipili")));
  assert.ok(routes.some(r => r.nodes.some(n => n.name === "Niali")));
});
