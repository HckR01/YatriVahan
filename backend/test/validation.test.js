import assert from "node:assert/strict";
import test from "node:test";
import { updateProfileBody } from "../src/validation/profiles.js";
import { createRideBody, searchRidesQuery } from "../src/validation/rides.js";

const validRide = {
  rideType: "carpool",
  origin: { name: "Astarang Bus Stand", lat: 19.973, lng: 86.27 },
  destination: { name: "Bhubaneswar", lat: 20.296, lng: 85.824 },
  departureTime: "2030-10-07T08:00:00+05:30",
  seatsTotal: "3",
  pricePerSeat: "300",
};

test("ride validation coerces numeric form values and applies safe defaults", () => {
  const parsed = createRideBody.parse(validRide);
  assert.equal(parsed.seatsTotal, 3);
  assert.equal(parsed.pricePerSeat, 300);
  assert.equal(parsed.womenOnly, false);
  assert.equal(parsed.allowLuggage, true);
  assert.deepEqual(parsed.stops, []);
});

test("ride validation rejects invalid coordinates and excess seats", () => {
  assert.equal(
    createRideBody.safeParse({
      ...validRide,
      origin: { ...validRide.origin, lat: 91 },
      seatsTotal: 13,
    }).success,
    false,
  );
});

test("profile updates cannot self-promote role or verification", () => {
  assert.equal(updateProfileBody.safeParse({ role: "driver" }).success, false);
  assert.equal(updateProfileBody.safeParse({ isVerified: true }).success, false);
});

test("ride search pagination is bounded and typed", () => {
  const parsed = searchRidesQuery.parse({ page: "2", limit: "25", seats: "2" });
  assert.deepEqual(
    { page: parsed.page, limit: parsed.limit, seats: parsed.seats },
    { page: 2, limit: 25, seats: 2 },
  );
  assert.equal(searchRidesQuery.safeParse({ limit: 101 }).success, false);
});

