import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Page, { Empty, Modal, Notice } from "../../components/ui/Page";
import JourneyCard from "../../components/ride/JourneyCard";
import { ridesApi, listAllBookings } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
export default function DriverDashboard() {
  const { user } = useAuth();
  const [rides, setRides] = useState([]),
    [tab, setTab] = useState("Upcoming"),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [confirm, setConfirm] = useState(null);
  const load = useCallback(async () => {
    const [own, bookings] = await Promise.all([
      ridesApi.mine(),
      listAllBookings({ role: "passenger" }),
    ]);
    const all = new Map(own.map((r) => [r.id, r]));
    bookings
      .filter((b) => ["confirmed", "completed"].includes(b.status) && b.ride)
      .forEach((b) => {
        if (!all.has(b.ride.id)) all.set(b.ride.id, b.ride);
      });
    setRides([...all.values()]);
  }, []);
  useEffect(() => {
    Promise.resolve()
      .then(load)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [load]);
  const visible = rides.filter((r) =>
    tab === "Past"
      ? ["completed", "cancelled"].includes(r.status)
      : tab === "Active"
        ? ["arriving", "in_progress"].includes(r.status)
        : ["draft", "scheduled", "searching", "accepted"].includes(r.status),
  );
  async function act() {
    setBusy(true);
    try {
      if (confirm.status === "cancelled")
        await ridesApi.cancel(confirm.ride.id);
      else await ridesApi.updateStatus(confirm.ride.id, confirm.status);
      setConfirm(null);
      await load();
    } catch (e) {
      setError(e.message);
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page
      title="Your journeys"
      description="Manage your upcoming, active and past rides."
      scenic
      action={
        <Link className="button" to="/offer-ride">
          + Offer a Ride
        </Link>
      }
    >
      <Notice error>{error}</Notice>
      <div className="tabs" role="tablist" aria-label="Journey status">
        {["Upcoming", "Active", "Past"].map((t) => (
          <button
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? "active" : ""}
            key={t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="stack">
        {loading ? (
          <p role="status">Loading journeys…</p>
        ) : !visible.length ? (
          <Empty title={`No ${tab.toLowerCase()} journeys`}>
            Post a travel request or offer your available seats.
          </Empty>
        ) : (
          visible.map((ride) => {
            const owner = [ride.driverId, ride.acceptedDriverId].includes(
              user.id,
            );
            return (
              <JourneyCard
                key={ride.id}
                ride={ride}
                badge={
                  owner
                    ? "You are driving"
                    : ride.status === "searching"
                      ? "Waiting for a driver"
                      : "You are travelling"
                }
              >
                {owner &&
                  ["scheduled", "accepted", "arriving"].includes(
                    ride.status,
                  ) && (
                    <button
                      className="button"
                      onClick={() =>
                        setConfirm({ ride, status: "in_progress" })
                      }
                    >
                      Start ride
                    </button>
                  )}
                {owner && ride.status === "in_progress" && (
                  <button
                    className="button"
                    onClick={() => setConfirm({ ride, status: "completed" })}
                  >
                    End ride
                  </button>
                )}
                {(owner || ride.requesterId === user.id) &&
                  !["completed", "cancelled"].includes(ride.status) && (
                    <button
                      className="text-button"
                      onClick={() => setConfirm({ ride, status: "cancelled" })}
                    >
                      Cancel ride
                    </button>
                  )}
              </JourneyCard>
            );
          })
        )}
      </div>
      {confirm && (
        <Modal
          title={
            confirm.status === "cancelled"
              ? "Cancel this ride?"
              : confirm.status === "completed"
                ? "End this ride?"
                : "Start this ride?"
          }
          onClose={() => setConfirm(null)}
        >
          <p>
            {confirm.ride.origin.name} → {confirm.ride.destination.name}
          </p>
          <p className="muted">
            {confirm.status === "cancelled"
              ? "This also cancels bookings for this ride."
              : "All passengers will see the updated ride status."}
          </p>
          <div className="actions">
            <button
              className="button secondary"
              onClick={() => setConfirm(null)}
            >
              Go back
            </button>
            <button disabled={busy} className="button" onClick={act}>
              {busy ? "Updating…" : "Confirm"}
            </button>
          </div>
        </Modal>
      )}
    </Page>
  );
}
