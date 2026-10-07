import { ArrowRight, CarFront, LoaderCircle, LockKeyhole, Mail, ShieldCheck, UsersRound } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import loginImage from "../../assets/LoginImg.png";
import Footer from "../../components/layout/Footer";
import Navbar from "../../components/layout/Navbar";
import StatusBanner from "../../components/common/StatusBanner";
import { useAuth } from "../../hooks/useAuth";

export default function AuthPage({ mode = "login" }) {
  const isLogin = mode === "login";
  const { user, signIn, signUp, isDemoMode } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const returnTo = new URLSearchParams(location.search).get("returnTo") || "/profile";
  const [role, setRole] = useState("rider");
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  if (user) return <Navigate to={returnTo} replace />;

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (isLogin) {
        await signIn(form.email, form.password);
        navigate(returnTo, { replace: true });
      } else {
        const created = await signUp({ ...form, role });
        if (created && !isDemoMode) {
          setNotice("Account created. If email confirmation is enabled, open the link in your inbox before signing in.");
        } else {
          navigate(returnTo, { replace: true });
        }
      }
    } catch (reason) {
      setError(reason.message || "We could not complete that request.");
    } finally {
      setBusy(false);
    }
  };

  const inputClass = "min-h-12 w-full rounded-xl border border-[#e6d9d3] bg-white px-4 text-[#271e1e] outline-none transition placeholder:text-[#9c8f8b] focus:border-[#e8462c] focus:ring-4 focus:ring-[#e8462c]/10";
  const labelClass = "mb-2 block text-sm font-extrabold text-[#2d2322]";

  return (
    <div className="min-h-screen bg-[#fffaf6]">
      <Navbar />
      <main className="mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl items-stretch lg:grid-cols-2">
        <section className="relative hidden min-h-[720px] overflow-hidden lg:block">
          <img src={loginImage} alt="Odisha-inspired travel illustration" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#3b0d12] via-[#65151b]/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-12 text-white">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] backdrop-blur"><ShieldCheck size={15} /> Travel with confidence</span>
            <h2 className="mt-5 max-w-lg font-serif text-5xl leading-tight">Every journey feels lighter when it’s shared.</h2>
            <p className="mt-4 max-w-lg text-lg leading-8 text-white/80">Book seats, share your car, create a commute group or call a full cab—all with one account.</p>
          </div>
        </section>
        <section className="flex items-center px-5 py-12 sm:px-10 lg:px-16">
          <div className="mx-auto w-full max-w-md">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#e8462c]">{isLogin ? "Welcome back" : "Join the community"}</p>
            <h1 className="mt-3 font-serif text-4xl text-[#65151b]">{isLogin ? "Sign in to ride" : "Create your account"}</h1>
            <p className="mt-3 leading-7 text-[#706460]">{isLogin ? "Your trips, bookings and travel groups are waiting." : "Start as a rider, driver, or both. You can change this later."}</p>

            {isDemoMode && <div className="mt-6"><StatusBanner>Demo mode is active until Supabase environment values are configured. Accounts stay in this browser only.</StatusBanner></div>}
            {notice && <div className="mt-6"><StatusBanner type="success">{notice}</StatusBanner></div>}

            <form onSubmit={submit} className="mt-7 space-y-5">
              {!isLogin && (
                <>
                  <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#f7eee9] p-1.5">
                    {[["rider", UsersRound, "Rider"], ["driver", CarFront, "Driver"], ["both", ShieldCheck, "Both"]].map(([value, Icon, label]) => (
                      <button key={value} type="button" onClick={() => setRole(value)} className={`flex min-h-12 items-center justify-center gap-1.5 rounded-xl text-xs font-extrabold transition ${role === value ? "bg-white text-[#7a1f2a] shadow-sm" : "text-[#746762]"}`}><Icon size={16} />{label}</button>
                    ))}
                  </div>
                  <div><label htmlFor="full-name" className={labelClass}>Full name</label><input id="full-name" value={form.fullName} onChange={(event) => update("fullName", event.target.value)} className={inputClass} placeholder="Your name" autoComplete="name" required /></div>
                  <div><label htmlFor="phone" className={labelClass}>Phone number</label><input id="phone" type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} className={inputClass} placeholder="+91 98765 43210" autoComplete="tel" /></div>
                </>
              )}
              <div><label htmlFor="email" className={labelClass}>Email address</label><div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a8d88]" size={17} /><input id="email" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} className={`${inputClass} pl-11`} placeholder="you@example.com" autoComplete="email" required /></div></div>
              <div><label htmlFor="password" className={labelClass}>Password</label><div className="relative"><LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a8d88]" size={17} /><input id="password" type="password" minLength="6" value={form.password} onChange={(event) => update("password", event.target.value)} className={`${inputClass} pl-11`} placeholder="At least 6 characters" autoComplete={isLogin ? "current-password" : "new-password"} required /></div></div>
              {error && <StatusBanner type="error">{error}</StatusBanner>}
              <button disabled={busy} type="submit" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#7a1f2a] px-5 text-sm font-extrabold text-white shadow-lg shadow-[#7a1f2a]/15 transition hover:bg-[#5f141c] disabled:opacity-60">{busy ? <LoaderCircle className="animate-spin" size={19} /> : <>{isLogin ? "Sign in" : "Create account"}<ArrowRight size={18} /></>}</button>
            </form>
            <p className="mt-6 text-center text-sm text-[#746762]">{isLogin ? "New to YatriVahan?" : "Already have an account?"} <Link to={`${isLogin ? "/register" : "/login"}?returnTo=${encodeURIComponent(returnTo)}`} className="font-extrabold text-[#e8462c] hover:underline">{isLogin ? "Create an account" : "Sign in"}</Link></p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
