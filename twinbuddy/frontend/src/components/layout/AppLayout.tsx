import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';

export function AppLayout() {
  return (
    <div className="h-screen flex flex-col">
      <TopNav />
      {/* Pages need pt-16 for header, pb-[77px+padding] for bottom nav */}
      <main className="flex-1 w-full max-w-3xl mx-auto overflow-y-auto pb-[100px]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
