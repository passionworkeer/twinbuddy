import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import OnboardingPage from './pages/OnboardingPage';
import FeedPage from './pages/FeedPage';
import ResultPage from './pages/ResultPage';
import { useLocalStorage } from './hooks/useLocalStorage';
import { STORAGE_KEYS, type OnboardingData } from './types';

function HomeRedirect() {
  const [data] = useLocalStorage<OnboardingData>(STORAGE_KEYS.onboarding, {
    mbti: '', interests: [], voiceText: '', city: '', completed: false, timestamp: 0,
  });
  return <Navigate to={data.completed ? '/feed' : '/onboarding'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
