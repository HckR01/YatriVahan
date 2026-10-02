import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import loginImage from "../../assets/LoginImg.png";
import Footer from "../../components/layout/Footer";
import Navbar from "../../components/layout/Navbar";
import { findUser } from "../../utils/auth";

const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const returnTo =
    location.state?.returnTo ||
    new URLSearchParams(location.search).get("returnTo") ||
    "/";
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const updateForm = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const user = findUser(form.email, form.password);

    if (!user) {
      setError("Email or password is incorrect. Please register first.");
      return;
    }

    localStorage.setItem("yatri-vahan-user", JSON.stringify(user));
    navigate(returnTo, { replace: true });
  };

  const inputClass =
    "min-h-12 w-full rounded-[13px] border border-[#EFDED9] bg-white px-4 text-[#171414] outline-none transition placeholder:text-[#9A8D89] focus:border-[#E53935] focus:ring-4 focus:ring-[#E53935]/10";
  const labelClass = "mb-2 block text-sm font-bold text-[#171414]";

  return (
    <div className="min-h-screen bg-[#FFF9F3]">
      <Navbar />
      <main className="relative isolate flex min-h-[calc(100svh-73px)] items-center overflow-hidden bg-[#FFF9F3] px-4 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:px-8 sm:py-12 md:min-h-0 md:py-16">
        <img
          src={loginImage}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-[0.12]"
        />

        <div className="relative mx-auto w-full max-w-lg rounded-2xl border border-[#EFDED9] bg-white p-5 shadow-[0_18px_44px_rgba(59,13,18,0.18)] sm:rounded-3xl sm:p-8">
          <header className="mb-6 text-center sm:mb-7">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#E53935] sm:mb-3 sm:text-sm">
              YatriVahan
            </p>
            <h1 className="font-serif text-2xl text-[#65151B] sm:text-3xl">
              Welcome back
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#665B59] sm:mt-3">
              Log in to post rides, create groups and request transport.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label htmlFor="login-email" className={labelClass}>
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={form.email}
                onChange={(event) => updateForm("email", event.target.value)}
                className={inputClass}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="login-password" className={labelClass}>
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={form.password}
                onChange={(event) => updateForm("password", event.target.value)}
                className={inputClass}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl bg-[#FDECEA] px-3 py-3 text-sm font-semibold leading-relaxed text-[#B3261E] sm:px-4"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className="min-h-12 w-full rounded-xl bg-[#E53935] px-5 text-sm font-bold text-white shadow-md transition hover:brightness-110"
            >
              Log In
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[#665B59] sm:mt-6">
            New to YatriVahan?{" "}
            <Link
              to={`/register?returnTo=${encodeURIComponent(returnTo)}`}
              className="font-bold text-[#E53935] hover:underline"
            >
              Register here
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LoginPage;
