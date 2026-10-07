import { ArrowRight, BadgeCheck, Clock3, MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDateTime, formatDuration, formatMoney, getRidePrice, rideTypeLabel } from "../../lib/format";

export default function RideCard({ ride, compact = false }) {
  const available = Number(ride.seatsAvailable ?? ride.seatsTotal ?? 0);
  return (
    <article className="group relative overflow-hidden rounded-[24px] border border-[#eaded8] bg-white p-5 shadow-[0_16px_50px_rgba(74,25,24,0.07)] transition duration-300 hover:-translate-y-1 hover:border-[#e8b7a9] hover:shadow-[0_20px_50px_rgba(74,25,24,0.12)] sm:p-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#e8462c] via-[#ff8a3d] to-[#f4c15d]" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-[#fff0e7] px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.1em] text-[#a53a23]">
          {rideTypeLabel(ride.rideType)}
        </span>
        <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${ride.status === "in_progress" ? "bg-[#e9f3ff] text-[#1766a5]" : "bg-[#e9f6ed] text-[#26763d]"}`}>
          {ride.status === "in_progress" ? "Live now" : `${available} seat${available === 1 ? "" : "s"} open`}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-[18px_1fr] gap-x-3 gap-y-1">
        <span className="mt-1.5 h-2.5 w-2.5 rounded-full border-[3px] border-[#7a1f2a] bg-white" />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#8b7b76]">Pickup</p>
          <h3 className="mt-0.5 line-clamp-1 text-lg font-extrabold text-[#261c1c]">{ride.origin?.name || ride.from}</h3>
        </div>
        <span className="ml-[4px] h-8 w-px bg-[repeating-linear-gradient(to_bottom,#e8462c_0_4px,transparent_4px_8px)]" />
        <div />
        <MapPin className="-ml-0.5 text-[#e8462c]" size={18} />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#8b7b76]">Destination</p>
          <p className="mt-0.5 line-clamp-1 font-bold text-[#453a37]">{ride.destination?.name || ride.to}</p>
        </div>
      </div>

      {!compact && (
        <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-[#fffaf6] p-4 text-sm text-[#6e625f]">
          <p className="flex items-center gap-2"><Clock3 size={16} className="text-[#e8462c]" />{formatDateTime(ride.departureTime)}</p>
          <p className="flex items-center gap-2"><Users size={16} className="text-[#e8462c]" />{ride.rideType === "private" ? "Whole car" : `${available} available`}</p>
          <p>{ride.distanceKm ? `${ride.distanceKm} km` : "Local route"}</p>
          <p>{formatDuration(ride.durationMinutes)}</p>
        </div>
      )}

      <div className="mt-5 flex items-end justify-between gap-4 border-t border-[#eee4df] pt-5">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-bold text-[#413735]">
            {ride.driver?.verified && <BadgeCheck size={17} className="text-[#1d8a50]" />}
            {ride.driver?.fullName || "YatriVahan driver"}
          </p>
          <p className="mt-1 text-xs text-[#8b7b76]">{ride.driver?.rating ? `★ ${ride.driver.rating} · ${ride.driver.trips || 0} trips` : "New route host"}</p>
        </div>
        <div className="text-right">
          <strong className="block text-xl text-[#7a1f2a]">{formatMoney(getRidePrice(ride))}</strong>
          <span className="text-xs text-[#8b7b76]">{ride.rideType === "carpool" ? "per seat" : "estimated"}</span>
        </div>
      </div>
      <Link to={`/rides/${ride.id}`} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7a1f2a] px-5 text-sm font-extrabold text-white transition hover:bg-[#5f141c] focus:outline-none focus:ring-4 focus:ring-[#e8462c]/20">
        View ride <ArrowRight size={17} />
      </Link>
    </article>
  );
}
