import Navbar from "../../components/layout/Navbar";
import Hero from "../../components/home/Hero";
import ActionSection from "../../components/home/ActionSection";
import AvailableRides from "../../components/home/AvailableRides";
import watermark from "../../assets/Mandala Wheel.png";
import HowItWorks from "../../components/home/HowItWorks";
import Footer from "../../components/layout/Footer";

const HomePage = () => {
  return (
    <>
      <Navbar />
      <Hero />
      {/* Shared watermark area * avelable ride and action section */}
      <main className="relative overflow-hidden bg-[#FFF9F3]">
        <img
          src={watermark}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 w-[900px] -translate-x-1/2 -translate-y-1/2 opacity-[0.08] select-none"
        />

        <div className="relative z-10">
          <ActionSection />
          <AvailableRides />
        </div>
      </main>
      <HowItWorks />
      <Footer />
    </>
  );
};

export default HomePage;
