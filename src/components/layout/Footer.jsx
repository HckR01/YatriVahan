import { Code2 as Github, Heart, MapPin, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-[#321014] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.3fr_.7fr_.7fr]">
        <div>
          <p className="font-serif text-2xl font-bold">YatriVahan</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/65">Safe, affordable local journeys—shared seats, private cars and trusted travel groups in one place.</p>
          <p className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-[#ffc9a7]"><MapPin size={15} /> Built for Odisha, ready to travel</p>
        </div>
        <div>
          <h2 className="text-sm font-extrabold">Travel</h2>
          <div className="mt-4 grid gap-3 text-sm text-white/65"><Link to="/find-ride" className="hover:text-white">Find a ride</Link><Link to="/offer-ride" className="hover:text-white">Offer seats</Link><Link to="/groups" className="hover:text-white">Travel groups</Link></div>
        </div>
        <div>
          <h2 className="flex items-center gap-2 text-sm font-extrabold"><ShieldCheck size={17} /> Trust & support</h2>
          <div className="mt-4 grid gap-3 text-sm text-white/65"><Link to="/safety" className="hover:text-white">Safety centre</Link><a href="mailto:support@yatrivahan.app" className="hover:text-white">Get help</a><a href="https://github.com/HckR01/YatriVahan" className="flex items-center gap-2 hover:text-white" target="_blank" rel="noreferrer"><Github size={15} /> GitHub</a></div>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-white/50">Made with <Heart className="mx-1 inline text-[#ff806d]" size={13} fill="currentColor" /> for better journeys · © 2026 YatriVahan</div>
    </footer>
  );
}
