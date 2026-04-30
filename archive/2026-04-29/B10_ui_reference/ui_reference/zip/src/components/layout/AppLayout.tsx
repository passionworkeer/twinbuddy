import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col pt-16 pb-[120px]">
      <TopNav />
      <main className="flex-1 w-full max-w-3xl mx-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
