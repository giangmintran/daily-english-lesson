import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { getSavedWords, subscribeSavedWords } from '../services/savedWordStorage';

interface SavedWordsButtonProps {
  onClick: () => void;
  isOpen?: boolean;
}

export const SavedWordsButton: React.FC<SavedWordsButtonProps> = ({
  onClick,
  isOpen,
}) => {
  const [count, setCount] = useState<number>(() => getSavedWords().length);

  // Subscribe to reactive updates
  useEffect(() => {
    // Initial sync
    setCount(getSavedWords().length);

    const unsubscribe = subscribeSavedWords((newCount) => {
      setCount(newCount);
    });

    return () => unsubscribe();
  }, []);

  return (
    <aside
      aria-label="Sổ tay từ vựng"
      className="fixed bottom-[calc(7.2rem+env(safe-area-inset-bottom,0px))] md:bottom-[4.85rem] right-3.5 sm:right-6 z-40 flex items-center"
    >
      <button
        onClick={onClick}
        type="button"
        aria-expanded={isOpen}
        aria-label="Mở Sổ tay từ vựng đã lưu"
        className="group relative flex items-center justify-center w-11 h-11 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 sm:gap-2 rounded-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold shadow-lg hover:shadow-xl hover:shadow-amber-500/30 transition-all active:scale-95 sm:active:scale-100 cursor-pointer border border-amber-300/60 dark:border-amber-400/30 ring-4 ring-transparent hover:ring-amber-500/20"
        title="Sổ tay từ vựng (Các từ mới bạn đã lưu khi học & làm bài tập)"
      >
        {/* Count badge on mobile */}
        {count > 0 && (
          <span className="sm:hidden absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 text-[10px] font-black border border-amber-300 shadow-xs">
            {count > 99 ? '99+' : count}
          </span>
        )}

        {/* Bookmark Icon */}
        <Bookmark size={18} className="shrink-0 fill-current" />

        {/* Text for desktop & tablet */}
        <span className="hidden sm:inline font-bold text-xs sm:text-sm tracking-tight whitespace-nowrap">
          Sổ từ vựng
        </span>

        {/* Count badge for desktop */}
        <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-600 text-white dark:bg-zinc-900 dark:text-amber-300 font-bold">
          {count}
        </span>
      </button>
    </aside>
  );
};
