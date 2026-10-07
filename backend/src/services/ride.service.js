import { supabaseAdmin } from "../config/supabase.js";
import { badRequest, conflict, forbidden, notFound, unauthorized, assertDatabase } from "../lib/errors.js";
import { getPagination, paginationMeta } from "../lib/http.js";
import { camelizeKeys } from "../lib/case.js";
import { assertRideManager, assertRideParticipant, getRideRecord, isRideManager } from "./access.service.js";
import { createNotificationBestEffort } from "./notification.service.js";

const transitions = {
  draft: new Set(["scheduled", "cancelled"]),
  scheduled: new Set(["arriving", "in_progress", "cancelled"]),
  searching: new Set(["accepted", "cancelled"]),
  accepted: new Set(["arriving", "in_progress", "cancelled"]),
  arriving: new Set(["in_progress", "cancelled"]),
  in_progress: new Set(["completed", "cancelled"]),
  completed: new Set(),
  cancelled: new Set(),
};

function toRideRow(input) {
  return {
    ride_type: input.rideType,
    origin_name: input.origin.name,
    origin_lat: input.origin.lat,
    origin_lng: input.origin.lng,
    destination_name: input.destination.name,
    destination_lat: input.destination.lat,
    destination_lng: input.destination.lng,
    departure_time: input.departureTime,
    seats_total: input.seatsTotal,
    price_per_seat: input.pricePerSeat ?? 0,
    estimated_fare: input.estimatedFare ?? null,
    distance_km: input.distanceKm ?? null,
    duration_minutes: input.durationMinutes ?? null,
    notes: input.notes ?? null,
    women_only: input.womenOnly,
    allow_luggage: input.allowLuggage,
    vehicle_id: input.vehicleId ?? null,
  };
}

function toStopRows(rideId, stops) {
  return stops.map((stop) => ({
    ride_id: rideId,
    stop_order: stop.stopOrder,
    name: stop.name,
    lat: stop.lat,
    lng: stop.lng,
    eta: stop.eta ?? null,
  }));
}

function ensureReasonableDeparture(departureTime) {
  if (new Date(departureTime).getTime() < Date.now() - 15 * 60_000) {
    throw badRequest("Departure time cannot be in the past");
  }
}

async function assertVehicleOwner(vehicleId, userId) {
  if (!vehicleId) return;
  const result = await supabaseAdmin
    .from("vehicles")
    .select("id, seats, active")
    .eq("id", vehicleId)
    .eq("owner_id", userId)
    .maybeSingle();
  const vehicle = assertDatabase(result, "Unable to verify vehicle");
  if (!vehicle || !vehicle.active) throw forbidden("Choose one of your active vehicles");
  return vehicle;
}

async function hydrateRides(rides) {
  if (!rides?.length) return [];
  const profileIds = [...new Set(
    rides.flatMap((ride) => [ride.driver_id, ride.accepted_driver_id]).filter(Boolean),
  )];
  const vehicleIds = [...new Set(rides.map((ride) => ride.vehicle_id).filter(Boolean))];

  const [profilesResult, vehiclesResult] = await Promise.all([
    profileIds.length
      ? supabaseAdmin
          .from("profiles")
          .select("id, full_name, avatar_url, is_verified, avg_rating, rating_count")
          .in("id", profileIds)
      : Promise.resolve({ data: [], error: null }),
    vehicleIds.length
      ? supabaseAdmin
          .from("vehicles")
          .select("id, owner_id, make, model, color, seats, vehicle_type, photo_url, active")
          .in("id", vehicleIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const profiles = assertDatabase(profilesResult, "Unable to load ride drivers") ?? [];
  const vehicles = assertDatabase(vehiclesResult, "Unable to load ride vehicles") ?? [];
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const vehicleMap = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));

  return rides.map((ride) => ({
    ...ride,
    driver: profileMap.get(ride.accepted_driver_id ?? ride.driver_id) ?? null,
    vehicle: vehicleMap.get(ride.vehicle_id) ?? null,
  }));
}

async function assertDriverProfile(userId) {
  if (!userId) throw unauthorized();
  const result = await supabaseAdmin
    .from("profiles")
    .select("role, is_verified")
    .eq("id", userId)
    .maybeSingle();
  const profile = assertDatabase(result, "Unable to verify driver profile");
  if (!profile || !["driver", "both"].includes(profile.role)) {
    throw forbidden("An approved driver / ride-offerer profile is required");
  }
  if (!profile.is_verified) {
    throw forbidden("Driver verification is required");
  }
}

async function insertStopsOrRollback(ride, stops) {
  if (!stops.length) return [];
  const result = await supabaseAdmin.from("ride_stops").insert(toStopRows(ride.id, stops)).select("*");
  if (result.error) {
    await supabaseAdmin.from("rides").delete().eq("id", ride.id);
    throw assertDatabase(result, "Unable to save ride stops");
  }
  return result.data;
}

export async function createRideOffer(userId, input) {
  await assertDriverProfile(userId);
  ensureReasonableDeparture(input.departureTime);
  if (input.rideType === "on_demand") {
    throw badRequest("Use /rides/requests for an on-demand ride request");
  }
  const vehicle = await assertVehicleOwner(input.vehicleId, userId);
  if (vehicle && input.seatsTotal > vehicle.seats) {
    throw badRequest("Available seats cannot exceed the selected vehicle capacity");
  }

  const result = await supabaseAdmin
    .from("rides")
    .insert({
      ...toRideRow(input),
      requester_id: null,
      driver_id: userId,
      accepted_driver_id: null,
      status: "scheduled",
      seats_available: input.seatsTotal,
    })
    .select("*")
    .single();
  const ride = assertDatabase(result, "Unable to create ride offer");
  const stops = await insertStopsOrRollback(ride, input.stops);
  return { ...ride, stops };
}

export async function createRideRequest(userId, input) {
  ensureReasonableDeparture(input.departureTime);
  const result = await supabaseAdmin
    .from("rides")
    .insert({
      ...toRideRow(input),
      requester_id: userId,
      driver_id: null,
      accepted_driver_id: null,
      vehicle_id: null,
      status: "searching",
      seats_available: input.seatsTotal,
      price_per_seat: 0,
    })
    .select("*")
    .single();
  const ride = assertDatabase(result, "Unable to create ride request");

  try {
    const bookingResult = await supabaseAdmin
      .from("bookings")
      .insert({
        ride_id: ride.id,
        passenger_id: userId,
        seats: input.seatsTotal,
        amount: input.estimatedFare ?? 0,
        status: "pending",
        pickup_name: input.origin.name,
        pickup_lat: input.origin.lat,
        pickup_lng: input.origin.lng,
        dropoff_name: input.destination.name,
        dropoff_lat: input.destination.lat,
        dropoff_lng: input.destination.lng,
        payment_status: "unpaid",
        notes: input.notes ?? null,
      })
      .select("*")
      .single();
    const booking = assertDatabase(bookingResult, "Unable to create ride request booking");
    const stops = await insertStopsOrRollback(ride, input.stops);
    return { ...ride, stops, booking };
  } catch (error) {
    await supabaseAdmin.from("rides").delete().eq("id", ride.id);
    throw error;
  }
}

export async function searchRides(query, userId) {
  if (query.status === "searching") await assertDriverProfile(userId);
  if (query.status && !["scheduled", "searching"].includes(query.status)) {
    throw forbidden("Use the authenticated /rides/mine endpoint for private trip history");
  }
  const { from, to } = getPagination(query.page, query.limit);
  let builder = supabaseAdmin
    .from("rides")
    .select("*", { count: "exact" })
    .order("departure_time", { ascending: true, nullsFirst: false });

  builder = builder.eq("status", query.status ?? "scheduled");
  if (query.origin) builder = builder.ilike("origin_name", `%${query.origin}%`);
  if (query.destination) builder = builder.ilike("destination_name", `%${query.destination}%`);
  if (query.rideType) builder = builder.eq("ride_type", query.rideType);
  if (query.womenOnly !== undefined) builder = builder.eq("women_only", query.womenOnly);
  if (query.maxPrice !== undefined) builder = builder.lte("price_per_seat", query.maxPrice);
  if (query.seats && query.status !== "searching") {
    builder = builder.gte("seats_available", query.seats);
  }

  if (query.departureDate) {
    const start = new Date(`${query.departureDate}T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    builder = builder.gte("departure_time", start.toISOString()).lt("departure_time", end.toISOString());
  }
  if (query.departureAfter) builder = builder.gte("departure_time", query.departureAfter);
  if (query.departureBefore) builder = builder.lte("departure_time", query.departureBefore);

  const result = await builder.range(from, to);
  const rides = assertDatabase(result, "Unable to search rides") ?? [];
  return {
    data: await hydrateRides(rides),
    meta: paginationMeta(query.page, query.limit, result.count),
  };
}

export async function listMyRides(userId) {
  const result = await supabaseAdmin
    .from("rides")
    .select("*")
    .or(`requester_id.eq.${userId},driver_id.eq.${userId},accepted_driver_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(100);
  return hydrateRides(assertDatabase(result, "Unable to load your rides") ?? []);
}

export async function getRide(rideId, userId) {
  const ride = await getRideRecord(rideId);
  if (ride.status === "searching") {
    const isActor = [ride.requester_id, ride.driver_id, ride.accepted_driver_id].includes(userId);
    if (!isActor) await assertDriverProfile(userId);
  } else if (ride.status !== "scheduled") {
    if (!userId) throw unauthorized();
    await assertRideParticipant(rideId, userId);
  }
  const stopsResult = await supabaseAdmin
    .from("ride_stops")
    .select("*")
    .eq("ride_id", rideId)
    .order("stop_order", { ascending: true });
  const stops = assertDatabase(stopsResult, "Unable to load ride stops") ?? [];
  const [hydrated] = await hydrateRides([ride]);
  return { ...hydrated, stops };
}

export async function acceptRideRequest(rideId, driverId, input, io) {
  const ride = await getRideRecord(rideId);
  if (ride.status !== "searching" || !ride.requester_id) {
    throw conflict("This ride request is no longer available");
  }
  if (ride.requester_id === driverId) throw forbidden("You cannot accept your own ride request");

  const profileResult = await supabaseAdmin
    .from("profiles")
    .select("role, is_verified")
    .eq("id", driverId)
    .maybeSingle();
  const profile = assertDatabase(profileResult, "Unable to verify driver profile");
  if (!profile || !["driver", "both"].includes(profile.role)) {
    throw forbidden("A driver profile is required to accept ride requests");
  }
  if (!profile.is_verified) {
    throw forbidden("Driver verification is required to accept ride requests");
  }
  await assertVehicleOwner(input.vehicleId, driverId);

  const result = await supabaseAdmin
    .from("rides")
    .update({
      accepted_driver_id: driverId,
      vehicle_id: input.vehicleId ?? null,
      status: "accepted",
    })
    .eq("id", rideId)
    .eq("status", "searching")
    .is("accepted_driver_id", null)
    .select("*")
    .maybeSingle();
  const updated = assertDatabase(result, "Unable to accept ride request");
  if (!updated) throw conflict("Another driver has already accepted this request");

  await createNotificationBestEffort({
    userId: ride.requester_id,
    type: "ride_accepted",
    title: "Driver assigned",
    message: "A driver accepted your ride request.",
    data: { rideId, driverId },
  }, io);
  io?.to(`ride:${rideId}`).emit("trip:status_updated", { rideId, status: "accepted" });
  return updated;
}

export async function updateRideStatus(rideId, userId, nextStatus, io) {
  const ride = await assertRideManager(rideId, userId);
  if (!transitions[ride.status]?.has(nextStatus)) {
    throw conflict(`Ride cannot move from ${ride.status} to ${nextStatus}`);
  }

  const timestamps = {
    ...(nextStatus === "in_progress" && { started_at: new Date().toISOString() }),
    ...(nextStatus === "completed" && { completed_at: new Date().toISOString() }),
  };
  const result = await supabaseAdmin
    .from("rides")
    .update({ status: nextStatus, ...timestamps })
    .eq("id", rideId)
    .eq("status", ride.status)
    .select("*")
    .maybeSingle();
  const updated = assertDatabase(result, "Unable to update ride status");
  if (!updated) throw conflict("Ride status changed; refresh and try again");

  if (nextStatus === "completed") {
    await supabaseAdmin
      .from("bookings")
      .update({ status: "completed" })
      .eq("ride_id", rideId)
      .eq("status", "confirmed");
  }
  io?.to(`ride:${rideId}`).emit("trip:status_updated", { rideId, status: nextStatus });
  if (ride.requester_id) {
    await createNotificationBestEffort({
      userId: ride.requester_id,
      type: "trip_status",
      title: "Trip update",
      message: `Your trip is now ${nextStatus.replaceAll("_", " ")}.`,
      data: { rideId, status: nextStatus },
    }, io);
  }
  return updated;
}

export async function cancelRide(rideId, userId, reason, io) {
  const ride = await getRideRecord(rideId);
  const allowed = isRideManager(ride, userId) || ride.requester_id === userId;
  if (!allowed) throw forbidden("Only the requester or assigned driver can cancel this ride");
  if (["completed", "cancelled"].includes(ride.status)) {
    throw conflict(`A ${ride.status} ride cannot be cancelled`);
  }

  const result = await supabaseAdmin
    .from("rides")
    .update({
      status: "cancelled",
      cancelled_by: userId,
      cancellation_reason: reason ?? null,
    })
    .eq("id", rideId)
    .eq("status", ride.status)
    .select("*")
    .maybeSingle();
  const updated = assertDatabase(result, "Unable to cancel ride");
  if (!updated) throw conflict("Ride status changed; refresh and try again");

  await supabaseAdmin
    .from("bookings")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("ride_id", rideId)
    .in("status", ["pending", "confirmed"]);
  io?.to(`ride:${rideId}`).emit("trip:status_updated", { rideId, status: "cancelled", reason });
  return updated;
}

export async function updateDestination(rideId, userId, destination, io) {
  const ride = await getRideRecord(rideId);
  const allowed = isRideManager(ride, userId) || ride.requester_id === userId;
  if (!allowed) throw forbidden("Only the requester or driver can change the destination");
  if (["completed", "cancelled"].includes(ride.status)) {
    throw conflict(`Destination cannot change after a ride is ${ride.status}`);
  }

  const result = await supabaseAdmin
    .from("rides")
    .update({
      destination_name: destination.name,
      destination_lat: destination.lat,
      destination_lng: destination.lng,
    })
    .eq("id", rideId)
    .select("*")
    .single();
  const updated = assertDatabase(result, "Unable to update destination");
  const event = { rideId, destination };
  io?.to(`ride:${rideId}`).emit("destination:updated", event);
  return updated;
}

export async function saveRideLocation(rideId, userId, location, io) {
  await assertRideManager(rideId, userId);
  const result = await supabaseAdmin
    .from("ride_locations")
    .insert({
      ride_id: rideId,
      user_id: userId,
      lat: location.lat,
      lng: location.lng,
      heading: location.heading ?? null,
      speed: location.speed ?? null,
      accuracy: location.accuracy ?? null,
    })
    .select("*")
    .single();
  const saved = assertDatabase(result, "Unable to save live location");
  io?.to(`ride:${rideId}`).emit("location:updated", {
    rideId,
    userId,
    location: camelizeKeys(saved),
  });
  return saved;
}

export async function getLatestRideLocation(rideId, userId) {
  await assertRideParticipant(rideId, userId);
  const result = await supabaseAdmin
    .from("ride_locations")
    .select("*")
    .eq("ride_id", rideId)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const location = assertDatabase(result, "Unable to load live location");
  if (!location) throw notFound("Ride location");
  return location;
}

