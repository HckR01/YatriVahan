import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = [20.2961, 85.8245];

const pin = (color, label) =>
  L.divIcon({
    className: "yatri-map-pin-wrap",
    html: `<span class="yatri-map-pin" style="--pin:${color}"><b>${label}</b></span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
  });

const validPoint = (point) => Number.isFinite(Number(point?.lat)) && Number.isFinite(Number(point?.lng));

const popupContent = (title, value) => {
  const wrapper = document.createElement("div");
  const heading = document.createElement("strong");
  const content = document.createElement("div");
  heading.textContent = title;
  content.textContent = value;
  wrapper.append(heading, content);
  return wrapper;
};

export default function RideMap({ origin, destination, currentLocation, className = "h-80", onMapClick }) {
  const elementRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const clickHandlerRef = useRef(onMapClick);

  useEffect(() => {
    clickHandlerRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    if (!elementRef.current || mapRef.current) return undefined;
    const map = L.map(elementRef.current, { zoomControl: false, attributionControl: true }).setView(DEFAULT_CENTER, 9);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    map.on("click", (event) => clickHandlerRef.current?.({ lat: event.latlng.lat, lng: event.latlng.lng }));
    mapRef.current = map;
    window.setTimeout(() => map.invalidateSize(), 50);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    layerRef.current?.remove();
    const layer = L.layerGroup().addTo(map);
    layerRef.current = layer;
    const points = [];

    if (validPoint(origin)) {
      const coords = [Number(origin.lat), Number(origin.lng)];
      L.marker(coords, { icon: pin("#7a1f2a", "A") }).bindPopup(popupContent("Pickup", origin.name || "Origin")).addTo(layer);
      points.push(coords);
    }
    if (validPoint(destination)) {
      const coords = [Number(destination.lat), Number(destination.lng)];
      L.marker(coords, { icon: pin("#ee4b2b", "B") }).bindPopup(popupContent("Destination", destination.name || "Destination")).addTo(layer);
      points.push(coords);
    }
    if (validPoint(currentLocation)) {
      const coords = [Number(currentLocation.lat), Number(currentLocation.lng)];
      L.circleMarker(coords, { radius: 10, color: "#fff", weight: 4, fillColor: "#1677ff", fillOpacity: 1 })
        .bindPopup("Driver’s live position")
        .addTo(layer);
      points.push(coords);
    }
    if (validPoint(origin) && validPoint(destination)) {
      L.polyline(
        [[origin.lat, origin.lng], [destination.lat, destination.lng]],
        { color: "#ee4b2b", weight: 5, opacity: 0.82, dashArray: "10 10" },
      ).addTo(layer);
    }
    if (points.length > 1) map.fitBounds(points, { padding: [42, 42], maxZoom: 14 });
    else if (points.length === 1) map.setView(points[0], 13);
  }, [currentLocation, destination, origin]);

  return (
    <div className={`relative overflow-hidden rounded-[24px] bg-[#eaded7] ${className}`}>
      <div ref={elementRef} className="h-full w-full" aria-label="Ride route map" />
      <span className="pointer-events-none absolute left-3 top-3 z-[500] rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#7a1f2a] shadow-sm">
        OpenStreetMap · live route
      </span>
    </div>
  );
}
