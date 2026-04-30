import { Home, MessageCircle, UserRound, UsersRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/home', label: '对话', icon: Home },
  { to: '/buddies', label: '搭子', icon: UsersRound },
  { to: '/community', label: '社区', icon: Home },
  { to: '/messages', label: '私信', icon: MessageCircle },
  { to: '/profile', label: '我的', icon: UserRound },
];

export default function BottomTabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/8 bg-black px-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.6rem)] pt-2">
      <div className="mx-auto flex max-w-5xl items-stretch justify-between">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 gap-0.5 px-1 py-2 text-[10px] leading-none transition ${
                isActive
                  ? 'text-[var(--color-primary)] font-bold'
                  : 'text-[var(--color-text-secondary)] hover:bg-white/5 hover:text-white'
              }`
            }
            to={to}
          >
            <Icon className="h-[22px] w-[22px]" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
