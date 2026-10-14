import { useState } from "react";
import { Link } from "react-router-dom";
import Page, { Empty, Field, Notice } from "../../components/ui/Page";
import LocationFields from "../../components/ride/LocationFields";
import { apiRequest, searchAllRides } from "../../lib/api";
import { dayBounds, indiaDate } from "../../lib/matching";
import { formatMoney, formatDateTime } from "../../lib/format";
export default function BookFullCarPage() {
  const [today] = useState(() => indiaDate(Date.now()));
  const [form, setForm] = useState(() => ({
      origin: "",
      destination: "",
      date: indiaDate(Date.now()),
    })),
    [tab, setTab] = useState("cars"),
    [drivers, setDrivers] = useState([]),
    [rides, setRides] = useState([]),
    [busy, setBusy] = useState(false),
    [searched, setSearched] = useState(false),
    [error, setError] = useState("");
  async function search(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const all = await searchAllRides({
        origin: form.origin,
        destination: form.destination,
        rideType: "private",
        ...dayBounds(form.date),
      });
      setRides(
        all.filter(
          (r) =>
            Date.parse(r.departureTime) > Date.now() &&
            r.seatsAvailable === r.seatsTotal,
        ),
      );
      setSearched(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page
      title="Book Full Car"
      description="Keep the entire car for your journey."
      scenic
    >
      <Notice error>{error}</Notice>
      <div className="tabs">
        <button
          className={tab === "cars" ? "active" : ""}
          onClick={() => setTab("cars")}
        >
          Available cars
        </button>
        <button
          className={tab === "drivers" ? "active" : ""}
          onClick={async () => {
            setTab("drivers");
            setBusy(true);
            setError("");
            try {
              setDrivers(
                await apiRequest("/profiles/drivers", {
                  query: { limit: 100 },
                }),
              );
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          Driver for hire
        </button>
      </div>
      {tab === "drivers" ? (
        <section className="stack">
          <p className="muted">
            Verified drivers. Availability and service area must be confirmed;
            direct driver hiring is not enabled yet.
          </p>
          {busy ? (
            <p role="status">Loading drivers…</p>
          ) : drivers.length ? (
            drivers.map((driver) => (
              <article className="card" key={driver.id}>
                <div className="row start">
                  <span className="avatar">{driver.fullName?.[0] || "D"}</span>
                  <div>
                    <h2>{driver.fullName}</h2>
                    <span className="badge success">Verified driver</span>
                  </div>
                </div>
                <p className="muted">
                  {driver.ratingCount
                    ? `${driver.avgRating} · ${driver.ratingCount} reviews`
                    : "No reviews yet"}
                </p>
                {driver.vehicles?.map((v) => (
                  <p key={v.id}>
                    {v.make} {v.model} · {v.seats} seats
                  </p>
                ))}
              </article>
            ))
          ) : (
            <Empty title="No drivers to show">Please check back later.</Empty>
          )}
        </section>
      ) : (
        <>
          <form className="card search-form" onSubmit={search}>
            <LocationFields
              origin={form.origin}
              destination={form.destination}
              onChange={(k, v) => setForm((f) => ({ ...f, [k]: v }))}
            />
            <Field label="Date">
              <input
                type="date"
                min={today}
                required
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </Field>
            <button className="button" disabled={busy}>
              {busy ? "Searching…" : "Search cars"}
            </button>
          </form>
          <section className="stack section-gap">
            <h2>Available cars</h2>
            {!rides.length ? (
              <Empty
                title={
                  searched
                    ? "No full cars match yet"
                    : "Plan your whole-car journey"
                }
              >
                {searched
                  ? "Try another date or route."
                  : "Enter your route and date to see available cars."}
              </Empty>
            ) : (
              rides.map((r) => (
                <article className="card full-car" key={r.id}>
                  <div className="car-art" aria-hidden="true">
                    🚘
                  </div>
                  <div>
                    <h2>
                      {[r.vehicle?.make, r.vehicle?.model]
                        .filter(Boolean)
                        .join(" ") || "Available full car"}
                    </h2>
                    <p>
                      {r.origin.name} → {r.destination.name}
                    </p>
                    <p className="muted">
                      {formatDateTime(r.departureTime)} · {r.seatsTotal}{" "}
                      passenger seats
                    </p>
                    <p>{r.driver?.fullName || "Driver"}</p>
                  </div>
                  <div>
                    <strong className="price">
                      {formatMoney(
                        r.estimatedFare ||
                          Number(r.pricePerSeat) * Number(r.seatsTotal),
                      )}
                      <small>whole car</small>
                    </strong>
                    <Link className="button" to={`/rides/${r.id}`}>
                      Request booking
                    </Link>
                  </div>
                </article>
              ))
            )}
          </section>
        </>
      )}
    </Page>
  );
}
