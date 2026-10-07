export const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));

export const formatDateTime = (value) => {
  if (!value) return "Flexible time";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

export const formatDuration = (minutes) => {
  const total = Number(minutes || 0);
  if (!total) return "Time varies";
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return `${hours ? `${hours} hr ` : ""}${rest ? `${rest} min` : ""}`.trim();
};

export const rideTypeLabel = (type) =>
  ({ carpool: "Shared ride", private: "Full car", on_demand: "Instant ride" })[type] || "Ride";

export const getRidePrice = (ride) =>
  ride.rideType === "carpool" ? ride.pricePerSeat : ride.estimatedFare ?? ride.pricePerSeat;
