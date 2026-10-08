import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE, ApiError } from "../../lib/api";

// Never persist administrator tokens in localStorage or share them with user APIs.
async function adminRequest(path, token, body, method = "GET") {
  const response = await fetch(`${API_BASE}/admin${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(body && { "Content-Type": "application/json" }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) throw new ApiError(payload?.error?.message || "Admin service unavailable. Check your backend connection.", response.status);
  return payload.data;
}

const inputStyle = "w-full rounded-xl border border-[#eaded8] bg-white px-4 py-3 text-[#332826]";
const buttonStyle = "rounded-xl bg-[#7a1f2a] px-5 py-3 font-bold text-white disabled:opacity-50";

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [users, setUsers] = useState([]);
  const [rides, setRides] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!token) return;
    let active = true;
    adminRequest(`/users?page=${page}`, token).then(data => {
      if (active) { setUsers(data.users); setRides(data.rides || []); setBookings(data.bookings || []); setTotal(data.total); }
    }).catch(reason => {
      if (active) {
        setError(reason.message);
        if (reason.status === 401) { setToken(""); setUsers([]); }
      }
    });
    return () => { active = false; };
  }, [token, page, revision]);

  async function login(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const session = await adminRequest("/login", null, { username, password }, "POST");
      setToken(session.token); setPassword(""); setPage(1); setMessage("");
    } catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true);
    try { await adminRequest("/logout", token, {}, "POST"); }
    catch (reason) { setError(reason.message); }
    finally { setToken(""); setUsers([]); setMessage(""); setBusy(false); }
  }

  async function verify(user, verified) {
    if (!window.confirm(`${verified ? "Approve" : "Revoke verification for"} ${user.fullName || user.id}?`)) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const saved = await adminRequest(`/users/${user.id}/verification`, token, { verified }, "PATCH");
      setUsers(current => current.map(item => item.id === saved.id ? { ...item, ...saved } : item));
      setMessage(verified ? "User approved for cab driving and ride offers." : "Verification revoked. New offers and cab acceptance are blocked.");
    } catch (reason) {
      setError(reason.message);
      if (reason.status === 401) { setToken(""); setUsers([]); }
    } finally { setBusy(false); }
  }
  async function removeRide(ride) {
    if (!window.confirm(`Delete ride post ${ride.originName} → ${ride.destinationName}?`)) return;
    setBusy(true); setError("");
    try { await adminRequest(`/rides/${ride.id}`, token, null, "DELETE"); setRides(current => current.filter(item => item.id !== ride.id)); setMessage("Ride post deleted."); }
    catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  }

  const visible = users.filter(user => {
    const matches = `${user.fullName} ${user.phone || ""} ${user.id}`.toLowerCase().includes(search.toLowerCase());
    return matches && (filter === "all" || (filter === "verified" ? user.isVerified : !user.isVerified));
  });

  return <div className="min-h-screen bg-[#fffaf6] text-[#332826]">
    <header className="border-b border-[#eaded8] bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5"><Link to="/" className="font-serif text-2xl font-bold text-[#7a1f2a]">YatriVahan</Link><span className="text-sm font-bold">Administrator</span></div></header>
    <main className="mx-auto max-w-6xl px-5 py-10">
      {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
      {!token ? <section className="mx-auto max-w-md rounded-3xl border border-[#eaded8] bg-white p-7 shadow-sm"><h1 className="font-serif text-3xl text-[#52151d]">Admin sign in</h1><p className="mt-3 text-sm text-[#756963]">Manage driver and ride-offerer verification.</p><form onSubmit={login} className="mt-7 space-y-5"><label className="block"><span className="mb-2 block text-sm font-bold">Admin ID</span><input autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} className={inputStyle} required maxLength={100} /></label><label className="block"><span className="mb-2 block text-sm font-bold">Password</span><input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} className={inputStyle} required maxLength={256} /></label><button disabled={busy} className={`${buttonStyle} w-full`}>{busy ? "Signing in…" : "Sign in"}</button></form><p className="mt-5 text-xs text-[#756963]">Sessions expire after one hour. Refreshing this page signs you out.</p></section> : <>
        <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="font-serif text-4xl text-[#52151d]">Admin control panel</h1><p className="mt-3 text-[#756963]">{total} users · {rides.length} ride posts · {bookings.length} bookings.</p></div><button onClick={logout} disabled={busy} className={buttonStyle}>Sign out</button></div>
        {message && <p role="status" className="mt-5 rounded-xl bg-green-50 p-4 text-green-800">{message}</p>}
        <section className="mt-6 rounded-2xl bg-[#fff0e7] p-5 text-sm leading-6">Every signed-in user can offer rides and join rides. Use verification as an optional trust label, and review or remove ride posts here.</section>
        <div className="my-6 flex flex-wrap gap-3"><input aria-label="Search current page" placeholder="Search this page by name, phone or user ID" value={search} onChange={event => setSearch(event.target.value)} className={`${inputStyle} max-w-md`} /><select aria-label="Verification filter" value={filter} onChange={event => setFilter(event.target.value)} className="rounded-xl border border-[#eaded8] bg-white px-4 py-3"><option value="all">All users</option><option value="pending">Not verified</option><option value="verified">Verified</option></select><button disabled={busy} onClick={() => { setError(""); setRevision(value => value + 1); }} className="rounded-xl border px-5 py-3">Refresh</button></div>
        <div className="grid gap-4">{visible.map(user => <article key={user.id} className="rounded-2xl border border-[#eaded8] bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-bold">{user.fullName || "Unnamed user"}</h2><p className="mt-1 text-sm">{user.phone || "No phone provided"} · {user.role} · {user.isVerified ? "Verified" : "Not verified"}</p><p className="mt-2 break-all text-xs text-[#756963]">User ID: {user.id}</p>{user.bio && <p className="mt-3 text-sm">{user.bio}</p>}</div><button disabled={busy} onClick={() => verify(user, !user.isVerified)} className={user.isVerified ? "rounded-xl border border-red-300 px-5 py-3 font-bold text-red-800 disabled:opacity-50" : buttonStyle}>{user.isVerified ? "Revoke verification" : "Approve driver / offerer"}</button></div><div className="mt-4 border-t pt-4 text-sm">{user.vehicles.length ? user.vehicles.map(vehicle => <p key={vehicle.id} className="py-1">{vehicle.make} {vehicle.model} · {vehicle.color} · {vehicle.registrationNumber} · {vehicle.active ? "Active" : "Inactive"}</p>) : <p className="text-[#756963]">No registered vehicles. Confirm vehicle details before approval.</p>}</div></article>)}</div>
        {visible.length === 0 && <p className="rounded-2xl border bg-white p-8 text-center">No users match on this page.</p>}
        <section className="mt-10"><h2 className="font-serif text-3xl text-[#52151d]">Ride posts</h2><div className="mt-4 grid gap-3">{rides.map(ride => <article key={ride.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#eaded8] bg-white p-5"><div><p className="font-bold">{ride.originName} → {ride.destinationName}</p><p className="mt-1 text-xs text-[#756963]">{ride.status} · {ride.seatsAvailable}/{ride.seatsTotal} seats · {ride.driverId || ride.requesterId || "Unknown user"}</p></div><button disabled={busy} onClick={() => removeRide(ride)} className="rounded-xl border border-red-300 px-4 py-2 text-sm font-bold text-red-800">Delete post</button></article>)}</div></section>
        <section className="mt-10"><h2 className="font-serif text-3xl text-[#52151d]">Recent joins / bookings</h2><div className="mt-4 grid gap-3">{bookings.map(booking => <article key={booking.id} className="rounded-2xl border border-[#eaded8] bg-white p-5 text-sm"><p><strong>Booking:</strong> {booking.id}</p><p className="mt-1 text-[#756963]">Ride {booking.rideId} · Passenger {booking.passengerId} · {booking.seats} seat(s) · {booking.status}</p></article>)}</div></section>
        <nav aria-label="User pages" className="mt-6 flex items-center justify-between"><button disabled={page === 1 || busy} onClick={() => setPage(value => value - 1)} className={buttonStyle}>Previous</button><span>Page {page} of {Math.max(1, Math.ceil(total / 25))}</span><button disabled={page * 25 >= total || busy} onClick={() => setPage(value => value + 1)} className={buttonStyle}>Next</button></nav>
      </>}
    </main>
  </div>;
}
