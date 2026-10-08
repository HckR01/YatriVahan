import { getAccessToken } from "./supabase";

const API_BASE = (import.meta.env.VITE_API_URL || "/api/v1").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status = 0, code = "REQUEST_FAILED", details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const buildUrl = (path, query) => {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const search = params.toString();
  return search ? `${url}?${search}` : url;
};

export const apiRequest = async (path, options = {}) => {
  const { query, body, headers: extraHeaders, ...requestOptions } = options;
  const token = await getAccessToken();
  const headers = {
    Accept: "application/json",
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };

  let response;
  try {
    response = await fetch(buildUrl(path, query), {
      ...requestOptions,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    throw new ApiError(
      "The YatriVahan service is not reachable right now.",
      0,
      "NETWORK_ERROR",
      error,
    );
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    const apiError = payload?.error;
    throw new ApiError(
      apiError?.message || `Request failed with status ${response.status}.`,
      response.status,
      apiError?.code || "REQUEST_FAILED",
      apiError?.details,
    );
  }

  return payload?.data ?? payload;
};

export const normalizeRide = (ride) => {
  if (!ride) return ride;
  return {
    ...ride,
    origin: ride.origin || {
      name: ride.originName,
      lat: Number(ride.originLat),
      lng: Number(ride.originLng),
    },
    destination: ride.destination || {
      name: ride.destinationName,
      lat: Number(ride.destinationLat),
      lng: Number(ride.destinationLng),
    },
  };
};

export const normalizeGroup = (group) => {
  if (!group) return group;
  return {
    ...group,
    origin: group.origin || { name: group.originName },
    destination: group.destination || { name: group.destinationName },
    isMember: group.isMember ?? group.joined ?? false,
    memberCount: group.memberCount ?? group.members?.length ?? 0,
  };
};

export const ridesApi = {
  search: (query) => apiRequest("/rides/search", { query }).then((rides) => rides.map(normalizeRide)),
  mine: () => apiRequest("/rides/mine").then((rides) => rides.map(normalizeRide)),
  get: (rideId) => apiRequest(`/rides/${rideId}`).then(normalizeRide),
  create: (ride) => apiRequest("/rides", { method: "POST", body: ride }).then(normalizeRide),
  request: (ride) => apiRequest("/rides/requests", { method: "POST", body: ride }).then(normalizeRide),
  accept: (rideId) => apiRequest(`/rides/${rideId}/accept`, { method: "POST", body: {} }).then(normalizeRide),
  cancel: (rideId) => apiRequest(`/rides/${rideId}/cancel`, { method: "POST", body: { reason: "Cancelled by user" } }),
  book: (rideId, booking) =>
    apiRequest(`/rides/${rideId}/bookings`, { method: "POST", body: booking }),
  join: (rideId, booking) =>
    apiRequest(`/rides/${rideId}/join`, { method: "POST", body: booking }),
  location: (rideId) => apiRequest(`/rides/${rideId}/location`),
  updateStatus: (rideId, status) =>
    apiRequest(`/rides/${rideId}/status`, { method: "PATCH", body: { status } }),
};

export const bookingsApi = {
  list: (query) => apiRequest("/bookings", { query }).then((bookings) =>
    bookings.map((booking) => ({ ...booking, ride: normalizeRide(booking.ride) })),
  ),
  get: (bookingId) => apiRequest(`/bookings/${bookingId}`),
  updateStatus: (bookingId, status) =>
    apiRequest(`/bookings/${bookingId}/status`, {
      method: "PATCH",
      body: { status },
    }),
  cancel: (bookingId, reason) =>
    apiRequest(`/bookings/${bookingId}/cancel`, {
      method: "POST",
      body: { reason },
    }),
};

export const groupsApi = {
  list: (query) => apiRequest("/groups", { query }).then((groups) => groups.map(normalizeGroup)),
  create: (group) => apiRequest("/groups", { method: "POST", body: group }).then(normalizeGroup),
  get: (groupId) => apiRequest(`/groups/${groupId}`).then(normalizeGroup),
  join: (groupId, joinCode) => apiRequest(`/groups/${groupId}/members/me`, { method: "POST", body: joinCode ? { joinCode } : {} }),
  leave: (groupId) => apiRequest(`/groups/${groupId}/members/me`, { method: "DELETE" }),
  messages: (groupId) => apiRequest(`/groups/${groupId}/messages`),
  sendMessage: (groupId, message) =>
    apiRequest(`/groups/${groupId}/messages`, {
      method: "POST",
      body: { message },
    }),
};

export const profileApi = {
  me: () => apiRequest("/profiles/me"),
  update: (profile) => apiRequest("/profiles/me", { method: "PATCH", body: profile }),
  remove: () => apiRequest("/profiles/me", { method: "DELETE" }),
};

export { API_BASE };
