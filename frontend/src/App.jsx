import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SessionProvider } from "./context/session.jsx";
import { RequireAuth } from "./components/route-guards.jsx";
import { AppLayout } from "./layouts/AppLayout.jsx";
import { AuthLayout } from "./layouts/AuthLayout.jsx";
import { DestinationDetailPage } from "./pages/DestinationDetailPage.jsx";
import { ExplorePage } from "./pages/ExplorePage.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { JourneyDetailPage } from "./pages/JourneyDetailPage.jsx";
import { JourneyEditPage } from "./pages/JourneyEditPage.jsx";
import { JourneyNewPage } from "./pages/JourneyNewPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { MapPage } from "./pages/MapPage.jsx";
import { MyJourneysPage } from "./pages/MyJourneysPage.jsx";
import { NotFoundPage } from "./pages/NotFoundPage.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";
import { SavedPage } from "./pages/SavedPage.jsx";
import { SettingsPage } from "./pages/SettingsPage.jsx";
import { SignupPage } from "./pages/SignupPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/saved" element={<RequireAuth><SavedPage /></RequireAuth>} />
            <Route path="/journeys/new" element={<RequireAuth><JourneyNewPage /></RequireAuth>} />
            <Route path="/journeys/mine" element={<RequireAuth><MyJourneysPage /></RequireAuth>} />
            <Route path="/journeys/:id" element={<JourneyDetailPage />} />
            <Route path="/journeys/:id/edit" element={<RequireAuth><JourneyEditPage /></RequireAuth>} />
            <Route path="/destinations/:slug" element={<DestinationDetailPage />} />
            <Route path="/profile/:handle" element={<ProfilePage />} />
            <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  );
}
