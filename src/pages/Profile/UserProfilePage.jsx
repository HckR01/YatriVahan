import { useEffect, useState } from "react";
import { CheckCircle2, LogOut, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/layout/Footer";
import Navbar from "../../components/layout/Navbar";
import { getCurrentUser, getLoginPath, logoutUser, saveUser } from "../../utils/auth";

const UserProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getCurrentUser());
  const [form, setForm] = useState(() => {
    const savedUser = getCurrentUser();
    return { name: savedUser?.name || "", phone: savedUser?.phone || "" };
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate(getLoginPath("/userprofile"), { replace: true });
    }
  }, [navigate, user]);

  if (!user) {
    return null;
  }

  const updateForm = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    setSaved(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      return;
    }

    const updatedUser = {
      ...user,
      name: form.name.trim(),
      phone: form.phone.trim(),
    };
    saveUser(updatedUser);
    setUser(updatedUser);
    setSaved(true);
  };

  const handleLogout = () => {
    logoutUser();
    navigate("/", { replace: true });
  };

  const inputClass =
    "min-h-12 w-full rounded-[13px] border border-[#EFDED9] bg-white px-4 text-[#171414] outline-none transition placeholder:text-[#9A8D89] focus:border-[#E53935] focus:ring-4 focus:ring-[#E53935]/10";
  const labelClass = "mb-2 block text-sm font-bold text-[#171414]";
  const roleLabel = user.role === "driver" ? "Cab Driver" : "Traveller";

  return (
    <div className="min-h-screen bg-[#FFF9F3]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-8 md:py-16">
        <div className="overflow-hidden rounded-3xl border border-[#EFDED9] bg-white shadow-[0_18px_44px_rgba(59,13,18,0.08)]">
          <div className="bg-[linear-gradient(118deg,#3B0D12_0%,#65151B_68%,#792024_100%)] px-5 py-8 text-white sm:px-8">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-[#FFF1E8] text-[#E53935]">
                <UserCircle size={48} />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#FFD1AD]">
                  My profile
                </p>
                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{user.name}</h1>
                <p className="mt-1 text-sm text-[#F9DDD5]">{roleLabel}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="profile-name" className={labelClass}>
                  Full Name
                </label>
                <input
                  id="profile-name"
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label htmlFor="profile-phone" className={labelClass}>
                  Phone Number
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(event) => updateForm("phone", event.target.value)}
                  className={inputClass}
                  placeholder="Add phone number"
                />
              </div>
              <div>
                <label htmlFor="profile-email" className={labelClass}>
                  Email
                </label>
                <input
                  id="profile-email"
                  value={user.email}
                  className={`${inputClass} bg-[#FFF9F3]`}
                  readOnly
                />
              </div>
              <div>
                <label htmlFor="profile-role" className={labelClass}>
                  Account Type
                </label>
                <input
                  id="profile-role"
                  value={roleLabel}
                  className={`${inputClass} bg-[#FFF9F3]`}
                  readOnly
                />
              </div>
            </div>

            {user.role === "driver" && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#F3C5B6] bg-[#FFF1E8] p-4 text-sm text-[#65151B]">
                <CheckCircle2 className="mt-0.5 shrink-0 text-[#2E7D32]" size={18} />
                <p>
                  Offline verification submitted. Your cab driver access will
                  be confirmed by the YatriVahan team.
                </p>
              </div>
            )}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="submit"
                className="min-h-12 rounded-xl bg-[#E53935] px-6 text-sm font-bold text-white transition hover:brightness-110"
              >
                Save Changes
              </button>
              {saved && (
                <p role="status" className="text-sm font-semibold text-[#2E7D32]">
                  Profile updated successfully.
                </p>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#E53935] px-6 text-sm font-bold text-[#E53935] transition hover:bg-[#FFF1E8] sm:ml-auto"
              >
                <LogOut size={17} />
                Log Out
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UserProfilePage;
