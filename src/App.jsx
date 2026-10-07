import { Navigate, Route, Routes, useParams } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AuthPage from "./pages/Auth/AuthPage";
import LoginPage from "./pages/Auth/LoginPage";
import BookFullCarPage from "./pages/BookFullCar/BookFullCarPage";
import FindRidePage from "./pages/FindRide/FindRidePage";
import GroupDetailsPage from "./pages/Groups/GroupDetailsPage";
import GroupsPage from "./pages/Groups/GroupsPage";
import HireRidePage from "./pages/HireRide/HireRidePage";
import HomePage from "./pages/Home/HomePage";
import OfferRidePage from "./pages/OfferRide/OfferRidePage";
import UserProfilePage from "./pages/Profile/UserProfilePage";
import RideDetailsPage from "./pages/Rides/RideDetailsPage";
import TripTrackingPage from "./pages/Rides/TripTrackingPage";
import SafetyPage from "./pages/Safety/SafetyPage";
import NotFoundPage from "./pages/NotFound/NotFoundPage";
import DriverDashboard from "./pages/Rides/DriverDashboard";

function LegacyRideRedirect() {
  const { rideId } = useParams();
  return <Navigate to={`/rides/${rideId}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/find-ride" element={<FindRidePage />} />
      <Route path="/book-full-car" element={<BookFullCarPage />} />
      <Route path="/rides/:rideId" element={<RideDetailsPage />} />
      <Route path="/ride/:rideId" element={<LegacyRideRedirect />} />
      <Route path="/groups" element={<GroupsPage />} />
      <Route path="/groups/:groupId" element={<GroupDetailsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/safety" element={<SafetyPage />} />
      <Route path="/offer-ride" element={<ProtectedRoute><OfferRidePage /></ProtectedRoute>} />
      <Route path="/driver" element={<ProtectedRoute><DriverDashboard /></ProtectedRoute>} />
      <Route path="/hire-ride" element={<ProtectedRoute><HireRidePage /></ProtectedRoute>} />
      <Route path="/ride-request" element={<Navigate to="/hire-ride" replace />} />
      <Route path="/profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
      <Route path="/userprofile" element={<Navigate to="/profile" replace />} />
      <Route path="/trips/:rideId" element={<ProtectedRoute><TripTrackingPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
