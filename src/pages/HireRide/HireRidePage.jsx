import { useState } from "react";
import { CarFront, CheckCircle2, UsersRound } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Footer from "../../components/layout/Footer";
import Navbar from "../../components/layout/Navbar";
import { getCurrentUser, getLoginPath } from "../../utils/auth";

const emptyRequest = {
  from: "",
  to: "",
  date: "",
  time: "",
  passengers: 1,
  pickupPoint: "",
  returnNeeded: false,
  returnTime: "",
  budget: "",
  notes: "",
};

const preferredTimeDefaults = {
  Morning: "07:00",
  "Early Morning": "06:00",
  Afternoon: "13:00",
  Evening: "18:00",
  "Any Time": "",
};

const HireRidePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const group = location.state?.group;
  const [bookingType, setBookingType] = useState(
    location.state?.bookingType || "driver",
  );
  const [request, setRequest] = useState({
    ...emptyRequest,
    ...(group
      ? {
          from: group.from || "",
          to: group.destination || "",
          date: group.travelDate || "",
          time: preferredTimeDefaults[group.preferredTime] || "",
          passengers: group.members || 1,
          notes: `Group of ${group.members || 1} travelling together`,
        }
      : {}),
  });
  const [submitted, setSubmitted] = useState(false);

  const updateRequest = (field, value) => {
    setRequest((currentRequest) => ({ ...currentRequest, [field]: value }));
    setSubmitted(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const requiredFields = [
      "from",
      "to",
      "date",
      "time",
      "passengers",
      "pickupPoint",
    ];

    if (
      requiredFields.some(
        (field) => request[field] === "" || request[field] === null,
      )
    ) {
      return;
    }
    if (!getCurrentUser()) {
      navigate(getLoginPath("/hire-ride"));
      return;
    }

    const rideRequest = {
      id: Date.now(),
      bookingType,
      ...request,
      passengers: Number(request.passengers),
      budget: request.budget === "" ? "" : Number(request.budget),
      returnTime: request.returnNeeded ? request.returnTime : "",
      status: "open",
    };

    console.log("Transport request posted:", rideRequest);
    setSubmitted(true);
  };

  const inputClass =
    "min-h-12 w-full rounded-[13px] border border-[#EFDED9] bg-white px-4 text-[#171414] outline-none transition placeholder:text-[#9A8D89] focus:border-[#E53935] focus:ring-4 focus:ring-[#E53935]/10";
  const labelClass = "mb-2 block text-sm font-bold text-[#171414]";

  return (
    <div className="min-h-screen bg-[#FFF9F3]">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 md:py-16">
        <header className="mb-8 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#E53935]">
            Your journey, your choice
          </p>
          <h1 className="font-serif text-4xl leading-tight text-[#65151B] sm:text-5xl">
            Hire a Ride
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#665B59] sm:text-lg">
            Tell drivers where you want to go and find the right vehicle for
            your journey.
          </p>
        </header>

        <div className="mb-7 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setBookingType("driver")}
            className={`rounded-2xl border p-5 text-left transition ${
              bookingType === "driver"
                ? "border-[#E53935] bg-[#E53935] text-white shadow-md"
                : "border-[#EFDED9] bg-[#FFF1E8] text-[#65151B]"
            }`}
          >
            <UsersRound size={24} />
            <strong className="mt-3 block text-lg">Hire Rider / Driver</strong>
            <span
              className={`mt-1 block text-sm ${
                bookingType === "driver" ? "text-white/85" : "text-[#665B59]"
              }`}
            >
              Ask available drivers to respond to your journey request.
            </span>
          </button>
          <button
            type="button"
            onClick={() => setBookingType("full-cab")}
            className={`rounded-2xl border p-5 text-left transition ${
              bookingType === "full-cab"
                ? "border-[#E53935] bg-[#E53935] text-white shadow-md"
                : "border-[#EFDED9] bg-[#FFF1E8] text-[#65151B]"
            }`}
          >
            <CarFront size={24} />
            <strong className="mt-3 block text-lg">Book Full Cab</strong>
            <span
              className={`mt-1 block text-sm ${
                bookingType === "full-cab"
                  ? "text-white/85"
                  : "text-[#665B59]"
              }`}
            >
              Request an entire cab for your group or personal journey.
            </span>
          </button>
        </div>

        {group && (
          <div className="mb-7 rounded-2xl border border-[#F3C5B6] bg-[#FFF1E8] px-5 py-4 text-sm text-[#65151B]">
            This request is prefilled from <strong>{group.name}</strong>.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-[#EFDED9] bg-white p-5 shadow-[0_18px_44px_rgba(59,13,18,0.08)] sm:p-8"
        >
          <div className="grid gap-5 md:grid-cols-2">
            {[
              ["from", "From", "Starting location"],
              ["to", "To", "Destination"],
              ["pickupPoint", "Pickup Point", "Where should the driver meet you?"],
            ].map(([field, label, placeholder]) => (
              <div key={field}>
                <label htmlFor={field} className={labelClass}>
                  {label}
                </label>
                <input
                  id={field}
                  value={request[field]}
                  onChange={(event) => updateRequest(field, event.target.value)}
                  className={inputClass}
                  placeholder={placeholder}
                  required
                />
              </div>
            ))}

            <div>
              <label htmlFor="date" className={labelClass}>
                Travel Date
              </label>
              <input
                id="date"
                type="date"
                value={request.date}
                onChange={(event) => updateRequest("date", event.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="time" className={labelClass}>
                Preferred Time
              </label>
              <input
                id="time"
                type="time"
                value={request.time}
                onChange={(event) => updateRequest("time", event.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="passengers" className={labelClass}>
                Number of Passengers
              </label>
              <input
                id="passengers"
                type="number"
                min="1"
                max="50"
                value={request.passengers}
                onChange={(event) =>
                  updateRequest("passengers", event.target.value)
                }
                className={inputClass}
                required
              />
            </div>
            <fieldset>
              <legend className={labelClass}>Return Needed?</legend>
              <div className="flex min-h-12 items-center gap-6">
                {[
                  [true, "Yes"],
                  [false, "No"],
                ].map(([value, label]) => (
                  <label
                    key={label}
                    className="flex items-center gap-2 text-sm text-[#665B59]"
                  >
                    <input
                      type="radio"
                      name="returnNeeded"
                      checked={request.returnNeeded === value}
                      onChange={() => {
                        updateRequest("returnNeeded", value);
                        if (!value) updateRequest("returnTime", "");
                      }}
                      className="h-4 w-4 accent-[#E53935]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            {request.returnNeeded && (
              <div>
                <label htmlFor="returnTime" className={labelClass}>
                  Return Time
                </label>
                <input
                  id="returnTime"
                  type="time"
                  value={request.returnTime}
                  onChange={(event) =>
                    updateRequest("returnTime", event.target.value)
                  }
                  className={inputClass}
                />
              </div>
            )}
            <div>
              <label htmlFor="budget" className={labelClass}>
                Budget
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#665B59]">
                  ₹
                </span>
                <input
                  id="budget"
                  type="number"
                  min="0"
                  value={request.budget}
                  onChange={(event) => updateRequest("budget", event.target.value)}
                  className={`${inputClass} pl-9`}
                  placeholder="Optional budget"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="notes" className={labelClass}>
                Notes / Special Requirements
              </label>
              <textarea
                id="notes"
                rows="4"
                value={request.notes}
                onChange={(event) => updateRequest("notes", event.target.value)}
                className={`${inputClass} py-3`}
                placeholder="Add luggage, accessibility or other details"
              />
            </div>
          </div>

          <div className="mt-7 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
            <button
              type="submit"
              className="min-h-13 rounded-xl bg-[#E53935] px-7 text-base font-bold text-white shadow-md transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-[#E53935]/20"
            >
              {bookingType === "driver"
                ? "Post Transport Request"
                : "Request Full Cab"}
            </button>
            {submitted && (
              <p role="status" className="flex items-center gap-2 font-semibold text-[#2E7D32]">
                <CheckCircle2 size={18} />
                Request posted successfully.
              </p>
            )}
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default HireRidePage;
