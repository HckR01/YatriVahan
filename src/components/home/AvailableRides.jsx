const rides = [
  {
    badge: "Verified Rider",
    badgeStyle: "bg-[#E6F5EB] text-[#2E9B58]",
    route: "Astarang → Bhubaneswar",
    timing: "Tomorrow • Morning",
    price: "₹300 / seat",
    seats: "2 seats left",
  },
  {
    badge: "Empty Return Ride",
    badgeStyle: "bg-[#FFF1E8] text-[#8F3A24]",
    route: "Bhubaneswar → Astarang",
    timing: "Today • 5:00 PM",
    price: "₹250 / seat",
    seats: "3 seats left",
  },
];

const AvailableRides = () => {
  return (
    <section id="find-ride" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#E53935]">
            Explore the Route
          </p>

          <h2 className="text-2xl font-bold text-[#171414]">Available Rides</h2>
        </div>

        <span className="rounded-full bg-[#FFF1E8] px-3 py-2 text-[13px] text-[#65151B]">
          Sample rides
        </span>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {rides.map((ride) => (
          <article
            key={ride.route}
            className="relative overflow-hidden rounded-2xl border border-[#EFDED9] bg-white p-6
                       shadow-[0_18px_44px_rgba(59,13,18,0.08)]"
          >
            {/* Top gradient line */}
            <div className="absolute left-0 top-0 h-1 w-full bg-[linear-gradient(90deg,#E53935,#FF8A3D)]" />

            <span
              className={`inline-flex rounded-full px-3 py-1 text-[13px] ${ride.badgeStyle}`}
            >
              {ride.badge}
            </span>

            <h3 className="mt-6 text-[22px] font-bold text-[#171414]">
              {ride.route}
            </h3>

            <p className="mt-2 text-[16px] text-[#665B59]">{ride.timing}</p>

            {/* Route divider */}
            <div className="my-5 h-[2px] bg-[repeating-linear-gradient(90deg,#F0C5B8_0_12px,transparent_12px_21px)]" />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[21px] font-extrabold text-[#E53935]">
                  {ride.price}
                </p>

                <p className="mt-1 text-[14px] text-[#665B59]">{ride.seats}</p>
              </div>

              <button
                type="button"
                className="rounded-xl bg-[#E53935] px-5 py-3 text-[16px] font-bold text-white transition hover:brightness-110"
              >
                View Ride
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default AvailableRides;
