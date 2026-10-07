import { Filter, LoaderCircle, MapPinned, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Footer from "../../components/layout/Footer";
import Navbar from "../../components/layout/Navbar";
import StatusBanner from "../../components/common/StatusBanner";
import RideCard from "../../components/ride/RideCard";
import { ridesApi } from "../../lib/api";
import { demoStore } from "../../lib/demoStore";

const rideTypes = [["", "All"], ["carpool", "Shared seats"], ["private", "Full car"], ["on_demand", "Ride now"]];
const asList = (data) => Array.isArray(data) ? data : data?.rides || data?.items || [];

export default function FindRidePage() {
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState(() => ({
    origin: params.get("origin") || "",
    destination: params.get("destination") || "",
    departureDate: params.get("departureDate") || "",
    seats: Number(params.get("seats") || 1),
    rideType: params.get("rideType") || "",
  }));
  const [rides, setRides] = useState(() => demoStore.searchRides(filters));
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await ridesApi.search(filters);
        if (active) { setRides(asList(data)); setOffline(false); }
      } catch {
        if (active) { setRides(demoStore.searchRides(filters)); setOffline(true); }
      } finally {
        if (active) { setLoading(false); setSearched(true); }
      }
    };
    load();
    return () => { active = false; };
    // Initial URL filters are loaded once; the form owns later searches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (field, value) => setFilters((current) => ({ ...current, [field]: value }));
  const runSearch = async (event) => {
    event?.preventDefault();
    setLoading(true);
    setSearched(true);
    const query = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ""));
    setParams(query);
    try {
      setRides(asList(await ridesApi.search(query)));
      setOffline(false);
    } catch {
      setRides(demoStore.searchRides(query));
      setOffline(true);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "min-h-12 w-full rounded-xl border border-[#e6d9d3] bg-white px-4 text-sm font-semibold text-[#2a2020] outline-none focus:border-[#e8462c] focus:ring-4 focus:ring-[#e8462c]/10";

  return (
    <div className="min-h-screen bg-[#fffaf6]">
      <Navbar />
      <section className="bg-[radial-gradient(circle_at_85%_20%,rgba(255,163,99,.25),transparent_30%),linear-gradient(130deg,#421017,#7b202a)] px-5 py-12 text-white sm:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl"><p className="text-xs font-extrabold uppercase tracking-[.17em] text-[#ffc6a1]">Shared, private or instant</p><h1 className="mt-3 font-serif text-4xl sm:text-5xl">Find the ride that fits</h1><p className="mt-3 max-w-xl leading-7 text-white/70">Compare available seats and full cars, then book in a few taps.</p></div>
      </section>
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
        <form onSubmit={runSearch} className="-mt-16 rounded-[26px] border border-[#eaded8] bg-white p-5 shadow-[0_22px_65px_rgba(63,19,24,.14)] sm:p-6">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#65151b]"><SlidersHorizontal size={18} /> Search filters</div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_1fr_.72fr_.48fr_auto]">
            <label><span className="mb-2 block text-xs font-extrabold uppercase tracking-[.1em] text-[#80736e]">From</span><input value={filters.origin} onChange={(event) => update("origin", event.target.value)} className={inputClass} placeholder="Pickup city or landmark" /></label>
            <label><span className="mb-2 block text-xs font-extrabold uppercase tracking-[.1em] text-[#80736e]">To</span><input value={filters.destination} onChange={(event) => update("destination", event.target.value)} className={inputClass} placeholder="Destination" /></label>
            <label><span className="mb-2 block text-xs font-extrabold uppercase tracking-[.1em] text-[#80736e]">Date</span><input type="date" value={filters.departureDate} onChange={(event) => update("departureDate", event.target.value)} className={inputClass} /></label>
            <label><span className="mb-2 block text-xs font-extrabold uppercase tracking-[.1em] text-[#80736e]">Seats</span><select value={filters.seats} onChange={(event) => update("seats", Number(event.target.value))} className={inputClass}>{[1,2,3,4,5,6].map((seat) => <option key={seat}>{seat}</option>)}</select></label>
            <button disabled={loading} className="mt-auto flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#e8462c] px-6 text-sm font-extrabold text-white hover:bg-[#d23b24] disabled:opacity-60">{loading ? <LoaderCircle className="animate-spin" size={18} /> : <Search size={18} />} Search</button>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">{rideTypes.map(([value, label]) => <button key={label} type="button" onClick={() => update("rideType", value)} className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${filters.rideType === value ? "bg-[#7a1f2a] text-white" : "bg-[#fff2ea] text-[#7a1f2a] hover:bg-[#ffe2d1]"}`}>{label}</button>)}</div>
        </form>
        <div className="mt-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-serif text-3xl text-[#52151d]">{loading ? "Searching routes…" : `${rides.length} ride${rides.length === 1 ? "" : "s"} found`}</h2><p className="mt-1 text-sm text-[#776a65]">Sorted by route match and departure time</p></div><span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-[#776a65] shadow-sm"><Filter size={14} /> Live availability</span></div>
          {offline && <div className="mb-6"><StatusBanner>Showing demo and locally posted rides while the API is offline.</StatusBanner></div>}
          {!loading && searched && rides.length === 0 && <div className="rounded-[28px] border border-dashed border-[#dcbfb5] bg-white px-6 py-16 text-center"><MapPinned className="mx-auto text-[#e8462c]" size={34} /><h3 className="mt-4 text-xl font-extrabold text-[#52151d]">No exact ride yet</h3><p className="mx-auto mt-2 max-w-md text-[#776a65]">Try a nearby landmark, remove the date, or create a travel group to find people going your way.</p></div>}
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{rides.map((ride) => <RideCard key={ride.id} ride={ride} />)}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
