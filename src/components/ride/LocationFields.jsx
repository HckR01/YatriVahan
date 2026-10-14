import { useState } from "react";
import RideMap from "../map/RideMap";
import { geocodeLocation } from "../../lib/locations";
import { Field } from "../ui/Page";
const places = [
  "Astarang",
  "Bhubaneswar",
  "Cuttack",
  "Puri",
  "Konark",
  "Kakatpur",
  "Nimapara",
  "Pipili",
];
export default function LocationFields({
  origin,
  destination,
  onChange,
  points,
  onPointsChange,
}) {
  const [activePin, setActivePin] = useState("origin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function preview() {
    setBusy(true);
    setError("");
    try {
      const [from, to] = await Promise.all([
        geocodeLocation(origin),
        geocodeLocation(destination),
      ]);
      onPointsChange({ origin: from, destination: to });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Field label="From">
        <input
          disabled={busy}
          required
          maxLength={150}
          list="odisha-places"
          value={origin}
          onFocus={() => setActivePin("origin")}
          onChange={(e) => {
            onChange("origin", e.target.value);
            onPointsChange?.((p) => ({ ...p, origin: null }));
          }}
          placeholder="Starting town"
          autoComplete="off"
        />
      </Field>
      <Field label="To">
        <input
          disabled={busy}
          required
          maxLength={150}
          list="odisha-places"
          value={destination}
          onFocus={() => setActivePin("destination")}
          onChange={(e) => {
            onChange("destination", e.target.value);
            onPointsChange?.((p) => ({ ...p, destination: null }));
          }}
          placeholder="Destination town"
          autoComplete="off"
        />
      </Field>
      {onPointsChange && (
        <div className="journey-map-picker">
          <div className="actions">
            <button
              type="button"
              className="button secondary"
              disabled={busy || !origin.trim() || !destination.trim()}
              onClick={preview}
            >
              {busy ? "Finding route…" : "Preview route"}
            </button>
            <button
              type="button"
              className="text-button"
              aria-pressed={activePin === "origin"}
              onClick={() => setActivePin("origin")}
            >
              Pin pickup
            </button>
            <button
              type="button"
              className="text-button"
              aria-pressed={activePin === "destination"}
              onClick={() => setActivePin("destination")}
            >
              Pin destination
            </button>
          </div>
          <p className="muted small">
            Click the map to set your{" "}
            {activePin === "origin" ? "pickup" : "destination"}. Keep the town
            names above for matching.
          </p>
          {error && <p role="alert">{error}</p>}
          <RideMap
            origin={points?.origin}
            destination={points?.destination}
            onMapClick={(point) =>
              onPointsChange((previous) => ({
                ...previous,
                [activePin]: {
                  ...point,
                  name: activePin === "origin" ? origin : destination,
                },
              }))
            }
            className="h-64"
          />
        </div>
      )}
      <datalist id="odisha-places">
        {places.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
    </>
  );
}
