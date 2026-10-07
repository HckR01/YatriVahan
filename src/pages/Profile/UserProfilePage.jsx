import { BadgeCheck, CalendarCheck, CarFront, Edit3, LogOut, Mail, MapPin, Phone, Save, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../../components/layout/Footer";
import Navbar from "../../components/layout/Navbar";
import StatusBanner from "../../components/common/StatusBanner";
import RideCard from "../../components/ride/RideCard";
import { useAuth } from "../../hooks/useAuth";
import { bookingsApi, profileApi, ridesApi } from "../../lib/api";
import { demoStore } from "../../lib/demoStore";
import { formatDateTime, formatMoney } from "../../lib/format";

export default function UserProfilePage() {
  const { user, signOut, updateLocalUser, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("trips");
  const [profile, setProfile] = useState(() => ({
    fullName: user?.user_metadata?.full_name || "Traveller",
    phone: user?.phone || user?.user_metadata?.phone || "",
    email: user?.email || "",
    role: user?.user_metadata?.role || "rider",
    bio: "",
    isVerified: false,
  }));
  const [bookings, setBookings] = useState(() => demoStore.getBookings());
  const [rides, setRides] = useState([]);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState("");
  const [offline, setOffline] = useState(isDemoMode);

  useEffect(() => {
    let active = true;
    Promise.allSettled([profileApi.me(), bookingsApi.list({ role: "passenger" }), ridesApi.mine()]).then(([profileResult, bookingResult, rideResult]) => {
      if (!active) return;
      if (profileResult.status === "fulfilled") setProfile((current) => ({ ...current, ...profileResult.value }));
      if (bookingResult.status === "fulfilled") setBookings(bookingResult.value);
      if (rideResult.status === "fulfilled") setRides(rideResult.value);
      setOffline([profileResult, bookingResult, rideResult].some((result) => result.status === "rejected"));
    });
    return () => { active = false; };
  }, []);

  const save = async (event) => {
    event.preventDefault();
    setStatus("");
    const updates = { fullName: profile.fullName, phone: profile.phone || null, bio: profile.bio || null, role: profile.role };
    try {
      if (!isDemoMode) await profileApi.update(updates);
      await updateLocalUser({ full_name: profile.fullName, phone: profile.phone, role: profile.role });
      setEditing(false);
      setStatus("Profile updated.");
    } catch (reason) { setStatus(reason.message || "Profile could not be saved."); }
  };
  const logout = async () => { await signOut(); navigate("/"); };
  const input = "min-h-12 w-full rounded-xl border border-[#e6d9d3] bg-white px-4 text-sm font-semibold outline-none focus:border-[#e8462c] focus:ring-4 focus:ring-[#e8462c]/10 disabled:bg-[#f8f3f0] disabled:text-[#81746f]";

  return (
    <div className="min-h-screen bg-[#f8f3ef]"><Navbar /><main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-12"><section className="overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_85%_10%,rgba(255,162,96,.25),transparent_25%),linear-gradient(130deg,#421017,#741e28)] p-6 text-white shadow-[0_22px_60px_rgba(63,19,24,.18)] sm:p-8"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center"><div className="flex items-center gap-5"><span className="grid h-20 w-20 shrink-0 place-items-center rounded-[26px] bg-white text-3xl font-extrabold text-[#7a1f2a]">{profile.fullName.charAt(0).toUpperCase()}</span><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-[#ffc6a1]">My YatriVahan {profile.isVerified && <BadgeCheck size={15} />}</p><h1 className="mt-2 font-serif text-3xl sm:text-4xl">{profile.fullName}</h1><p className="mt-1 text-sm capitalize text-white/65">{profile.role === "both" ? "Rider & driver" : profile.role}</p></div></div><button onClick={logout} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 px-5 text-sm font-bold hover:bg-white/10"><LogOut size={17} /> Sign out</button></div></section>
      {offline && <div className="mt-5"><StatusBanner>Some account data is shown from this browser while the API is unavailable.</StatusBanner></div>}
      <div className="mt-7 flex gap-2 overflow-x-auto rounded-2xl bg-white p-1.5 shadow-sm">{[["trips",CalendarCheck,"My bookings"],["rides",CarFront,"My rides"],["profile",UserRound,"Profile & safety"]].map(([value,Icon,label]) => <button key={value} onClick={() => setTab(value)} className={`flex min-h-11 min-w-max flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-extrabold ${tab === value ? "bg-[#7a1f2a] text-white" : "text-[#756963] hover:bg-[#fff0e7]"}`}><Icon size={17} />{label}</button>)}</div>
      {tab === "trips" && <section className="mt-7"><div className="mb-5"><h2 className="font-serif text-3xl text-[#52151d]">Your bookings</h2><p className="mt-1 text-sm text-[#756963]">Upcoming and recent passenger journeys.</p></div>{bookings.length ? <div className="grid gap-4">{bookings.map((booking) => { const ride = booking.ride || demoStore.getRide(booking.rideId); return <article key={booking.id} className="rounded-[22px] border border-[#eaded8] bg-white p-5 shadow-[0_12px_35px_rgba(63,19,24,.05)]"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><span className={`rounded-full px-3 py-1 text-xs font-extrabold capitalize ${booking.status === "confirmed" ? "bg-[#e9f6ed] text-[#26743d]" : "bg-[#fff0e7] text-[#9a4025]"}`}>{booking.status}</span><h3 className="mt-3 text-lg font-extrabold text-[#422f2c]">{ride?.origin?.name || booking.pickupName} <span className="text-[#e8462c]">→</span> {ride?.destination?.name || booking.dropoffName}</h3><p className="mt-2 flex items-center gap-2 text-sm text-[#756963]"><MapPin size={15} className="text-[#e8462c]" />{formatDateTime(ride?.departureTime)} · {booking.seats} seat{booking.seats === 1 ? "" : "s"}</p></div><div className="flex items-center gap-3 sm:text-right"><div><p className="font-extrabold text-[#52151d]">{formatMoney(booking.amount || ride?.estimatedFare || 0)}</p><p className="text-xs text-[#8a7c77]">{booking.paymentStatus || "unpaid"}</p></div>{ride && <Link to={`/trips/${ride.id}`} className="rounded-xl bg-[#1677c8] px-4 py-3 text-sm font-extrabold text-white">Track</Link>}</div></div></article>; })}</div> : <div className="rounded-3xl border border-dashed border-[#dcbfb5] bg-white px-5 py-14 text-center"><CalendarCheck className="mx-auto text-[#e8462c]" size={32} /><p className="mt-4 font-extrabold text-[#52151d]">No bookings yet</p><Link to="/find-ride" className="mt-3 inline-block text-sm font-bold text-[#e8462c]">Find your first ride</Link></div>}</section>}
      {tab === "rides" && <section className="mt-7"><div className="mb-5 flex items-end justify-between"><div><h2 className="font-serif text-3xl text-[#52151d]">Rides you manage</h2><p className="mt-1 text-sm text-[#756963]">Offers and ride requests connected to your account.</p></div><Link to="/offer-ride" className="hidden rounded-xl bg-[#e8462c] px-5 py-3 text-sm font-extrabold text-white sm:block">Offer a ride</Link></div>{rides.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{rides.map((ride) => <RideCard key={ride.id} ride={ride} compact />)}</div> : <div className="rounded-3xl border border-dashed border-[#dcbfb5] bg-white px-5 py-14 text-center"><CarFront className="mx-auto text-[#e8462c]" size={32} /><p className="mt-4 font-extrabold text-[#52151d]">You aren’t managing a ride yet</p><Link to="/offer-ride" className="mt-3 inline-block text-sm font-bold text-[#e8462c]">Post available seats</Link></div>}</section>}
      {tab === "profile" && <section className="mt-7 grid gap-6 lg:grid-cols-[1fr_.72fr]"><form onSubmit={save} className="rounded-[26px] border border-[#eaded8] bg-white p-5 sm:p-7"><div className="flex items-center justify-between"><div><h2 className="font-serif text-3xl text-[#52151d]">Profile details</h2><p className="mt-1 text-sm text-[#756963]">Keep your contact and travel role current.</p></div><button type="button" onClick={() => setEditing((value) => !value)} className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff0e7] text-[#e8462c]" aria-label="Edit profile"><Edit3 size={18} /></button></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><label><span className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#332826]"><UserRound size={16} /> Full name</span><input disabled={!editing} value={profile.fullName} onChange={(event) => setProfile((current) => ({...current,fullName:event.target.value}))} className={input} required /></label><label><span className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#332826]"><Phone size={16} /> Phone</span><input disabled={!editing} value={profile.phone || ""} onChange={(event) => setProfile((current) => ({...current,phone:event.target.value}))} className={input} /></label><label><span className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#332826]"><Mail size={16} /> Email</span><input disabled value={profile.email || user?.email || ""} className={input} /></label><label><span className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#332826]"><CarFront size={16} /> Role</span><select disabled={!editing} value={profile.role} onChange={(event) => setProfile((current) => ({...current,role:event.target.value}))} className={input}><option value="rider">Rider</option><option value="driver">Driver</option><option value="both">Rider & driver</option></select></label><label className="sm:col-span-2"><span className="mb-2 block text-sm font-extrabold text-[#332826]">Bio</span><textarea disabled={!editing} rows="3" value={profile.bio || ""} onChange={(event) => setProfile((current) => ({...current,bio:event.target.value}))} className={`${input} py-3`} placeholder="A little about your travel preferences" /></label></div>{editing && <button className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#7a1f2a] px-5 text-sm font-extrabold text-white"><Save size={17} /> Save changes</button>}{status && <p className="mt-4 text-sm font-bold text-[#26743d]">{status}</p>}</form><aside className="rounded-[26px] bg-[#fff0e7] p-6"><ShieldCheck className="text-[#e8462c]" size={27} /><h2 className="mt-4 text-xl font-extrabold text-[#52151d]">Safety first</h2><div className="mt-5 space-y-4 text-sm leading-6 text-[#695d59]"><p>Verify trip details and vehicle number before boarding.</p><p>Share the live tracking link with a trusted person.</p><p>Keep all booking and payment conversations in YatriVahan.</p></div>{profile.isVerified ? <p className="mt-6 flex items-center gap-2 font-extrabold text-[#26743d]"><BadgeCheck size={18} /> Verified profile</p> : <p className="mt-6 text-xs font-bold text-[#8a5b46]">Verification is managed securely by the YatriVahan team. No verification passwords are collected.</p>}</aside></section>}
      </main><Footer /></div>
  );
}
