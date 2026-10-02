import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Menu, X } from "lucide-react";
import logo from "../../assets/logo.svg";
import { getCurrentUser } from "../../utils/auth";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const currentUser = getCurrentUser();
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const handleAppInstalled = () => setInstallPrompt(null);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) {
      return;
    }

    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Find Ride", path: "/find-ride" },
    { name: "Offer Ride", path: "/offer-ride" },
    { name: "Book Full Car", path: "/book-full-car" },
    { name: "Groups", path: "/groups" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#65151B] bg-[#FE2A2B]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-2 sm:px-8">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center">
          <img
            src={logo}
            alt="YatriVahan"
            className="h-13 w-12 object-contain md:h-14 md:w-14"
          />
          <h2 className="text-[20px] font-bold text-[#FFF9F3]">YatriVahan</h2>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="text-[16px] font-medium tracking-[0.02em] text-[#FFF9F3] transition hover:text-[#FFD1AD]"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Desktop Login */}
        <div className="flex items-center gap-2">
          {installPrompt && (
            <button
              type="button"
              onClick={installApp}
              className="hidden items-center gap-2 rounded-lg border border-[#FFF9F3] px-4 py-2.5 text-sm font-bold text-[#FFF9F3] transition hover:bg-[#65151B] sm:inline-flex"
            >
              <Download size={16} />
              Install App
            </button>
          )}
          <Link
            to={currentUser ? "/userprofile" : "/login"}
            className="hidden rounded-lg bg-[#FFF9F3] px-5 py-2.5 text-[16px] font-bold text-[#65151B] shadow-sm transition hover:bg-[#FF8A3D] md:block"
          >
            {currentUser ? "My Profile" : "Login / Register"}
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded-xl border border-[#FFF9F3]/60 p-3 text-[#FFF9F3] transition hover:bg-[#65151B] md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <nav className="border-t border-[#65151B] bg-[#65151B] px-5 py-5 md:hidden">
          <div className="flex flex-col items-start gap-5">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setOpen(false)}
                className="text-[16px] text-[#FFF9F3]"
              >
                {item.name}
              </Link>
            ))}

              {installPrompt && (
                <button
                  type="button"
                  onClick={installApp}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#FFF9F3] px-5 py-3 text-[16px] font-bold text-[#FFF9F3]"
                >
                  <Download size={17} />
                  Install App
                </button>
              )}

              <Link
              to={currentUser ? "/userprofile" : "/login"}
              onClick={() => setOpen(false)}
              className="rounded-xl bg-[#FFF9F3] px-5 py-3 text-[16px] font-bold text-[#65151B]"
            >
              {currentUser ? "My Profile" : "Login / Register"}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
