import { Home, Search, MessageCircle, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function BottomNav() {
  return (
    <nav className="bottom-nav px-2">
      <NavLink
        to="/feed"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <Home className="w-5 h-5" />
        <span>首页</span>
      </NavLink>
      <button className="bottom-nav-item" aria-label="搜索">
        <Search className="w-5 h-5" />
        <span>搜索</span>
      </button>
      <button className="bottom-nav-item" aria-label="消息">
        <MessageCircle className="w-5 h-5" />
        <span>消息</span>
      </button>
      <button className="bottom-nav-item" aria-label="我的">
        <User className="w-5 h-5" />
        <span>我的</span>
      </button>
    </nav>
  );
}
