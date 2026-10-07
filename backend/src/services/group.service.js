import { randomBytes, timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "../config/supabase.js";
import { assertDatabase, conflict, forbidden, notFound, unauthorized } from "../lib/errors.js";
import { getPagination, paginationMeta } from "../lib/http.js";
import { camelizeKeys } from "../lib/case.js";
import { assertGroupMember, getGroupRecord } from "./access.service.js";

function safeCodeEquals(actual, supplied) {
  if (!actual || !supplied) return false;
  const actualBuffer = Buffer.from(actual);
  const suppliedBuffer = Buffer.from(supplied);
  return actualBuffer.length === suppliedBuffer.length && timingSafeEqual(actualBuffer, suppliedBuffer);
}

async function attachMembershipState(groups, userId) {
  if (!groups.length) return [];
  const ids = groups.map((group) => group.id);
  const memberResult = await supabaseAdmin
    .from("group_members")
    .select("group_id, user_id, role, status")
    .in("group_id", ids)
    .eq("status", "active");
  const members = assertDatabase(memberResult, "Unable to load group membership") ?? [];
  const counts = new Map();
  const joined = new Set();
  for (const member of members) {
    counts.set(member.group_id, (counts.get(member.group_id) ?? 0) + 1);
    if (member.user_id === userId) joined.add(member.group_id);
  }
  return groups.map(({ join_code: _joinCode, ...group }) => ({
    ...group,
    member_count: counts.get(group.id) ?? 0,
    joined: joined.has(group.id),
  }));
}

export async function createGroup(userId, input) {
  const joinCode = input.isPrivate ? input.joinCode ?? randomBytes(5).toString("hex") : null;
  const result = await supabaseAdmin
    .from("groups")
    .insert({
      owner_id: userId,
      name: input.name,
      origin_name: input.originName,
      destination_name: input.destinationName,
      travel_date: input.travelDate,
      preferred_time: input.preferredTime,
      max_members: input.maxMembers,
      description: input.description ?? null,
      is_private: input.isPrivate,
      join_code: joinCode,
    })
    .select("*")
    .single();
  const group = assertDatabase(result, "Unable to create group");
  return { ...group, join_code: joinCode, joined: true, member_count: 1 };
}

export async function listGroups(query, userId) {
  const { from, to } = getPagination(query.page, query.limit);
  let allowedPrivateIds = [];
  if (query.joined) {
    if (!userId) throw unauthorized();
    const membershipResult = await supabaseAdmin
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId)
      .eq("status", "active");
    allowedPrivateIds = (assertDatabase(membershipResult, "Unable to load memberships") ?? []).map(
      ({ group_id: id }) => id,
    );
    if (!allowedPrivateIds.length) {
      return { data: [], meta: paginationMeta(query.page, query.limit, 0) };
    }
  }

  let builder = supabaseAdmin
    .from("groups")
    .select("*", { count: "exact" })
    .order("travel_date", { ascending: true, nullsFirst: false });
  if (query.joined) builder = builder.in("id", allowedPrivateIds);
  else builder = builder.eq("is_private", false);
  if (query.origin) builder = builder.ilike("origin_name", `%${query.origin}%`);
  if (query.destination) builder = builder.ilike("destination_name", `%${query.destination}%`);
  if (query.travelDate) builder = builder.eq("travel_date", query.travelDate);

  const result = await builder.range(from, to);
  const groups = assertDatabase(result, "Unable to load groups") ?? [];
  return {
    data: await attachMembershipState(groups, userId),
    meta: paginationMeta(query.page, query.limit, result.count),
  };
}

export async function getGroup(groupId, userId) {
  const group = await getGroupRecord(groupId);
  if (group.is_private) {
    if (!userId) throw unauthorized();
    await assertGroupMember(groupId, userId);
  }

  const memberResult = await supabaseAdmin
    .from("group_members")
    .select("group_id, user_id, role, status, joined_at")
    .eq("group_id", groupId)
    .eq("status", "active")
    .order("joined_at", { ascending: true });
  const members = assertDatabase(memberResult, "Unable to load group members") ?? [];
  const ids = members.map(({ user_id: id }) => id);
  const profileResult = ids.length
    ? await supabaseAdmin
        .from("profiles")
        .select("id, full_name, avatar_url, role, is_verified, avg_rating")
        .in("id", ids)
    : { data: [], error: null };
  const profiles = assertDatabase(profileResult, "Unable to load group member profiles") ?? [];
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  const { join_code: joinCode, ...publicGroup } = group;
  return {
    ...publicGroup,
    ...(group.owner_id === userId && { join_code: joinCode }),
    joined: members.some((member) => member.user_id === userId),
    members: members.map((member) => ({
      ...member,
      profile: profileMap.get(member.user_id) ?? null,
    })),
  };
}

export async function joinGroup(groupId, userId, input) {
  const group = await getGroupRecord(groupId);
  if (group.is_private && !safeCodeEquals(group.join_code, input.joinCode)) {
    throw forbidden("A valid join code is required for this private group");
  }

  const result = await supabaseAdmin.rpc("join_group", {
    p_group_id: groupId,
    p_user_id: userId,
  });
  if (result.error) {
    if (result.error.message?.toLowerCase().includes("full")) throw conflict("This group is full");
    throw assertDatabase(result, "Unable to join group");
  }
  return result.data;
}

export async function leaveGroup(groupId, userId) {
  const { group } = await assertGroupMember(groupId, userId);
  if (group.owner_id === userId) throw conflict("The group owner cannot leave the group");
  const result = await supabaseAdmin
    .from("group_members")
    .update({ status: "left" })
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();
  const membership = assertDatabase(result, "Unable to leave group");
  if (!membership) throw notFound("Group membership");
  return membership;
}

export async function listMessages(groupId, userId, query) {
  await assertGroupMember(groupId, userId);
  const { from, to } = getPagination(query.page, query.limit);
  const result = await supabaseAdmin
    .from("group_messages")
    .select("*", { count: "exact" })
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .range(from, to);
  const messages = assertDatabase(result, "Unable to load group messages") ?? [];
  const ids = [...new Set(messages.map(({ sender_id: id }) => id))];
  const profileResult = ids.length
    ? await supabaseAdmin
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", ids)
    : { data: [], error: null };
  const profiles = assertDatabase(profileResult, "Unable to load message senders") ?? [];
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  return {
    data: messages.map((message) => ({
      ...message,
      sender: profileMap.get(message.sender_id) ?? null,
    })),
    meta: paginationMeta(query.page, query.limit, result.count),
  };
}

export async function createMessage(groupId, userId, message, io) {
  await assertGroupMember(groupId, userId);
  const result = await supabaseAdmin
    .from("group_messages")
    .insert({ group_id: groupId, sender_id: userId, message })
    .select("*")
    .single();
  const saved = assertDatabase(result, "Unable to send group message");
  io?.to(`group:${groupId}`).emit("group:message_created", camelizeKeys(saved));
  return saved;
}

