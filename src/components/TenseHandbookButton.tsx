import React from 'react';
import { BookOpen } from 'lucide-react';

interface TenseHandbookButtonProps {
  onClick: () => void;
  isOpen?: boolean;
}

export const TenseHandbookButton: React.FC<TenseHandbookButtonProps> = ({
  onClick,
  isOpen,
}) => {
  return (
    <aside
      aria-label="Sổ tay 12 thì"
      className="fixed bottom-[calc(4.2rem+env(safe-area-inset-bottom,0px))] md:bottom-6 right-3.5 sm:right-6 z-40 flex items-center"
    >
      <button
        onClick={onClick}
        type="button"
        aria-expanded={isOpen}
        aria-label="Mở sổ tay 12 thì Tiếng Anh"
        className="group relative flex items-center justify-center w-11 h-11 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 sm:gap-2 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 cursor-pointer border border-blue-400/40 dark:border-blue-400/30 ring-4 ring-transparent hover:ring-blue-500/20"
        title="Sổ tay 12 thì tiếng Anh (Tra cứu nhanh công thức & dấu hiệu)"
      >
        {/* Subtle indicator dot / pulse */}
        <span className="absolute -top-0.5 -right-0.5 sm:static sm:top-auto sm:right-auto flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-200 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white border border-blue-600 sm:border-0" />
        </span>

        {/* Book Icon (Always visible) */}
        <BookOpen size={18} className="transition-transform group-hover:scale-110 shrink-0" />

        {/* Text (Hidden on mobile phones, only shown on tablet and desktop) */}
        <span className="hidden sm:inline font-semibold text-xs sm:text-sm tracking-tight whitespace-nowrap">
          Sổ tay các thì
        </span>

        {/* Shortcut badge on desktop */}
        <span className="hidden md:inline-block text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-blue-500/80 text-blue-100 font-normal">
          12 thì
        </span>
      </button>
    </aside>
  );
};
