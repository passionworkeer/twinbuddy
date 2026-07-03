import { Link } from 'react-router-dom';

export function TopNav() {
  return (
    <header className="fixed top-0 w-full border-b-2 border-black dark:border-white shadow-none bg-white/80 dark:bg-black/80 backdrop-blur-xl flex justify-between items-center px-6 h-16 z-50 md:hidden">
      <button className="hover:opacity-80 transition-opacity active:scale-95 duration-200">
        <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400">explore</span>
      </button>
      <Link to="/" className="font-h1 font-bold tracking-tighter uppercase text-2xl text-black dark:text-white">
        TWINBUDDY
      </Link>
      <button className="hover:opacity-80 transition-opacity active:scale-95 duration-200">
        <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400">notifications</span>
      </button>
    </header>
  );
}
