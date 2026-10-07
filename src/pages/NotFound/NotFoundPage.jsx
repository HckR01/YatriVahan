import { ArrowLeft, MapPinOff } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "../../components/layout/Footer";
import Navbar from "../../components/layout/Navbar";

export default function NotFoundPage() {
  return <div className="min-h-screen bg-[#fffaf6]"><Navbar /><main className="grid min-h-[65vh] place-items-center px-5 py-16 text-center"><div><MapPinOff className="mx-auto text-[#e8462c]" size={46} /><p className="mt-5 text-xs font-extrabold uppercase tracking-[.16em] text-[#e8462c]">404 · Route not found</p><h1 className="mt-3 font-serif text-5xl text-[#52151d]">This road ends here</h1><p className="mx-auto mt-4 max-w-md leading-7 text-[#756963]">The page may have moved, but there are plenty of rides waiting back home.</p><Link to="/" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#7a1f2a] px-6 text-sm font-extrabold text-white"><ArrowLeft size={17} /> Back home</Link></div></main><Footer /></div>;
}
