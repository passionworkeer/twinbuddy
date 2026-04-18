import { NavLink } from 'react-router-dom';

export default function BottomNav() {
  return (
    <div className="md:hidden">
      <nav className="fixed bottom-0 w-full z-50 bg-black pt-3 pb-safe">
        <div className="flex justify-between items-center px-6 pb-2 text-[15px] font-medium text-white/70">
          <NavLink
            to="/feed"
            end
            className={({ isActive }) => `flex flex-col items-center justify-center font-bold w-12 ${isActive ? 'text-white' : 'hover:text-white transition-colors'}`}
          >
            首页
          </NavLink>
          <button className="flex flex-col items-center justify-center hover:text-white transition-colors w-12">
            朋友
          </button>
          
          {/* Prominent Center Add Button */}
          <button className="flex items-center justify-center px-4 py-1.5 border-[2px] border-white rounded-[14px] bg-black text-white hover:bg-white/10 transition-colors mx-2">
            <span className="material-symbols-outlined text-[20px] font-bold">add</span>
          </button>
          
          <button className="flex flex-col items-center justify-center hover:text-white transition-colors w-12">
            消息
          </button>
          <button className="flex flex-col items-center justify-center hover:text-white transition-colors w-12">
            我
          </button>
        </div>
        {/* Safe area padding for newer iPhones */}
        <div className="h-6 w-full bg-black"></div>
      </nav>
    </div>
  );
}
