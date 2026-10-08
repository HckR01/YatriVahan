import { ArrowLeft, BadgeCheck, CalendarDays, CarFront, CheckCircle2, Clock3, IndianRupee, LoaderCircle, Luggage, MapPin, ShieldCheck, Star, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Footer from "../../components/layout/Footer";
import Navbar from "../../components/layout/Navbar";
import StatusBanner from "../../components/common/StatusBanner";
import RideMap from "../../components/map/RideMap";
import { useAuth } from "../../hooks/useAuth";
import { ridesApi } from "../../lib/api";
import { bookingsApi } from "../../lib/api";
import { demoStore } from "../../lib/demoStore";
import { isSupabaseConfigured } from "../../lib/supabase";
import { formatDateTime, formatDuration, formatMoney, getRidePrice, rideTypeLabel } from "../../lib/format";

export default function RideDetailsPage() {
  const { rideId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ride, setRide] = useState(() => demoStore.getRide(rideId));
  const [loading, setLoading] = useState(true);
  const [seats, setSeats] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(null);
  const [managedBookings, setManagedBookings] = useState([]);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let active = true;
    ridesApi.get(rideId).then((data) => { if (active) { setRide(data?.ride || data); setOffline(false); } }).catch(() => {
      if (active) { setRide(demoStore.getRide(rideId)); setOffline(true); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [rideId]);

  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    bookingsApi.list({ role: "driver" }).then((items) => {
      if (active) setManagedBookings(items.filter((item) => String(item.rideId || item.ride?.id) === String(rideId)));
    }).catch(() => { /* demo mode has local bookings */ });
    return () => { active = false; };
  }, [rideId, user]);

  const book = async () => {
    if (!user) {
      navigate(`/login?returnTo=${encodeURIComponent(`/rides/${rideId}`)}`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      let created;
      const payload = { seats: ride.rideType === "private" ? Number(ride.seatsTotal || 1) : Number(seats), pickup: ride.origin, dropoff: ride.destination };
      try { created = await ridesApi.book(rideId, payload); }
      catch { created = demoStore.bookRide(rideId, payload.seats, user); setOffline(true); }
      setBooking(created?.booking || created);
    } catch (reason) { setError(reason.message || "Could not complete the booking."); }
    finally { setBusy(false); }
  };

  if (loading && !ride) return <div className="grid min-h-screen place-items-center bg-[#fffaf6]"><LoaderCircle className="animate-spin text-[#e8462c]" size={30} /></div>;

  if (!ride) return (
    <div className="min-h-screen bg-[#fffaf6]"><Navbar /><main className="mx-auto max-w-2xl px-5 py-24 text-center"><MapPin className="mx-auto text-[#e8462c]" size={38} /><h1 className="mt-5 font-serif text-4xl text-[#52151d]">Ride not found</h1><p className="mt-3 text-[#756963]">It may have been cancelled or the link is no longer available.</p><Link to="/find-ride" className="mt-7 inline-flex rounded-xl bg-[#7a1f2a] px-6 py-3 text-sm font-extrabold text-white">Browse available rides</Link></main><Footer /></div>
  );

  const available = Number(ride.seatsAvailable ?? ride.seatsTotal ?? 1);
  const totalSeats = Number(ride.seatsTotal ?? available);
  const bookedSeats = Math.max(0, totalSeats - available);
  const bookings = ride.bookings || demoStore.getBookings().filter((item) => String(item.rideId) === String(rideId));
  const visibleBookings = managedBookings.length ? managedBookings : bookings;
  const isOwner = !isSupabaseConfigured || Boolean(user?.id && (ride.driverId === user.id || ride.driver?.id === user.id));
  const price = getRidePrice(ride);
  return (
    <div className="min-h-screen bg-[#fffaf6]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
        <Link to="/find-ride" className="inline-flex items-center gap-2 text-sm font-extrabold text-[#7a1f2a] hover:text-[#e8462c]"><ArrowLeft size={17} /> Back to rides</Link>
        {(location.state?.justPosted || location.state?.requested) && <div className="mt-6"><StatusBanner type="success">{location.state.justPosted ? "Your ride is published and ready for bookings." : "Your ride request is live. We’ll update it as soon as a driver responds."}</StatusBanner></div>}
        {offline && <div className="mt-6"><StatusBanner>Demo mode is showing this ride locally. Connect the backend to sync bookings and live updates.</StatusBanner></div>}
        <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <section className="rounded-[28px] border border-[#eaded8] bg-white p-6 shadow-[0_18px_55px_rgba(63,19,24,.07)] sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-5"><div><span className="rounded-full bg-[#fff0e7] px-3 py-1.5 text-xs font-extrabold uppercase tracking-[.12em] text-[#a53a23]">{rideTypeLabel(ride.rideType)}</span><h1 className="mt-5 font-serif text-3xl text-[#52151d] sm:text-4xl">{ride.origin?.name} <span className="text-[#e8462c]">→</span> {ride.destination?.name}</h1><p className="mt-3 flex items-center gap-2 text-[#756963]"><CalendarDays size={17} className="text-[#e8462c]" />{formatDateTime(ride.departureTime)}</p></div><span className={`rounded-full px-4 py-2 text-xs font-extrabold ${ride.status === "in_progress" ? "bg-[#e8f2ff] text-[#1765a4]" : "bg-[#e9f6ed] text-[#28733f]"}`}>{ride.status === "in_progress" ? "Trip in progress" : "Booking open"}</span></div>
              <div className="mt-7"><RideMap origin={ride.origin} destination={ride.destination} currentLocation={ride.currentLocation} className="h-[340px] sm:h-[420px]" /></div>
               <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[[Clock3,formatDuration(ride.durationMinutes),"Travel time"],[MapPin,ride.distanceKm ? `${ride.distanceKm} km` : "Local route","Distance"],[UsersRound,ride.rideType === "private" ? "Whole car" : `${available} seats`,"Availability"],[IndianRupee,formatMoney(price),ride.rideType === "carpool" ? "Per seat" : "Estimated fare"]].map(([Icon,value,label]) => <div key={label} className="rounded-2xl bg-[#fffaf6] p-4"><Icon size={19} className="text-[#e8462c]" /><strong className="mt-3 block text-[#342927]">{value}</strong><span className="mt-1 block text-xs text-[#8a7c77]">{label}</span></div>)}</div>
              {ride.rideType === "carpool" && <section className="mt-6 rounded-[24px] border border-[#efcfc2] bg-gradient-to-br from-[#fff8f1] to-[#ffe9df] p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#a5543c]">Seat board</p><h2 className="mt-1 font-serif text-2xl text-[#52151d]">Choose your spot</h2></div><span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-extrabold text-[#7a1f2a]">{bookedSeats} joined · {available} open</span></div><div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4">{Array.from({ length: totalSeats }, (_, index) => { const occupied = index < bookedSeats; return <div key={index} className={`flex min-h-16 flex-col items-center justify-center rounded-2xl border text-xs font-extrabold ${occupied ? "border-[#e7b2a4] bg-[#f2c6b8]/70 text-[#8d3a2d]" : "border-[#b8d8c1] bg-[#e8f7ec] text-[#28733f]"}`}><span className="text-xl">{occupied ? "●" : "○"}</span><span>{occupied ? "Joined" : `Seat ${index + 1}`}</span></div>; })}</div><p className="mt-4 text-xs leading-5 text-[#806f69]">Green seats are available. Coral seats are joined or awaiting approval.</p>{visibleBookings.length > 0 && <div className="mt-5 border-t border-[#e8cfc5] pt-4"><p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#a5543c]">Passenger requests</p><div className="mt-3 space-y-2">{visibleBookings.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/75 px-3 py-2 text-xs font-bold text-[#5f4139]"><span>{item.passenger?.full_name || item.passengerName || "Passenger"} · {item.seats} seat{item.seats === 1 ? "" : "s"} · <span className="capitalize">{item.status}</span></span>{isOwner && item.status === "pending" && <span className="flex gap-2"><button type="button" onClick={async () => { try { const updated = isOwner && managedBookings.length ? await bookingsApi.updateStatus(item.id, "confirmed") : demoStore.updateBookingStatus(item.id, "confirmed"); setManagedBookings((current) => current.map((entry) => entry.id === item.id ? updated : entry)); } catch (reason) { setError(reason.message); } }} className="rounded-lg bg-[#28733f] px-2.5 py-1.5 text-white">Accept</button><button type="button" onClick={async () => { try { const updated = isOwner && managedBookings.length ? await bookingsApi.updateStatus(item.id, "cancelled") : demoStore.updateBookingStatus(item.id, "cancelled"); setManagedBookings((current) => current.map((entry) => entry.id === item.id ? updated : entry)); } catch (reason) { setError(reason.message); } }} className="rounded-lg border border-[#d8aaa0] px-2.5 py-1.5 text-[#8d3a2d]">Ignore</button></span>}</div>)}</div></div>}</section>}
            </section>
            <section className="grid gap-5 sm:grid-cols-2"><article className="rounded-[24px] border border-[#eaded8] bg-white p-6"><p className="text-xs font-extrabold uppercase tracking-[.13em] text-[#e8462c]">Your driver</p><div className="mt-4 flex items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-full bg-[#fff0e7] text-xl font-extrabold text-[#7a1f2a]">{(ride.driver?.fullName || "Y").charAt(0)}</span><div><h2 className="flex items-center gap-2 font-extrabold text-[#2e2422]">{ride.driver?.fullName || "Driver matching"}{ride.driver?.verified && <BadgeCheck className="text-[#25814a]" size={18} />}</h2><p className="mt-1 flex items-center gap-1 text-sm text-[#756963]"><Star size={15} fill="currentColor" className="text-[#d68400]" /> {ride.driver?.rating || "New"} · {ride.driver?.trips || 0} trips</p></div></div><p className="mt-5 flex items-center gap-2 text-sm text-[#756963]"><CarFront size={17} className="text-[#e8462c]" />{[ride.vehicle?.color,ride.vehicle?.make,ride.vehicle?.model].filter(Boolean).join(" ") || "Vehicle assigned after match"}</p></article><article className="rounded-[24px] border border-[#eaded8] bg-white p-6"><p className="text-xs font-extrabold uppercase tracking-[.13em] text-[#e8462c]">Ride preferences</p><div className="mt-4 space-y-3 text-sm text-[#655a56]"><p className="flex items-center gap-2">{ride.allowLuggage ? <CheckCircle2 className="text-[#25814a]" size={18} /> : <Luggage size={18} />} {ride.allowLuggage ? "Luggage is welcome" : "Travel light for this ride"}</p><p className="flex items-center gap-2"><ShieldCheck size={18} className="text-[#e8462c]" />{ride.womenOnly ? "Women-only ride" : "Open to all verified travellers"}</p>{ride.notes && <p className="rounded-xl bg-[#fffaf6] p-3 leading-6">“{ride.notes}”</p>}</div></article></section>
          </div>
          <aside className="lg:sticky lg:top-24 lg:self-start"><div className="rounded-[28px] border border-[#eaded8] bg-white p-6 shadow-[0_20px_60px_rgba(63,19,24,.11)]"><p className="text-sm text-[#756963]">{ride.rideType === "carpool" ? "Seat price" : "Estimated total"}</p><p className="mt-1 text-4xl font-extrabold text-[#52151d]">{formatMoney(price)}</p>{ride.rideType === "carpool" && <label className="mt-6 block"><span className="mb-2 block text-sm font-extrabold text-[#2d2322]">Seats to book</span><select value={seats} onChange={(event) => setSeats(Number(event.target.value))} className="min-h-12 w-full rounded-xl border border-[#e6d9d3] px-4 font-bold outline-none focus:border-[#e8462c]">{Array.from({length:Math.max(1,available)},(_,index) => index + 1).map((count) => <option key={count}>{count}</option>)}</select></label>}{error && <div className="mt-5"><StatusBanner type="error">{error}</StatusBanner></div>}{booking ? <div className="mt-6"><StatusBanner type="success">Booking confirmed. Your trip is ready to track.</StatusBanner><Link to={`/trips/${ride.id}`} className="mt-4 flex min-h-12 items-center justify-center rounded-xl bg-[#1677c8] px-5 text-sm font-extrabold text-white">Open live trip</Link></div> : <button onClick={book} disabled={busy || available < 1} className="mt-6 flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#e8462c] px-6 font-extrabold text-white shadow-lg shadow-[#e8462c]/20 hover:bg-[#d23b24] disabled:opacity-60">{busy ? <LoaderCircle className="animate-spin" size={19} /> : ride.rideType === "carpool" ? "Request seats" : "Book full car"}</button>}{ride.status === "in_progress" && <Link to={`/trips/${ride.id}`} className="mt-3 flex min-h-12 items-center justify-center rounded-xl border border-[#1677c8] px-5 text-sm font-extrabold text-[#1677c8]">Track this trip</Link>}<div className="mt-5 border-t border-[#eee4df] pt-5 text-xs leading-5 text-[#8a7c77]"><p className="flex gap-2"><ShieldCheck className="mt-0.5 shrink-0 text-[#25814a]" size={16} /> Exact contact details are shared only after confirmation. Never pay outside YatriVahan.</p></div></div></aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
