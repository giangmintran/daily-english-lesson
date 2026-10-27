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
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md transition-colors">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Brand / Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
            onClick={() => onSelectTab('overview')}
          >
            <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 font-bold text-xs shadow-xs">
              En
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
                Daily English
              </span>
              <span className="hidden sm:inline-block text-[11px] font-mono px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {currentDate}
              </span>
            </div>
          </div>

          {/* Center Navigation Pills (Desktop Only) */}
          <nav className="hidden md:flex items-center space-x-1 bg-zinc-100/80 dark:bg-zinc-900/80 p-1 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 text-xs font-medium">
            <button
              onClick={() => onSelectTab('overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
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
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Streak Badge */}
            <div className="flex items-center gap-1 text-xs px-2 sm:px-2.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
              <Flame size={13} className="fill-amber-500 text-amber-500" />
              <span className="font-mono text-xs">{streak}</span>
              <span className="hidden sm:inline">ngày</span>
            </div>

            {/* Import JSON button */}
            <button
              onClick={onOpenImport}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-xs cursor-pointer"
              title="Import bài học JSON"
            >
              <Upload size={13} />
              <span className="hidden sm:inline">Import JSON</span>
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-1.5 sm:p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              title="Đổi giao diện sáng/tối"
            >
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Logout / Lock button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 sm:p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                title="Khóa ứng dụng / Đăng xuất"
              >
                <LogOut size={15} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (Phone Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-800 pb-[max(0.25rem,env(safe-area-inset-bottom))] shadow-lg transition-colors">
        <div className="grid grid-cols-4 h-14">
          <button
            onClick={() => onSelectTab('overview')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-1 transition-colors cursor-pointer ${
              currentTab === 'overview'
                ? 'text-zinc-900 dark:text-zinc-100 font-semibold'
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${currentTab === 'overview' ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}>
              <LayoutDashboard size={18} />
            </div>
            <span className="text-[11px] leading-tight">Tổng quan</span>
          </button>

          <button
            onClick={() => onSelectTab('vocabulary')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-1 transition-colors cursor-pointer ${
              currentTab === 'vocabulary'
                ? 'text-zinc-900 dark:text-zinc-100 font-semibold'
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <div className={`p-1 rounded-xl relative transition-all ${currentTab === 'vocabulary' ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}>
              <BookOpen size={18} />
              {vocabularyCount > 0 && (
                <span className="absolute -top-1 -right-2 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-blue-600 text-white leading-none">
                  {vocabularyCount}
                </span>
              )}
            </div>
            <span className="text-[11px] leading-tight">Từ mới</span>
          </button>

          <button
            onClick={() => onSelectTab('exercises')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-1 transition-colors cursor-pointer ${
              currentTab === 'exercises'
                ? 'text-zinc-900 dark:text-zinc-100 font-semibold'
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <div className={`p-1 rounded-xl relative transition-all ${currentTab === 'exercises' ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}>
              <CheckSquare size={18} />
              {exerciseCount > 0 && (
                <span className="absolute -top-1 -right-2 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-600 text-white leading-none">
                  {exerciseCount}
                </span>
              )}
            </div>
            <span className="text-[11px] leading-tight">Bài tập</span>
          </button>

          <button
            onClick={() => onSelectTab('history')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-1 transition-colors cursor-pointer ${
              currentTab === 'history'
                ? 'text-zinc-900 dark:text-zinc-100 font-semibold'
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${currentTab === 'history' ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}>
              <History size={18} />
            </div>
            <span className="text-[11px] leading-tight">Lịch sử</span>
          </button>
        </div>
      </nav>
    </>
  );
};
