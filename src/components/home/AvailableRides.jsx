import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import RideCard from "../ride/RideCard";
import { SAMPLE_RIDES } from "../../lib/sampleData";

export default function AvailableRides() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-extrabold uppercase tracking-[.17em] text-[#e8462c]">Leaving soon</p><h2 className="mt-2 font-serif text-3xl text-[#52151d] sm:text-4xl">Popular rides near you</h2><p className="mt-2 text-[#756963]">A few routes travellers are joining today.</p></div>
        <Link to="/find-ride" className="inline-flex items-center gap-2 text-sm font-extrabold text-[#7a1f2a] hover:text-[#e8462c]">Explore all rides <ArrowRight size={17} /></Link>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">{SAMPLE_RIDES.slice(0, 3).map((ride) => <RideCard key={ride.id} ride={ride} />)}</div>
    </section>
  );
}
