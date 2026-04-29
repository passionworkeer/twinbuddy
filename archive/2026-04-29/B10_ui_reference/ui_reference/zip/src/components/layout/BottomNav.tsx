import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  filledIcon?: string;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/buddies', label: 'Buddies', icon: 'travel_explore' },
  { path: '/messages', label: 'Messages', icon: 'chat_bubble', filledIcon: 'chat_bubble' },
  { path: '/community', label: 'Community', icon: 'groups', filledIcon: 'groups' },
  { path: '/profile', label: 'Profile', icon: 'person' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 pb-safe border-t-2 border-black dark:border-white bg-white/90 dark:bg-black/90 backdrop-blur-xl shadow-[0_-8px_30px_rgba(0,0,0,0.04)] md:hidden">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
               "flex flex-col items-center justify-center transition-all active:scale-90 duration-150 px-4 py-2",
               isActive 
                ? "bg-indigo-600 text-white rounded-full ring-2 ring-black dark:ring-white hover:opacity-100"
                : "text-black dark:text-white opacity-60 hover:opacity-100"
            )}
          >
            <span className={cn("material-symbols-outlined mb-1", isActive && "fill")}>
               {item.icon}
            </span>
            <span className="font-h1 text-[10px] font-bold uppercase tracking-widest mt-1">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
