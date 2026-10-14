// No identities, booking details or private trip data leave participant rooms.
export function notifyRideSearch(io) {
  io?.to("ride-search").emit("search:changed", { refresh: true });
}
