import { ArrowRight, Leaf, MapPin, Search, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import mainImage from "../../assets/Mainpg_img.png";

export default function Hero() {
  const navigate = useNavigate();
  const [search, setSearch] = useState({ origin: "", destination: "", departureDate: "", seats: 1 });

  const submit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    Object.entries(search).forEach(([key, value]) => value && params.set(key, value));
    navigate(`/find-ride?${params.toString()}`);
  };

  return (
    <section className="relative isolate overflow-hidden bg-[#fffaf6]">
      <div className="absolute inset-x-0 top-0 -z-10 h-[78%] bg-[radial-gradient(circle_at_85%_15%,rgba(255,153,92,.28),transparent_28%),linear-gradient(128deg,#421017_0%,#711d28_58%,#982d29_100%)]" />
      <div className="absolute -right-36 top-12 -z-10 h-96 w-96 rounded-full border border-white/10 shadow-[0_0_0_65px_rgba(255,255,255,.025),0_0_0_130px_rgba(255,255,255,.018)]" />
      <div className="mx-auto max-w-7xl px-5 pb-14 pt-12 sm:px-8 lg:pb-20 lg:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
          <div className="text-white">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[#ffd2b6] backdrop-blur"><Sparkles size={14} /> One app. Every kind of ride.</span>
            <h1 className="mt-6 max-w-2xl font-serif text-5xl leading-[1.04] tracking-tight sm:text-6xl lg:text-[70px]">Go together.<br /><span className="text-[#ffb37e]">Go your way.</span></h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/75">Share a seat, book the whole car, or find a ride right now. YatriVahan brings local riders and trusted drivers onto one simple route.</p>
            <div className="mt-7 flex flex-wrap gap-4 text-sm font-bold text-white/75"><span className="flex items-center gap-2"><ShieldCheck size={18} className="text-[#ffb37e]" /> Verified profiles</span><span className="flex items-center gap-2"><UsersRound size={18} className="text-[#ffb37e]" /> Community groups</span><span className="flex items-center gap-2"><Leaf size={18} className="text-[#ffb37e]" /> Lower-cost travel</span></div>
          </div>
          <div className="relative hidden lg:block">
            <div className="absolute -inset-3 translate-x-4 translate-y-4 rounded-[34px] border border-[#ffb37e]/40" />
            <div className="relative overflow-hidden rounded-[32px] border border-white/15 shadow-2xl"><img src={mainImage} alt="Travellers riding together in Odisha" className="h-[440px] w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#3b0d12]/70 via-transparent to-transparent" /><div className="absolute inset-x-5 bottom-5 flex items-center justify-between rounded-2xl bg-white/95 p-4 text-[#3b0d12] shadow-xl"><div><p className="text-xs font-bold uppercase tracking-[.12em] text-[#e8462c]">Live journeys</p><p className="mt-1 font-extrabold">Your next ride is nearby</p></div><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#fff0e7] text-[#e8462c]"><MapPin size={20} /></span></div></div>
          </div>
        </div>

        <form onSubmit={submit} className="relative z-10 mt-10 rounded-[26px] border border-[#eaded8] bg-white p-4 shadow-[0_24px_70px_rgba(50,16,20,.16)] sm:p-5 lg:-mb-16 lg:mt-14">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1fr_1fr_.72fr_.55fr_auto]">
            {[['origin','Pickup','Astarang, station, landmark'],['destination','Destination','Bhubaneswar, airport...']].map(([field,label,placeholder]) => <label key={field} className="rounded-2xl bg-[#fffaf6] px-4 py-3"><span className="text-xs font-extrabold uppercase tracking-[.1em] text-[#887a75]">{label}</span><span className="mt-1 flex items-center gap-2"><MapPin size={17} className="shrink-0 text-[#e8462c]" /><input value={search[field]} onChange={(event) => setSearch((current) => ({...current,[field]:event.target.value}))} className="min-w-0 flex-1 bg-transparent font-bold text-[#2d2221] outline-none placeholder:font-medium placeholder:text-[#a99d98]" placeholder={placeholder} /></span></label>)}
            <label className="rounded-2xl bg-[#fffaf6] px-4 py-3"><span className="text-xs font-extrabold uppercase tracking-[.1em] text-[#887a75]">Date</span><input type="date" value={search.departureDate} onChange={(event) => setSearch((current) => ({...current,departureDate:event.target.value}))} className="mt-1 block w-full bg-transparent font-bold text-[#2d2221] outline-none" /></label>
            <label className="rounded-2xl bg-[#fffaf6] px-4 py-3"><span className="text-xs font-extrabold uppercase tracking-[.1em] text-[#887a75]">Seats</span><select value={search.seats} onChange={(event) => setSearch((current) => ({...current,seats:event.target.value}))} className="mt-1 block w-full bg-transparent font-bold text-[#2d2221] outline-none">{[1,2,3,4,5,6].map((seat) => <option key={seat}>{seat}</option>)}</select></label>
            <button className="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-[#e8462c] px-6 font-extrabold text-white shadow-lg shadow-[#e8462c]/20 transition hover:bg-[#d33c24]"><Search size={19} /> Find rides <ArrowRight size={18} /></button>
          </div>
        </form>
      </div>
    </section>
  );
}
