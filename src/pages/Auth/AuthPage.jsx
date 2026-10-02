import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import loginImage from "../../assets/LoginImg.png";
import Footer from "../../components/layout/Footer";
import Navbar from "../../components/layout/Navbar";
import { findUser, saveUser } from "../../utils/auth";

const AuthPage = ({ mode = "login" }) => {
  const isLogin = mode === "login";
  const location = useLocation();
  const navigate = useNavigate();
  const returnTo =
    location.state?.returnTo ||
    new URLSearchParams(location.search).get("returnTo") ||
    "/";
  const [role, setRole] = useState("user");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    verificationId: "",
    verificationPassword: "",
  });
  const [error, setError] = useState("");

  const updateForm = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isLogin) {
      const user = findUser(form.email, form.password);
      if (!user) {
        setError("Email or password is incorrect. Please register first.");
        return;
      }
      localStorage.setItem("yatri-vahan-user", JSON.stringify(user));
      navigate(returnTo, { replace: true });
      return;
    }

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError("Please complete the required fields.");
      return;
    }

    if (
      role === "driver" &&
      (!form.verificationId.trim() || !form.verificationPassword.trim())
    ) {
      setError("Cab drivers must provide their offline verification ID and password.");
      return;
    }

    saveUser({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      phone: form.phone.trim(),
      role,
      offlineVerificationId:
        role === "driver" ? form.verificationId.trim() : "",
      offlineVerificationStatus: role === "driver" ? "submitted" : "not-applicable",
    });
    navigate(returnTo, { replace: true });
  };

  const inputClass =
    "min-h-12 w-full rounded-[13px] border border-[#EFDED9] bg-white px-4 text-[#171414] outline-none transition placeholder:text-[#9A8D89] focus:border-[#E53935] focus:ring-4 focus:ring-[#E53935]/10";
  const labelClass = "mb-2 block text-sm font-bold text-[#171414]";

  return (
    <div className="min-h-screen bg-[#FFF9F3]">
      <Navbar />
      <main
        className="relative isolate overflow-hidden bg-[#FFF9F3] px-5 py-12 sm:px-8 md:py-16"
      >
        {isLogin && (
          <img
            src={loginImage}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-[0.12]"
          />
        )}
        <div className="relative mx-auto max-w-lg rounded-3xl border border-[#EFDED9] bg-white p-6 shadow-[0_18px_44px_rgba(59,13,18,0.18)] sm:p-8">
          <header className="mb-7 text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-[#E53935]">
              YatriVahan
            </p>
            <h1 className="font-serif text-3xl text-[#65151B]">
              {isLogin ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#665B59]">
              {isLogin
                ? "Log in to post rides, create groups and request transport."
                : "Register to start posting and planning journeys."}
            </p>
          </header>

          {!isLogin && (
            <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-[#FFF1E8] p-1">
              {[
                ["user", "Traveller"],
                ["driver", "Cab Driver"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  className={`min-h-11 rounded-lg text-sm font-bold transition ${
                    role === value
                      ? "bg-[#E53935] text-white shadow-sm"
                      : "text-[#65151B]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label htmlFor="name" className={labelClass}>
                  Full Name
                </label>
                <input
                  id="name"
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  className={inputClass}
                  placeholder="Enter your name"
                  required
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => updateForm("email", event.target.value)}
                className={inputClass}
                placeholder="you@example.com"
                required
              />
            </div>
            {!isLogin && (
              <div>
                <label htmlFor="phone" className={labelClass}>
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(event) => updateForm("phone", event.target.value)}
                  className={inputClass}
                  placeholder="Optional for now"
                />
              </div>
            )}
            <div>
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) => updateForm("password", event.target.value)}
                className={inputClass}
                placeholder="Enter your password"
                required
              />
            </div>
            {!isLogin && role === "driver" && (
              <div className="space-y-5 rounded-2xl border border-[#F3C5B6] bg-[#FFF1E8] p-4">
                <p className="text-sm leading-relaxed text-[#65151B]">
                  Cab driver verification is handled offline for now. Enter the
                  ID and password provided by YatriVahan to continue.
                </p>
                <div>
                  <label htmlFor="verificationId" className={labelClass}>
                    Offline Verification ID
                  </label>
                  <input
                    id="verificationId"
                    value={form.verificationId}
                    onChange={(event) =>
                      updateForm("verificationId", event.target.value)
                    }
                    className={inputClass}
                    placeholder="Verification ID"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="verificationPassword" className={labelClass}>
                    Verification Password
                  </label>
                  <input
                    id="verificationPassword"
                    type="password"
                    value={form.verificationPassword}
                    onChange={(event) =>
                      updateForm("verificationPassword", event.target.value)
                    }
                    className={inputClass}
                    placeholder="Verification password"
                    required
                  />
                </div>
              </div>
            )}

            {error && (
              <p role="alert" className="rounded-xl bg-[#FDECEA] px-4 py-3 text-sm font-semibold text-[#B3261E]">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="min-h-12 w-full rounded-xl bg-[#E53935] px-5 text-sm font-bold text-white shadow-md transition hover:brightness-110"
            >
              {isLogin ? "Log In" : "Register"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#665B59]">
            {isLogin ? "New to YatriVahan?" : "Already have an account?"}{" "}
            <Link
              to={isLogin ? `/register?returnTo=${encodeURIComponent(returnTo)}` : `/login?returnTo=${encodeURIComponent(returnTo)}`}
              className="font-bold text-[#E53935] hover:underline"
            >
              {isLogin ? "Register here" : "Log in"}
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AuthPage;
