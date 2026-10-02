import watermark from "../../assets/Mandala Wheel.png";
import mainImage from "../../assets/Mainpg_img.png";
import { useState } from "react";

const Hero = () => {
  const [dateType, setDateType] = useState("any");

  return (
    <section
      id="home"
      className="relative overflow-hidden bg-[linear-gradient(118deg,#3B0D12_0%,#65151B_68%,#792024_100%)]"
    >
      {/* Top accent line */}
      <div className="absolute left-0 top-0 h-1 w-full bg-[linear-gradient(90deg,#E53935,#FF8A3D_38%,transparent_75%)]" />

      {/* Decorative circle */}
      <div className="pointer-events-none absolute -right-30 -top-44 h-[520px] w-[520px] rounded-full border border-[#FF8A3D]/20 shadow-[0_0_0_64px_rgba(255,138,61,0.035),0_0_0_130px_rgba(255,138,61,0.025)]" />
      <img
        src={watermark}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-[-140px] top-1/2 z-0 w-[650px] -translate-y-1/2 opacity-10 select-none"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-5 pb-14 pt-12 sm:px-8 md:pt-20">
        <div className="grid items-center gap-9 lg:grid-cols-[1.08fr_.92fr] lg:gap-14">
          {/* Left content */}
          <div>
            <p className="inline-block rounded-full border border-[#FF8A3D]/45 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#FFD1AD]">
              Local Journeys, Better Together
            </p>

            <h1 className="mt-6 max-w-2xl font-serif text-4xl leading-[1.1] tracking-tight text-[#FFF9F3] sm:text-5xl md:text-[58px]">
              Travel Together. Pay Less.
            </h1>

            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-[#F9DDD5] sm:text-[19px]">
              Find shared rides, offer empty seats, or travel together with
              people going your way.
            </p>
          </div>

          {/* Right image */}
          <div className="relative">
            <div className="absolute -inset-x-3 -inset-y-3 translate-x-2 translate-y-2 rounded-[29px] border border-[#FF8A3D]/50" />

            <div className="relative overflow-hidden rounded-3xl">
              <img
                src={mainImage}
                alt="Odisha gaman by car"
                className="h-[220px] w-full object-cover shadow-2xl md:h-[335px]"
              />

              <span className="absolute bottom-4 left-4 rounded-xl bg-[#FFF9F3]/95 px-4 py-3 text-[13px] font-medium text-[#65151B] shadow-lg">
                On the road together
              </span>
            </div>
          </div>
        </div>

        {/* Search card */}
        <form
          className="mt-10 rounded-2xl border border-[#EFDED9] bg-white p-5 shadow-[0_18px_44px_rgba(59,13,18,0.08)] md:p-7"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_.85fr_.85fr_auto]">
            <div>
              <label className="mb-2 block text-base font-bold text-[#171414]">
                From
              </label>
              <input
                type="text"
                placeholder="Enter pickup location"
                className="min-h-[52px] w-full rounded-[13px] border border-[#E9D8D2] bg-white px-4 text-[#171414] outline-none transition focus:border-[#E53935] focus:ring-4 focus:ring-[#E53935]/15"
              />
            </div>

            <div>
              <label className="mb-2 block text-base font-bold text-[#171414]">
                To
              </label>
              <input
                type="text"
                placeholder="Enter destination"
                className="min-h-[52px] w-full rounded-[13px] border border-[#E9D8D2] bg-white px-4 text-[#171414] outline-none transition focus:border-[#E53935] focus:ring-4 focus:ring-[#E53935]/15"
              />
            </div>

            <div>
              <label className="mb-2 block text-base font-bold text-[#171414]">
                Date
              </label>
              <select
                value={dateType}
                onChange={(e) => setDateType(e.target.value)}
                className="min-h-[52px] w-full rounded-[13px] border border-[#E9D8D2] bg-white px-4 text-[#171414] outline-none focus:border-[#E53935]"
              >
                <option value="any">Any date</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="custom">Choose date</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-base font-bold text-[#171414]">
                Time
              </label>
              <select className="min-h-[52px] w-full rounded-[13px] border border-[#E9D8D2] bg-white px-4 text-[#171414] outline-none focus:border-[#E53935]">
                <option value="any">Any time</option>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
            </div>

            <button
              type="submit"
              className="min-h-[52px] whitespace-nowrap rounded-xl bg-[#E53935] px-6 text-base font-bold text-white shadow-md transition hover:brightness-110"
            >
              Find a Ride
            </button>
          </div>

          {dateType === "custom" && (
            <div className="mt-4">
              <label className="mb-2 block text-base font-bold text-[#171414]">
                Select date
              </label>
              <input
                type="date"
                className="min-h-[52px] w-full max-w-xs rounded-[13px] border border-[#E9D8D2] bg-white px-4 outline-none focus:border-[#E53935]"
              />
            </div>
          )}
        </form>
      </div>
    </section>
  );
};

export default Hero;
