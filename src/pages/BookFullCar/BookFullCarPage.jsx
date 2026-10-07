import { ArrowRight, BriefcaseBusiness, CarFront, HeartPulse, LoaderCircle, Search, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../../components/layout/Footer";
import Navbar from "../../components/layout/Navbar";
import RideCard from "../../components/ride/RideCard";
import StatusBanner from "../../components/common/StatusBanner";
import { ridesApi } from "../../lib/api";
import { demoStore } from "../../lib/demoStore";

const asList = (data) => Array.isArray(data) ? data : data?.rides || data?.items || [];

export default function BookFullCarPage() {
  const [search, setSearch] = useState({ origin: "", destination: "", departureDate: "", seats: 1 });
  const [rides, setRides] = useState(() => demoStore.searchRides({ rideType: "private" }));
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let active = true;
    ridesApi.search({ rideType: "private" }).then((data) => {
      if (active) setRides(asList(data));
    }).catch(() => {
      if (active) setOffline(true);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    const query = { ...search, rideType: "private" };
    try { setRides(asList(await ridesApi.search(query))); setOffline(false); }
    catch { setRides(demoStore.searchRides(query)); setOffline(true); }
    finally { setLoading(false); }
  };
  const input = "min-h-12 w-full rounded-xl border border-[#e6d9d3] bg-white px-4 text-sm font-semibold outline-none focus:border-[#e8462c] focus:ring-4 focus:ring-[#e8462c]/10";

  return (
    <div className="min-h-screen bg-[#fffaf6]">
      <Navbar />
      <section className="overflow-hidden bg-[#4a1119] px-5 py-14 text-white sm:px-8 lg:py-20"><div className="mx-auto grid max-w-7xl gap-9 lg:grid-cols-[1fr_.8fr] lg:items-center"><div><p className="text-xs font-extrabold uppercase tracking-[.17em] text-[#ffc6a1]">The whole car is yours</p><h1 className="mt-3 font-serif text-5xl sm:text-6xl">More room. One simple fare.</h1><p className="mt-5 max-w-xl text-lg leading-8 text-white/70">Ideal for families, airport runs, hospital visits and days when you need the entire vehicle.</p><Link to="/hire-ride?type=private" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#ff9a63] px-6 text-sm font-extrabold text-[#3b0d12] hover:bg-[#ffb187]">Request a custom car <ArrowRight size={18} /></Link></div><div className="grid grid-cols-3 gap-3">{[[Users,"Family trips"],[BriefcaseBusiness,"Work travel"],[HeartPulse,"Appointments"]].map(([Icon,label]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center backdrop-blur"><Icon className="mx-auto text-[#ffb187]" size={25} /><p className="mt-3 text-xs font-bold text-white/80">{label}</p></div>)}</div></div></section>
      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
        <form onSubmit={submit} className="grid gap-4 rounded-[26px] border border-[#eaded8] bg-white p-5 shadow-[0_16px_50px_rgba(63,19,24,.07)] sm:grid-cols-2 lg:grid-cols-[1fr_1fr_.7fr_.48fr_auto] sm:p-6"><input value={search.origin} onChange={(event) => setSearch((current) => ({...current,origin:event.target.value}))} className={input} placeholder="Pickup" aria-label="Pickup" /><input value={search.destination} onChange={(event) => setSearch((current) => ({...current,destination:event.target.value}))} className={input} placeholder="Destination" aria-label="Destination" /><input type="date" value={search.departureDate} onChange={(event) => setSearch((current) => ({...current,departureDate:event.target.value}))} className={input} aria-label="Travel date" /><select value={search.seats} onChange={(event) => setSearch((current) => ({...current,seats:event.target.value}))} className={input} aria-label="Passengers">{[1,2,3,4,5,6,7].map((seat) => <option key={seat} value={seat}>{seat} people</option>)}</select><button disabled={loading} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#e8462c] px-6 text-sm font-extrabold text-white">{loading ? <LoaderCircle className="animate-spin" size={18} /> : <Search size={18} />} Search</button></form>
        {offline && <div className="mt-6"><StatusBanner>Showing demo full-car options while the service reconnects.</StatusBanner></div>}
        <div className="mb-7 mt-10 flex items-end justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#e8462c]">Available cars</p><h2 className="mt-2 font-serif text-3xl text-[#52151d]">Book the entire vehicle</h2></div><CarFront className="hidden text-[#e8462c] sm:block" size={32} /></div>
        {!loading && rides.length === 0 ? <div className="rounded-3xl border border-dashed border-[#dbbeb3] bg-white px-5 py-14 text-center"><p className="font-extrabold text-[#52151d]">No scheduled full cars match yet.</p><Link to="/hire-ride?type=private" className="mt-3 inline-block text-sm font-bold text-[#e8462c]">Post a custom request</Link></div> : <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{rides.map((ride) => <RideCard key={ride.id} ride={ride} />)}</div>}
      </main>
      <Footer />
    </div>
  );
}
