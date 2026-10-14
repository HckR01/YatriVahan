import test from "node:test";
import assert from "node:assert/strict";
import {
  rankMatches,
  indiaDate,
  indiaDeparture,
  dayBounds,
} from "../src/lib/matching.js";
const departureTime = indiaDeparture("2026-11-01", "08:00");
const request = {
  origin: { name: "Astarang" },
  destination: { name: "Bhubaneswar" },
  departureTime,
  seatsTotal: 2,
};
const ride = {
  id: "r1",
  driverId: "driver",
  rideType: "carpool",
  status: "scheduled",
  origin: { name: "Astarang, Odisha" },
  destination: { name: "Bhubaneswar" },
  departureTime,
  seatsAvailable: 3,
  pricePerSeat: 200,
};
const options = { userId: "passenger", now: Date.parse("2026-10-01") };
const rank = (rides, req = request) => rankMatches(rides, req, options);
test("matches same city names regardless of case/spacing and location suffix", () =>
  assert.equal(
    rank([{ ...ride, origin: { name: " ASTARANG , Puri" } }]).length,
    1,
  ));
test("never matches reversed route or similar substring city", () =>
  assert.equal(
    rank([
      { ...ride, origin: ride.destination, destination: ride.origin },
      { ...ride, origin: { name: "New Astarang" } },
    ]).length,
    0,
  ));
test("excludes own, full, cancelled, expired and private rides", () => {
  for (const change of [
    { driverId: "passenger" },
    { seatsAvailable: 1 },
    { status: "cancelled" },
    { departureTime: "2020-01-01" },
    { rideType: "private" },
  ])
    assert.equal(rank([{ ...ride, ...change }]).length, 0);
});
test("keeps matching within two hours and the same India day", () => {
  assert.equal(
    rank([{ ...ride, departureTime: indiaDeparture("2026-11-01", "10:00") }])
      .length,
    1,
  );
  assert.equal(
    rank([{ ...ride, departureTime: indiaDeparture("2026-11-01", "10:01") }])
      .length,
    0,
  );
  const late = {
    ...request,
    departureTime: indiaDeparture("2026-11-01", "23:30"),
  };
  assert.equal(
    rank(
      [{ ...ride, departureTime: indiaDeparture("2026-11-02", "00:15") }],
      late,
    ).length,
    0,
  );
});
test("ranks closest time then lowest price, deterministic ties", () =>
  assert.deepEqual(
    rank([
      {
        ...ride,
        id: "late",
        departureTime: indiaDeparture("2026-11-01", "09:00"),
        pricePerSeat: 1,
      },
      { ...ride, id: "expensive", pricePerSeat: 300 },
      { ...ride, id: "cheap", pricePerSeat: 150 },
    ]).map((r) => r.id),
    ["cheap", "expensive", "late"],
  ));
test("does not expose women-only rides without eligibility", () =>
  assert.equal(rank([{ ...ride, womenOnly: true }]).length, 0));
test("rejects invalid requests", () => {
  for (const change of [
    { seatsTotal: 0 },
    { seatsTotal: 1.5 },
    { departureTime: "invalid" },
    { destination: request.origin },
  ])
    assert.equal(rank([ride], { ...request, ...change }).length, 0);
});
test("mid-route stops must occur in travel order", () => {
  const extended = {
    ...ride,
    origin: { name: "Puri" },
    stops: [
      { name: "Astarang", stopOrder: 1 },
      { name: "Bhubaneswar", stopOrder: 2 },
    ],
    destination: { name: "Cuttack" },
  };
  assert.equal(rank([extended]).length, 1);
  assert.equal(
    rank([
      {
        ...extended,
        stops: [
          { name: "Bhubaneswar", stopOrder: 1 },
          { name: "Astarang", stopOrder: 2 },
        ],
      },
    ]).length,
    0,
  );
});
test("IST date boundaries include local midnight and end of day", () => {
  const bounds = dayBounds("2026-11-01");
  assert.equal(bounds.departureAfter, "2026-10-31T18:30:00.000Z");
  assert.equal(bounds.departureBefore, "2026-11-01T18:29:59.999Z");
  assert.equal(indiaDate(bounds.departureAfter), "2026-11-01");
});
