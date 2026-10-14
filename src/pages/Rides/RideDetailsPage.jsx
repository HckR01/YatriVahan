import RideMap from "../../components/map/RideMap";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Page, { Empty, Field, Modal, Notice } from "../../components/ui/Page";
import { ridesApi, listAllBookings, bookingsApi } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import { formatDateTime, formatMoney } from "../../lib/format";
export default function RideDetailsPage() {
  const { rideId } = useParams(),
    { user } = useAuth(),
    navigate = useNavigate();
  const [ride, setRide] = useState(null),
    [booking, setBooking] = useState(null),
    [seats, setSeats] = useState(1),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [cancel, setCancel] = useState(false);
  const load = useCallback(async () => {
    const r = await ridesApi.get(rideId);
    setRide(r);
    if (user) {
      const bs = await listAllBookings({ role: "passenger" });
      setBooking(
        bs.find(
          (b) =>
            b.rideId === rideId &&
            ["pending", "confirmed", "completed"].includes(b.status),
        ) || null,
      );
    }
  }, [rideId, user]);
  useEffect(() => {
    Promise.resolve()
      .then(load)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [load]);
  async function book() {
    if (!user)
      return navigate(
        `/login?returnTo=${encodeURIComponent(`/rides/${rideId}`)}`,
      );
    setBusy(true);
    setError("");
    try {
      const fresh = await ridesApi.get(rideId);
      const count =
        fresh.rideType === "private" ? fresh.seatsTotal : Number(seats);
      if (fresh.status !== "scheduled" || fresh.seatsAvailable < count)
        throw new Error("This ride no longer has enough seats available.");
      const bs = await listAllBookings({ role: "passenger" });
      if (
        bs.some(
          (b) =>
            b.rideId === rideId && ["pending", "confirmed"].includes(b.status),
        )
      )
        throw new Error("You already have a booking request for this ride.");
      const result = await ridesApi.book(rideId, {
        seats: count,
        pickup: fresh.origin,
        dropoff: fresh.destination,
      });
      setBooking(result);
      setNotice("Request sent. Waiting for driver approval.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const owner = Boolean(
      user && ride && [ride.driverId, ride.acceptedDriverId].includes(user.id),
    ),
    requester = Boolean(user && ride?.requesterId === user.id);
  return (
    <Page
      title={
        ride ? `${ride.origin.name} → ${ride.destination.name}` : "Ride details"
      }
      description={ride ? formatDateTime(ride.departureTime) : ""}
    >
      <Link className="text-button" to="/dashboard">
        ← Back to dashboard
      </Link>
      <Notice error>{error}</Notice>
      <Notice>{notice}</Notice>
      {loading ? (
        <p role="status">Loading ride…</p>
      ) : !ride ? (
        <Empty title="Ride unavailable">
          Please check the link or try again.
        </Empty>
      ) : (
        <div className="content-sidebar section-gap">
          <div className="stack">
            <section className="card">
              <div className="row">
                <h2>Route & stops</h2>
                <span className="badge">
                  {ride.status.replaceAll("_", " ")}
                </span>
              </div>
              <RideMap
                origin={ride.origin}
                destination={ride.destination}
                className="h-80"
              />
              <ol className="route-list">
                {[ride.origin, ...(ride.stops || []), ride.destination].map(
                  (n, i) => (
                    <li key={`${n.name}-${i}`}>{n.name}</li>
                  ),
                )}
              </ol>
            </section>
            <section className="card">
              <h2>Driver & vehicle</h2>
              <div className="row start">
                <span className="avatar">
                  {(ride.driver?.fullName || "D")[0]}
                </span>
                <div>
                  <h3>{ride.driver?.fullName || "Waiting for a driver"}</h3>
                  {ride.driver?.isVerified && (
                    <span className="badge success">Verified driver</span>
                  )}
                  <p className="muted">
                    {[
                      ride.vehicle?.make,
                      ride.vehicle?.model,
                      ride.vehicle?.color,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                </div>
              </div>
              <p>
                {ride.seatsAvailable} seats available ·{" "}
                {formatMoney(ride.pricePerSeat)} per seat
              </p>
            </section>
            <section className="card">
              <h2>Passengers</h2>
              {ride.bookings?.length ? (
                <div className="passenger-list">
                  {ride.bookings.map((b) => (
                    <div key={b.id}>
                      <span className="avatar">
                        {(b.passenger?.fullName || "P")[0]}
                      </span>
                      <span>
                        {b.passenger?.fullName || "Passenger"} · {b.seats} seats
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">No confirmed passengers yet.</p>
              )}
              {owner && (
                <Link className="button secondary" to="/requests">
                  Manage requests
                </Link>
              )}
            </section>
            {ride.notes && (
              <section className="card">
                <h2>Trip notes</h2>
                <p className="pre-wrap">{ride.notes}</p>
              </section>
            )}
          </div>
          <aside className="card ride-summary">
            <h2>
              {owner
                ? "Your offered ride"
                : requester
                  ? "Your travel request"
                  : booking
                    ? "Your booking"
                    : "Request this ride"}
            </h2>
            {booking ? (
              <>
                <span className="badge">
                  {booking.status === "pending"
                    ? "Waiting for approval"
                    : booking.status}
                </span>
                <p>
                  {booking.seats} seats · {formatMoney(booking.amount)}
                </p>
                {["pending", "confirmed"].includes(booking.status) && (
                  <button
                    className="button secondary full"
                    onClick={() => setCancel(true)}
                  >
                    Cancel booking
                  </button>
                )}
                {booking.status === "confirmed" && (
                  <Link
                    className="button secondary full"
                    to={`/chat/ride/${ride.id}`}
                  >
                    Ride chat
                  </Link>
                )}
              </>
            ) : owner || requester ? (
              <Link className="button full" to="/dashboard">
                Manage journey
              </Link>
            ) : ride.status === "scheduled" ? (
              <>
                <strong className="price">
                  {formatMoney(
                    ride.rideType === "private"
                      ? ride.estimatedFare ||
                          Number(ride.pricePerSeat) * ride.seatsTotal
                      : ride.pricePerSeat,
                  )}
                  <small>
                    {ride.rideType === "private" ? "whole car" : "per seat"}
                  </small>
                </strong>
                {ride.rideType === "carpool" && (
                  <Field label="Seats needed">
                    <input
                      type="number"
                      min="1"
                      max={Math.min(ride.seatsAvailable, 8)}
                      value={seats}
                      onChange={(e) => setSeats(e.target.value)}
                    />
                  </Field>
                )}
                <button
                  className="button full"
                  disabled={
                    busy ||
                    ride.seatsAvailable < Number(seats) ||
                    !Number.isInteger(Number(seats)) ||
                    Number(seats) < 1
                  }
                  onClick={book}
                >
                  {busy
                    ? "Sending…"
                    : ride.rideType === "private"
                      ? "Request full car"
                      : "Request seats"}
                </button>
                <p className="muted small">The driver confirms your booking.</p>
              </>
            ) : (
              <p className="muted">This ride is not open for booking.</p>
            )}
          </aside>
        </div>
      )}
      {cancel && (
        <Modal title="Cancel this booking?" onClose={() => setCancel(false)}>
          <div className="actions">
            <button
              className="button secondary"
              onClick={() => setCancel(false)}
            >
              Keep booking
            </button>
            <button
              disabled={busy}
              className="button"
              onClick={async () => {
                setBusy(true);
                try {
                  await bookingsApi.cancel(
                    booking.id,
                    "Cancelled by passenger",
                  );
                  setCancel(false);
                  await load();
                  setNotice("Booking cancelled.");
                } catch (e) {
                  setError(e.message);
                  setCancel(false);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Cancel booking
            </button>
          </div>
        </Modal>
      )}
    </Page>
  );
}
