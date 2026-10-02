const steps = [
  "Search or post a ride",
  "Find travellers going your way",
  "Chat and decide the pickup point",
  "Travel together and save money",
];

const benefits = [
  "Save travel cost",
  "Earn from empty seats",
  "Find return passengers",
  "Connect with local travellers",
  "Book a full car when needed",
];

const HowItWorks = () => {
  return (
    <section className="bg-[#FFF1E8] py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <h2 className="mb-9 text-2xl font-bold text-[#171414]">
          How YatriVahan Works
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={step}
              className="rounded-2xl border border-[#EFDED9] bg-white p-6 shadow-[0_8px_25px_rgba(59,13,18,0.04)]"
            >
              <span className="font-bold text-[#E53935]">
                {String(index + 1).padStart(2, "0")}
              </span>

              <p className="mt-5 font-bold text-[#171414]">{step}</p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <h3 className="mb-6 text-xl font-bold text-[#171414]">
            More ways to move together
          </h3>

          <div className="flex flex-wrap gap-3">
            {benefits.map((item) => (
              <span
                key={item}
                className="rounded-xl border border-[#EFDED9] bg-white px-4 py-3 text-[15px] text-[#171414] shadow-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
