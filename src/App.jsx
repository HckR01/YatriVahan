import HomePage from "./pages/Home/HomePage";
import OfferRidePage from "./pages/OfferRide/OfferRidePage";
import FindRidePage from "./pages/FindRide/FindRidePage";
import BookFullCarPage from "./pages/BookFullCar/BookFullCarPage";
import GroupsPage from "./pages/Groups/GroupsPage";
import GroupDetailsPage from "./pages/Groups/GroupDetailsPage";
import HireRidePage from "./pages/HireRide/HireRidePage";
import AuthPage from "./pages/Auth/AuthPage";
import LoginPage from "./pages/Auth/LoginPage";
import UserProfilePage from "./pages/Profile/UserProfilePage";
import { Route, Routes } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/find-ride" element={<FindRidePage />} />
      <Route path="/book-full-car" element={<BookFullCarPage />} />
      <Route path="/offer-ride" element={<OfferRidePage />} />
      <Route path="/groups" element={<GroupsPage />} />
      <Route path="/groups/:groupId" element={<GroupDetailsPage />} />
      <Route path="/hire-ride" element={<HireRidePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/userprofile" element={<UserProfilePage />} />
    </Routes>
  );
}

export default App;
