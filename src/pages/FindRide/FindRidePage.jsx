import { useState } from "react";
import {
  ArrowRight,
  CarFront,
  CheckCircle2,
  Clock3,
  MapPin,
  Search,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "../../components/layout/Footer";
import Navbar from "../../components/layout/Navbar";

const mockRides = [
  {
    id: 1,
    from: "Astarang",
    to: "Bhubaneswar",
    date: "2026-10-03",
    departureTime: "08:00",
    seats: 3,
    pricePerSeat: 300,
    pickupPoint: "Astarang Bus Stand",
    vehicle: "Swift Dzire",
    returnAvailable: true,
    returnTime: "17:00",
    notes: "Can pick passengers from nearby points",
    driverName: "Rakesh",
    verified: true,
  },
  {
    id: 2,
    from: "Astarang",
    to: "Bhubaneswar",
    date: "2026-10-03",
    departureTime: "10:30",
    seats: 2,
    pricePerSeat: 250,
    pickupPoint: "Astarang Market",
    vehicle: "Toyota Innova",
    returnAvailable: false,
    returnTime: "",
    notes: "Comfortable ride with space for small bags",
    driverName: "Sanjay",
    verified: false,
  },
  {
    id: 3,
    from: "Puri",
    to: "Bhubaneswar",
    date: "2026-10-03",
    departureTime: "07:15",
    seats: 4,
    pricePerSeat: 220,
    pickupPoint: "Puri Railway Station",
    vehicle: "Ertiga",
    returnAvailable: true,
    returnTime: "18:30",
    notes: "Flexible pickup near the main road",
    driverName: "Meena",
    verified: true,
  },
  {
    id: 4,
    from: "Astarang",
    to: "Bhubaneswar",
    date: "2026-10-04",
    departureTime: "16:30",
    seats: 1,
    pricePerSeat: 280,
    pickupPoint: "Astarang Bus Stand",
    vehicle: "WagonR",
    returnAvailable: false,
    returnTime: "",
    notes: "",
    driverName: "Bikash",
    verified: true,
  },
];

const initialSearch = {
  from: "",
  to: "",
  date: "",
  preferredTime: "any",
  seatsNeeded: 1,
};

const timeRanges = {
  morning: [5 * 60, 12 * 60],
  afternoon: [12 * 60, 17 * 60],
  evening: [17 * 60, 22 * 60],
};

const normalizeLocation = (value) => value.trim().toLowerCase();

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const isInPreferredTime = (departureTime, preferredTime) => {
  if (preferredTime === "any") {
    return true;
  }

  const range = timeRanges[preferredTime];
  const departureMinutes = timeToMinutes(departureTime);
  return departureMinutes >= range[0] && departureMinutes <= range[1];
};

const formatDate = (date) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));

const formatTime = (time) =>
  new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(`2026-01-01T${time}`));

const FindRidePage = () => {
  const [search, setSearch] = useState(initialSearch);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const updateSearch = (field, value) => {
    setSearch((currentSearch) => ({ ...currentSearch, [field]: value }));
  };

  const handleSearch = (event) => {
    event.preventDefault();

    const from = normalizeLocation(search.from);
    const to = normalizeLocation(search.to);
    const requestedSeats = Number(search.seatsNeeded);

    const matchingRides = mockRides
      .filter((ride) => {
        const routeMatches =
          (!from || normalizeLocation(ride.from) === from) &&
          (!to || normalizeLocation(ride.to) === to);
        const dateMatches = !search.date || ride.date === search.date;
        const seatsMatch = ride.seats >= requestedSeats;
        const timeMatches = isInPreferredTime(
          ride.departureTime,
          search.preferredTime,
        );

        return routeMatches && dateMatches && seatsMatch && timeMatches;
      })
      .sort((firstRide, secondRide) => {
        const firstExactRoute =
          normalizeLocation(firstRide.from) === from &&
          normalizeLocation(firstRide.to) === to;
        const secondExactRoute =
          normalizeLocation(secondRide.from) === from &&
          normalizeLocation(secondRide.to) === to;

        if (firstExactRoute !== secondExactRoute) {
          return firstExactRoute ? -1 : 1;
        }

        if (search.date && firstRide.date !== secondRide.date) {
          return firstRide.date.localeCompare(secondRide.date);
        }

        return timeToMinutes(firstRide.departureTime) -
          timeToMinutes(secondRide.departureTime);
      });

    setResults(matchingRides);
    setHasSearched(true);
  };

  const inputClass =
    "min-h-12 w-full rounded-[13px] border border-[#EFDED9] bg-white px-4 text-[#171414] outline-none transition placeholder:text-[#9A8D89] focus:border-[#E53935] focus:ring-4 focus:ring-[#E53935]/10";
  const labelClass = "mb-2 block text-sm font-bold text-[#171414]";

  return (
    <div className="min-h-screen bg-[#FFF9F3]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8 md:py-16">
        <header className="mb-8 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#E53935]">
            Go together
          </p>
          <h1 className="font-serif text-4xl leading-tight text-[#65151B] sm:text-5xl">
            Find a Ride
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#665B59] sm:text-lg">
            Search rides already posted by people travelling your way.
          </p>
        </header>

        <form
          onSubmit={handleSearch}
          className="rounded-3xl border border-[#EFDED9] bg-white p-5 shadow-[0_18px_44px_rgba(59,13,18,0.08)] sm:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label htmlFor="from" className={labelClass}>
                From
              </label>
              <input
                id="from"
                value={search.from}
                onChange={(event) => updateSearch("from", event.target.value)}
                className={inputClass}
                placeholder="Starting location"
              />
            </div>

            <div>
              <label htmlFor="to" className={labelClass}>
                To
              </label>
              <input
                id="to"
                value={search.to}
                onChange={(event) => updateSearch("to", event.target.value)}
                className={inputClass}
                placeholder="Destination"
              />
            </div>

            <div>
              <label htmlFor="date" className={labelClass}>
                Date
              </label>
              <input
                id="date"
                type="date"
                value={search.date}
                onChange={(event) => updateSearch("date", event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="preferredTime" className={labelClass}>
                Preferred Time
              </label>
              <select
                id="preferredTime"
                value={search.preferredTime}
                onChange={(event) =>
                  updateSearch("preferredTime", event.target.value)
                }
                className={inputClass}
              >
                <option value="any">Any Time</option>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
            </div>

            <div>
              <label htmlFor="seatsNeeded" className={labelClass}>
                Seats Needed
              </label>
              <input
                id="seatsNeeded"
                type="number"
                min="1"
                max="20"
                value={search.seatsNeeded}
                onChange={(event) =>
                  updateSearch("seatsNeeded", event.target.value)
                }
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#E53935] px-7 text-base font-bold text-white shadow-md transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-[#E53935]/20 sm:w-auto"
          >
            <Search size={19} />
            Search Rides
          </button>
        </form>

        {hasSearched && (
          <section className="mt-12" aria-live="polite">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#E53935]">
                  Available matches
                </p>
                <h2 className="mt-1 text-2xl font-bold text-[#171414]">
                  {results.length} {results.length === 1 ? "ride" : "rides"}{" "}
                  found
                </h2>
              </div>
            </div>

            {results.length > 0 ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {results.map((ride) => (
                  <article
                    key={ride.id}
                    className="relative overflow-hidden rounded-2xl border border-[#EFDED9] bg-white p-5 shadow-[0_12px_30px_rgba(59,13,18,0.06)]"
                  >
                    <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#E53935,#FF8A3D)]" />

                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="flex items-center gap-2 text-xl font-bold text-[#65151B]">
                          {ride.from}
                          <ArrowRight size={18} className="text-[#E53935]" />
                          {ride.to}
                        </h3>
                        <p className="mt-2 flex items-center gap-2 text-sm text-[#665B59]">
                          <Clock3 size={16} />
                          {formatDate(ride.date)} at{" "}
                          {formatTime(ride.departureTime)}
                        </p>
                      </div>

                      <p className="text-right">
                        <span className="block text-2xl font-extrabold text-[#E53935]">
                          ₹{ride.pricePerSeat}
                        </span>
                        <span className="text-xs text-[#665B59]">
                          per seat
                        </span>
                      </p>
                    </div>

                    <div className="mt-5 grid gap-3 border-y border-[#EFDED9] py-4 text-sm text-[#665B59] sm:grid-cols-2">
                      <p className="flex items-start gap-2">
                        <MapPin size={17} className="mt-0.5 shrink-0 text-[#E53935]" />
                        <span>
                          <strong className="block text-[#171414]">
                            Pickup point
                          </strong>
                          {ride.pickupPoint}
                        </span>
                      </p>
                      <p className="flex items-start gap-2">
                        <CarFront size={17} className="mt-0.5 shrink-0 text-[#E53935]" />
                        <span>
                          <strong className="block text-[#171414]">
                            Vehicle
                          </strong>
                          {ride.vehicle}
                        </span>
                      </p>
                      <p className="flex items-start gap-2">
                        <Users size={17} className="mt-0.5 shrink-0 text-[#E53935]" />
                        <span>
                          <strong className="block text-[#171414]">
                            Seats left
                          </strong>
                          {ride.seats}
                        </span>
                      </p>
                      <p>
                        <strong className="text-[#171414]">Driver</strong>{" "}
                        {ride.driverName}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {ride.verified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F5E9] px-3 py-1 text-xs font-bold text-[#2E7D32]">
                          <CheckCircle2 size={14} />
                          Verified
                        </span>
                      )}
                      {ride.returnAvailable && (
                        <span className="rounded-full bg-[#FFF1E8] px-3 py-1 text-xs font-bold text-[#A4491D]">
                          Empty return ride
                        </span>
                      )}
                    </div>

                    {ride.notes && (
                      <p className="mt-4 text-sm leading-relaxed text-[#665B59]">
                        {ride.notes}
                      </p>
                    )}

                    <Link
                      to={`/ride/${ride.id}`}
                      className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[#E53935] px-5 text-sm font-bold text-[#E53935] transition hover:bg-[#E53935] hover:text-white"
                    >
                      View Ride
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#EFDED9] bg-white px-5 py-10 text-center shadow-[0_12px_30px_rgba(59,13,18,0.06)]">
                <p className="text-lg font-bold text-[#65151B]">
                  No rides found for this route.
                </p>
                <p className="mt-2 text-sm text-[#665B59]">
                  Try changing your search or post a ride request.
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#F3C5B6] bg-[#FFF1E8] px-5 py-5 text-center sm:flex-row sm:text-left">
              <p className="font-semibold text-[#65151B]">
                Can&apos;t find a ride? Post a ride request.
              </p>
              <Link
                to="/ride-request"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#FF8A3D] px-5 text-sm font-bold text-[#3B0D12] transition hover:brightness-105"
              >
                Post Ride Request
              </Link>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default FindRidePage;
