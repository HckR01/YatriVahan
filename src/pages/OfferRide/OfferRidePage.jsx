import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/layout/Footer";
import Navbar from "../../components/layout/Navbar";
import { getCurrentUser, getLoginPath } from "../../utils/auth";

const initialRide = {
  from: "",
  to: "",
  date: "",
  departureTime: "",
  seats: 1,
  pricePerSeat: "",
  pickupPoint: "",
  vehicle: "",
  returnAvailable: false,
  returnTime: "",
  notes: "",
};

const OfferRidePage = () => {
  const [ride, setRide] = useState(initialRide);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const updateRide = (field, value) => {
    setRide((currentRide) => ({ ...currentRide, [field]: value }));
    setSubmitted(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const requiredFields = [
      "from",
      "to",
      "date",
      "departureTime",
      "seats",
      "pricePerSeat",
      "pickupPoint",
    ];

    if (
      requiredFields.some(
        (field) => ride[field] === "" || ride[field] === null,
      )
    ) {
      return;
    }
    if (!getCurrentUser()) {
      navigate(getLoginPath("/offer-ride"));
      return;
    }

    const rideToPost = {
      ...ride,
      seats: Number(ride.seats),
      returnTime: ride.returnAvailable ? ride.returnTime : "",
    };

    console.log("Ride posted:", rideToPost);
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
            Share the journey
          </p>
          <h1 className="font-serif text-4xl leading-tight text-[#65151B] sm:text-5xl">
            Offer a Ride
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#665B59] sm:text-lg">
            Share your empty seats with travellers going your way.
          </p>
        </header>

        <div className="mb-7 rounded-2xl border border-[#F3C5B6] bg-[#FFF1E8] px-5 py-4 text-sm leading-relaxed text-[#65151B] sm:px-6">
          You decide the route, pickup point and seat price. Passengers can
          find your ride and send a request.
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-[#EFDED9] bg-white p-5 shadow-[0_18px_44px_rgba(59,13,18,0.08)] sm:p-8"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="from" className={labelClass}>
                From
              </label>
              <input
                id="from"
                value={ride.from}
                onChange={(event) => updateRide("from", event.target.value)}
                className={inputClass}
                placeholder="Enter starting location"
                required
              />
            </div>

            <div>
              <label htmlFor="to" className={labelClass}>
                To
              </label>
              <input
                id="to"
                value={ride.to}
                onChange={(event) => updateRide("to", event.target.value)}
                className={inputClass}
                placeholder="Enter destination"
                required
              />
            </div>

            <div>
              <label htmlFor="date" className={labelClass}>
                Date
              </label>
              <input
                id="date"
                type="date"
                value={ride.date}
                onChange={(event) => updateRide("date", event.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="departureTime" className={labelClass}>
                Departure Time
              </label>
              <input
                id="departureTime"
                type="time"
                value={ride.departureTime}
                onChange={(event) =>
                  updateRide("departureTime", event.target.value)
                }
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="seats" className={labelClass}>
                Available Seats
              </label>
              <input
                id="seats"
                type="number"
                min="1"
                max="20"
                value={ride.seats}
                onChange={(event) => updateRide("seats", event.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="pricePerSeat" className={labelClass}>
                Price Per Seat
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#665B59]">
                  ₹
                </span>
                <input
                  id="pricePerSeat"
                  type="number"
                  min="0"
                  value={ride.pricePerSeat}
                  onChange={(event) =>
                    updateRide("pricePerSeat", event.target.value)
                  }
                  className={`${inputClass} pl-9`}
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="pickupPoint" className={labelClass}>
                Pickup Point
              </label>
              <input
                id="pickupPoint"
                value={ride.pickupPoint}
                onChange={(event) =>
                  updateRide("pickupPoint", event.target.value)
                }
                className={inputClass}
                placeholder="Where should passengers meet you?"
                required
              />
            </div>

            <div>
              <label htmlFor="vehicle" className={labelClass}>
                Vehicle
              </label>
              <input
                id="vehicle"
                value={ride.vehicle}
                onChange={(event) => updateRide("vehicle", event.target.value)}
                className={inputClass}
                placeholder="e.g. Maruti Suzuki Swift"
              />
            </div>

            <fieldset>
              <legend className={labelClass}>Return Available?</legend>
              <div className="flex min-h-12 items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-[#665B59]">
                  <input
                    type="radio"
                    name="returnAvailable"
                    checked={ride.returnAvailable}
                    onChange={() => updateRide("returnAvailable", true)}
                    className="h-4 w-4 accent-[#E53935]"
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2 text-sm text-[#665B59]">
                  <input
                    type="radio"
                    name="returnAvailable"
                    checked={!ride.returnAvailable}
                    onChange={() => {
                      updateRide("returnAvailable", false);
                      updateRide("returnTime", "");
                    }}
                    className="h-4 w-4 accent-[#E53935]"
                  />
                  No
                </label>
              </div>
            </fieldset>

            {ride.returnAvailable && (
              <div>
                <label htmlFor="returnTime" className={labelClass}>
                  Return Time
                </label>
                <input
                  id="returnTime"
                  type="time"
                  value={ride.returnTime}
                  onChange={(event) =>
                    updateRide("returnTime", event.target.value)
                  }
                  className={inputClass}
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label htmlFor="notes" className={labelClass}>
                Notes / Additional Information
              </label>
              <textarea
                id="notes"
                rows="4"
                value={ride.notes}
                onChange={(event) => updateRide("notes", event.target.value)}
                className={`${inputClass} py-3`}
                placeholder="Add any details passengers should know"
              />
            </div>
          </div>

          <div className="mt-7 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
            <button
              type="submit"
              className="min-h-13 rounded-xl bg-[#E53935] px-7 text-base font-bold text-white shadow-md transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-[#E53935]/20"
            >
              Post Ride
            </button>
            {submitted && (
              <p role="status" className="font-semibold text-[#2E7D32]">
                Ride posted successfully.
              </p>
            )}
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
};

export default OfferRidePage;
