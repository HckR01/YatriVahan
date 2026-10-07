import { supabaseAdmin } from "../config/supabase.js";
import { assertDatabase, conflict, forbidden, notFound } from "../lib/errors.js";
import { getPagination, paginationMeta } from "../lib/http.js";
import { camelizeKeys } from "../lib/case.js";
import { getRideRecord, isRideManager } from "./access.service.js";
import { createNotificationBestEffort } from "./notification.service.js";

const bookingTransitions = {
  pending: new Set(["confirmed", "cancelled"]),
  confirmed: new Set(["completed", "cancelled"]),
  completed: new Set(),
  cancelled: new Set(),
};

function bookingRow(ride, userId, input, status) {
  return {
    ride_id: ride.id,
    passenger_id: userId,
    seats: input.seats,
    amount: Number(ride.price_per_seat ?? 0) * input.seats,
    status,
    pickup_name: input.pickup?.name ?? ride.origin_name,
    pickup_lat: input.pickup?.lat ?? ride.origin_lat,
    pickup_lng: input.pickup?.lng ?? ride.origin_lng,
    dropoff_name: input.dropoff?.name ?? ride.destination_name,
    dropoff_lat: input.dropoff?.lat ?? ride.destination_lat,
    dropoff_lng: input.dropoff?.lng ?? ride.destination_lng,
    payment_status: "unpaid",
    notes: input.notes ?? null,
  };
}

async function createRideBooking(rideId, userId, input, status, io) {
  const ride = await getRideRecord(rideId);
  if (ride.status !== "scheduled") throw conflict("This ride is not open for bookings");
  if (ride.ride_type === "on_demand") throw conflict("On-demand requests are accepted by drivers");
  if ([ride.driver_id, ride.accepted_driver_id, ride.requester_id].includes(userId)) {
    throw forbidden("You cannot book your own ride");
  }
  if (ride.seats_available < input.seats) throw conflict("Not enough seats are available");

  const result = await supabaseAdmin
    .from("bookings")
    .insert(bookingRow(ride, userId, input, status))
    .select("*")
    .single();
  const booking = assertDatabase(result, "Unable to create booking");
  const event = { rideId, booking: camelizeKeys(booking) };
  io?.to(`ride:${rideId}`).emit("ride:booking_updated", event);

  if (ride.driver_id) {
    await createNotificationBestEffort({
      userId: ride.driver_id,
      type: status === "confirmed" ? "ride_joined" : "booking_requested",
      title: status === "confirmed" ? "Passenger joined" : "New booking request",
      message: `A passenger requested ${input.seats} seat${input.seats === 1 ? "" : "s"}.`,
      data: { rideId, bookingId: booking.id },
    }, io);
  }
  return booking;
}

export function createBooking(rideId, userId, input, io) {
  return createRideBooking(rideId, userId, input, "pending", io);
}

export function joinRide(rideId, userId, input, io) {
  return createRideBooking(rideId, userId, input, "confirmed", io);
}

export async function listBookings(userId, query) {
  const { from, to } = getPagination(query.page, query.limit);
  let builder = supabaseAdmin
    .from("bookings")
    .select("*, ride:rides(*)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (query.role === "passenger") {
    builder = builder.eq("passenger_id", userId);
  } else {
    const ridesResult = await supabaseAdmin
      .from("rides")
      .select("id")
      .or(`driver_id.eq.${userId},accepted_driver_id.eq.${userId}`);
    const rideIds = (assertDatabase(ridesResult, "Unable to load driver rides") ?? []).map(({ id }) => id);
    if (!rideIds.length) {
      return { data: [], meta: paginationMeta(query.page, query.limit, 0) };
    }
    builder = builder.in("ride_id", rideIds);
  }
  if (query.status) builder = builder.eq("status", query.status);

  const result = await builder.range(from, to);
  return {
    data: assertDatabase(result, "Unable to load bookings") ?? [],
    meta: paginationMeta(query.page, query.limit, result.count),
  };
}

export async function getBooking(bookingId, userId) {
  const result = await supabaseAdmin
    .from("bookings")
    .select("*, ride:rides(*)")
    .eq("id", bookingId)
    .maybeSingle();
  const booking = assertDatabase(result, "Unable to load booking");
  if (!booking) throw notFound("Booking");
  if (booking.passenger_id !== userId && !isRideManager(booking.ride, userId)) {
    throw forbidden("You cannot view this booking");
  }
  return booking;
}

export async function updateBookingStatus(bookingId, userId, nextStatus, io) {
  const booking = await getBooking(bookingId, userId);
  if (!isRideManager(booking.ride, userId)) {
    throw forbidden("Only the ride driver can change booking status");
  }
  if (!bookingTransitions[booking.status]?.has(nextStatus)) {
    throw conflict(`Booking cannot move from ${booking.status} to ${nextStatus}`);
  }

  const result = await supabaseAdmin
    .from("bookings")
    .update({
      status: nextStatus,
      ...(nextStatus === "cancelled" && { cancelled_at: new Date().toISOString() }),
    })
    .eq("id", bookingId)
    .eq("status", booking.status)
    .select("*")
    .maybeSingle();
  const updated = assertDatabase(result, "Unable to update booking");
  if (!updated) throw conflict("Booking status changed; refresh and try again");

  io?.to(`ride:${booking.ride_id}`).emit("ride:booking_updated", {
    rideId: booking.ride_id,
    booking: camelizeKeys(updated),
  });
  await createNotificationBestEffort({
    userId: booking.passenger_id,
    type: "booking_status",
    title: "Booking update",
    message: `Your booking is now ${nextStatus}.`,
    data: { rideId: booking.ride_id, bookingId, status: nextStatus },
  }, io);
  return updated;
}

export async function cancelBooking(bookingId, userId, reason, io) {
  const booking = await getBooking(bookingId, userId);
  const allowed = booking.passenger_id === userId || isRideManager(booking.ride, userId);
  if (!allowed) throw forbidden("You cannot cancel this booking");
  if (["completed", "cancelled"].includes(booking.status)) {
    throw conflict(`A ${booking.status} booking cannot be cancelled`);
  }

  const result = await supabaseAdmin
    .from("bookings")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", bookingId)
    .eq("status", booking.status)
    .select("*")
    .maybeSingle();
  const updated = assertDatabase(result, "Unable to cancel booking");
  if (!updated) throw conflict("Booking status changed; refresh and try again");

  io?.to(`ride:${booking.ride_id}`).emit("ride:booking_updated", {
    rideId: booking.ride_id,
    booking: camelizeKeys(updated),
    reason,
  });
  return updated;
}

