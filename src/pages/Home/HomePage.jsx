import { ArrowRight, CarFront, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
const actions = [
  [
    "Join a Ride",
    "Post your travel request and connect with a matching ride.",
    "/join-ride",
    UsersRound,
    "Post a travel request",
  ],
  [
    "Offer a Ride",
    "Share your available seats and your journey.",
    "/offer-ride",
    CarFront,
    "Offer a ride",
  ],
  [
    "Book Full Car",
    "Keep the whole car for your journey together.",
    "/book-car",
    CarFront,
    "Book full car",
  ],
];
export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="home-page">
        <section className="home-hero">
          <div>
            <p className="eyebrow">YOUR JOURNEY. GOOD COMPANY.</p>
            <h1>
              Travel Together.
              <br />
              <span>Go Further.</span>
            </h1>
            <p>Share your journey across Odisha.</p>
          </div>
        </section>
        <section className="home-actions" aria-label="Plan your journey">
          {actions.map(([title, copy, to, Icon, cta]) => (
            <article className="card action-card" key={to}>
              <span className="feature-icon">
                <Icon size={30} />
              </span>
              <h2>{title}</h2>
              <p>{copy}</p>
              <Link className="button" to={to}>
                {cta}
                <ArrowRight size={18} />
              </Link>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}
