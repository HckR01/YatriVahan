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
      <main className="relative isolate flex min-h-[calc(100svh-73px)] items-center justify-center overflow-hidden bg-[#FFF9F3] px-4 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:px-8 sm:py-12 md:min-h-0 md:py-16">
        <div className="relative mx-auto flex w-full max-w-5xl overflow-hidden rounded-2xl border border-[#EFDED9] bg-white shadow-[0_20px_60px_rgba(59,13,18,0.12)] sm:rounded-3xl">
          
          <div className="relative hidden w-1/2 bg-[#FFF9F3] lg:block">
            <img
              src={loginImage}
              alt="Traditional Odisha Sketch"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[20s] hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#65151B]/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-12 text-white">
              <h2 className="font-serif text-4xl font-bold">Journey into Heritage</h2>
              <p className="mt-4 text-base leading-relaxed opacity-95">
                Experience the rich art and tradition of Odisha as you travel. Connect with others and share the ride.
              </p>
            </div>
          </div>

          <div className="w-full p-6 sm:p-10 lg:w-1/2 lg:px-14 lg:py-16">
            <header className="mb-8 text-center sm:mb-10">
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
      </div>
    </main>
      <Footer />
    </div>
  );
};

export default LoginPage;
