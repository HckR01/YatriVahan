import { useEffect, useState } from "react";
import {
  Bell,
  CarFront,
  Home,
  LayoutDashboard,
  Menu,
  Inbox,
  UserRound,
  X,
  Download,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { apiRequest } from "../../lib/api";

const mainLinks = [
  ["Home", "/"],
  ["Join a Ride", "/join-ride"],
  ["Offer a Ride", "/offer-ride"],
  ["Book Full Car", "/book-car"],
];
const accountLinks = [
  ["Dashboard", "/dashboard", LayoutDashboard],
  ["Requests", "/requests", Inbox],
  ["Profile", "/profile", UserRound],
];
export default function Navbar() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(null);
  const [noticeError, setNoticeError] = useState("");
  const [install, setInstall] = useState(null);
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstall(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  async function toggleNotifications() {
    if (notifications !== null) {
      setNotifications(null);
      return;
    }
    setNotifications([]);
    setNoticeError("Loading notifications…");
    try {
      const items = await apiRequest("/notifications", {
        query: { limit: 20 },
      });
      setNotifications(items);
      setNoticeError("");
    } catch (e) {
      setNoticeError(e.message);
    }
  }
  return (
    <>
      <header className="site-header">
        <div className="nav-inner">
          <Link to="/" className="brand" aria-label="YatriVahan home">
            <CarFront size={35} />
            <span>
              Yatri<span>Vahan</span>
            </span>
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation">
            {mainLinks.map(([label, to]) => (
              <NavLink key={to} to={to} end>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-actions">
            {install && (
              <button
                className="icon-button"
                aria-label="Install YatriVahan"
                onClick={async () => {
                  await install.prompt();
                  setInstall(null);
                }}
              >
                <Download size={20} />
              </button>
            )}
            {user ? (
              <>
                <button
                  className="icon-button"
                  aria-label="Notifications"
                  aria-expanded={notifications !== null}
                  onClick={toggleNotifications}
                >
                  <Bell size={21} />
                </button>
                <Link
                  to="/profile"
                  className="avatar"
                  aria-label="Your profile"
                >
                  {(user.user_metadata?.full_name ||
                    user.email ||
                    "Y")[0].toUpperCase()}
                </Link>
              </>
            ) : (
              <>
                <Link className="button secondary login-link" to="/login">
                  Sign in
                </Link>
                <Link className="button" to="/signup">
                  Sign up
                </Link>
              </>
            )}
            <button
              className="icon-button menu-toggle"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {user && (
          <nav className="account-nav" aria-label="Account navigation">
            {accountLinks.map(([label, to]) => (
              <NavLink key={to} to={to}>
                {label}
              </NavLink>
            ))}
          </nav>
        )}
        {open && (
          <nav className="mobile-menu">
            {mainLinks.map(([label, to]) => (
              <NavLink key={to} to={to} onClick={() => setOpen(false)}>
                {label}
              </NavLink>
            ))}
          </nav>
        )}
        {notifications !== null && (
          <section className="notification-panel" aria-label="Notifications">
            <div className="row">
              <h2>Notifications</h2>
              <button
                className="icon-button"
                onClick={() => setNotifications(null)}
                aria-label="Close notifications"
              >
                ×
              </button>
            </div>
            {noticeError ? (
              <p role="status">{noticeError}</p>
            ) : notifications.length ? (
              notifications.map((n) => (
                <article key={n.id}>
                  <strong>{n.title}</strong>
                  <p>{n.message}</p>
                </article>
              ))
            ) : (
              <p>You’re all caught up.</p>
            )}
          </section>
        )}
      </header>
      {user && (
        <nav className="bottom-nav" aria-label="Mobile account navigation">
          {[["Home", "/", Home], ...accountLinks].map(([label, to, Icon]) => (
            <NavLink key={to} to={to} end>
              <Icon size={21} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </>
  );
}
