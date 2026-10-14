import { getAccessToken } from "./supabase";
import { isSupabaseConfigured } from "./supabase";
import { demoStore } from "./demoStore";

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

const asArray = (value) => (Array.isArray(value) ? value : value?.items || value?.rides || value?.bookings || value?.groups || []);

export const ridesApi = {
  search: (query) =>
    isSupabaseConfigured
      ? apiRequest("/rides/search", { query }).then((rides) => asArray(rides).map(normalizeRide))
      : Promise.resolve(demoStore.searchRides(query).map(normalizeRide)),
  mine: () =>
    isSupabaseConfigured
      ? apiRequest("/rides/mine").then((rides) => asArray(rides).map(normalizeRide))
      : Promise.resolve(demoStore.getRides().map(normalizeRide)),
  get: (rideId) =>
    isSupabaseConfigured
      ? apiRequest(`/rides/${rideId}`).then(normalizeRide)
      : Promise.resolve(normalizeRide(demoStore.getRide(rideId))),
  create: (ride) =>
    isSupabaseConfigured
      ? apiRequest("/rides", { method: "POST", body: ride }).then(normalizeRide)
      : Promise.resolve(normalizeRide(demoStore.createRide(ride))),
  request: (ride) =>
    apiRequest("/rides/requests", { method: "POST", body: ride }).then(
      normalizeRide,
    ),
  accept: (rideId) =>
    apiRequest(`/rides/${rideId}/accept`, { method: "POST", body: {} }).then(
      normalizeRide,
    ),
  cancel: (rideId) =>
    apiRequest(`/rides/${rideId}/cancel`, {
      method: "POST",
      body: { reason: "Cancelled by user" },
    }),
  book: (rideId, booking) =>
    apiRequest(`/rides/${rideId}/bookings`, { method: "POST", body: booking }),
  join: (rideId, booking) =>
    apiRequest(`/rides/${rideId}/join`, { method: "POST", body: booking }),
  location: (rideId) => apiRequest(`/rides/${rideId}/location`),
  updateStatus: (rideId, status) =>
    apiRequest(`/rides/${rideId}/status`, {
      method: "PATCH",
      body: { status },
    }),
};

export const bookingsApi = {
  list: (query) =>
    isSupabaseConfigured
      ? apiRequest("/bookings", { query }).then((bookings) =>
          asArray(bookings).map((booking) => ({
            ...booking,
            ride: normalizeRide(booking.ride),
          })),
        )
      : Promise.resolve(demoStore.getBookings()),
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
  list: (query) =>
    apiRequest("/groups", { query }).then((groups) =>
      asArray(groups).map(normalizeGroup),
    ),
  create: (group) =>
    apiRequest("/groups", { method: "POST", body: group }).then(normalizeGroup),
  get: (groupId) => apiRequest(`/groups/${groupId}`).then(normalizeGroup),
  join: (groupId, joinCode) =>
    apiRequest(`/groups/${groupId}/members/me`, {
      method: "POST",
      body: joinCode ? { joinCode } : {},
    }),
  leave: (groupId) =>
    apiRequest(`/groups/${groupId}/members/me`, { method: "DELETE" }),
  messages: (groupId) => apiRequest(`/groups/${groupId}/messages`),
  sendMessage: (groupId, message) =>
    apiRequest(`/groups/${groupId}/messages`, {
      method: "POST",
      body: { message },
    }),
};

export const profileApi = {
  me: () => (isSupabaseConfigured ? apiRequest("/profiles/me") : Promise.resolve(demoStore.getProfile())),
  update: (profile) =>
    isSupabaseConfigured
      ? apiRequest("/profiles/me", { method: "PATCH", body: profile })
      : Promise.resolve(demoStore.updateProfile(profile)),
  remove: () => apiRequest("/profiles/me", { method: "DELETE" }),
};

export { API_BASE };

export const vehiclesApi = {
  mine: () => (isSupabaseConfigured ? apiRequest("/vehicles/mine") : Promise.resolve(demoStore.getVehicles())),
  create: (body) =>
    isSupabaseConfigured
      ? apiRequest("/vehicles", { method: "POST", body })
      : Promise.resolve(demoStore.createVehicle(body)),
  update: (id, body) =>
    isSupabaseConfigured
      ? apiRequest(`/vehicles/${id}`, { method: "PATCH", body })
      : Promise.resolve(demoStore.updateVehicle(id, body)),
};
// Search pagination must be exhausted before ranking; never silently match only page one.
export async function searchAllRides(query) {
  const all = [];
  for (let page = 1; ; page++) {
    const items = await ridesApi.search({ ...query, page, limit: 100 });
    all.push(...items);
    if (items.length < 100) return all;
  }
}
export async function listAllBookings(query) {
  const all = [];
  for (let page = 1; ; page++) {
    const items = await bookingsApi.list({ ...query, page, limit: 100 });
    all.push(...items);
    if (items.length < 100) return all;
  }
}
