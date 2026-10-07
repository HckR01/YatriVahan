import { supabaseAdmin } from "../config/supabase.js";
import { assertDatabase, notFound } from "../lib/errors.js";

function toRow(input) {
  return {
    ...(input.make !== undefined && { make: input.make }),
    ...(input.model !== undefined && { model: input.model }),
    ...(input.color !== undefined && { color: input.color }),
    ...(input.registrationNumber !== undefined && { registration_number: input.registrationNumber }),
    ...(input.seats !== undefined && { seats: input.seats }),
    ...(input.vehicleType !== undefined && { vehicle_type: input.vehicleType }),
    ...(input.photoUrl !== undefined && { photo_url: input.photoUrl }),
    ...(input.active !== undefined && { active: input.active }),
  };
}

export async function listMyVehicles(userId) {
  const result = await supabaseAdmin
    .from("vehicles")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  return assertDatabase(result, "Unable to load vehicles") ?? [];
}

export async function createVehicle(userId, input) {
  const result = await supabaseAdmin
    .from("vehicles")
    .insert({ owner_id: userId, ...toRow(input), active: input.active ?? true })
    .select("*")
    .single();
  return assertDatabase(result, "Unable to create vehicle");
}

export async function updateVehicle(userId, vehicleId, input) {
  const result = await supabaseAdmin
    .from("vehicles")
    .update(toRow(input))
    .eq("id", vehicleId)
    .eq("owner_id", userId)
    .select("*")
    .maybeSingle();
  const vehicle = assertDatabase(result, "Unable to update vehicle");
  if (!vehicle) throw notFound("Vehicle");
  return vehicle;
}

export async function deactivateVehicle(userId, vehicleId) {
  const result = await supabaseAdmin
    .from("vehicles")
    .update({ active: false })
    .eq("id", vehicleId)
    .eq("owner_id", userId)
    .select("*")
    .maybeSingle();
  const vehicle = assertDatabase(result, "Unable to deactivate vehicle");
  if (!vehicle) throw notFound("Vehicle");
  return vehicle;
}

