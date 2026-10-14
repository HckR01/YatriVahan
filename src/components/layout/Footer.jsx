import { Link } from "react-router-dom";
export default function Footer() {
  return (
    <footer className="site-footer">
      <span>
        © {new Date().getFullYear()} YatriVahan · Travel together, go further.
      </span>
      <div>
        <Link to="/join-ride">Join a Ride</Link>
        <Link to="/offer-ride">Offer a Ride</Link>
      </div>
    </footer>
  );
}
