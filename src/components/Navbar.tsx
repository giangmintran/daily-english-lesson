import React from 'react';
import { BookOpen, CheckSquare, Upload, Moon, Sun, Flame, History, LayoutDashboard, LogOut } from 'lucide-react';

interface NavbarProps {
  currentTab: 'overview' | 'vocabulary' | 'exercises' | 'history';
  onSelectTab: (tab: 'overview' | 'vocabulary' | 'exercises' | 'history') => void;
  onOpenImport: () => void;
  vocabularyCount: number;
  exerciseCount: number;
  streak: number;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  currentDate: string;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenImport,
  vocabularyCount,
  exerciseCount,
  streak,
  isDarkMode,
  onToggleDarkMode,
  currentDate,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('overview')}>
          <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 font-semibold text-sm shadow-sm">
            En
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">Daily English</span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {currentDate}
              </span>
            </div>
          </div>
        </div>

        {/* Center Navigation Pills */}
        <nav className="hidden md:flex items-center space-x-1 bg-zinc-100/80 dark:bg-zinc-900/80 p-1 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 text-xs font-medium">
          <button
            onClick={() => onSelectTab('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              currentTab === 'overview'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <LayoutDashboard size={14} />
            <span>Tổng quan</span>
          </button>

          <button
            onClick={() => onSelectTab('vocabulary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              currentTab === 'vocabulary'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <BookOpen size={14} />
            <span>Từ mới</span>
            <span className="ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-700">
              {vocabularyCount}
            </span>
          </button>

          <button
            onClick={() => onSelectTab('exercises')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              currentTab === 'exercises'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <CheckSquare size={14} />
            <span>Bài tập</span>
            <span className="ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-700">
              {exerciseCount}
            </span>
          </button>

          <button
            onClick={() => onSelectTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              currentTab === 'history'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <History size={14} />
            <span>Lịch sử</span>
          </button>
        </nav>

        {/* Right Action Icons */}
        <div className="flex items-center space-x-2">
          {/* Streak Badge */}
          <div className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
            <Flame size={14} className="fill-amber-500 text-amber-500" />
            <span>{streak} ngày</span>
          </div>

          {/* Import JSON button */}
          <button
            onClick={onOpenImport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-xs cursor-pointer"
          >
            <Upload size={13} />
            <span className="hidden sm:inline">Import JSON</span>
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            title="Đổi giao diện sáng/tối"
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Logout / Lock button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              title="Khóa ứng dụng / Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-zinc-200 dark:border-zinc-800 py-2 bg-white dark:bg-zinc-950 text-xs">
        <button
          onClick={() => onSelectTab('overview')}
          className={`flex flex-col items-center gap-1 py-1 px-3 ${
            currentTab === 'overview' ? 'text-zinc-900 dark:text-zinc-100 font-semibold' : 'text-zinc-500'
          }`}
        >
          <LayoutDashboard size={16} />
          <span>Tổng quan</span>
        </button>

        <button
          onClick={() => onSelectTab('vocabulary')}
          className={`flex flex-col items-center gap-1 py-1 px-3 ${
            currentTab === 'vocabulary' ? 'text-zinc-900 dark:text-zinc-100 font-semibold' : 'text-zinc-500'
          }`}
        >
          <BookOpen size={16} />
          <span>Từ mới ({vocabularyCount})</span>
        </button>

        <button
          onClick={() => onSelectTab('exercises')}
          className={`flex flex-col items-center gap-1 py-1 px-3 ${
            currentTab === 'exercises' ? 'text-zinc-900 dark:text-zinc-100 font-semibold' : 'text-zinc-500'
          }`}
        >
          <CheckSquare size={16} />
          <span>Bài tập ({exerciseCount})</span>
        </button>

        <button
          onClick={() => onSelectTab('history')}
          className={`flex flex-col items-center gap-1 py-1 px-3 ${
            currentTab === 'history' ? 'text-zinc-900 dark:text-zinc-100 font-semibold' : 'text-zinc-500'
          }`}
        >
          <History size={16} />
          <span>Lịch sử</span>
        </button>
      </div>
    </header>
  );
};
