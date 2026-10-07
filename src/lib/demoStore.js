import { SAMPLE_GROUPS, SAMPLE_RIDES } from "./sampleData";
import { isSupabaseConfigured } from "./supabase";

const RIDES_KEY = "yatrivahan-demo-rides-v2";
const GROUPS_KEY = "yatrivahan-demo-groups-v2";
const BOOKINGS_KEY = "yatrivahan-demo-bookings-v2";

const read = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  if (isSupabaseConfigured) throw new Error("The request could not be saved. Please check your connection and try again.");
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("yatrivahan:demo-updated", { detail: { key } }));
};

export const demoStore = {
  getRides() {
    if (isSupabaseConfigured) return [];
    return read(RIDES_KEY, SAMPLE_RIDES);
  },
  getRide(id) {
    return this.getRides().find((ride) => String(ride.id) === String(id)) || null;
  },
  searchRides(filters = {}) {
    const origin = String(filters.origin || "").trim().toLowerCase();
    const destination = String(filters.destination || "").trim().toLowerCase();
    const seats = Number(filters.seats || 1);
    return this.getRides().filter((ride) => {
      const matchesOrigin = !origin || ride.origin?.name?.toLowerCase().includes(origin);
      const matchesDestination = !destination || ride.destination?.name?.toLowerCase().includes(destination);
      const matchesDate = !filters.departureDate || ride.departureTime?.slice(0, 10) === filters.departureDate;
      const matchesType = !filters.rideType || ride.rideType === filters.rideType;
      return matchesOrigin && matchesDestination && matchesDate && matchesType && Number(ride.seatsAvailable ?? ride.seatsTotal) >= seats;
    });
  },
  createRide(ride, user) {
    const next = {
      ...ride,
      id: `local-${Date.now()}`,
      seatsAvailable: ride.seatsTotal,
      status: "scheduled",
      driver: {
        id: user?.id || "local-driver",
        fullName: user?.user_metadata?.full_name || user?.fullName || user?.name || "You",
        rating: 5,
        trips: 0,
        verified: false,
      },
    };
    write(RIDES_KEY, [next, ...this.getRides()]);
    return next;
  },
  bookRide(rideId, seats, user) {
    const ride = this.getRide(rideId);
    if (!ride) throw new Error("Ride not found.");
    const booking = {
      id: `booking-${Date.now()}`,
      rideId,
      ride,
      seats,
      status: "confirmed",
      passengerName: user?.user_metadata?.full_name || user?.name || "You",
      createdAt: new Date().toISOString(),
    };
    const bookings = read(BOOKINGS_KEY, []);
    write(BOOKINGS_KEY, [booking, ...bookings]);
    return booking;
  },
  getBookings() {
    return read(BOOKINGS_KEY, []);
  },
  getGroups() {
    if (isSupabaseConfigured) return [];
    return read(GROUPS_KEY, SAMPLE_GROUPS);
  },
  getGroup(id) {
    return this.getGroups().find((group) => String(group.id) === String(id)) || null;
  },
  createGroup(group) {
    const next = {
      ...group,
      id: `local-group-${Date.now()}`,
      memberCount: 1,
      isMember: true,
      messages: [],
    };
    write(GROUPS_KEY, [next, ...this.getGroups()]);
    return next;
  },
  joinGroup(id) {
    let joined;
    const groups = this.getGroups().map((group) => {
      if (String(group.id) !== String(id)) return group;
      joined = { ...group, isMember: true, memberCount: Math.min(group.memberCount + 1, group.maxMembers) };
      return joined;
    });
    write(GROUPS_KEY, groups);
    return joined;
  },
  addMessage(groupId, message, senderName = "You") {
    let created;
    const groups = this.getGroups().map((group) => {
      if (String(group.id) !== String(groupId)) return group;
      created = { id: `local-message-${Date.now()}`, senderName, message, createdAt: new Date().toISOString() };
      return { ...group, messages: [...(group.messages || []), created] };
    });
    write(GROUPS_KEY, groups);
    return created;
  },
};
