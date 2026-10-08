import { ArrowRight, BadgeCheck, CalendarDays, CarFront, Check, Clock3, IndianRupee, Leaf, LoaderCircle, Luggage, MapPin, Route, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../../components/layout/Footer";
import Navbar from "../../components/layout/Navbar";
import StatusBanner from "../../components/common/StatusBanner";
import RoutePlanner from "../../components/map/RoutePlanner";
import { useAuth } from "../../hooks/useAuth";
import { profileApi, ridesApi } from "../../lib/api";
import { validPoint } from "../../lib/coordinates";
import { demoStore } from "../../lib/demoStore";

const initial = { route: { origin: { name: "", lat: null, lng: null }, destination: { name: "", lat: null, lng: null } }, date: "", time: "", seatsTotal: 3, pricePerSeat: "", vehicle: "", notes: "", womenOnly: false, allowLuggage: true };

function SectionTitle({ icon: Icon, step, title, description }) {
  return <div className="mb-6 flex items-start gap-4"><span className="section-icon"><Icon size={21} /></span><div><p className="eyebrow">Step {step}</p><h2 className="mt-1 text-xl font-extrabold text-[#52151d]">{title}</h2><p className="mt-1 text-sm text-[#756963]">{description}</p></div></div>;
}

export default function OfferRidePage() {
  const { user, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [approval, setApproval] = useState(isDemoMode ? "approved" : "loading");
  useEffect(() => {
    if (isDemoMode) return;
    let active = true;
    profileApi.me().then(profile => { if (active) setApproval(profile.isVerified && ["driver", "both"].includes(profile.role) ? "approved" : "pending"); })
      .catch(() => { if (active) setApproval("unavailable"); });
    return () => { active = false; };
  }, [isDemoMode]);
  const update = (field, value) => { setForm(current => ({ ...current, [field]: value })); setError(""); };
  const routeReady = validPoint(form.route.origin) && validPoint(form.route.destination);
  const detailsReady = !!(form.date && form.time && form.pricePerSeat !== "");
  const submit = async event => {
    event.preventDefault();
    if (!routeReady) return setError("Find both locations on the map or drop a pin before posting your ride.");
    const departure = new Date(`${form.date}T${form.time}`);
    if (!Number.isFinite(departure.getTime()) || departure <= new Date()) return setError("Choose a departure date and time in the future.");
    if (!isDemoMode && approval !== "approved") return setError("Your profile needs admin approval before you can publish. You can still plan your ride here.");
    setBusy(true); setError("");
    try {
      const payload = { rideType: "carpool", origin: form.route.origin, destination: form.route.destination, departureTime: departure.toISOString(), seatsTotal: Number(form.seatsTotal), pricePerSeat: Number(form.pricePerSeat), notes: [form.vehicle ? `Vehicle: ${form.vehicle}.` : "", form.notes].filter(Boolean).join(" "), womenOnly: form.womenOnly, allowLuggage: form.allowLuggage };
      const ride = isDemoMode ? demoStore.createRide({ ...payload, vehicle: { model: form.vehicle || "Your vehicle" } }, user) : await ridesApi.create(payload);
      navigate(`/rides/${ride.id}`, { state: { justPosted: true } });
    } catch (reason) { setError(reason.message || "Could not post this ride."); }
    finally { setBusy(false); }
  };
  const total = Number(form.pricePerSeat || 0) * Number(form.seatsTotal);

  return <div className="min-h-screen bg-[#fffaf6]">
    <Navbar />
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
      <header className="offer-hero reveal-in">
        <div className="relative z-10 max-w-2xl"><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-[#ffd7bd]"><Sparkles size={14} /> A little company. A better journey.</span><h1 className="mt-5 font-serif text-4xl leading-tight sm:text-5xl">Your route.<br /><span className="text-[#ffb889]">Someone’s next adventure.</span></h1><p className="mt-4 max-w-lg text-sm leading-7 text-white/75 sm:text-base">Going somewhere? Share your empty seats, split the travel cost, and make the miles feel shorter.</p><div className="mt-6 flex flex-wrap gap-5 text-xs font-bold text-white/85"><span className="flex items-center gap-2"><ShieldCheck size={17} /> Approved drivers</span><span className="flex items-center gap-2"><Leaf size={17} /> More shared journeys</span></div></div>
        <div className="offer-hero-art" aria-hidden="true"><div className="orbit-ring" /><div className="orbit-ring orbit-ring-small" /><span className="hero-pin hero-pin-a"><MapPin size={25} /></span><span className="hero-car"><CarFront size={68} strokeWidth={1.4} /></span><span className="hero-pin hero-pin-b"><Users size={24} /></span><span className="hero-art-label">GOOD COMPANY, GREAT JOURNEYS</span></div>
      </header>
      <div className="my-7 flex flex-wrap gap-3" aria-label="Ride setup progress">{[["Route",routeReady],["Ride details",detailsReady],["Publish",false]].map(([label,done],index) => <span key={label} className={`step-pill ${done ? "step-complete" : ""}`}><span>{done ? <Check size={13} /> : `0${index + 1}`}</span>{label}{index < 2 && <ArrowRight size={13} className="ml-2 opacity-40" />}</span>)}</div>
      <form onSubmit={submit} className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <section className="surface-card reveal-in"><SectionTitle icon={Route} step="01" title="Where are you headed?" description="Search a place or choose pickup and destination pins on the map." /><RoutePlanner value={form.route} onChange={route => update("route", route)} /></section>
          <section className="surface-card reveal-in"><SectionTitle icon={CalendarDays} step="02" title="Make it your kind of ride" description="A few details help the right passengers find you." /><div className="grid gap-5 sm:grid-cols-2">
            <label><span className="ride-label"><CalendarDays size={15} /> Departure date</span><input type="date" value={form.date} onChange={event => update("date",event.target.value)} className="ride-input" required /></label>
            <label><span className="ride-label"><Clock3 size={15} /> Departure time</span><input type="time" value={form.time} onChange={event => update("time",event.target.value)} className="ride-input" required /></label>
            <label><span className="ride-label"><Users size={15} /> Available seats</span><select value={form.seatsTotal} onChange={event => update("seatsTotal",event.target.value)} className="ride-input">{[1,2,3,4,5,6,7].map(seat => <option key={seat} value={seat}>{seat} {seat === 1 ? "seat" : "seats"}</option>)}</select></label>
            <label><span className="ride-label"><IndianRupee size={15} /> Price per seat</span><input type="number" min="0" max="100000" step="0.01" value={form.pricePerSeat} onChange={event => update("pricePerSeat",event.target.value)} className="ride-input" placeholder="e.g. 250" required /></label>
            <label className="sm:col-span-2"><span className="ride-label"><CarFront size={15} /> Your vehicle</span><input value={form.vehicle} onChange={event => update("vehicle",event.target.value)} className="ride-input" placeholder="e.g. White Maruti Ertiga" maxLength={100} /></label>
            <label className="sm:col-span-2"><span className="ride-label">Anything passengers should know? <span className="font-normal text-[#92837c]">Optional</span></span><textarea value={form.notes} onChange={event => update("notes",event.target.value)} className="ride-input min-h-24 py-3" placeholder="Pickup flexibility, stops, or a favourite road-trip playlist…" maxLength={1500} /></label>
          </div><div className="mt-5 grid gap-3 sm:grid-cols-2">{[["allowLuggage",Luggage,"Room for luggage","A little extra space for their bags"],["womenOnly",ShieldCheck,"Women-only ride","Limit this ride to women passengers"]].map(([field,Icon,label,hint]) => <button key={field} type="button" aria-pressed={form[field]} onClick={() => update(field,!form[field])} className={`preference-tile ${form[field] ? "preference-selected" : ""}`}><Icon size={21} className="shrink-0" /><span className="flex-1 text-left"><strong className="block text-sm">{label}</strong><span className="mt-1 block text-xs opacity-70">{hint}</span></span><span className="preference-check">{form[field] && <Check size={13} />}</span></button>)}</div></section>
          {error && <StatusBanner type="error">{error}</StatusBanner>}
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24">
          <section className="surface-card !p-6"><div className="flex items-center justify-between"><h2 className="font-serif text-2xl text-[#52151d]">Your ride, at a glance</h2><CarFront size={22} className="text-[#e8462c]" /></div><p className="mt-2 text-xs text-[#897970]">Updates as you plan your journey</p><div className="summary-route mt-7"><div><span className="summary-dot" /><p className="eyebrow">Pickup</p><p className="mt-1 break-words text-sm font-bold">{form.route.origin.name || "Choose your starting point"}</p></div><div><span className="summary-dot summary-dot-end" /><p className="eyebrow">Destination</p><p className="mt-1 break-words text-sm font-bold">{form.route.destination.name || "Where will you go?"}</p></div></div><div className="my-5 space-y-3 border-y border-[#eee4df] py-5 text-sm"><p className="flex items-center gap-3"><CalendarDays size={16} className="text-[#9c796b]" />{form.date || "Pick a date"}{form.time && ` · ${form.time}`}</p><p className="flex items-center gap-3"><Users size={16} className="text-[#9c796b]" />{form.seatsTotal} seats available</p><p className="flex items-center gap-3"><IndianRupee size={16} className="text-[#9c796b]" />{form.pricePerSeat === "" ? "Set your seat price" : `${Number(form.pricePerSeat).toLocaleString("en-IN")} per seat`}</p></div><div className="flex items-end justify-between"><div><p className="text-xs font-bold text-[#897970]">Total if all seats fill</p><p className="mt-1 font-serif text-3xl text-[#52151d]">₹{total.toLocaleString("en-IN")}</p></div><Leaf size={22} className="text-[#51794e]" /></div><button disabled={busy || approval === "loading"} className="primary-action mt-6 w-full">{busy ? <LoaderCircle size={18} className="animate-spin" /> : <><span>Publish your ride</span><ArrowRight size={18} /></>}</button><p className="mt-3 text-center text-[11px] leading-5 text-[#897970]">Review your route and departure time before publishing.</p></section>
          <div className="rounded-2xl border border-[#eaded8] bg-[#f5eee6] p-5"><BadgeCheck size={22} className="text-[#7a1f2a]" /><p className="mt-3 text-sm font-bold text-[#52151d]">{approval === "approved" ? "Ready for the road" : approval === "loading" ? "Checking your profile…" : "Driver approval required"}</p><p className="mt-2 text-xs leading-6 text-[#756963]">{approval === "approved" ? "Keep pickup details clear and confirm your passengers before you leave." : "Plan your ride now. An admin must approve your driver profile before you publish."}</p><Link to="/profile" className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[#7a1f2a]">View your profile <ArrowRight size={13} /></Link></div>
        </aside>
      </form>
    </main><Footer />
  </div>;
}
