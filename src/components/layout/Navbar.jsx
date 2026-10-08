import { useEffect, useState } from "react";
import { Bell, CarFront, Download, Menu, PlusCircle, Search, Route, UserRound, UsersRound, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import logo from "../../assets/logo.svg";
import { useAuth } from "../../hooks/useAuth";

const links = [
  ["Find a ride", "/find-ride", Search],
  ["Offer a ride", "/offer-ride", PlusCircle],
  ["Full car", "/book-full-car", CarFront],
  ["Groups", "/groups", UsersRound],
  ["Drive", "/driver", Route],
];

export default function Navbar() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const capture = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const installed = () => setInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  const install = async () => {
    await installPrompt?.prompt();
    setInstallPrompt(null);
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0];

  return (
    <header className="sticky top-0 z-[1000] border-b border-white/10 bg-[#681923]/95 text-white shadow-[0_8px_30px_rgba(60,10,16,0.12)] backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="YatriVahan home">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-sm"><img src={logo} alt="" className="h-9 w-9" /></span>
          <span className="font-serif text-xl font-bold tracking-tight">YatriVahan</span>
        </Link>
        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {links.map(([label, path, Icon]) => (
            <NavLink key={path} to={path} className={({ isActive }) => `inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2.5 text-xs font-bold transition ${isActive ? "bg-[#ffeadc] text-[#681923] shadow-sm" : "text-white/85 hover:bg-white/10 hover:text-white"}`}>
              <Icon size={15} />{label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-2">
          {installPrompt && <button type="button" onClick={install} className="hidden h-10 items-center gap-2 rounded-xl border border-white/25 px-3 text-xs font-bold hover:bg-white/10 sm:inline-flex"><Download size={15} /> Install</button>}
          {user && <Link to="/profile" className="hidden h-10 w-10 place-items-center rounded-xl text-white/85 hover:bg-white/10 sm:grid" aria-label="Notifications"><Bell size={18} /></Link>}
          <Link to={user ? "/profile" : "/login"} className="hidden h-10 items-center gap-2 rounded-xl bg-[#ffeadc] px-4 text-sm font-extrabold text-[#681923] hover:bg-white sm:inline-flex">
            <UserRound size={17} /> {user ? displayName : "Sign in"}
          </Link>
          <button type="button" onClick={() => setOpen((value) => !value)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 lg:hidden" aria-label="Toggle navigation" aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-white/10 bg-[#55131b] px-4 py-4 lg:hidden" aria-label="Mobile navigation">
          <div className="mx-auto grid max-w-7xl gap-1">
            {links.map(([label, path, Icon]) => <NavLink key={path} to={path} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold ${isActive ? "bg-white/15 text-[#ffcfb3]" : "text-white/90 hover:bg-white/10"}`}><Icon size={18} />{label}</NavLink>)}
            <NavLink to={user ? "/profile" : "/login"} onClick={() => setOpen(false)} className="mt-2 rounded-xl bg-white px-4 py-3 text-center text-sm font-extrabold text-[#681923]">{user ? "My trips & profile" : "Sign in / Create account"}</NavLink>
          </div>
        </nav>
      )}
    </header>
  );
}
