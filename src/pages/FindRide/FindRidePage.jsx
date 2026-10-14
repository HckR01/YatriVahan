import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Page, { Field, Notice, Empty } from "../../components/ui/Page";
import LocationFields from "../../components/ride/LocationFields";
import { searchAllRides } from "../../lib/api";
import {
  dayBounds,
  indiaDate,
  indiaDeparture,
  placeKey,
  rankMatches,
} from "../../lib/matching";
import { formatDateTime, formatMoney } from "../../lib/format";
import { useAuth } from "../../hooks/useAuth";
import { useSearchRefresh } from "../../hooks/useSearchRefresh";

export default function FindRidePage() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const [today] = useState(() => indiaDate(Date.now()));
  const [form, setForm] = useState(() => ({
    origin: params.get("origin") || "",
    destination: params.get("destination") || "",
    date: params.get("date") || indiaDate(Date.now()),
    time: params.get("time") || "",
    seats: Number(params.get("seats")) || 1,
  }));
  const [query, setQuery] = useState(null);
  const [rides, setRides] = useState([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    if (!query) return;
    const epoch = ++generation.current;
    setLoading(true);
    try {
      const all = await searchAllRides({
        ...dayBounds(query.date),
        seats: query.seats,
        rideType: "carpool",
      });
      const matched = rankMatches(
        all,
        {
          origin: { name: query.origin },
          destination: { name: query.destination },
          departureTime: indiaDeparture(query.date, query.time || "12:00"),
          seatsTotal: query.seats,
        },
        { userId: user?.id, windowMinutes: query.time ? 120 : Infinity },
      );
      if (!query.time)
        matched.sort(
          (a, b) =>
            a.match.route - b.match.route ||
            Date.parse(a.departureTime) - Date.parse(b.departureTime) ||
            Number(a.pricePerSeat) - Number(b.pricePerSeat),
        );
      if (epoch === generation.current) {
        setRides(matched);
        setError("");
      }
    } catch (e) {
      if (epoch === generation.current) {
        setError(e.message);
        setRides([]);
      }
    } finally {
      if (epoch === generation.current) setLoading(false);
    }
  }, [query, user]);
  const invalidate = useCallback(() => {
    generation.current++;
  }, []);
  useEffect(() => {
    Promise.resolve().then(refresh);
    return invalidate;
  }, [refresh, invalidate]);
  const connected = useSearchRefresh(refresh, Boolean(query));
  function search(e) {
    e.preventDefault();
    if (placeKey(form.origin) === placeKey(form.destination)) {
      setError("Choose different pickup and destination stops.");
      return;
    }
    setParams(
      Object.fromEntries(Object.entries(form).filter(([, v]) => v !== "")),
    );
    setQuery({ ...form });
  }
  return (
    <Page
      title="Find a Ride"
      description="Search towns or route stops. Exact rides first, then rides passing through both stops."
      scenic
    >
      <Notice error>{error}</Notice>
      <form onSubmit={search} className="card form-card">
        <div className="form-grid">
          <LocationFields
            origin={form.origin}
            destination={form.destination}
            onChange={(key, value) => setForm((f) => ({ ...f, [key]: value }))}
          />
          <Field label="Travel date">
            <input
              type="date"
              required
              min={today}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Field>
          <Field label="Preferred time (IST, optional)">
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            />
          </Field>
          <Field label="Seats needed">
            <select
              value={form.seats}
              onChange={(e) =>
                setForm({ ...form, seats: Number(e.target.value) })
              }
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </Field>
        </div>
        <button className="button" disabled={loading}>
          {loading ? "Searching…" : "Find rides"}
        </button>
      </form>
      {query && (
        <section className="stack section-gap">
          <div className="row">
            <h2>{rides.length} matching rides</h2>
            <span className="muted small">
              {connected
                ? "Live updates connected"
                : "Refreshes every 30 seconds"}
            </span>
          </div>
          <p className="muted small">
            Times are departure from the driver’s starting point. Confirm pickup
            time with the driver. The listed seat fare applies; no distance
            discount is calculated.
          </p>
          {!loading && !rides.length && !error && (
            <Empty title="No matching rides yet">
              <Link to="/join-ride">Post a travel request</Link> so you can
              check for new offers.
            </Empty>
          )}
          {rides.map((ride) => (
            <article className="card" key={ride.id}>
              <span className="badge">
                {ride.match.route === 0 ? "Exact ride" : "Along your route"}
              </span>
              <h2>
                {query.origin} → {query.destination}
              </h2>
              <p className="muted">
                Driver route: {ride.origin.name} → {ride.destination.name}
              </p>
              <p className="muted small">
                Via{" "}
                {(ride.stops || []).map((n) => n.name).join(" → ") ||
                  "No intermediate stops"}
              </p>
              <p>
                {formatDateTime(ride.departureTime)} · {ride.seatsAvailable}{" "}
                seats · {formatMoney(ride.pricePerSeat)} / seat
              </p>
              <Link
                className="button"
                to={`/rides/${ride.id}?${new URLSearchParams({ pickup: query.origin, dropoff: query.destination, seats: String(query.seats) })}`}
              >
                View ride & request seats
              </Link>
            </article>
          ))}
        </section>
      )}
    </Page>
  );
}
