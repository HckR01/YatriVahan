import { Search, CarFront, UsersRound, CarTaxiFront } from "lucide-react";
import { useNavigate } from "react-router-dom";

import ActionCard from "../common/ActionCard";

const ActionSection = () => {
  const navigate = useNavigate();

  return (
    <section className="mx-auto max-w-7xl px-5 pt-16 sm:px-8">
      <h2 className="mb-7 text-2xl font-bold text-[#171414]">
        A better way to get there
      </h2>

      <div className="grid gap-5 md:grid-cols-3">
        <ActionCard
          icon={Search}
          title="Find a Ride"
          description="Search available shared rides."
          onClick={() => navigate("/find-ride")}
        />

        <ActionCard
          icon={CarFront}
          title="Offer a Ride"
          description="Share empty seats in your car."
          onClick={() => navigate("/offer-ride")}
        />

        <ActionCard
          icon={UsersRound}
          title="Make a Group"
          description="Find people travelling to the same destination."
          onClick={() => navigate("/groups")}
        />
      </div>

      {/* Full Car Booking */}
      <button
        type="button"
        onClick={() => navigate("/book-full-car")}
        className="mt-5 flex w-full items-center gap-4 rounded-2xl
                   border border-[#F3C5B6]
                   bg-[#FFF1E8]
                   p-5 text-left
                   transition hover:brightness-[0.98]"
      >
        <div className="grid h-[47px] w-[47px] shrink-0 place-items-center rounded-[15px] bg-white text-[#E53935]">
          <CarTaxiFront size={22} />
        </div>

        <div>
          <h3 className="text-[19px] font-bold text-[#171414]">
            Book Full Car
          </h3>

          <p className="mt-1 text-[16px] text-[#665B59]">
            Hire a complete cab for hospital, work, shopping or round trips.
          </p>
        </div>
      </button>
    </section>
  );
};

export default ActionSection;
