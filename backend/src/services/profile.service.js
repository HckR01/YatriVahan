import { supabaseAdmin } from "../config/supabase.js";
import { assertDatabase, notFound } from "../lib/errors.js";

const publicProfileFields =
  "id, full_name, avatar_url, bio, role, is_verified, avg_rating, rating_count, created_at";

export async function getMyProfile(user) {
  let result = await supabaseAdmin.from("profiles").select("*").eq("id", user.id).maybeSingle();
  let profile = assertDatabase(result, "Unable to load profile");

  // Normally created by the auth.users trigger; this fallback also supports older projects.
  if (!profile) {
    const metadata = user.user_metadata ?? {};
    result = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: metadata.full_name ?? metadata.name ?? "",
        phone: metadata.phone ?? user.phone ?? null,
        avatar_url: metadata.avatar_url ?? null,
        role: ["rider", "driver", "both"].includes(metadata.role) ? metadata.role : "rider",
      })
      .select("*")
      .single();
    profile = assertDatabase(result, "Unable to initialize profile");
  }

  return { ...profile, email: user.email ?? null };
}

export async function updateMyProfile(user, input) {
  const updates = {
    ...(input.fullName !== undefined && { full_name: input.fullName }),
    ...(input.phone !== undefined && { phone: input.phone }),
    ...(input.avatarUrl !== undefined && { avatar_url: input.avatarUrl }),
    ...(input.bio !== undefined && { bio: input.bio }),
    ...(input.emergencyContact !== undefined && {
      emergency_contact: input.emergencyContact ?? {},
    }),
  };

  const result = await supabaseAdmin
    .from("profiles")
    .upsert({ id: user.id, ...updates }, { onConflict: "id" })
    .select("*")
    .single();
  const profile = assertDatabase(result, "Unable to update profile");
  return { ...profile, email: user.email ?? null };
}

export async function getPublicProfile(profileId) {
  const result = await supabaseAdmin
    .from("profiles")
    .select(publicProfileFields)
    .eq("id", profileId)
    .maybeSingle();
  const profile = assertDatabase(result, "Unable to load profile");
  if (!profile) throw notFound("Profile");
  return profile;
}

export async function searchDrivers({ location, limit = 20 }) {
  let query = supabaseAdmin
    .from("profiles")
    .select(publicProfileFields)
    .in("role", ["driver", "both"])
    .order("avg_rating", { ascending: false })
    .limit(limit);

  // Service location is not yet modeled. `location` is retained in the API for forward compatibility.
  void location;
  const profiles = assertDatabase(await query, "Unable to search drivers") ?? [];
  if (profiles.length === 0) return [];

  const driverIds = profiles.map((profile) => profile.id);
  const vehicles = assertDatabase(
    await supabaseAdmin
      .from("vehicles")
      .select("id, owner_id, make, model, color, seats, vehicle_type, photo_url, active")
      .in("owner_id", driverIds)
      .eq("active", true),
    "Unable to load driver vehicles",
  );
  const byOwner = new Map();
  for (const vehicle of vehicles ?? []) {
    byOwner.set(vehicle.owner_id, [...(byOwner.get(vehicle.owner_id) ?? []), vehicle]);
  }

  return profiles.map((profile) => ({
    ...profile,
    vehicles: byOwner.get(profile.id) ?? [],
  }));
}

