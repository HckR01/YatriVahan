import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Page, { Empty, Modal, Notice } from "../../components/ui/Page";
import {
  bookingsApi,
  listAllBookings,
  profileApi,
  ridesApi,
  searchAllRides,
} from "../../lib/api";
import { formatDateTime, formatMoney } from "../../lib/format";
export default function RequestsPage() {
  const [tab, setTab] = useState("Received"),
    [received, setReceived] = useState([]),
    [sent, setSent] = useState([]),
    [open, setOpen] = useState([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [confirm, setConfirm] = useState(null);
  const load = useCallback(async () => {
    const [r, s, p] = await Promise.all([
      listAllBookings({ role: "driver" }),
      listAllBookings({ role: "passenger" }),
      profileApi.me(),
    ]);
    setReceived(r);
    setSent(s);
    if (["driver", "both"].includes(p.role))
      setOpen(await searchAllRides({ status: "searching" }));
  }, []);
  useEffect(() => {
    Promise.resolve()
      .then(load)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [load]);
  async function act() {
    setBusy(true);
    setError("");
    try {
      if (confirm.kind === "acceptRide") await ridesApi.accept(confirm.id);
      else if (confirm.kind === "cancel")
        await bookingsApi.cancel(confirm.id, "Cancelled by passenger");
      else await bookingsApi.updateStatus(confirm.id, confirm.status);
      setConfirm(null);
      await load();
    } catch (e) {
      setError(e.message);
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  }
  const entries = tab === "Received" ? received : sent;
  return (
    <Page
      title="Requests"
      description="Your seat requests, full-car bookings and driver inbox."
    >
      <Notice error>{error}</Notice>
      <div className="tabs">
        {["Received", "Sent"].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t} ({(t === "Received" ? received : sent).length})
          </button>
        ))}
      </div>
      <div className="stack">
        {loading ? (
          <p role="status">Loading requests…</p>
        ) : !entries.length ? (
          <Empty title="No booking requests yet">
            Your requests will appear here.
          </Empty>
        ) : (
          entries.map((b) => (
            <article className="card" key={b.id}>
              <div className="row">
                <span className="badge">{b.status}</span>
                <strong className="price">{formatMoney(b.amount)}</strong>
              </div>
              <h2>
                {b.ride?.origin?.name || b.pickupName} →{" "}
                {b.ride?.destination?.name || b.dropoffName}
              </h2>
              <p className="muted">
                {formatDateTime(b.ride?.departureTime)} · {b.seats} seats ·{" "}
                {b.ride?.rideType === "private" ? "Full car" : "Ride request"}
              </p>
              {b.notes && <p>{b.notes}</p>}
              <div className="actions">
                <Link className="button secondary" to={`/rides/${b.rideId}`}>
                  Ride details
                </Link>
                {tab === "Received" && b.status === "pending" && (
                  <>
                    <button
                      className="button secondary"
                      onClick={() =>
                        setConfirm({
                          id: b.id,
                          status: "cancelled",
                          label: "Decline this request?",
                        })
                      }
                    >
                      Decline
                    </button>
                    <button
                      className="button"
                      onClick={() =>
                        setConfirm({
                          id: b.id,
                          status: "confirmed",
                          label: "Accept this request?",
                        })
                      }
                    >
                      Accept
                    </button>
                  </>
                )}
                {tab === "Sent" &&
                  ["pending", "confirmed"].includes(b.status) && (
                    <button
                      className="text-button"
                      onClick={() =>
                        setConfirm({
                          id: b.id,
                          kind: "cancel",
                          label: "Cancel this booking?",
                        })
                      }
                    >
                      Cancel request
                    </button>
                  )}
              </div>
            </article>
          ))
        )}
      </div>
      {tab === "Received" && open.length > 0 && (
        <section className="stack section-gap">
          <h2>Travellers looking for a driver</h2>
          <p className="muted">
            Accepting assigns you to their requested journey.
          </p>
          {open.map((r) => (
            <article className="card" key={r.id}>
              <h3>
                {r.origin.name} → {r.destination.name}
              </h3>
              <p className="muted">
                {formatDateTime(r.departureTime)} · {r.seatsTotal} passengers
              </p>
              <button
                className="button"
                onClick={() =>
                  setConfirm({
                    id: r.id,
                    kind: "acceptRide",
                    label: "Drive this requested journey?",
                  })
                }
              >
                Accept journey
              </button>
            </article>
          ))}
        </section>
      )}
      {confirm && (
        <Modal title={confirm.label} onClose={() => setConfirm(null)}>
          <p>The passenger and driver will see this updated status.</p>
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
