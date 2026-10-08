export function validPoint(point) {
  const validNumber = value => (typeof value === "number" || (typeof value === "string" && value.trim() !== "")) && Number.isFinite(Number(value));
  return !!point && validNumber(point.lat) && validNumber(point.lng)
    && Math.abs(Number(point.lat)) <= 90 && Math.abs(Number(point.lng)) <= 180;
}
