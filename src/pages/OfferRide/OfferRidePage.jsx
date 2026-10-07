import { Check, IndianRupee, LoaderCircle, Luggage, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/layout/Footer";
import Navbar from "../../components/layout/Navbar";
import StatusBanner from "../../components/common/StatusBanner";
import RoutePlanner from "../../components/map/RoutePlanner";
import { useAuth } from "../../hooks/useAuth";
import { ridesApi } from "../../lib/api";
import { demoStore } from "../../lib/demoStore";

const initial = {
  route: { origin: { name: "", lat: null, lng: null }, destination: { name: "", lat: null, lng: null } },
  date: "",
  time: "",
  seatsTotal: 3,
  pricePerSeat: "",
  vehicle: "",
  notes: "",
  womenOnly: false,
  allowLuggage: true,
};

export default function OfferRidePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const update = (field, value) => { setForm((current) => ({ ...current, [field]: value })); setError(""); };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.route.origin.lat || !form.route.destination.lat) {
      setError("Find both locations on the map or drop a pin before posting your ride.");
      return;
    }
    setBusy(true);
    const payload = {
      rideType: "carpool",
      origin: form.route.origin,
      destination: form.route.destination,
      departureTime: new Date(`${form.date}T${form.time}`).toISOString(),
      seatsTotal: Number(form.seatsTotal),
      pricePerSeat: Number(form.pricePerSeat),
      notes: [form.vehicle ? `Vehicle: ${form.vehicle}.` : "", form.notes].filter(Boolean).join(" "),
      womenOnly: form.womenOnly,
      allowLuggage: form.allowLuggage,
    };
    try {
      let ride;
      try {
        ride = await ridesApi.create(payload);
      } catch {
        ride = demoStore.createRide({ ...payload, vehicle: { model: form.vehicle || "Your vehicle" } }, user);
      }
      navigate(`/rides/${ride.id}`, { state: { justPosted: true } });
    } catch (reason) {
      setError(reason.message || "Could not post this ride.");
    } finally {
      setBusy(false);
    }
  };

  const inputClass = "min-h-12 w-full rounded-xl border border-[#e6d9d3] bg-white px-4 text-sm font-semibold text-[#2a2020] outline-none focus:border-[#e8462c] focus:ring-4 focus:ring-[#e8462c]/10";
  const labelClass = "mb-2 block text-sm font-extrabold text-[#2d2322]";

  return (
    <div className="min-h-screen bg-[#fffaf6]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:py-14">
        <header className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end"><div><span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.17em] text-[#e8462c]"><Sparkles size={14} /> Turn empty seats into shared journeys</span><h1 className="mt-3 font-serif text-4xl text-[#52151d] sm:text-5xl">Offer a ride</h1><p className="mt-3 max-w-2xl leading-7 text-[#756963]">Set your route and price. Travellers can request seats while you stay in control.</p></div><div className="flex gap-5 rounded-2xl bg-[#fff0e7] px-5 py-4 text-sm font-bold text-[#7a1f2a]"><span className="flex items-center gap-2"><Users size={18} /> Fill seats</span><span className="flex items-center gap-2"><ShieldCheck size={18} /> You approve</span></div></header>
        <form onSubmit={submit} className="mt-8 space-y-7">
          <section className="rounded-[28px] border border-[#eaded8] bg-white p-5 shadow-[0_18px_55px_rgba(63,19,24,.07)] sm:p-7"><div className="mb-6"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#fff0e7] text-sm font-extrabold text-[#e8462c]">1</span><h2 className="mt-3 text-xl font-extrabold text-[#52151d]">Plan your route</h2><p className="mt-1 text-sm text-[#756963]">Search each place or click the map to place its pin.</p></div><RoutePlanner value={form.route} onChange={(route) => update("route", route)} /></section>
          <section className="rounded-[28px] border border-[#eaded8] bg-white p-5 shadow-[0_18px_55px_rgba(63,19,24,.07)] sm:p-7"><div className="mb-6"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#fff0e7] text-sm font-extrabold text-[#e8462c]">2</span><h2 className="mt-3 text-xl font-extrabold text-[#52151d]">Ride details</h2></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><label><span className={labelClass}>Departure date</span><input type="date" value={form.date} onChange={(event) => update("date", event.target.value)} className={inputClass} required /></label><label><span className={labelClass}>Departure time</span><input type="time" value={form.time} onChange={(event) => update("time", event.target.value)} className={inputClass} required /></label><label><span className={labelClass}>Available seats</span><select value={form.seatsTotal} onChange={(event) => update("seatsTotal", event.target.value)} className={inputClass}>{[1,2,3,4,5,6,7].map((seat) => <option key={seat}>{seat}</option>)}</select></label><label><span className={labelClass}>Price per seat</span><span className="relative block"><IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8d7f7a]" size={16} /><input type="number" min="0" value={form.pricePerSeat} onChange={(event) => update("pricePerSeat", event.target.value)} className={`${inputClass} pl-10`} placeholder="250" required /></span></label><label className="sm:col-span-2"><span className={labelClass}>Vehicle</span><input value={form.vehicle} onChange={(event) => update("vehicle", event.target.value)} className={inputClass} placeholder="e.g. White Maruti Ertiga" /></label><label className="sm:col-span-2"><span className={labelClass}>A note for passengers</span><input value={form.notes} onChange={(event) => update("notes", event.target.value)} className={inputClass} placeholder="Pickup flexibility, stops, luggage details..." /></label></div><div className="mt-5 flex flex-wrap gap-3">{[["allowLuggage",Luggage,"Luggage allowed"],["womenOnly",ShieldCheck,"Women only"]].map(([field,Icon,label]) => <button key={field} type="button" onClick={() => update(field,!form[field])} className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold ${form[field] ? "border-[#e8462c] bg-[#fff0e7] text-[#8a2c1d]" : "border-[#e6d9d3] text-[#746762]"}`}><Icon size={17} />{label}{form[field] && <Check size={16} />}</button>)}</div></section>
          {error && <StatusBanner type="error">{error}</StatusBanner>}
          <div className="flex flex-col justify-between gap-4 rounded-[24px] bg-[#4b1119] p-5 text-white sm:flex-row sm:items-center sm:p-6"><div><p className="font-extrabold">Ready to share your journey?</p><p className="mt-1 text-sm text-white/65">Your exact contact details stay private until a booking is confirmed.</p></div><button disabled={busy} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#ff8a55] px-7 text-sm font-extrabold text-[#3b0d12] hover:bg-[#ffad7f] disabled:opacity-60">{busy ? <LoaderCircle className="animate-spin" size={18} /> : "Publish ride"}</button></div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
