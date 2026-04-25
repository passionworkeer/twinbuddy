import type { PropsWithChildren } from 'react';
import { useLocation } from 'react-router-dom';
import BottomTabBar from './BottomTabBar';
import { useRouteScrollMemory } from '../../hooks/useRouteScrollMemory';

export default function AppShell({ children }: PropsWithChildren) {
  const location = useLocation();
  useRouteScrollMemory(location.pathname);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(255,179,182,0.22),transparent_68%)]" />
        <div className="absolute right-[-4rem] top-20 h-56 w-56 rounded-full bg-[rgba(175,255,251,0.08)] blur-3xl" />
        <div className="absolute bottom-12 left-[-3rem] h-48 w-48 rounded-full bg-[rgba(238,194,36,0.08)] blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-white/6 bg-[rgba(10,12,26,0.62)] px-5 pb-4 pt-5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-text-secondary)]">
              TwinBuddy V2
            </p>
            <h1 className="mt-1 text-xl font-semibold text-white">旅行搭子数字分身</h1>
          </div>
          <div className="rounded-full border border-[rgba(255,179,182,0.28)] bg-[rgba(255,179,182,0.08)] px-3 py-1 text-xs text-[var(--color-primary-light)]">
            {location.pathname === '/community' ? 'V2 Preview' : 'MVP Build'}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto h-[calc(100vh-5rem)] max-w-5xl overflow-y-auto px-4 pb-28 pt-5 sm:px-5">
        {children}
      </main>

      <BottomTabBar />
    </div>
  );
}
