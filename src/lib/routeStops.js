import { geocodeLocation } from "./locations";
// Resolve only a driver's explicitly chosen route. Never infer a road variant.
const cache = new Map();
export async function resolveRouteStops(nodes) {
  const stops = [];
  for (const node of nodes.slice(1, -1)) {
    const query = `${node.name}, ${node.district}`;
    let point = cache.get(query);
    if (!point) {
      // Sequential requests keep the existing geocoder below one request/second.
      await new Promise((resolve) => setTimeout(resolve, 1100));
      point = await geocodeLocation(query);
      cache.set(query, point);
    }
    stops.push({
      name: node.name,
      lat: point.lat,
      lng: point.lng,
      stopOrder: stops.length + 1,
    });
  }
  return stops;
}
