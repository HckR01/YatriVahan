import { Search, CarFront, UsersRound, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

import ActionCard from "../common/ActionCard";

const ActionSection = () => {
  const navigate = useNavigate();

  return (
    <section className="mx-auto max-w-7xl px-5 pt-20 sm:px-8 lg:pt-32">
      <p className="text-xs font-extrabold uppercase tracking-[.17em] text-[#e8462c]">Choose how you move</p>
      <h2 className="mb-7 mt-2 font-serif text-3xl text-[#52151d] sm:text-4xl">One platform, four easy ways to travel</h2>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
        <ActionCard icon={Zap} title="Ride Now" description="Request a nearby driver for an instant trip." onClick={() => navigate("/hire-ride")} />
      </div>
    </section>
  );
};

export default ActionSection;
