import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  BookOpen,
  Search,
  X,
  Sparkles,
  Table,
  CheckCircle2,
  Bookmark,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Copy,
  Check,
  ChevronsUpDown,
} from 'lucide-react';
import {
  ENGLISH_TENSES,
  GOLDEN_GRAMMAR_RULES,
} from '../data/englishTenses';

interface TenseHandbookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TenseHandbookModal: React.FC<TenseHandbookModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'present' | 'past' | 'future' | 'matrix' | 'rules'>('all');
  const [expandedTenseId, setExpandedTenseId] = useState<string | null>(null);
  const [expandAll, setExpandAll] = useState(false);
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);

  // Matrix mobile sub-tab: 'present' | 'past' | 'future'
  const [matrixMobileCategory, setMatrixMobileCategory] = useState<'present' | 'past' | 'future'>('present');

  // Ref map for smooth scrolling to specific tense on mobile
  const tenseRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedFormula(id);
    setTimeout(() => {
      setCopiedFormula(null);
    }, 1800);
  };

  // Scroll to a specific tense
  const scrollToTense = (id: string) => {
    setExpandedTenseId(id);
    const el = tenseRefs.current[id];
    if (el) {
      const isPc = typeof window !== 'undefined' && window.innerWidth >= 640;
      el.scrollIntoView({ behavior: isPc ? 'auto' : 'smooth', block: 'start' });
    }
  };

  // Filtered tenses based on tab and search keyword
  const filteredTenses = useMemo(() => {
    const lower = searchTerm.toLowerCase().trim();

    return ENGLISH_TENSES.filter((t) => {
      // Tab filter
      if (activeTab === 'present' && t.category !== 'present') return false;
      if (activeTab === 'past' && t.category !== 'past') return false;
      if (activeTab === 'future' && t.category !== 'future') return false;

      // Search query filter
      if (!lower) return true;

      const matchName = t.name.toLowerCase().includes(lower) || t.nameVi.toLowerCase().includes(lower);
      const matchFormula =
        t.summaryFormula.toLowerCase().includes(lower) ||
        t.formulas.affirmative.toLowerCase().includes(lower) ||
        t.formulas.negative.toLowerCase().includes(lower) ||
        t.formulas.interrogative.toLowerCase().includes(lower);
      const matchSignals = t.signals.some((s) => s.toLowerCase().includes(lower));
      const matchUsage = t.usage.some((u) => u.toLowerCase().includes(lower));
      const matchExamples = t.examples.some(
        (ex) => ex.en.toLowerCase().includes(lower) || ex.vi.toLowerCase().includes(lower)
      );

      return matchName || matchFormula || matchSignals || matchUsage || matchExamples;
    });
  }, [searchTerm, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150 sm:animate-none sm:transition-none">
      <div
        className="relative w-full sm:max-w-4xl h-[92vh] sm:h-auto sm:max-h-[88vh] bg-white dark:bg-zinc-900 border-t sm:border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100 animate-in slide-in-from-bottom duration-200 sm:animate-none sm:transition-none sm:transform-none"
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Pull Handle */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        </div>

        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 bg-zinc-50/70 dark:bg-zinc-900/70 backdrop-blur-xs shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
              <BookOpen size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                  Sổ tay 12 thì Tiếng Anh
                </h2>
                <span className="hidden sm:inline-block text-[11px] font-normal px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50 shrink-0">
                  Tra cứu nhanh
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate">
                Công thức, dấu hiệu và mẹo làm bài tập
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 sm:p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            title="Đóng (Esc)"
            aria-label="Đóng sổ tay"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar & Tabs Navigation */}
        <div className="p-3 sm:px-6 sm:py-3 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-950/20 space-y-2.5 shrink-0">
          {/* Search box */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm nhanh thì hoặc dấu hiệu (yesterday, since, Look!...)"
              className="w-full pl-9 pr-9 py-2 sm:py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 transition-all shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-md"
                title="Xóa tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Navigation Tabs (Scrollable on phone) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 text-xs font-medium">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              Tất cả ({ENGLISH_TENSES.length})
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Table size={13} />
              <span>Bảng tra nhanh</span>
            </button>

            <button
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'rules'
                  ? 'bg-amber-600 text-white font-semibold shadow-2xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Sparkles size={13} />
              <span>Mẹo phối thì</span>
            </button>

            <span className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-0.5 shrink-0" />

            <button
              onClick={() => setActiveTab('present')}
              className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'present'
                  ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              Hiện tại
            </button>

            <button
              onClick={() => setActiveTab('past')}
              className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'past'
                  ? 'bg-amber-600 text-white font-semibold shadow-2xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              Quá khứ
            </button>

            <button
              onClick={() => setActiveTab('future')}
              className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'future'
                  ? 'bg-purple-600 text-white font-semibold shadow-2xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              Tương lai
            </button>
          </div>

          {/* Sub Toolbar: Quick Jump Chips & Expand/Collapse Toggle on phone */}
          {activeTab !== 'matrix' && activeTab !== 'rules' && (
            <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-zinc-500 overflow-hidden">
              {/* Quick jump pills */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 pr-2">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold shrink-0">
                  Nhảy tới:
                </span>
                {filteredTenses.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => scrollToTense(t.id)}
                    className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 whitespace-nowrap text-[10px] sm:text-[11px] cursor-pointer transition-colors shrink-0"
                  >
                    {t.nameVi.replace('Thì ', '')}
                  </button>
                ))}
              </div>

              {/* Toggle expand all button */}
              <button
                onClick={() => setExpandAll((prev) => !prev)}
                className="flex items-center gap-1 text-[10px] sm:text-[11px] text-blue-600 dark:text-blue-400 hover:underline shrink-0 pl-1 cursor-pointer"
              >
                <ChevronsUpDown size={12} />
                <span>{expandAll ? 'Thu gọn' : 'Mở hết'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
          {/* ========================================================= */}
          {/* VIEW: MATRIX / SUMMARY TABLE                              */}
          {/* ========================================================= */}
          {activeTab === 'matrix' ? (
            <div className="space-y-4">
              {/* Mobile Matrix Controls (Điện thoại: hiển thị dạng thẻ phân loại không cần cuộn ngang) */}
              <div className="sm:hidden space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    Chọn thời gian:
                  </span>
                  <span className="text-[11px] text-zinc-400">Xem nhanh 4 thể của thì</span>
                </div>

                {/* 3 Nút chọn thời gian trên điện thoại */}
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80">
                  <button
                    onClick={() => setMatrixMobileCategory('past')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      matrixMobileCategory === 'past'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    Quá khứ
                  </button>
                  <button
                    onClick={() => setMatrixMobileCategory('present')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      matrixMobileCategory === 'present'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    Hiện tại
                  </button>
                  <button
                    onClick={() => setMatrixMobileCategory('future')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      matrixMobileCategory === 'future'
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    Tương lai
                  </button>
                </div>

                {/* Danh sách 4 thẻ tóm tắt trên Mobile */}
                <div className="space-y-2.5">
                  {matrixMobileCategory === 'present' && (
                    <>
                      <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300">
                            1. Hiện tại đơn (Simple)
                          </span>
                          <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            S + V(s/es)
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">Dấu hiệu: </span>
                          always, usually, often, every day, once a week
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300">
                            2. Hiện tại tiếp diễn (Continuous)
                          </span>
                          <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            S + am/is/are + V-ing
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">Dấu hiệu: </span>
                          now, right now, at the moment, Look!, Listen!
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300">
                            3. Hiện tại hoàn thành (Perfect)
                          </span>
                          <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            S + have/has + V3/ed
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">Dấu hiệu: </span>
                          already, yet, just, since, for, so far, ever, never
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300">
                            4. Hiện tại HT tiếp diễn (Perf. Cont)
                          </span>
                          <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            S + have/has been + V-ing
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">Dấu hiệu: </span>
                          all day, all morning, how long, for [thời gian liên tục]
                        </div>
                      </div>
                    </>
                  )}

                  {matrixMobileCategory === 'past' && (
                    <>
                      <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-amber-800 dark:text-amber-300">
                            1. Quá khứ đơn (Simple)
                          </span>
                          <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                            S + V2/ed
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">Dấu hiệu: </span>
                          yesterday, last night/year, ago, in 2020
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-amber-800 dark:text-amber-300">
                            2. Quá khứ tiếp diễn (Continuous)
                          </span>
                          <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                            S + was/were + V-ing
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">Dấu hiệu: </span>
                          at 8 PM yesterday, while, when (xen vào)
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-amber-800 dark:text-amber-300">
                            3. Quá khứ hoàn thành (Perfect)
                          </span>
                          <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                            S + had + V3/ed
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">Dấu hiệu: </span>
                          before, by the time, after, as soon as
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-amber-800 dark:text-amber-300">
                            4. Quá khứ HT tiếp diễn (Perf. Cont)
                          </span>
                          <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                            S + had been + V-ing
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">Dấu hiệu: </span>
                          until then, prior to that time, for + time (quá khứ)
                        </div>
                      </div>
                    </>
                  )}

                  {matrixMobileCategory === 'future' && (
                    <>
                      <div className="p-3 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/30 dark:bg-purple-950/20 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-purple-800 dark:text-purple-300">
                            1. Tương lai đơn (Simple)
                          </span>
                          <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                            S + will + V_inf
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">Dấu hiệu: </span>
                          tomorrow, next week, soon, I think, probably
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/30 dark:bg-purple-950/20 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-purple-800 dark:text-purple-300">
                            2. Tương lai tiếp diễn (Continuous)
                          </span>
                          <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                            S + will be + V-ing
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">Dấu hiệu: </span>
                          at this time tomorrow, at 8 PM tomorrow
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/30 dark:bg-purple-950/20 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-purple-800 dark:text-purple-300">
                            3. Tương lai hoàn thành (Perfect)
                          </span>
                          <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                            S + will have + V3/ed
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">Dấu hiệu: </span>
                          by + mốc tương lai, by the time + S + V(hiện tại)
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/30 dark:bg-purple-950/20 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-purple-800 dark:text-purple-300">
                            4. Tương lai HT tiếp diễn (Perf. Cont)
                          </span>
                          <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                            S + will have been + V-ing
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">Dấu hiệu: </span>
                          by the time... for [khoảng thời gian]
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Desktop Matrix Comparison Table (Máy tính & Tablet rộng) */}
              <div className="hidden sm:block space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    Bảng tổng hợp nhanh công thức và dấu hiệu của 12 thì cơ bản
                  </span>
                </div>

                <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950">
                  <table className="w-full text-xs text-left border-collapse min-w-[620px]">
                    <thead>
                      <tr className="bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                        <th className="p-3 w-32">Dạng thì</th>
                        <th className="p-3">Quá khứ (Past)</th>
                        <th className="p-3">Hiện tại (Present)</th>
                        <th className="p-3">Tương lai (Future)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono text-[11px] sm:text-xs">
                      {/* Đơn (Simple) */}
                      <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                        <td className="p-3 font-sans font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-50/50 dark:bg-zinc-900/50">
                          Đơn (Simple)
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-amber-600 dark:text-amber-400">S + V2/ed</div>
                          <div className="text-[10px] font-sans text-zinc-500 mt-1">
                            yesterday, last..., ...ago
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">S + V(s/es)</div>
                          <div className="text-[10px] font-sans text-zinc-500 mt-1">
                            always, usually, every day
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-purple-600 dark:text-purple-400">S + will + V_inf</div>
                          <div className="text-[10px] font-sans text-zinc-500 mt-1">
                            tomorrow, next..., in 5 mins
                          </div>
                        </td>
                      </tr>

                      {/* Tiếp diễn (Continuous) */}
                      <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                        <td className="p-3 font-sans font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-50/50 dark:bg-zinc-900/50">
                          Tiếp diễn (Continuous)
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-amber-600 dark:text-amber-400">S + was/were + V-ing</div>
                          <div className="text-[10px] font-sans text-zinc-500 mt-1">
                            at 8 PM yesterday, while, when
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">S + am/is/are + V-ing</div>
                          <div className="text-[10px] font-sans text-zinc-500 mt-1">
                            now, at the moment, Look!
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-purple-600 dark:text-purple-400">S + will be + V-ing</div>
                          <div className="text-[10px] font-sans text-zinc-500 mt-1">
                            at this time tomorrow
                          </div>
                        </td>
                      </tr>

                      {/* Hoàn thành (Perfect) */}
                      <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                        <td className="p-3 font-sans font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-50/50 dark:bg-zinc-900/50">
                          Hoàn thành (Perfect)
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-amber-600 dark:text-amber-400">S + had + V3/ed</div>
                          <div className="text-[10px] font-sans text-zinc-500 mt-1">
                            before, by the time, after
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">S + have/has + V3/ed</div>
                          <div className="text-[10px] font-sans text-zinc-500 mt-1">
                            already, yet, just, since, for
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-purple-600 dark:text-purple-400">S + will have + V3/ed</div>
                          <div className="text-[10px] font-sans text-zinc-500 mt-1">
                            by + mốc tương lai, by the time
                          </div>
                        </td>
                      </tr>

                      {/* Hoàn thành tiếp diễn (Perfect Continuous) */}
                      <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                        <td className="p-3 font-sans font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-50/50 dark:bg-zinc-900/50">
                          Hoàn thành tiếp diễn (Perfect Cont.)
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-amber-600 dark:text-amber-400">S + had been + V-ing</div>
                          <div className="text-[10px] font-sans text-zinc-500 mt-1">
                            until then, for + time (quá khứ)
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">S + have/has been + V-ing</div>
                          <div className="text-[10px] font-sans text-zinc-500 mt-1">
                            all day, all morning, how long
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-purple-600 dark:text-purple-400">S + will have been + V-ing</div>
                          <div className="text-[10px] font-sans text-zinc-500 mt-1">
                            by next month... for 5 years
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tips for fast memorization */}
              <div className="p-3 sm:p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-blue-700 dark:text-blue-300">
                  <Bookmark size={14} />
                  <span>Mẹo nhận diện công thức trong 3 giây:</span>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-[11px] sm:text-xs">
                  • <strong>Tiếp diễn</strong> = luôn luôn có dạng <code className="font-mono text-blue-600 dark:text-blue-400">to be + V-ing</code>.<br />
                  • <strong>Hoàn thành</strong> = luôn luôn có dạng <code className="font-mono text-blue-600 dark:text-blue-400">have/has/had + V3/ed</code>.<br />
                  • <strong>Hoàn thành tiếp diễn</strong> = ghép cả hai dạng: <code className="font-mono text-blue-600 dark:text-blue-400">have/has/had + been + V-ing</code>.<br />
                  • <strong>Tương lai</strong> = xuất hiện trợ động từ <code className="font-mono text-blue-600 dark:text-blue-400">will</code>.
                </p>
              </div>
            </div>
          ) : activeTab === 'rules' ? (
            /* ========================================================= */
            /* VIEW: GOLDEN RULES FOR EXERCISES                          */
            /* ========================================================= */
            <div className="space-y-3">
              <div className="text-xs text-zinc-500 font-medium px-0.5">
                7 quy tắc phối thì hay gặp nhất khi làm bài tập trắc nghiệm:
              </div>

              <div className="grid gap-2.5 sm:gap-3">
                {GOLDEN_GRAMMAR_RULES.map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xs space-y-2 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[10px] sm:text-[11px] font-mono font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <span>{rule.title}</span>
                      </h4>
                      <button
                        onClick={() => handleCopy(rule.formula, `rule-${idx}`)}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-md shrink-0 cursor-pointer"
                        title="Sao chép công thức"
                      >
                        {copiedFormula === `rule-${idx}` ? (
                          <Check size={14} className="text-emerald-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>

                    <div className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 font-mono text-[11px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400 border border-zinc-200/50 dark:border-zinc-800/50 break-words">
                      {rule.formula}
                    </div>

                    <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {rule.explanation}
                    </p>

                    <div className="text-[11px] italic text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-900">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300 not-italic">Ví dụ: </span>
                      "{rule.example}"
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* VIEW: TENSE LIST CARDS                                    */
            /* ========================================================= */
            <div className="space-y-2.5 sm:space-y-3">
              {filteredTenses.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 dark:text-zinc-500 text-xs space-y-2">
                  <AlertCircle size={28} className="mx-auto text-zinc-400" />
                  <p>Không tìm thấy thì nào khớp với từ khóa "{searchTerm}".</p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setActiveTab('all');
                    }}
                    className="text-blue-600 dark:text-blue-400 underline cursor-pointer text-xs"
                  >
                    Xem tất cả các thì
                  </button>
                </div>
              ) : (
                filteredTenses.map((tense) => {
                  const isExpanded = expandAll || expandedTenseId === tense.id || Boolean(searchTerm);
                  const isCopied = copiedFormula === tense.id;

                  const categoryBadgeColor =
                    tense.category === 'present'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : tense.category === 'past'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';

                  return (
                    <div
                      key={tense.id}
                      ref={(el) => (tenseRefs.current[tense.id] = el)}
                      className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 overflow-hidden transition-all sm:transition-none shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700"
                    >
                      {/* Card Header (Tap to toggle on mobile) */}
                      <div
                        onClick={() => {
                          if (!searchTerm && !expandAll) {
                            setExpandedTenseId(isExpanded ? null : tense.id);
                          }
                        }}
                        className={`p-3 sm:p-4 flex items-center justify-between gap-2.5 cursor-pointer select-none transition-colors ${
                          isExpanded
                            ? 'bg-zinc-50/70 dark:bg-zinc-900/60 border-b border-zinc-200/70 dark:border-zinc-800/70'
                            : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 active:bg-zinc-100 dark:active:bg-zinc-800'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span
                              className={`text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.2 rounded-md border shrink-0 ${categoryBadgeColor}`}
                            >
                              {tense.categoryLabel}
                            </span>
                            <h3 className="font-bold text-xs sm:text-base text-zinc-900 dark:text-zinc-100 truncate">
                              {tense.name}
                            </h3>
                            <span className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-normal truncate">
                              ({tense.nameVi})
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] sm:text-xs font-mono font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 truncate max-w-full">
                              {tense.summaryFormula}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(tense.summaryFormula, tense.id);
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Sao chép công thức"
                            aria-label="Sao chép"
                          >
                            {isCopied ? (
                              <Check size={14} className="text-emerald-500" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>

                          {!searchTerm && !expandAll && (
                            <div className="p-1 text-zinc-400">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Expandable Body */}
                      {isExpanded && (
                        <div className="p-3 sm:p-5 space-y-3.5 text-xs">
                          {/* Formulas Grid */}
                          <div>
                            <div className="font-semibold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                <span>Công thức chi tiết</span>
                              </span>
                              <span className="text-[10px] text-zinc-400 font-normal hidden sm:inline">
                                Bấm biểu tượng để sao chép
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px] sm:text-xs">
                              {/* Affirmative (+) */}
                              <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 relative group">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] font-sans font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                                    (+) Khẳng định
                                  </span>
                                  <button
                                    onClick={() => handleCopy(tense.formulas.affirmative, `${tense.id}-aff`)}
                                    className="text-emerald-600 dark:text-emerald-400 p-0.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                                    title="Sao chép"
                                  >
                                    {copiedFormula === `${tense.id}-aff` ? (
                                      <Check size={12} />
                                    ) : (
                                      <Copy size={12} />
                                    )}
                                  </button>
                                </div>
                                <div className="text-zinc-800 dark:text-zinc-200 font-semibold whitespace-pre-line leading-relaxed text-[11px]">
                                  {tense.formulas.affirmative}
                                </div>
                              </div>

                              {/* Negative (-) */}
                              <div className="p-2.5 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 relative group">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] font-sans font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">
                                    (-) Phủ định
                                  </span>
                                  <button
                                    onClick={() => handleCopy(tense.formulas.negative, `${tense.id}-neg`)}
                                    className="text-red-600 dark:text-red-400 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/40"
                                    title="Sao chép"
                                  >
                                    {copiedFormula === `${tense.id}-neg` ? (
                                      <Check size={12} />
                                    ) : (
                                      <Copy size={12} />
                                    )}
                                  </button>
                                </div>
                                <div className="text-zinc-800 dark:text-zinc-200 font-semibold whitespace-pre-line leading-relaxed text-[11px]">
                                  {tense.formulas.negative}
                                </div>
                              </div>

                              {/* Interrogative (?) */}
                              <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 relative group">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] font-sans font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                                    (?) Nghi vấn
                                  </span>
                                  <button
                                    onClick={() => handleCopy(tense.formulas.interrogative, `${tense.id}-int`)}
                                    className="text-blue-600 dark:text-blue-400 p-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40"
                                    title="Sao chép"
                                  >
                                    {copiedFormula === `${tense.id}-int` ? (
                                      <Check size={12} />
                                    ) : (
                                      <Copy size={12} />
                                    )}
                                  </button>
                                </div>
                                <div className="text-zinc-800 dark:text-zinc-200 font-semibold whitespace-pre-line leading-relaxed text-[11px]">
                                  {tense.formulas.interrogative}
                                </div>
                              </div>
                            </div>

                            {tense.formulas.note && (
                              <p className="mt-1.5 text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 italic">
                                * {tense.formulas.note}
                              </p>
                            )}
                          </div>

                          {/* Signal words / Dấu hiệu nhận biết */}
                          <div>
                            <div className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              <span>Dấu hiệu nhận biết (Signal words)</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {tense.signals.map((signal, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40"
                                >
                                  {signal}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Usage & Examples (1 col on mobile, 2 col on tablet/desktop) */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            {/* Usage */}
                            <div className="space-y-1">
                              <div className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                <CheckCircle2 size={13} className="text-emerald-500" />
                                <span>Cách dùng chính</span>
                              </div>
                              <ul className="list-disc list-inside space-y-1 text-zinc-600 dark:text-zinc-400 text-[11px] sm:text-xs">
                                {tense.usage.map((u, uIdx) => (
                                  <li key={uIdx} className="leading-relaxed">
                                    <span>{u}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Examples */}
                            <div className="space-y-1">
                              <div className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                <Sparkles size={13} className="text-blue-500" />
                                <span>Ví dụ minh họa</span>
                              </div>
                              <div className="space-y-1.5">
                                {tense.examples.map((ex, exIdx) => (
                                  <div
                                    key={exIdx}
                                    className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-100 dark:border-zinc-800 text-[11px]"
                                  >
                                    <div className="font-medium text-zinc-800 dark:text-zinc-200">
                                      {ex.en}
                                    </div>
                                    <div className="text-zinc-500 dark:text-zinc-400 mt-0.5 text-[10px] sm:text-[11px]">
                                      {ex.vi}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Tips & Common Traps */}
                          {tense.tips && tense.tips.length > 0 && (
                            <div className="p-2.5 sm:p-3 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-1">
                              <div className="font-semibold text-amber-700 dark:text-amber-400 text-[10px] sm:text-[11px] flex items-center gap-1">
                                <AlertCircle size={13} />
                                <span>Lưu ý quan trọng khi làm bài:</span>
                              </div>
                              <div className="space-y-0.5 text-[10px] sm:text-[11px] text-zinc-600 dark:text-zinc-400 whitespace-pre-line leading-relaxed">
                                {tense.tips.map((tip, tIdx) => (
                                  <p key={tIdx}>• {tip}</p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer with Mobile Safe Area */}
        <div className="p-3 sm:px-6 sm:py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50/70 dark:bg-zinc-900/70 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
            <span className="hidden sm:inline">Mẹo: Bấm</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] font-mono font-semibold">
              ESC
            </kbd>
            <span className="hidden sm:inline">để đóng sổ tay và tiếp tục làm bài.</span>
            <span className="sm:hidden text-zinc-400">Vuốt xuống hoặc bấm nút để đóng</span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 sm:py-1.5 rounded-xl sm:rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer text-center"
          >
            Đóng sổ tay
          </button>
        </div>
      </div>
    </div>
  );
};
