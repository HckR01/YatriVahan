import routes from "../data/odishaRoutes.json" with { type: "json" };
import { placeKey } from "./matching.js";
export const routeCatalog = routes;
export const routePlaces = [
  ...new Set(routes.flatMap((r) => r.nodes.map((n) => n.name))),
].sort();
export function routeOptions(origin, destination) {
  const from = placeKey(origin),
    to = placeKey(destination);
  if (!from || !to || from === to) return [];
  return routes.flatMap((route) => {
    const start = route.nodes.findIndex((n) => placeKey(n.name) === from);
    const end = route.nodes.findIndex((n) => placeKey(n.name) === to);
    if (start < 0 || end < 0 || start === end) return [];
    const selected =
      start < end
        ? route.nodes.slice(start, end + 1)
        : route.nodes.slice(end, start + 1).reverse();
    const startKm = Number(selected[0].distanceFromStartKm);
    const forward = start < end;
    const nodes = selected.map((node, index) => {
      const distanceFromStartKm = forward
        ? Number(node.distanceFromStartKm) - startKm
        : startKm - Number(node.distanceFromStartKm);
      return {
        ...node,
        distanceFromStartKm,
        distanceFromPreviousKm:
          index === 0
            ? 0
            : distanceFromStartKm -
              (forward
                ? Number(selected[index - 1].distanceFromStartKm) - startKm
                : startKm - Number(selected[index - 1].distanceFromStartKm)),
      };
    });
    return [
      {
        ...route,
        nodes,
        approximateTotalKm: nodes.at(-1).distanceFromStartKm,
        id: `${route.id}:${start}:${end}`,
      },
    ];
  });
}
