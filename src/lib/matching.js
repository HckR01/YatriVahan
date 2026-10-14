// Matching is advisory. The server owns availability, authorization and booking writes.
export const MATCH_WINDOW_MINUTES = 120;
const aliases = {
  astaranga: "astarang",
  "chari chhak": "charichhak",
  "chari chakh": "charichhak",
  "nua hata": "nuahata",
  nimapara: "nimapada",
  kendupatana: "kendupatna",
  salipur: "salepur",
  paradip: "paradeep (paradip)",
  paradeep: "paradeep (paradip)",
};
export const placeKey = (value) => {
  const key = String(value || "")
    .split(",")[0]
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  return aliases[key] || key;
};
export const indiaDate = (value) => {
  const d = new Date(value);
  return Number.isFinite(d.getTime())
    ? new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(d)
    : "";
};
export const indiaDeparture = (date, time) =>
  new Date(`${date}T${time}:00+05:30`).toISOString();
export function dayBounds(date) {
  return {
    departureAfter: indiaDeparture(date, "00:00"),
    departureBefore: new Date(
      Date.parse(indiaDeparture(date, "00:00")) + 86400000 - 1,
    ).toISOString(),
  };
}
export function routeScore(ride, request) {
  const from = placeKey(request.origin?.name),
    to = placeKey(request.destination?.name);
  if (!from || !to || from === to) return -1;
  if (
    placeKey(ride.origin?.name) === from &&
    placeKey(ride.destination?.name) === to
  )
    return 0;
  const nodes = [
    ride.origin,
    ...(ride.stops || []).slice().sort((a, b) => a.stopOrder - b.stopOrder),
    ride.destination,
  ].map((n) => placeKey(n?.name));
  const start = nodes.indexOf(from),
    end = nodes.lastIndexOf(to);
  return start >= 0 && end > start ? 1 : -1;
}
export function rankMatches(
  rides,
  request,
  { userId, now = Date.now(), windowMinutes = MATCH_WINDOW_MINUTES } = {},
) {
  const requested = Date.parse(request.departureTime),
    seats = Number(request.seatsTotal);
  if (!Number.isFinite(requested) || !Number.isInteger(seats) || seats < 1)
    return [];
  return rides
    .flatMap((ride) => {
      const time = Date.parse(ride.departureTime),
        route = routeScore(ride, request),
        gap = Math.abs(time - requested) / 60000;
      if (
        ride.status !== "scheduled" ||
        (request.rideType && ride.rideType !== request.rideType) ||
        route < 0 ||
        !Number.isFinite(time) ||
        time <= now ||
        indiaDate(time) !== indiaDate(requested) ||
        gap > windowMinutes ||
        Number(ride.seatsAvailable) < seats ||
        (userId &&
          [ride.driverId, ride.acceptedDriverId, ride.requesterId].includes(
            userId,
          )) ||
        (ride.womenOnly && request.womenOnly !== true)
      )
        return [];
      return [{ ...ride, match: { route, gap } }];
    })
    .sort(
      (a, b) =>
        a.match.route - b.match.route ||
        a.match.gap - b.match.gap ||
        Number(a.pricePerSeat) - Number(b.pricePerSeat) ||
        String(a.id).localeCompare(String(b.id)),
    );
}

export function isFutureDeparture(value) {
  return Date.parse(value) > Date.now();
}
