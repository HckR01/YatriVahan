import { ArrowRight, CarFront, Check, Clock3, IndianRupee, LoaderCircle, UsersRound, Zap } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Footer from "../../components/layout/Footer";
import Navbar from "../../components/layout/Navbar";
import StatusBanner from "../../components/common/StatusBanner";
import RoutePlanner from "../../components/map/RoutePlanner";
import { useAuth } from "../../hooks/useAuth";
import { ridesApi } from "../../lib/api";
import { demoStore } from "../../lib/demoStore";

export default function HireRidePage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const group = location.state?.group;
  const initialType = params.get("type") === "private" || location.state?.bookingType === "full-cab" ? "private" : "on_demand";
  const [type, setType] = useState(initialType);
  const [route, setRoute] = useState({
    origin: group?.origin || { name: group?.from || "", lat: null, lng: null },
    destination: group?.destination && typeof group.destination === "object" ? group.destination : { name: group?.destination || "", lat: null, lng: null },
  });
  const [details, setDetails] = useState({
    date: group?.departureDate || group?.travelDate || new Date().toISOString().slice(0, 10),
    time: group?.preferredTime || "",
    passengers: group?.memberCount || group?.members || 1,
    estimatedFare: "",
    notes: group ? `Ride for ${group.name}` : "",
    allowLuggage: true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const update = (field, value) => { setDetails((current) => ({ ...current, [field]: value })); setError(""); };

  const submit = async (event) => {
    event.preventDefault();
    if (!route.origin.lat || !route.destination.lat) {
      setError("Pin both pickup and destination on the map before requesting a ride.");
      return;
    }
    setBusy(true);
    const payload = {
      rideType: type,
      origin: route.origin,
      destination: route.destination,
      departureTime: new Date(`${details.date}T${details.time || "00:00"}`).toISOString(),
      seatsTotal: Number(details.passengers),
      estimatedFare: details.estimatedFare ? Number(details.estimatedFare) : undefined,
      notes: details.notes,
      allowLuggage: details.allowLuggage,
    };
    try {
      let ride;
      try { ride = await ridesApi.request(payload); }
      catch { ride = demoStore.createRide(payload, user); }
      navigate(`/rides/${ride.id}`, { state: { requested: true } });
    } catch (reason) {
      setError(reason.message || "Could not request this ride.");
    } finally { setBusy(false); }
  };
  const input = "min-h-12 w-full rounded-xl border border-[#e6d9d3] bg-white px-4 text-sm font-semibold outline-none focus:border-[#e8462c] focus:ring-4 focus:ring-[#e8462c]/10";
  const label = "mb-2 block text-sm font-extrabold text-[#2d2322]";

  return (
    <div className="min-h-screen bg-[#fffaf6]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:py-14">
        <header className="text-center"><p className="text-xs font-extrabold uppercase tracking-[.17em] text-[#e8462c]">Door-to-door travel</p><h1 className="mt-3 font-serif text-4xl text-[#52151d] sm:text-5xl">Where can we take you?</h1><p className="mx-auto mt-3 max-w-2xl leading-7 text-[#756963]">Request a driver now or reserve the whole car for your plan.</p></header>
        <form onSubmit={submit} className="mt-8 space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">{[["on_demand",Zap,"Ride now","Match with a nearby driver"],["private",CarFront,"Reserve full car","The whole vehicle for your group"]].map(([value,Icon,title,copy]) => <button key={value} type="button" onClick={() => setType(value)} className={`rounded-2xl border p-5 text-left transition ${type === value ? "border-[#7a1f2a] bg-[#7a1f2a] text-white shadow-lg" : "border-[#eaded8] bg-white text-[#52151d] hover:border-[#e6b4a5]"}`}><Icon size={23} /><strong className="mt-3 block text-lg">{title}</strong><span className={`mt-1 block text-sm ${type === value ? "text-white/70" : "text-[#756963]"}`}>{copy}</span></button>)}</div>
          {group && <StatusBanner>Prefilled from your group <strong>{group.name}</strong>. Confirm the pins and trip details.</StatusBanner>}
          <section className="rounded-[28px] border border-[#eaded8] bg-white p-5 shadow-[0_18px_55px_rgba(63,19,24,.07)] sm:p-7"><h2 className="mb-6 text-xl font-extrabold text-[#52151d]">Pickup & destination</h2><RoutePlanner value={route} onChange={setRoute} /></section>
          <section className="rounded-[28px] border border-[#eaded8] bg-white p-5 shadow-[0_18px_55px_rgba(63,19,24,.07)] sm:p-7"><h2 className="text-xl font-extrabold text-[#52151d]">Trip preferences</h2><div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><label><span className={label}>Date</span><input type="date" value={details.date} onChange={(event) => update("date", event.target.value)} className={input} required /></label><label><span className={label}>Pickup time</span><span className="relative block"><Clock3 className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8c7d78]" size={16} /><input type="time" value={details.time} onChange={(event) => update("time", event.target.value)} className={`${input} pl-10`} required /></span></label><label><span className={label}>Passengers</span><span className="relative block"><UsersRound className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8c7d78]" size={16} /><select value={details.passengers} onChange={(event) => update("passengers", event.target.value)} className={`${input} pl-10`}>{[1,2,3,4,5,6,7].map((count) => <option key={count}>{count}</option>)}</select></span></label><label><span className={label}>Your budget (optional)</span><span className="relative block"><IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8c7d78]" size={16} /><input type="number" min="0" value={details.estimatedFare} onChange={(event) => update("estimatedFare", event.target.value)} className={`${input} pl-10`} placeholder="Estimated fare" /></span></label><label className="sm:col-span-2 lg:col-span-3"><span className={label}>Notes for the driver</span><input value={details.notes} onChange={(event) => update("notes", event.target.value)} className={input} placeholder="Luggage, accessibility, pickup gate..." /></label><button type="button" onClick={() => update("allowLuggage",!details.allowLuggage)} className={`mt-auto flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold ${details.allowLuggage ? "border-[#e8462c] bg-[#fff0e7] text-[#8a2c1d]" : "border-[#e6d9d3] text-[#746762]"}`}>Luggage {details.allowLuggage ? <Check size={16} /> : "?"}</button></div></section>
          {error && <StatusBanner type="error">{error}</StatusBanner>}
          <button disabled={busy} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#e8462c] px-7 font-extrabold text-white shadow-lg shadow-[#e8462c]/20 hover:bg-[#d23b24] disabled:opacity-60">{busy ? <LoaderCircle className="animate-spin" size={19} /> : <>{type === "private" ? "Request full car" : "Find a driver"}<ArrowRight size={19} /></>}</button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
