import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Home from "./pages/Home";
import Buddies from "./pages/Buddies";
import Messages from "./pages/Messages";
import Community from "./pages/Community";
import Profile from "./pages/Profile";
import Onboarding from "./pages/Onboarding";
import Game from "./pages/Game";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/buddies" element={<Buddies />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/community" element={<Community />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        
        {/* Fullscreen/Special routes outside the main layout */}
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/game" element={<Game />} />
      </Routes>
    </BrowserRouter>
  );
}
