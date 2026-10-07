import { ArrowRight, CalendarDays, LockKeyhole, MapPin, Plus, Search, UsersRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../../components/layout/Footer";
import Navbar from "../../components/layout/Navbar";
import StatusBanner from "../../components/common/StatusBanner";
import { useAuth } from "../../hooks/useAuth";
import { groupsApi } from "../../lib/api";
import { demoStore } from "../../lib/demoStore";

const asList = (data) => Array.isArray(data) ? data : data?.groups || data?.items || [];
const formatDate = (value) => value ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`)) : "Date flexible";

export default function GroupsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState(() => demoStore.getGroups());
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", originName: "", destinationName: "", travelDate: "", preferredTime: "07:00", maxMembers: 8, description: "", isPrivate: false, joinCode: "" });

  useEffect(() => {
    let active = true;
    groupsApi.list().then((data) => { if (active) { setGroups(asList(data)); setOffline(false); } }).catch(() => { if (active) setOffline(true); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return groups;
    return groups.filter((group) => [group.name, group.origin?.name, group.destination?.name].some((value) => String(value || "").toLowerCase().includes(term)));
  }, [groups, query]);

  const openCreate = () => {
    if (!user) { navigate(`/login?returnTo=${encodeURIComponent("/groups")}`); return; }
    setShowCreate(true);
  };
  const create = async (event) => {
    event.preventDefault();
    setError("");
    const payload = { ...form, maxMembers: Number(form.maxMembers), joinCode: form.isPrivate && form.joinCode ? form.joinCode : undefined };
    try {
      let group;
      try { group = await groupsApi.create(payload); }
      catch { group = demoStore.createGroup({ ...payload, origin: { name: payload.originName }, destination: { name: payload.destinationName }, departureDate: payload.travelDate }); setOffline(true); }
      setGroups((current) => [group, ...current]);
      setShowCreate(false);
      navigate(`/groups/${group.id}`);
    } catch (reason) { setError(reason.message || "Could not create the group."); }
  };
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const input = "min-h-12 w-full rounded-xl border border-[#e6d9d3] bg-white px-4 text-sm font-semibold outline-none focus:border-[#e8462c] focus:ring-4 focus:ring-[#e8462c]/10";
  const label = "mb-2 block text-sm font-extrabold text-[#2d2322]";

  return (
    <div className="min-h-screen bg-[#fffaf6]"><Navbar />
      <section className="bg-[radial-gradient(circle_at_80%_10%,rgba(255,159,98,.25),transparent_28%),linear-gradient(130deg,#421017,#7b202a)] px-5 py-14 text-white sm:px-8"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-7 sm:flex-row sm:items-end"><div><p className="text-xs font-extrabold uppercase tracking-[.17em] text-[#ffc6a1]">Community carpooling</p><h1 className="mt-3 font-serif text-4xl sm:text-5xl">Find your travel people</h1><p className="mt-3 max-w-xl leading-7 text-white/70">Plan routes together, share a conversation and turn a group into a booking.</p></div><button onClick={openCreate} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#ff9a63] px-6 text-sm font-extrabold text-[#3b0d12]"><Plus size={18} /> Create a group</button></div></section>
      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
        {offline && <div className="mb-6"><StatusBanner>Showing local groups while the community service reconnects.</StatusBanner></div>}
        <div className="relative max-w-xl"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a7d78]" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} className={`${input} pl-11`} placeholder="Search route or group name" aria-label="Search groups" /></div>
        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map((group) => <article key={group.id} className="rounded-[24px] border border-[#eaded8] bg-white p-6 shadow-[0_16px_45px_rgba(63,19,24,.06)]"><div className="flex items-start justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff0e7] text-[#e8462c]"><UsersRound size={21} /></span>{group.isPrivate && <span className="flex items-center gap-1 rounded-full bg-[#f3eff8] px-3 py-1 text-xs font-bold text-[#664c86]"><LockKeyhole size={13} /> Private</span>}</div><h2 className="mt-5 text-xl font-extrabold text-[#52151d]">{group.name}</h2><p className="mt-3 flex items-start gap-2 text-sm text-[#695d59]"><MapPin className="mt-0.5 shrink-0 text-[#e8462c]" size={16} />{group.origin?.name || group.originName} <ArrowRight className="mt-0.5 shrink-0" size={15} /> {group.destination?.name || group.destinationName}</p><div className="mt-5 flex flex-wrap gap-3 border-y border-[#eee4df] py-4 text-xs font-bold text-[#7e706b]"><span className="flex items-center gap-1.5"><CalendarDays size={15} />{formatDate(group.departureDate || group.travelDate)}</span><span>{String(group.preferredTime || "Flexible").slice(0,5)}</span><span>{group.memberCount || 0}/{group.maxMembers} people</span></div><p className="mt-4 line-clamp-2 min-h-10 text-sm leading-6 text-[#756963]">{group.description || "A group for travellers taking this route together."}</p><Link to={`/groups/${group.id}`} className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#7a1f2a] px-5 text-sm font-extrabold text-white">{group.isMember ? "Open group" : "View & join"}<ArrowRight size={16} /></Link></article>)}</div>
        {filtered.length === 0 && <div className="mt-7 rounded-3xl border border-dashed border-[#dbbeb3] bg-white px-5 py-14 text-center text-[#756963]">No groups match that route yet. Create the first one.</div>}
      </main>
      {showCreate && <div className="fixed inset-0 z-[1200] overflow-y-auto bg-[#321014]/70 p-4 backdrop-blur-sm"><div className="mx-auto my-6 max-w-2xl rounded-[28px] bg-[#fffaf6] p-5 shadow-2xl sm:p-7"><div className="flex items-center justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#e8462c]">New community</p><h2 className="mt-2 font-serif text-3xl text-[#52151d]">Create a travel group</h2></div><button onClick={() => setShowCreate(false)} className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#756963]" aria-label="Close"><X size={19} /></button></div><form onSubmit={create} className="mt-6 grid gap-5 sm:grid-cols-2"><label className="sm:col-span-2"><span className={label}>Group name</span><input value={form.name} onChange={(event) => update("name",event.target.value)} className={input} placeholder="e.g. Puri Morning Commuters" minLength="3" required /></label><label><span className={label}>From</span><input value={form.originName} onChange={(event) => update("originName",event.target.value)} className={input} required /></label><label><span className={label}>Destination</span><input value={form.destinationName} onChange={(event) => update("destinationName",event.target.value)} className={input} required /></label><label><span className={label}>Travel date</span><input type="date" value={form.travelDate} onChange={(event) => update("travelDate",event.target.value)} className={input} required /></label><label><span className={label}>Preferred time</span><input type="time" value={form.preferredTime} onChange={(event) => update("preferredTime",event.target.value)} className={input} required /></label><label><span className={label}>Maximum members</span><input type="number" min="2" max="100" value={form.maxMembers} onChange={(event) => update("maxMembers",event.target.value)} className={input} required /></label><button type="button" onClick={() => update("isPrivate",!form.isPrivate)} className={`mt-auto min-h-12 rounded-xl border px-4 text-sm font-bold ${form.isPrivate ? "border-[#7a1f2a] bg-[#fff0e7] text-[#7a1f2a]" : "border-[#e6d9d3] text-[#756963]"}`}>{form.isPrivate ? "Private group" : "Public group"}</button>{form.isPrivate && <label className="sm:col-span-2"><span className={label}>Join code (optional)</span><input value={form.joinCode} minLength="4" onChange={(event) => update("joinCode",event.target.value)} className={input} placeholder="Leave blank to generate one" /></label>}<label className="sm:col-span-2"><span className={label}>Description</span><textarea rows="3" value={form.description} onChange={(event) => update("description",event.target.value)} className={`${input} py-3`} placeholder="Who is this group for?" /></label>{error && <div className="sm:col-span-2"><StatusBanner type="error">{error}</StatusBanner></div>}<button className="min-h-12 rounded-xl bg-[#e8462c] px-6 text-sm font-extrabold text-white sm:col-span-2">Create group</button></form></div></div>}
      <Footer />
    </div>
  );
}
