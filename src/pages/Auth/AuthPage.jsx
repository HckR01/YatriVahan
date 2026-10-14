import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { CarFront, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { Field, Notice } from "../../components/ui/Page";
const titles = {
  login: "Welcome back",
  register: "Create your account",
  verify: "Verify your email",
  forgot: "Forgot your password?",
  reset: "Set a new password",
};
export default function AuthPage({ mode = "login" }) {
  const { user, signIn, signUp, isDemoMode } = useAuth(),
    navigate = useNavigate(),
    [params] = useSearchParams();
  const [form, setForm] = useState({
      fullName: "",
      email: params.get("email") || "",
      password: "",
      confirm: "",
      token: "",
    }),
    [show, setShow] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const requested = params.get("returnTo"),
    returnTo =
      requested?.startsWith("/") &&
      !requested.startsWith("//") &&
      !requested.includes("\\")
        ? requested
        : "/dashboard";
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  if (user && ["login", "register"].includes(mode))
    return <Navigate to={returnTo} replace />;
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setNotice("");
    if (["register", "reset"].includes(mode) && form.password !== form.confirm)
      return setError("Passwords do not match.");
    setBusy(true);
    try {
      if (mode === "login") {
        await signIn(form.email, form.password);
        navigate(returnTo, { replace: true });
      } else if (mode === "register") {
        await signUp({
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          role: "both",
          phone: "",
        });
        navigate(
          isDemoMode
            ? returnTo
            : `/verify-email?email=${encodeURIComponent(form.email)}`,
        );
      } else {
        if (!supabase)
          throw new Error(
            "Email verification and password recovery are unavailable in demo mode.",
          );
        let result;
        if (mode === "forgot") {
          result = await supabase.auth.resetPasswordForEmail(form.email, {
            redirectTo: `${window.location.origin}/reset-password`,
          });
          if (result.error) throw result.error;
          setNotice(
            "If an account exists, check your email for a password reset link or code.",
          );
        }
        if (mode === "verify") {
          result = await supabase.auth.verifyOtp({
            email: form.email,
            token: form.token,
            type: "signup",
          });
          if (result.error) throw result.error;
          navigate("/dashboard");
        }
        if (mode === "reset") {
          if (!user) {
            result = await supabase.auth.verifyOtp({
              email: form.email,
              token: form.token,
              type: "recovery",
            });
            if (result.error) throw result.error;
          }
          result = await supabase.auth.updateUser({ password: form.password });
          if (result.error) throw result.error;
          setNotice("Password updated. You can now open your dashboard.");
        }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const passwords = ["login", "register", "reset"].includes(mode);
  return (
    <div className="auth-page">
      <header className="auth-header">
        <Link to="/" className="brand">
          <CarFront size={33} />
          <span>
            Yatri<span>Vahan</span>
          </span>
        </Link>
        <Link className="text-button" to="/login">
          Back to sign in
        </Link>
      </header>
      <main className="auth-layout">
        <section className="auth-art">
          <div>
            <h2>
              Travel Together.
              <br />
              <span>Go Further.</span>
            </h2>
            <p>One account for every journey.</p>
          </div>
        </section>
        <section className="auth-form">
          <h1>{titles[mode]}</h1>
          <p className="muted">
            {mode === "verify"
              ? "Use the verification code in your email, or follow the confirmation link."
              : mode === "forgot"
                ? "Enter your email to receive a reset link or code."
                : mode === "register"
                  ? "Join and offer rides with the same account."
                  : "Your next journey starts here."}
          </p>
          <Notice error>{error}</Notice>
          <Notice>{notice}</Notice>
          <form className="stack" onSubmit={submit}>
            {mode === "register" && (
              <Field label="Full name">
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                />
              </Field>
            )}
            {!(mode === "reset" && user) && (
              <Field label="Email">
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
            )}
            {(mode === "verify" || (mode === "reset" && !user)) && (
              <Field label="Email verification code">
                <input
                  className="otp-input"
                  inputMode="numeric"
                  pattern="[0-9]{6,10}"
                  autoComplete="one-time-code"
                  maxLength={10}
                  required
                  value={form.token}
                  onChange={(e) =>
                    set("token", e.target.value.replace(/\D/g, ""))
                  }
                />
              </Field>
            )}
            {passwords && (
              <Field label={mode === "reset" ? "New password" : "Password"}>
                <div className="password-field">
                  <input
                    type={show ? "text" : "password"}
                    required
                    minLength={mode === "login" ? 1 : 8}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                  />
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setShow(!show)}
                    aria-label={show ? "Hide password" : "Show password"}
                  >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </Field>
            )}
            {["register", "reset"].includes(mode) && (
              <Field label="Confirm password">
                <input
                  type={show ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={(e) => set("confirm", e.target.value)}
                />
              </Field>
            )}
            {mode === "login" && (
              <Link className="text-button align-right" to="/forgot-password">
                Forgot password?
              </Link>
            )}
            <button className="button full" disabled={busy}>
              {busy
                ? "Please wait…"
                : {
                    login: "Sign in",
                    register: "Create account",
                    verify: "Verify email",
                    forgot: "Send reset email",
                    reset: "Reset password",
                  }[mode]}
            </button>
          </form>
          {mode === "verify" && (
            <button
              className="text-button"
              disabled={busy}
              onClick={async () => {
                if (!supabase) return setError("Email service is unavailable.");
                setBusy(true);
                try {
                  const { error } = await supabase.auth.resend({
                    type: "signup",
                    email: form.email,
                  });
                  if (error) throw error;
                  setNotice("Verification email sent.");
                } catch (e) {
                  setError(e.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Resend verification email
            </button>
          )}
          {mode === "login" && (
            <p>
              New to YatriVahan? <Link to="/signup">Create an account</Link>
            </p>
          )}
          {mode === "register" && (
            <p>
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          )}
          {mode === "reset" && notice && (
            <Link className="text-button" to="/dashboard">
              Open dashboard →
            </Link>
          )}
        </section>
      </main>
    </div>
  );
}
