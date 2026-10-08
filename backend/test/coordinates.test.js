import assert from "node:assert/strict";
import test from "node:test";
import { validPoint } from "../../src/lib/coordinates.js";

test("empty map inputs never become coordinates or crash Leaflet", () => {
  for (const point of [undefined, null, {}, { lat: null, lng: null }, { lat: "", lng: "" }, { lat: " ", lng: 1 }, { lat: false, lng: 1 }, { lat: NaN, lng: 1 }, { lat: 91, lng: 0 }, { lat: 0, lng: 181 }]) assert.equal(validPoint(point), false);
  assert.equal(validPoint({ lat: 0, lng: 0 }), true);
  assert.equal(validPoint({ lat: "20.2961", lng: "85.8245" }), true);
});
