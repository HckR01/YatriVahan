const KNOWN_LOCATIONS = {
  astarang: { lat: 19.9735, lng: 86.2716 },
  bhubaneswar: { lat: 20.2961, lng: 85.8245 },
  cuttack: { lat: 20.4625, lng: 85.883 },
  puri: { lat: 19.8135, lng: 85.8312 },
  konark: { lat: 19.8876, lng: 86.0945 },
};

export const lookupKnownLocation = (name) => {
  const normalized = String(name || "").trim().toLowerCase();
  const key = Object.keys(KNOWN_LOCATIONS).find((item) => normalized.includes(item));
  return key ? KNOWN_LOCATIONS[key] : null;
};

export const geocodeLocation = async (name) => {
  const known = lookupKnownLocation(name);
  if (known) return { name: name.trim(), ...known };
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", `${name}, Odisha, India`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Location search is unavailable.");
  const [result] = await response.json();
  if (!result) throw new Error(`We could not find “${name}”. Try a nearby landmark.`);
  return { name: result.display_name, lat: Number(result.lat), lng: Number(result.lon) };
};

export const getCurrentLocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location is not supported by this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          name: "Current location",
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      () => reject(new Error("Allow location access to use your current pickup.")),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
