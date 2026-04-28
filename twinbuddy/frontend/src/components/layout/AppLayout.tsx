import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';

export function AppLayout() {
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <TopNav />
      <main className="flex-1 w-full max-w-3xl mx-auto h-[calc(100vh-64px-77px)] overflow-y-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}