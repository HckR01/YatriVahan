import assert from "node:assert/strict";
import test from "node:test";
import { camelizeKeys } from "../src/lib/case.js";

test("camelizeKeys converts nested database records without mutating input", () => {
  const input = {
    ride_id: "ride-1",
    nested_value: [{ full_name: "Asha" }],
  };

  assert.deepEqual(camelizeKeys(input), {
    rideId: "ride-1",
    nestedValue: [{ fullName: "Asha" }],
  });
  assert.equal(input.nested_value[0].full_name, "Asha");
});

