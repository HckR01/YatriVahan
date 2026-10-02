import { useState } from "react";
import {
  CarFront,
  CheckCircle2,
  MapPin,
  Star,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/layout/Footer";
import Navbar from "../../components/layout/Navbar";
import { getCurrentUser, getLoginPath } from "../../utils/auth";

const drivers = [
  {
    id: 1,
    name: "Rakesh Kumar",
    photo:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=500&q=80",
    vehicle: "Toyota Innova Crysta",
    location: "Bhubaneswar",
    seats: 6,
    price: 2200,
    rating: 4.9,
    trips: 128,
    available: true,
    verified: true,
    about: "Friendly local driver with a clean, comfortable car for family trips.",
    reviews: [
      { name: "Anita", text: "Very polite and punctual. The car was spotless.", rating: 5 },
      { name: "Suresh", text: "Great local knowledge and a safe driver.", rating: 5 },
    ],
  },
  {
    id: 2,
    name: "Meena Das",
    photo:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=500&q=80",
    vehicle: "Maruti Ertiga",
    location: "Puri",
    seats: 6,
    price: 1800,
    rating: 4.8,
    trips: 96,
    available: true,
    verified: true,
    about: "Experienced driver offering reliable full-car bookings around Puri.",
    reviews: [
      { name: "Deepak", text: "Smooth ride and excellent communication.", rating: 5 },
      { name: "Priya", text: "Arrived on time and helped with our luggage.", rating: 4 },
    ],
  },
  {
    id: 3,
    name: "Bikash Rout",
    photo:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80",
    vehicle: "Swift Dzire",
    location: "Astarang",
    seats: 4,
    price: 1400,
    rating: 4.7,
    trips: 74,
    available: false,
    verified: true,
    about: "Dependable driver for short trips, shopping and local appointments.",
    reviews: [
      { name: "Mohan", text: "Good service and a comfortable car.", rating: 5 },
    ],
  },
];

const Stars = ({ rating }) => (
  <span className="inline-flex items-center gap-1 font-bold text-[#B36B00]">
    <Star size={16} fill="currentColor" />
    {rating}
  </span>
);

const BookFullCarPage = () => {
  const [selectedDriver, setSelectedDriver] = useState(null);
  const navigate = useNavigate();

  const startBooking = (driverName) => {
    if (!getCurrentUser()) {
      navigate(getLoginPath("/book-full-car"));
      return;
    }
    window.alert(`Booking request started for ${driverName}.`);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F3]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8 md:py-16">
        <header className="mb-9 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#E53935]">
            Travel comfortably
          </p>
          <h1 className="font-serif text-4xl leading-tight text-[#65151B] sm:text-5xl">
            Book Full Car
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#665B59] sm:text-lg">
            Hire a complete car and driver for your next local journey.
          </p>
        </header>

        <div className="mb-8 rounded-2xl border border-[#F3C5B6] bg-[#FFF1E8] px-5 py-4 text-center text-sm text-[#65151B]">
          Choose an available driver, review their profile, and book a car for
          your group.
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {drivers.map((driver) => (
            <article
              key={driver.id}
              onClick={() => setSelectedDriver(driver)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  setSelectedDriver(driver);
                }
              }}
              role="button"
              tabIndex="0"
              className="group overflow-hidden rounded-2xl border border-[#EFDED9] bg-white text-left shadow-[0_14px_34px_rgba(59,13,18,0.07)] transition hover:-translate-y-1 hover:border-[#F3B4A7] hover:shadow-[0_20px_40px_rgba(101,21,27,0.12)]"
            >
              <div className="relative">
                <img
                  src={driver.photo}
                  alt={`${driver.name} profile`}
                  className="h-52 w-full object-cover"
                />
                <span
                  className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold ${
                    driver.available
                      ? "bg-[#E8F5E9] text-[#2E7D32]"
                      : "bg-white/90 text-[#665B59]"
                  }`}
                >
                  {driver.available ? "Available now" : "Currently booked"}
                </span>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-[#171414]">
                      {driver.name}
                    </h2>
                    <p className="mt-1 flex items-center gap-1 text-sm text-[#665B59]">
                      <MapPin size={15} />
                      {driver.location}
                    </p>
                  </div>
                  {driver.verified && (
                    <CheckCircle2
                      size={20}
                      className="shrink-0 text-[#2E7D32]"
                      aria-label="Verified driver"
                    />
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#665B59]">
                  <span className="flex items-center gap-1">
                    <CarFront size={16} className="text-[#E53935]" />
                    {driver.vehicle}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={16} className="text-[#E53935]" />
                    {driver.seats} seats
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#EFDED9] pt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Stars rating={driver.rating} />
                    <span className="text-[#665B59]">
                      ({driver.trips} trips)
                    </span>
                  </div>
                  <p className="text-right">
                    <strong className="text-lg text-[#E53935]">
                      ₹{driver.price}
                    </strong>
                    <span className="block text-xs text-[#665B59]">
                      full car
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!driver.available}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (driver.available) {
                      startBooking(driver.name);
                    }
                  }}
                  className="mt-5 min-h-11 w-full rounded-xl bg-[#E53935] px-5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-[#D9CECA]"
                >
                  {driver.available ? "Book Car" : "Unavailable"}
                </button>
                <p className="mt-3 text-center text-xs text-[#665B59]">
                  Tap the card to view reviews
                </p>
              </div>
            </article>
          ))}
        </div>
      </main>

      <Footer />

      {selectedDriver && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-[#3B0D12]/60 p-5"
          role="presentation"
          onClick={() => setSelectedDriver(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="driver-review-title"
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#E53935]">
                  Driver profile
                </p>
                <h2 id="driver-review-title" className="mt-1 text-2xl font-bold text-[#65151B]">
                  {selectedDriver.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDriver(null)}
                className="rounded-lg p-2 text-[#665B59] hover:bg-[#FFF1E8]"
                aria-label="Close driver reviews"
              >
                <X size={20} />
              </button>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#665B59]">
              {selectedDriver.about}
            </p>
            <div className="mt-5 flex items-center gap-3 border-y border-[#EFDED9] py-4">
              <Stars rating={selectedDriver.rating} />
              <span className="text-sm text-[#665B59]">
                Based on {selectedDriver.trips} completed trips
              </span>
            </div>
            <h3 className="mt-6 text-lg font-bold text-[#171414]">Reviews</h3>
            <div className="mt-3 space-y-3">
              {selectedDriver.reviews.map((review) => (
                <div key={review.name} className="rounded-xl bg-[#FFF9F3] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-sm text-[#171414]">{review.name}</strong>
                    <Stars rating={review.rating} />
                  </div>
                  <p className="mt-2 text-sm text-[#665B59]">{review.text}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={!selectedDriver.available}
              onClick={() => startBooking(selectedDriver.name)}
              className="mt-6 min-h-12 w-full rounded-xl bg-[#E53935] px-5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-[#D9CECA]"
            >
              {selectedDriver.available ? "Book Car" : "Currently Unavailable"}
            </button>
          </section>
        </div>
      )}
    </div>
  );
};

export default BookFullCarPage;
