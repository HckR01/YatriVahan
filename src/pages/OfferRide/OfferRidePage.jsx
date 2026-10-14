import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Page, { Field, Notice } from "../../components/ui/Page";
import LocationFields from "../../components/ride/LocationFields";
import { ridesApi, vehiclesApi, profileApi } from "../../lib/api";
import { routeOptions } from "../../lib/routeCatalog";
import { resolveRouteStops } from "../../lib/routeStops";
import { validPoint } from "../../lib/coordinates";
import { geocodeLocation } from "../../lib/locations";
import {
  indiaDate,
  indiaDeparture,
  placeKey,
  isFutureDeparture,
} from "../../lib/matching";
export default function OfferRidePage() {
  const [routeId, setRouteId] = useState("");
  const [points, setPoints] = useState({});
  const [today] = useState(() => indiaDate(Date.now()));
  const navigate = useNavigate();
  const [form, setForm] = useState(() => ({
      origin: "",
      destination: "",
      date: indiaDate(Date.now()),
      time: "",
      seats: 1,
      price: "",
      vehicleId: "",
      notes: "",
      pickup: "",
      rideType: "carpool",
    })),
    [vehicles, setVehicles] = useState([]),
    [profile, setProfile] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    Promise.all([vehiclesApi.mine(), profileApi.me()])
      .then(([v, p]) => {
        if (live) {
          setVehicles(v.filter((x) => x.active !== false));
          setProfile(p);
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);
  const options = routeOptions(form.origin, form.destination);
  const selectedRoute = options.find((r) => r.id === routeId);
  const update = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (["origin", "destination"].includes(k)) {
      setRouteId("");
    }
  };
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setError("");
    if (placeKey(form.origin) === placeKey(form.destination))
      return setError("Choose different starting and destination towns.");
    const departureTime = indiaDeparture(form.date, form.time);
    if (!isFutureDeparture(departureTime))
      return setError("Choose a departure time in the future.");
    setBusy(true);
    try {
      const [origin, destination] = await Promise.all([
        validPoint(points.origin)
          ? points.origin
          : geocodeLocation(form.origin),
        validPoint(points.destination)
          ? points.destination
          : geocodeLocation(form.destination),
      ]);
      const stops = selectedRoute
        ? await resolveRouteStops(selectedRoute.nodes)
        : [];
      const ride = await ridesApi.create({
        stops,
        rideType: form.rideType,
        origin: { ...origin, name: form.origin.trim() },
        destination: { ...destination, name: form.destination.trim() },
        departureTime,
        seatsTotal: Number(form.seats),
        pricePerSeat:
          form.rideType === "private"
            ? Number(form.price) / Number(form.seats)
            : Number(form.price),
        ...(form.rideType === "private"
          ? { estimatedFare: Number(form.price) }
          : {}),
        vehicleId: form.vehicleId,
        notes: [form.pickup && `Pickup: ${form.pickup}`, form.notes]
          .filter(Boolean)
          .join("\n"),
      });
      navigate(`/rides/${ride.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const vehicle = vehicles.find((v) => v.id === form.vehicleId);
  return (
    <Page
      title="Offer a Ride"
      description="Share your journey and offer your empty seats."
    >
      <Notice error>{error}</Notice>
      <form onSubmit={submit} className="content-sidebar">
        <section className="card form-card">
          <div className="row">
            <h2>Journey details</h2>
            {profile?.isVerified && (
              <span className="badge success">Verified profile</span>
            )}
          </div>
          <div className="form-grid">
            <Field label="Your vehicle">
              <select
                required
                value={form.vehicleId}
                onChange={(e) => update("vehicleId", e.target.value)}
              >
                <option value="">Choose a vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} · {v.registrationNumber}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Ride type">
              <select
                value={form.rideType}
                onChange={(e) => update("rideType", e.target.value)}
              >
                <option value="carpool">Shared seats</option>
                <option value="private">Full car</option>
              </select>
            </Field>
            <LocationFields
              origin={form.origin}
              destination={form.destination}
              onChange={update}
              points={points}
              onPointsChange={setPoints}
            />
            <div className="journey-map-picker">
              <Field label="Route via towns">
                <select
                  value={selectedRoute?.id || ""}
                  disabled={busy}
                  onChange={(e) => {
                    setRouteId(e.target.value);
                  }}
                >
                  <option value="">
                    Endpoints only — no intermediate boarding
                  </option>
                  {options.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label} · via{" "}
                      {r.nodes
                        .slice(1, -1)
                        .map((n) => n.name)
                        .join(", ")}
                    </option>
                  ))}
                </select>
              </Field>
              {selectedRoute ? (
                <p className="muted small">
                  Via: {selectedRoute.nodes.slice(1, -1).map((n) => n.name).join(" · ") || "direct route"}
                </p>
              ) : (
                <p className="muted small">
                  Choose a saved route to accept passengers between stops.{" "}
                  {options.length
                    ? ""
                    : "No saved route matches these towns yet."}
                </p>
              )}
            </div>
            <Field label="Departure date">
              <input
                type="date"
                min={today}
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
                required
              />
            </Field>
            <Field label="Departure time (IST)">
              <input
                type="time"
                value={form.time}
                onChange={(e) => update("time", e.target.value)}
                required
              />
            </Field>
            <Field label="Available seats">
              <input
                type="number"
                min="1"
                max={Math.min(vehicle?.seats || 8, 8)}
                required
                value={form.seats}
                onChange={(e) => update("seats", e.target.value)}
              />
            </Field>
            <Field
              label={
                form.rideType === "private"
                  ? "Whole-car price (₹)"
                  : "Price per seat (₹)"
              }
            >
              <input
                type="number"
                min="0"
                max="1000000"
                step="0.01"
                required
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
              />
            </Field>
            <Field label="Pickup point (optional)">
              <input
                maxLength={200}
                value={form.pickup}
                onChange={(e) => update("pickup", e.target.value)}
                placeholder="Landmark or meeting point"
              />
            </Field>
          </div>
          <Field label="Trip notes (optional)">
            <textarea
              maxLength={1500}
              rows="3"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </Field>
          <button
            disabled={busy || loading || !vehicles.length}
            className="button full"
          >
            {busy ? "Resolving stops and publishing…" : "Publish ride"}
          </button>
          {!loading && !vehicles.length && (
            <p className="muted">
              Add your vehicle in <Link to="/profile">Profile</Link> before
              publishing.
            </p>
          )}
        </section>
        <aside className="card ride-summary">
          <img src="/images/coastal-road.png" alt="" />
          <h2>Journey summary</h2>
          <p>
            {form.origin || "Starting town"} →{" "}
            {form.destination || "Destination town"}
          </p>
          <div className="route-flow" aria-label="Journey route flow">
            <p className="route-flow-title">Route flow</p>
            {(selectedRoute?.nodes || [
              { name: form.origin || "Starting town" },
              { name: form.destination || "Destination town" },
            ]).map((node, index, nodes) => (
              <div className="route-flow-point" key={`${node.name}-${index}`}>
                <span className={`route-flow-dot ${index === 0 ? "start" : index === nodes.length - 1 ? "end" : "via"}`} />
                <span>{node.name}</span>
                {index < nodes.length - 1 && <span className="route-flow-connector" />}
              </div>
            ))}
          </div>
          <p className="muted">
            {form.date} · {form.time || "Choose time"} IST
          </p>
          <p>
            {form.seats} seats · ₹{form.price || "0"}{" "}
            {form.rideType === "carpool" ? "per seat" : "whole car"}
          </p>
          <p className="muted small">
            For a return journey, publish another ride with its own date and
            time.
          </p>
        </aside>
      </form>
    </Page>
  );
}
