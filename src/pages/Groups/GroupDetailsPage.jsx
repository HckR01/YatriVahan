import { ArrowLeft, CalendarDays, CarFront, LoaderCircle, LockKeyhole, MapPin, MessageCircle, Send, UserPlus, UsersRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Footer from "../../components/layout/Footer";
import Navbar from "../../components/layout/Navbar";
import StatusBanner from "../../components/common/StatusBanner";
import { useAuth } from "../../hooks/useAuth";
import { useGroupSocket } from "../../hooks/useRideSocket";
import { groupsApi } from "../../lib/api";
import { demoStore } from "../../lib/demoStore";

const formatDate = (value) => value ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T00:00:00`)) : "Date flexible";
const normalizeMessage = (message) => ({ ...message, senderName: message.senderName || message.sender?.fullName || "Member", createdAt: message.createdAt || new Date().toISOString() });

export default function GroupDetailsPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [offline, setOffline] = useState(false);

  const addLiveMessage = useCallback((incoming) => {
    const next = normalizeMessage(incoming);
    setMessages((current) => current.some((item) => item.id && item.id === next.id) ? current : [...current, next]);
  }, []);
  useGroupSocket(group?.isMember ? groupId : null, addLiveMessage);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await groupsApi.get(groupId);
        if (!active) return;
        setGroup(data);
        if (data.isMember) {
          const loadedMessages = await groupsApi.messages(groupId).catch(() => []);
          if (active) setMessages((Array.isArray(loadedMessages) ? loadedMessages : loadedMessages?.items || []).map(normalizeMessage).reverse());
        }
      } catch {
        if (!active) return;
        const local = demoStore.getGroup(groupId);
        setGroup(local);
        setMessages((local?.messages || []).map(normalizeMessage));
        setOffline(Boolean(local));
      } finally { if (active) setLoading(false); }
    };
    load();
    return () => { active = false; };
  }, [groupId]);

  const join = async () => {
    if (!user) { navigate(`/login?returnTo=${encodeURIComponent(`/groups/${groupId}`)}`); return; }
    setError("");
    try {
      try { await groupsApi.join(groupId, joinCode); }
      catch { demoStore.joinGroup(groupId); setOffline(true); }
      setGroup((current) => ({ ...current, isMember: true, memberCount: Number(current.memberCount || 0) + 1 }));
    } catch (reason) { setError(reason.message || "Could not join this group."); }
  };

  const send = async (event) => {
    event.preventDefault();
    const text = message.trim();
    if (!text) return;
    setMessage("");
    try {
      let saved;
      try { saved = await groupsApi.sendMessage(groupId, text); }
      catch { saved = demoStore.addMessage(groupId, text, user?.user_metadata?.full_name || "You"); setOffline(true); }
      addLiveMessage(saved);
    } catch (reason) { setError(reason.message || "Message was not sent."); }
  };

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#fffaf6]"><LoaderCircle className="animate-spin text-[#e8462c]" size={30} /></div>;
  if (!group) return <div className="min-h-screen bg-[#fffaf6]"><Navbar /><main className="mx-auto max-w-xl px-5 py-24 text-center"><UsersRound className="mx-auto text-[#e8462c]" size={38} /><h1 className="mt-4 font-serif text-4xl text-[#52151d]">Group not found</h1><p className="mt-3 text-[#756963]">This group may be private, removed, or the link is invalid.</p><Link to="/groups" className="mt-6 inline-block font-extrabold text-[#e8462c]">Browse travel groups</Link></main><Footer /></div>;

  const members = group.members || [];
  return (
    <div className="min-h-screen bg-[#fffaf6]"><Navbar /><main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-12"><Link to="/groups" className="inline-flex items-center gap-2 text-sm font-extrabold text-[#7a1f2a]"><ArrowLeft size={17} /> All groups</Link>{offline && <div className="mt-5"><StatusBanner>Using the local group preview while the service reconnects.</StatusBanner></div>}{error && <div className="mt-5"><StatusBanner type="error">{error}</StatusBanner></div>}<section className="mt-6 overflow-hidden rounded-[28px] bg-[#4a1119] text-white shadow-[0_20px_60px_rgba(63,19,24,.18)]"><div className="p-6 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-5"><div><p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.15em] text-[#ffc6a1]">{group.isPrivate && <LockKeyhole size={14} />} Travel community</p><h1 className="mt-3 font-serif text-4xl sm:text-5xl">{group.name}</h1><p className="mt-4 max-w-2xl leading-7 text-white/70">{group.description || "Travellers coordinating a shared journey."}</p></div><span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold">{group.memberCount || members.length}/{group.maxMembers} members</span></div><div className="mt-7 grid gap-3 rounded-2xl bg-white/10 p-5 sm:grid-cols-3"><p className="flex items-center gap-2 text-sm"><MapPin size={17} className="text-[#ff9a63]" />{group.origin?.name || group.originName} → {group.destination?.name || group.destinationName}</p><p className="flex items-center gap-2 text-sm"><CalendarDays size={17} className="text-[#ff9a63]" />{formatDate(group.departureDate || group.travelDate)}</p><p className="text-sm font-bold">Preferred {String(group.preferredTime || "Flexible").slice(0,5)}</p></div></div></section>
      <div className="mt-6 grid gap-6 lg:grid-cols-[.72fr_1.28fr]"><div className="space-y-5"><section className="rounded-[24px] border border-[#eaded8] bg-white p-5"><h2 className="flex items-center gap-2 text-lg font-extrabold text-[#52151d]"><UsersRound size={19} className="text-[#e8462c]" /> Members</h2><div className="mt-4 grid gap-2">{members.length ? members.map((member,index) => <div key={member.userId || index} className="flex items-center gap-3 rounded-xl bg-[#fffaf6] p-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#fff0e7] text-sm font-extrabold text-[#7a1f2a]">{(member.profile?.fullName || "M").charAt(0)}</span><span className="text-sm font-bold text-[#4e4240]">{member.profile?.fullName || "Group member"}</span></div>) : <p className="text-sm text-[#756963]">{group.memberCount || 0} travellers have joined.</p>}</div></section>{group.isMember ? <button onClick={() => navigate("/hire-ride?type=private", { state: { group } })} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#e8462c] px-5 text-sm font-extrabold text-white"><CarFront size={18} /> Book for this group</button> : <section className="rounded-[24px] border border-[#eaded8] bg-white p-5"><h2 className="font-extrabold text-[#52151d]">Join the plan</h2><p className="mt-2 text-sm leading-6 text-[#756963]">Join to chat with members and book transport together.</p>{group.isPrivate && <input value={joinCode} onChange={(event) => setJoinCode(event.target.value)} className="mt-4 min-h-11 w-full rounded-xl border border-[#e6d9d3] px-4 text-sm outline-none" placeholder="Private join code" />}<button onClick={join} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7a1f2a] px-5 text-sm font-extrabold text-white"><UserPlus size={17} /> Join group</button></section>}</div>
      <section className="flex min-h-[500px] flex-col rounded-[24px] border border-[#eaded8] bg-white p-5 sm:p-6"><h2 className="flex items-center gap-2 text-lg font-extrabold text-[#52151d]"><MessageCircle size={19} className="text-[#e8462c]" /> Group chat</h2>{group.isMember ? <><div className="mt-5 flex-1 space-y-3 overflow-y-auto rounded-2xl bg-[#fffaf6] p-4">{messages.length === 0 && <p className="py-12 text-center text-sm text-[#8a7c77]">No messages yet. Say hello to the group.</p>}{messages.map((item,index) => <div key={item.id || index} className="rounded-2xl bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><strong className="text-sm text-[#4c403d]">{item.senderName}</strong><span className="text-[11px] text-[#998c87]">{new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(item.createdAt))}</span></div><p className="mt-1.5 text-sm leading-6 text-[#695d59]">{item.message || item.text}</p></div>)}</div><form onSubmit={send} className="mt-4 flex gap-2"><input value={message} onChange={(event) => setMessage(event.target.value)} maxLength="2000" className="min-h-12 min-w-0 flex-1 rounded-xl border border-[#e6d9d3] px-4 text-sm outline-none focus:border-[#e8462c]" placeholder="Message the group…" aria-label="Group message" /><button className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#e8462c] text-white" aria-label="Send"><Send size={18} /></button></form></> : <div className="grid flex-1 place-items-center py-16 text-center"><div><LockKeyhole className="mx-auto text-[#e8462c]" size={31} /><p className="mt-4 font-extrabold text-[#52151d]">Join to open group chat</p><p className="mt-2 text-sm text-[#756963]">Member conversations stay private.</p></div></div>}</section></div></main><Footer /></div>
  );
}
