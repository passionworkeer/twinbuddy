import type { PropsWithChildren } from 'react';
import { useLocation } from 'react-router-dom';
import BottomTabBar from './BottomTabBar';
import { useRouteScrollMemory } from '../../hooks/useRouteScrollMemory';

export default function AppShell({ children }: PropsWithChildren) {
  const location = useLocation();
  useRouteScrollMemory(location.pathname);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_50%_0%,rgba(74,222,128,0.1),transparent_70%)]" />
        <div className="absolute right-[-4rem] top-20 h-56 w-56 rounded-full bg-[rgba(74,222,128,0.06)] blur-3xl" />
        <div className="absolute bottom-24 left-[-3rem] h-48 w-48 rounded-full bg-[rgba(34,197,94,0.05)] blur-3xl" />
      </div>

      <header className="relative z-10 shrink-0 border-b border-white/6 bg-[rgba(11,28,21,0.62)] px-5 pb-4 pt-5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-text-secondary)]">
              TwinBuddy
            </p>
            <h1 className="mt-1 text-xl font-semibold text-white">旅行搭子</h1>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto min-h-0 w-full max-w-5xl flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom,0px)+7rem)] pt-5 sm:px-5">
        {children}
      </main>

      <BottomTabBar />
    </div>
  );
}
