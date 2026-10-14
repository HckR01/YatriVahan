import { Link } from "react-router-dom";
import { CalendarDays, CarFront, UsersRound } from "lucide-react";
import { formatDateTime, formatMoney } from "../../lib/format";
export default function JourneyCard({ ride, children, badge }) {
  return (
    <article className="card journey-card">
      <div>
        <span className="badge">
          {badge || ride.status?.replaceAll("_", " ")}
        </span>
        <h2>
          {ride.origin?.name} → {ride.destination?.name}
        </h2>
        <p className="muted">
          <CalendarDays size={16} />
          {formatDateTime(ride.departureTime)}
        </p>
        {ride.vehicle && (
          <p className="muted">
            <CarFront size={16} />
            {[ride.vehicle.make, ride.vehicle.model].filter(Boolean).join(" ")}
          </p>
        )}
      </div>
      <div>
        <p className="muted">
          <UsersRound size={16} />
          {ride.seatsAvailable} of {ride.seatsTotal} seats available
        </p>
        <strong className="price">
          {formatMoney(
            ride.rideType === "carpool"
              ? ride.pricePerSeat
              : ride.estimatedFare || ride.pricePerSeat,
          )}
          <small>
            {ride.rideType === "carpool" ? "per seat" : "estimated fare"}
          </small>
        </strong>
      </div>
      <div className="actions">
        <Link className="button secondary" to={`/rides/${ride.id}`}>
          Ride details
        </Link>
        {children}
      </div>
    </article>
  );
}
