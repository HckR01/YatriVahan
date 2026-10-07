import { supabaseAdmin } from "../config/supabase.js";
import { assertDatabase, forbidden, notFound } from "../lib/errors.js";

export async function getRideRecord(rideId) {
  const result = await supabaseAdmin.from("rides").select("*").eq("id", rideId).maybeSingle();
  const ride = assertDatabase(result, "Unable to load ride");
  if (!ride) throw notFound("Ride");
  return ride;
}

export function isRideManager(ride, userId) {
  return [ride.driver_id, ride.accepted_driver_id].filter(Boolean).includes(userId);
}

export async function assertRideManager(rideId, userId) {
  const ride = await getRideRecord(rideId);
  if (!isRideManager(ride, userId)) throw forbidden("Only the assigned driver can manage this ride");
  return ride;
}

export async function assertRideParticipant(rideId, userId) {
  const ride = await getRideRecord(rideId);
  if ([ride.requester_id, ride.driver_id, ride.accepted_driver_id].includes(userId)) return ride;

  const result = await supabaseAdmin
    .from("bookings")
    .select("id")
    .eq("ride_id", rideId)
    .eq("passenger_id", userId)
    .in("status", ["confirmed", "completed"])
    .maybeSingle();
  const booking = assertDatabase(result, "Unable to verify ride access");
  if (!booking) throw forbidden("Only ride participants can access live trip data");
  return ride;
}

export async function getGroupRecord(groupId) {
  const result = await supabaseAdmin.from("groups").select("*").eq("id", groupId).maybeSingle();
  const group = assertDatabase(result, "Unable to load group");
  if (!group) throw notFound("Group");
  return group;
}

export async function assertGroupMember(groupId, userId) {
  const group = await getGroupRecord(groupId);
  const result = await supabaseAdmin
    .from("group_members")
    .select("role, status")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  const membership = assertDatabase(result, "Unable to verify group access");
  if (!membership) throw forbidden("You must be an active group member");
  return { group, membership };
}

