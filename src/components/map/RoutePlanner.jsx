import { LocateFixed, MapPin, Search } from "lucide-react";
import { useState } from "react";
import { geocodeLocation, getCurrentLocation } from "../../lib/locations";
import RideMap from "./RideMap";

const emptyLocation = { name: "", lat: null, lng: null };

export default function RoutePlanner({ value, onChange, showMap = true }) {
  const route = { origin: emptyLocation, destination: emptyLocation, ...value };
  const [activePin, setActivePin] = useState("origin");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const update = (type, patch) => onChange({ ...route, [type]: { ...route[type], ...patch } });

  const resolve = async (type) => {
    if (!route[type]?.name?.trim()) return;
    setBusy(type);
    setError("");
    try {
      update(type, await geocodeLocation(route[type].name));
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy("");
    }
  };

  const useMyLocation = async () => {
    setBusy("current");
    setError("");
    try {
      update("origin", await getCurrentLocation());
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy("");
    }
  };

  const handleMapClick = (point) => update(activePin, { ...point, name: route[activePin].name || "Pinned location" });
  const inputClass = "min-h-12 w-full rounded-xl border border-[#e7d9d2] bg-white pl-11 pr-12 text-sm text-[#231b1b] outline-none transition focus:border-[#e8462c] focus:ring-4 focus:ring-[#e8462c]/10";

  return (
    <div className={showMap ? "grid gap-5 lg:grid-cols-[0.92fr_1.08fr]" : "space-y-4"}>
      <div className="space-y-4">
        {["origin", "destination"].map((type) => (
          <div key={type}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor={`route-${type}`} className="text-sm font-extrabold text-[#2a2020]">
                {type === "origin" ? "Pickup" : "Destination"}
              </label>
              <button type="button" onClick={() => setActivePin(type)} className={`text-xs font-bold ${activePin === type ? "text-[#e8462c]" : "text-[#776a66]"}`}>
                {activePin === type ? "Pinning on map" : "Pin on map"}
              </button>
            </div>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#e8462c]" size={18} />
              <input
                id={`route-${type}`}
                value={route[type]?.name || ""}
                onFocus={() => setActivePin(type)}
                onChange={(event) => update(type, { name: event.target.value, lat: null, lng: null })}
                className={inputClass}
                placeholder={type === "origin" ? "Area, landmark or address" : "Where are you going?"}
                required
              />
              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => resolve(type)} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[#7a1f2a] hover:bg-[#fff1e8]" aria-label={`Find ${type} on map`}>
                <Search size={16} className={busy === type ? "animate-pulse" : ""} />
              </button>
            </div>
          </div>
        ))}
        <button type="button" onClick={useMyLocation} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#e7d9d2] bg-white px-4 text-sm font-bold text-[#7a1f2a] hover:border-[#e8462c]">
          <LocateFixed size={17} className={busy === "current" ? "animate-pulse" : ""} />
          Use my current pickup
        </button>
        {error && <p role="alert" className="text-sm font-semibold text-[#b3261e]">{error}</p>}
      </div>
      {showMap && <RideMap origin={route.origin} destination={route.destination} onMapClick={handleMapClick} className="h-64 lg:h-full lg:min-h-72" />}
    </div>
  );
}
