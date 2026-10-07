import { BadgeCheck, HeartHandshake, MapPinned, PhoneCall, ShieldCheck, UserCheck } from "lucide-react";
import Footer from "../../components/layout/Footer";
import Navbar from "../../components/layout/Navbar";

const tips = [
  [UserCheck, "Check the profile", "Review the driver or passenger name, rating and verification badge before you confirm."],
  [MapPinned, "Confirm your route", "Meet in a public, well-lit pickup point and check the destination before departure."],
  [BadgeCheck, "Match the vehicle", "Check the car model and registration number shown in your confirmed booking."],
  [HeartHandshake, "Keep it in the app", "Use YatriVahan booking and group chat so your arrangements have a clear record."],
];

export default function SafetyPage() {
  return <div className="min-h-screen bg-[#fffaf6]"><Navbar /><section className="bg-[#421017] px-5 py-16 text-center text-white sm:px-8"><ShieldCheck className="mx-auto text-[#ff9a63]" size={44} /><p className="mt-5 text-xs font-extrabold uppercase tracking-[.18em] text-[#ffc6a1]">YatriVahan safety centre</p><h1 className="mx-auto mt-3 max-w-3xl font-serif text-5xl">Safer journeys start before pickup</h1><p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/70">Simple habits and clear information help everyone travel with confidence.</p></section><main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-16"><div className="grid gap-5 sm:grid-cols-2">{tips.map(([Icon,title,copy]) => <article key={title} className="rounded-[24px] border border-[#eaded8] bg-white p-6"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff0e7] text-[#e8462c]"><Icon size={22} /></span><h2 className="mt-5 text-xl font-extrabold text-[#52151d]">{title}</h2><p className="mt-2 leading-7 text-[#756963]">{copy}</p></article>)}</div><section className="mt-8 flex flex-col justify-between gap-5 rounded-[26px] bg-[#e8462c] p-6 text-white sm:flex-row sm:items-center sm:p-8"><div><h2 className="text-2xl font-extrabold">In immediate danger?</h2><p className="mt-2 text-white/80">Call India’s national emergency response number. App support is not an emergency service.</p></div><a href="tel:112" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 font-extrabold text-[#b33120]"><PhoneCall size={19} /> Call 112</a></section></main><Footer /></div>;
}
