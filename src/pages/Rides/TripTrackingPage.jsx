import { ArrowLeft, CircleDot, Clock3, LoaderCircle, Navigation, Phone, Radio, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Footer from "../../components/layout/Footer";
import Navbar from "../../components/layout/Navbar";
import RideMap from "../../components/map/RideMap";
import StatusBanner from "../../components/common/StatusBanner";
import { useRideSocket } from "../../hooks/useRideSocket";
import { ridesApi } from "../../lib/api";
import { demoStore } from "../../lib/demoStore";
import { formatDateTime, formatDuration } from "../../lib/format";
import { useAuth } from '../../hooks/useAuth';

export default function TripTrackingPage() {
  const { rideId } = useParams();
  const { user } = useAuth();
  const [actionError, setActionError] = useState('');
  const [ride, setRide] = useState(() => demoStore.getRide(rideId));
  const [loading, setLoading] = useState(!ride);
  const { connected, live, emit } = useRideSocket(rideId);
  const isDriver = [ride?.driverId, ride?.acceptedDriverId].includes(user?.id);
  useEffect(() => {
    if (!isDriver || !connected || !navigator.geolocation) return undefined;
    let lastSent = 0;
    const watcher = navigator.geolocation.watchPosition(position => {
      if (Date.now() - lastSent < 3000) return;
      lastSent = Date.now();
      const { latitude: lat, longitude: lng, heading, speed, accuracy } = position.coords;
      emit('location:update', { lat, lng, heading, speed, accuracy });
    }, reason => setActionError(reason.message), { enableHighAccuracy: true, maximumAge: 3000 });
    return () => navigator.geolocation.clearWatch(watcher);
    // Socket identity is stable while connected.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDriver, connected, rideId]);
  async function changeStatus(nextStatus) {
    try {
      await ridesApi.updateStatus(rideId, nextStatus);
      setRide(current => ({ ...current, status: nextStatus }));
      setActionError('');
    } catch (reason) { setActionError(reason.message); }
  }

  useEffect(() => {
    let active = true;
    Promise.allSettled([ridesApi.get(rideId), ridesApi.location(rideId)]).then(([rideResult, locationResult]) => {
      if (!active) return;
      if (rideResult.status === "fulfilled") setRide((rideResult.value?.ride || rideResult.value));
      if (locationResult.status === "fulfilled") setRide((current) => current ? { ...current, currentLocation: locationResult.value?.location || locationResult.value } : current);
      setLoading(false);
    });
    return () => { active = false; };
  }, [rideId]);

  const current = live.location || ride?.currentLocation;
  const destination = live.destination || ride?.destination;
  const status = live.status || ride?.status || "scheduled";
  const steps = useMemo(() => [
    ["Driver confirmed", true],
    ["Heading to pickup", ["driver_arriving","arriving","in_progress","completed"].includes(status)],
    ["Trip in progress", ["in_progress","completed"].includes(status)],
    ["Arrived", status === "completed"],
  ], [status]);

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#fffaf6]"><LoaderCircle className="animate-spin text-[#e8462c]" size={30} /></div>;
  if (!ride) return <div className="min-h-screen bg-[#fffaf6]"><Navbar /><main className="mx-auto max-w-xl px-5 py-24 text-center"><h1 className="font-serif text-4xl text-[#52151d]">Trip not found</h1><Link to="/profile" className="mt-6 inline-block font-bold text-[#e8462c]">Return to your trips</Link></main><Footer /></div>;

  return (
    <div className="min-h-screen bg-[#f6f1ed]"><Navbar />{isDriver && <div className="mx-auto flex max-w-7xl flex-wrap gap-3 px-5 pt-5">{["arriving", "in_progress", "completed"].map(next => <button key={next} onClick={() => changeStatus(next)} className="rounded-xl bg-[#7a1f2a] px-4 py-3 text-white">{next.replaceAll("_", " ")}</button>)}{actionError && <p role="alert" className="w-full text-red-700">{actionError}</p>}</div>}<main className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:py-10"><div className="mb-5 flex flex-wrap items-center justify-between gap-4"><Link to={`/rides/${rideId}`} className="inline-flex items-center gap-2 text-sm font-extrabold text-[#7a1f2a]"><ArrowLeft size={17} /> Ride details</Link><span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-extrabold ${connected ? "bg-[#e6f6eb] text-[#21723a]" : "bg-[#fff0e7] text-[#9b4227]"}`}><Radio size={14} className={connected ? "animate-pulse" : ""} />{connected ? "Live connection" : "Reconnecting / demo"}</span></div>{!connected && <div className="mb-5"><StatusBanner>Live socket updates will appear automatically when the trip service is connected.</StatusBanner></div>}<div className="grid gap-6 lg:grid-cols-[1fr_360px]"><section className="overflow-hidden rounded-[28px] border border-[#ded4cf] bg-white shadow-[0_18px_50px_rgba(49,25,22,.08)]"><RideMap origin={ride.origin} destination={destination} currentLocation={current} className="h-[58vh] min-h-[420px]" /><div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6"><div><p className="text-xs font-bold uppercase tracking-[.1em] text-[#8b7c76]">Pickup</p><p className="mt-1 font-extrabold text-[#332826]">{ride.origin?.name}</p></div><div><p className="text-xs font-bold uppercase tracking-[.1em] text-[#8b7c76]">Destination</p><p className="mt-1 font-extrabold text-[#332826]">{destination?.name}</p></div><div><p className="text-xs font-bold uppercase tracking-[.1em] text-[#8b7c76]">Estimated time</p><p className="mt-1 font-extrabold text-[#332826]">{formatDuration(ride.durationMinutes)}</p></div></div></section><aside className="space-y-5"><section className="rounded-[26px] bg-[#421017] p-6 text-white"><p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#ffc6a1]">Trip status</p><h1 className="mt-3 font-serif text-3xl">{status === "completed" ? "You’ve arrived" : status === "in_progress" ? "On the way" : "Driver confirmed"}</h1><p className="mt-2 text-sm text-white/65">Departure {formatDateTime(ride.departureTime)}</p><div className="mt-6 space-y-4">{steps.map(([label,done],index) => <div key={label} className="flex gap-3"><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${done ? "bg-[#ff9a63] text-[#421017]" : "bg-white/10 text-white/45"}`}>{done ? "✓" : index + 1}</span><div className="pt-1"><p className={`text-sm font-bold ${done ? "text-white" : "text-white/45"}`}>{label}</p>{index < steps.length - 1 && <div className="ml-0.5 mt-2 h-4 w-px bg-white/15" />}</div></div>)}</div></section><section className="rounded-[24px] border border-[#ded4cf] bg-white p-5"><div className="flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-full bg-[#fff0e7] font-extrabold text-[#7a1f2a]">{(ride.driver?.fullName || "D").charAt(0)}</span><div><p className="font-extrabold text-[#332826]">{ride.driver?.fullName || "Your driver"}</p><p className="mt-1 text-xs text-[#8b7c76]">{ride.vehicle?.model || "Vehicle details pending"} · {ride.vehicle?.plateNumber || ""}</p></div></div><div className="mt-5 grid grid-cols-2 gap-3"><a href={ride.driver?.phone ? `tel:${ride.driver.phone}` : undefined} aria-disabled={!ride.driver?.phone} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#e6d9d3] text-sm font-bold text-[#7a1f2a]"><Phone size={17} /> Call</a><a href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${ride.origin.lat}%2C${ride.origin.lng}%3B${destination.lat}%2C${destination.lng}`} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1677c8] text-sm font-bold text-white"><Navigation size={17} /> Navigate</a></div></section><section className="rounded-[24px] border border-[#ded4cf] bg-white p-5 text-sm text-[#6f625d]"><p className="flex gap-2"><ShieldCheck className="shrink-0 text-[#23814a]" size={18} /> Share trip details with someone you trust and use emergency services if you feel unsafe.</p><p className="mt-3 flex items-center gap-2"><CircleDot size={17} className="text-[#e8462c]" /> GPS point {current ? `${Number(current.lat).toFixed(4)}, ${Number(current.lng).toFixed(4)}` : "awaiting driver"}</p><p className="mt-3 flex items-center gap-2"><Clock3 size={17} className="text-[#e8462c]" /> Live data may be delayed by network conditions.</p></section></aside></div></main><Footer /></div>
  );
}
