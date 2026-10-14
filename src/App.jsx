import { Navigate, Route, Routes, useParams } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AuthPage from "./pages/Auth/AuthPage";
import HomePage from "./pages/Home/HomePage";
import FindRidePage from "./pages/FindRide/FindRidePage";
import JoinRidePage from "./pages/JoinRide/JoinRidePage";
import OfferRidePage from "./pages/OfferRide/OfferRidePage";
import BookFullCarPage from "./pages/BookFullCar/BookFullCarPage";
import DriverDashboard from "./pages/Rides/DriverDashboard";
import RequestsPage from "./pages/Requests/RequestsPage";
import RideDetailsPage from "./pages/Rides/RideDetailsPage";
import RideChatPage from "./pages/Chat/RideChatPage";
import UserProfilePage from "./pages/Profile/UserProfilePage";
import AdminPage from "./pages/Admin/AdminPage";
import NotFoundPage from "./pages/NotFound/NotFoundPage";
function LegacyRideRedirect() {
  const { rideId } = useParams();
  return <Navigate to={`/rides/${rideId}`} replace />;
}
const protectedPage = (element) => <ProtectedRoute>{element}</ProtectedRoute>;
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/signup" element={<AuthPage mode="register" />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/verify-email" element={<AuthPage mode="verify" />} />
      <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
      <Route path="/reset-password" element={<AuthPage mode="reset" />} />
      <Route path="/dashboard" element={protectedPage(<DriverDashboard />)} />
      <Route path="/join-ride" element={protectedPage(<JoinRidePage />)} />
      <Route path="/offer-ride" element={protectedPage(<OfferRidePage />)} />
      <Route path="/book-car" element={<BookFullCarPage />} />
      <Route path="/requests" element={protectedPage(<RequestsPage />)} />
      <Route path="/rides/:rideId" element={<RideDetailsPage />} />
      <Route
        path="/chat/ride/:rideId"
        element={protectedPage(<RideChatPage />)}
      />
      <Route path="/profile" element={protectedPage(<UserProfilePage />)} />
      <Route path="/find-ride" element={<FindRidePage />} />
      <Route path="/register" element={<Navigate to="/signup" replace />} />
      <Route
        path="/book-full-car"
        element={<Navigate to="/book-car" replace />}
      />
      <Route path="/driver" element={<Navigate to="/dashboard" replace />} />
      <Route path="/hire-ride" element={<Navigate to="/join-ride" replace />} />
      <Route
        path="/ride-request"
        element={<Navigate to="/join-ride" replace />}
      />
      <Route path="/userprofile" element={<Navigate to="/profile" replace />} />
      <Route path="/ride/:rideId" element={<LegacyRideRedirect />} />
      <Route path="/trips/:rideId" element={<LegacyRideRedirect />} />
      <Route path="/admine" element={<AdminPage />} />
      <Route path="/admin" element={<Navigate to="/admine" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
