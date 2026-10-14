import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, RefreshCw, UsersRound } from "lucide-react";
import Page, { Empty, Field, Modal, Notice } from "../../components/ui/Page";
import LocationFields from "../../components/ride/LocationFields";
import { useSearchRefresh } from "../../hooks/useSearchRefresh";
import { useAuth } from "../../hooks/useAuth";
import { listAllBookings, ridesApi, searchAllRides } from "../../lib/api";
import { validPoint } from "../../lib/coordinates";
import { geocodeLocation } from "../../lib/locations";
import {
  dayBounds,
  indiaDate,
  indiaDeparture,
  placeKey,
  rankMatches,
} from "../../lib/matching";
import { formatDateTime, formatMoney } from "../../lib/format";

export default function JoinRidePage() {
  const [points, setPoints] = useState({});
  const [today] = useState(() => indiaDate(Date.now()));
  const { user } = useAuth();
  const [form, setForm] = useState(() => ({
    origin: "",
    destination: "",
    date: indiaDate(Date.now()),
    time: "",
    seats: 1,
  }));
  const [requests, setRequests] = useState([]),
    [selected, setSelected] = useState(""),
    [matches, setMatches] = useState([]),
    [bookings, setBookings] = useState([]);
  const [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [cancel, setCancel] = useState(null),
    [hidden, setHidden] = useState([]);
  const lock = useRef(false),
    generation = useRef(0);
  const active = requests.find((r) => r.id === selected);
  const load = useCallback(async () => {
    const [own, existing] = await Promise.all([
      ridesApi.mine(),
      listAllBookings({ role: "passenger" }),
    ]);
    const mine = own.filter(
      (r) =>
        r.requesterId === user.id &&
        r.rideType === "on_demand" &&
        !["cancelled", "completed"].includes(r.status),
    );
    setRequests(mine);
    setBookings(existing);
    setSelected((id) =>
      mine.some((r) => r.id === id) ? id : mine[0]?.id || "",
    );
  }, [user.id]);
  useEffect(() => {
    let live = true;
    Promise.resolve()
      .then(load)
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [load]);
  const refreshMatches = useCallback(async () => {
    const epoch = ++generation.current;
    if (!active || active.status !== "searching") {
      setMatches([]);
      return;
    }
    try {
      const candidates = await searchAllRides({
        ...dayBounds(indiaDate(active.departureTime)),
        rideType: "carpool",
        seats: active.seatsTotal,
      });
      if (epoch === generation.current)
        setMatches(rankMatches(candidates, active, { userId: user.id }));
    } catch (e) {
      if (epoch === generation.current) {
        setError(e.message);
        setMatches([]);
      }
    }
  }, [active, user.id]);
  const invalidateMatches = useCallback(() => {
    generation.current++;
  }, []);
  useEffect(() => {
    Promise.resolve().then(refreshMatches);
    return invalidateMatches;
  }, [refreshMatches, invalidateMatches]);
  const liveSearch = useSearchRefresh(refreshMatches, Boolean(active));
  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  async function submit(e) {
    e.preventDefault();
    if (lock.current) return;
    setError("");
    setNotice("");
    if (placeKey(form.origin) === placeKey(form.destination))
      return setError("Choose different starting and destination towns.");
    const departureTime = indiaDeparture(form.date, form.time);
    if (Date.parse(departureTime) <= Date.now())
      return setError("Choose a future date and time.");
    if (
      requests.some(
        (r) =>
          r.status === "searching" &&
          placeKey(r.origin.name) === placeKey(form.origin) &&
          placeKey(r.destination.name) === placeKey(form.destination) &&
          Date.parse(r.departureTime) === Date.parse(departureTime),
      )
    )
      return setError("You already have an open request for this journey.");
    lock.current = true;
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
      const created = await ridesApi.request({
        rideType: "on_demand",
        origin: { ...origin, name: form.origin.trim() },
        destination: { ...destination, name: form.destination.trim() },
        departureTime,
        seatsTotal: Number(form.seats),
      });
      await load();
      setSelected(created.id);
      setNotice("Travel request posted. Matching rides will appear here.");
    } catch (e) {
      setError(e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function requestSeat(ride) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const fresh = await ridesApi.get(ride.id);
      if (!rankMatches([fresh], active, { userId: user.id }).length)
        throw new Error(
          "This ride is no longer eligible. Refresh the matches.",
        );
      const existing = await listAllBookings({ role: "passenger" });
      if (
        existing.some(
          (b) =>
            b.rideId === ride.id && ["pending", "confirmed"].includes(b.status),
        )
      )
        throw new Error(
          "You already requested this ride. Check Requests for its status.",
        );
      const booking = await ridesApi.book(ride.id, {
        seats: Number(active.seatsTotal),
        pickup: active.origin,
        dropoff: active.destination,
      });
      setBookings((b) => [booking, ...b]);
      setNotice(
        "Seat request sent for driver approval. Your separate travel request stays open; cancel it below when you no longer need a driver.",
      );
    } catch (e) {
      setError(e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Page
      title="Where do you want to go?"
      description="Post your travel request. We’ll match your route, travel day and preferred time."
      scenic
    >
      <Notice error>{error}</Notice>
      <Notice>{notice}</Notice>
      <div className="two-columns">
        <form className="card form-card" onSubmit={submit}>
          <h2>Post a travel request</h2>
          <p className="muted">Tell us where you’re headed.</p>
          <div className="form-grid">
            <LocationFields
              origin={form.origin}
              destination={form.destination}
              onChange={update}
              points={points}
              onPointsChange={setPoints}
            />
            <Field label="Date">
              <input
                type="date"
                min={today}
                required
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
              />
            </Field>
            <Field label="Preferred time (IST)">
              <input
                type="time"
                required
                value={form.time}
                onChange={(e) => update("time", e.target.value)}
              />
            </Field>
            <Field label="Seats needed">
              <select
                value={form.seats}
                onChange={(e) => update("seats", e.target.value)}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </Field>
          </div>
          <button className="button full" disabled={busy}>
            {busy ? "Please wait…" : "Post travel request"}
            <ArrowRight size={17} />
          </button>
        </form>
        <section className="stack">
          <div className="row">
            <h2>Your travel requests</h2>
            <button
              className="icon-button"
              aria-label="Refresh requests and matches"
              onClick={async () => {
                try {
                  await load();
                  await refreshMatches();
                } catch (e) {
                  setError(e.message);
                }
              }}
            >
              <RefreshCw size={18} />
            </button>
          </div>
          {loading ? (
            <p role="status">Loading your requests…</p>
          ) : requests.length === 0 ? (
            <Empty title="Your next journey starts here">
              Post a request to see compatible rides.
            </Empty>
          ) : (
            <>
              <Field label="Choose a request">
                <select
                  value={selected}
                  onChange={(e) => {
                    setSelected(e.target.value);
                    setHidden([]);
                  }}
                >
                  {requests.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.origin.name} → {r.destination.name} ·{" "}
                      {formatDateTime(r.departureTime)}
                    </option>
                  ))}
                </select>
              </Field>
              {active && (
                <article className="card">
                  <span className="badge">
                    {active.status.replaceAll("_", " ")}
                  </span>
                  <h3>
                    {active.origin.name} → {active.destination.name}
                  </h3>
                  <p className="muted">
                    {formatDateTime(active.departureTime)} · {active.seatsTotal}{" "}
                    seats
                  </p>
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() => setCancel(active)}
                  >
                    Cancel travel request
                  </button>
                </article>
              )}
            </>
          )}
          {active?.status === "searching" && (
            <>
              <div>
                <h2>Matching rides</h2>
                <p className="muted small">
                  Exact rides first, then ordered route stops · same day ·
                  within 2 hours of driver departure.{" "}
                  {liveSearch
                    ? "Live updates connected."
                    : "Refreshes every 30 seconds."}
                </p>
              </div>
              {matches.filter((r) => !hidden.includes(r.id)).length === 0 ? (
                <Empty title="No matching rides yet">
                  Your request is open. Check back as drivers post rides.
                </Empty>
              ) : (
                matches
                  .filter((r) => !hidden.includes(r.id))
                  .map((ride) => {
                    const booked = bookings.some(
                      (b) =>
                        (b.rideId || b.ride?.id) === ride.id &&
                        ["pending", "confirmed"].includes(b.status),
                    );
                    return (
                      <article className="card match-card" key={ride.id}>
                        <div className="row">
                          <div className="row">
                            <span className="avatar">
                              {(ride.driver?.fullName || "D")[0]}
                            </span>
                            <div>
                              <h3>{ride.driver?.fullName || "Driver"}</h3>
                              <p className="muted small">
                                {formatDateTime(ride.departureTime)}
                              </p>
                            </div>
                          </div>
                          <strong className="price">
                            {formatMoney(ride.pricePerSeat)}
                            <small>per seat</small>
                          </strong>
                        </div>
                        <p>
                          {ride.origin.name} → {ride.destination.name}
                        </p>
                        <p className="muted small">
                          <UsersRound size={15} /> {ride.seatsAvailable} seats
                          available ·{" "}
                          {ride.match.gap === 0
                            ? "Your preferred time"
                            : `${Math.round(ride.match.gap)} min from preferred time`}
                        </p>
                        <div className="actions">
                          <Link
                            className="text-button"
                            to={`/rides/${ride.id}`}
                          >
                            Details
                          </Link>
                          <button
                            className="button secondary"
                            onClick={() => setHidden((h) => [...h, ride.id])}
                          >
                            Hide
                          </button>
                          <button
                            disabled={busy || booked}
                            className="button"
                            onClick={() => requestSeat(ride)}
                          >
                            {booked ? "Request sent" : "Request seats"}
                          </button>
                        </div>
                      </article>
                    );
                  })
              )}
            </>
          )}
        </section>
      </div>
      {cancel && (
        <Modal
          title="Cancel this travel request?"
          onClose={() => setCancel(null)}
        >
          <p>Your existing seat bookings will remain unchanged.</p>
          <div className="actions">
            <button
              className="button secondary"
              onClick={() => setCancel(null)}
            >
              Keep request
            </button>
            <button
              className="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await ridesApi.cancel(cancel.id);
                  setCancel(null);
                  await load();
                } catch (e) {
                  setError(e.message);
                  setCancel(null);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Cancel request
            </button>
          </div>
        </Modal>
      )}
    </Page>
  );
}
