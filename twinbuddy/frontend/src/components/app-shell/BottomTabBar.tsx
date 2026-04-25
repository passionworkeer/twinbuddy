import { Home, MessageCircle, Sparkles, UserRound, UsersRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/home', label: 'AI助手', icon: Sparkles },
  { to: '/buddies', label: '搭子动态', icon: UsersRound },
  { to: '/community', label: '社区', icon: Home },
  { to: '/messages', label: '私信', icon: MessageCircle },
  { to: '/profile', label: '我的', icon: UserRound },
];

export default function BottomTabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/8 bg-[rgba(12,15,29,0.84)] px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.7rem)] pt-3 backdrop-blur-2xl">
      <div className="mx-auto grid max-w-5xl grid-cols-5 gap-2">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] transition ${
                isActive
                  ? 'bg-[rgba(255,179,182,0.12)] text-[var(--color-primary)] shadow-[0_0_24px_rgba(255,179,182,0.12)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-white/5 hover:text-white'
              }`
            }
            to={to}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
