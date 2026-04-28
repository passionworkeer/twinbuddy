import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { useLocalStorage } from './hooks/useLocalStorage';
import HomePage from './pages/v2/HomePage';
import BuddiesPage from './pages/v2/BuddiesPage';
import BlindGamePage from './pages/v2/BlindGamePage';
import CommunityPage from './pages/v2/CommunityPage';
import MessagesPage from './pages/v2/MessagesPage';
import OnboardingV2Page from './pages/v2/OnboardingV2Page';
import ProfilePage from './pages/v2/ProfilePage';
import { V2_STORAGE_KEYS, type TwinBuddyV2OnboardingData } from './types';

function HomeRedirect() {
  const [data] = useLocalStorage<TwinBuddyV2OnboardingData>(V2_STORAGE_KEYS.onboarding, {
    mbti: '',
    travelRange: [],
    interests: [],
    budget: '',
    selfDescription: '',
    city: '',
    completed: false,
    timestamp: 0,
  });
  return <Navigate to={data.completed ? '/home' : '/onboarding'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/onboarding" element={<OnboardingV2Page />} />
        <Route path="/blind-game/:buddyId/:negotiationId" element={<BlindGamePage />} />
        <Route element={<AppLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/buddies" element={<BuddiesPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/messages" element={<MessagesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
