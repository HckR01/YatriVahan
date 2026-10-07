import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { ridesApi } from '../../lib/api';
import { formatMoney } from '../../lib/format';

export default function DriverDashboard() {
  const [requests, setRequests] = useState([]);
  const [mine, setMine] = useState([]);
  const [error, setError] = useState('');
  async function refresh() {
    try {
      const [open, own] = await Promise.all([ridesApi.search({ status: 'searching' }), ridesApi.mine()]);
      setRequests(open); setMine(own); setError('');
    } catch (reason) { setError(reason.message); }
  }
  useEffect(() => {
    let active = true;
    Promise.all([ridesApi.search({ status: 'searching' }), ridesApi.mine()])
      .then(([open, own]) => { if (active) { setRequests(open); setMine(own); } })
      .catch(reason => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, []);
  async function accept(id) {
    try { await ridesApi.accept(id); await refresh(); }
    catch (reason) { setError(reason.message); }
  }
  return <div className="min-h-screen bg-[#fffaf6]"><Navbar /><main className="mx-auto max-w-5xl px-5 py-10"><h1 className="font-serif text-4xl text-[#52151d]">Driver dashboard</h1><p className="mt-3">Accept ride requests and manage your trips.</p>{error && <p role="alert" className="my-4 rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}<button onClick={refresh} className="my-5 rounded-xl border px-5 py-2">Refresh requests</button><h2 className="text-xl font-bold">Open requests</h2>{requests.length === 0 && <p className="my-4">No open requests right now.</p>}<div className="my-5 grid gap-4">{requests.map(ride => <article key={ride.id} className="rounded-2xl border bg-white p-5"><h3 className="font-bold">{ride.origin.name} → {ride.destination.name}</h3><p>{ride.seatsTotal} passengers · {formatMoney(ride.estimatedFare || 0)}</p><button onClick={() => accept(ride.id)} className="mt-3 rounded-xl bg-[#7a1f2a] px-5 py-3 text-white">Accept request</button></article>)}</div><h2 className="text-xl font-bold">My rides</h2><div className="my-5 grid gap-4">{mine.map(ride => <Link key={ride.id} to={`/trips/${ride.id}`} className="rounded-2xl border bg-white p-5"><strong>{ride.origin.name} → {ride.destination.name}</strong><p>{ride.status.replaceAll('_', ' ')} · Open trip controls</p></Link>)}</div></main><Footer /></div>;
}
