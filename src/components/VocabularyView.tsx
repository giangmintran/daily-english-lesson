import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DailyLesson, VocabularyExample } from '../types/lesson';
import {
  Volume2,
  ChevronLeft,
  ChevronRight,
  Check,
  RotateCcw,
  AlertTriangle,
  BookOpen,
  Layers,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { speakWord } from '../utils/speech';
import { updateLessonProgress } from '../services/storage';
import { VocabQuiz } from './VocabQuiz';

interface VocabularyViewProps {
  lesson: DailyLesson;
  onUpdateLesson: (updated: DailyLesson) => void;
  initialMode?: 'flashcards' | 'quiz';
}

export const VocabularyView: React.FC<VocabularyViewProps> = ({
  lesson,
  onUpdateLesson,
  initialMode = 'flashcards',
}) => {
  const [viewMode, setViewMode] = useState<'flashcards' | 'quiz'>(initialMode);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [autoPronounce, setAutoPronounce] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Sync initialMode if changed by parent
  useEffect(() => {
    if (initialMode) {
      setViewMode(initialMode);
    }
  }, [initialMode]);

  // Swipe detection refs
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const words = lesson.vocabulary || [];
  const currentWord = words[currentIndex] || words[0];
  const masteredIds = new Set(lesson.progress?.wordsMastered || []);
  const isCurrentMastered = currentWord ? masteredIds.has(currentWord.id) : false;

  const totalWords = words.length;

  const handlePlayAudio = useCallback(() => {
    if (!currentWord) return;
    setIsPlayingAudio(true);
    speakWord(
      currentWord.word,
      0.9,
      () => setIsPlayingAudio(false),
      () => setIsPlayingAudio(true)
    );
  }, [currentWord]);

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev < totalWords - 1 ? prev + 1 : 0));
  }, [totalWords]);

  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalWords - 1));
  }, [totalWords]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleToggleMastered = useCallback((mastered: boolean) => {
    if (!currentWord) return;

    const updated = updateLessonProgress(
      lesson.date,
      (prev) => {
        const currentMastered = new Set(prev?.wordsMastered || []);
        if (mastered) {
          currentMastered.add(currentWord.id);
        } else {
          currentMastered.delete(currentWord.id);
        }
        return {
          wordsMastered: Array.from(currentMastered),
          exerciseResults: prev?.exerciseResults || {},
        };
      },
      lesson
    );

    if (updated) {
      onUpdateLesson(updated);
    }
  }, [currentWord, lesson, onUpdateLesson]);

  // Pronounce word when navigating if autoPronounce is true
  useEffect(() => {
    if (viewMode !== 'flashcards') return;
    if (autoPronounce && currentWord) {
      const timer = setTimeout(() => {
        handlePlayAudio();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [viewMode, currentIndex, autoPronounce, handlePlayAudio, currentWord]);

  // Global Keyboard Navigation for Flashcards
  useEffect(() => {
    if (viewMode !== 'flashcards') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight' || e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft' || e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === '1') {
        e.preventDefault();
        handleToggleMastered(false);
        handleNext();
      } else if (e.key === '2') {
        e.preventDefault();
        handleToggleMastered(true);
        handleNext();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handlePlayAudio();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, handleFlip, handleNext, handlePrev, handleToggleMastered, handlePlayAudio]);

  // Touch Swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    if (viewMode !== 'flashcards') return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (viewMode !== 'flashcards') return;
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Trigger swipe if mostly horizontal and moved > 40px
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  if (!currentWord) {
    return (
      <div className="text-center py-20 text-zinc-500">
        Không có từ vựng nào trong bài học này.
      </div>
    );
  }

  // Parse examples
  const exampleList: VocabularyExample[] = [];
  if (currentWord.examples && currentWord.examples.length > 0) {
    currentWord.examples.forEach((ex) => {
      if (typeof ex === 'string') {
        exampleList.push({ en: ex });
      } else if (ex && ex.en) {
        exampleList.push(ex);
      }
    });
  } else if (currentWord.example) {
    exampleList.push({
      en: currentWord.example,
      vi: currentWord.exampleMeaning,
    });
  }

  const masteredCount = masteredIds.size;
  const progressPercent = totalWords > 0 ? Math.round((masteredCount / totalWords) * 100) : 0;

  return (
    <div className="w-full">
      {/* Top Mode Selector: Flashcards vs Quiz */}
      <div className="flex items-center justify-center pt-2 sm:pt-4 mb-2">
        <div className="inline-flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 shadow-xs">
          <button
            onClick={() => setViewMode('flashcards')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              viewMode === 'flashcards'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <BookOpen size={15} />
            <span>Thẻ ghi nhớ</span>
          </button>
          <button
            onClick={() => setViewMode('quiz')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              viewMode === 'quiz'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <CheckCircle2 size={15} className="text-emerald-500" />
            <span>Kiểm tra từ mới</span>
          </button>
        </div>
      </div>

      {viewMode === 'quiz' ? (
        <VocabQuiz
          lesson={lesson}
          onUpdateLesson={onUpdateLesson}
          onBackToFlashcards={() => setViewMode('flashcards')}
        />
      ) : (
        <div
          className="max-w-2xl mx-auto py-4 sm:py-6 px-3 sm:px-4 animate-fade-in flex flex-col items-center"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Top Controls: Counter & Sound toggle */}
          <div className="w-full flex items-center justify-between text-xs text-zinc-500 mb-3 px-1">
        <div className="font-mono flex items-center gap-1.5">
          <span>Từ</span>
          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
            {currentIndex + 1}
          </span>
          <span>/</span>
          <span>{totalWords}</span>
          <span className="hidden sm:inline-block ml-2 text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            {masteredCount} đã thuộc ({progressPercent}%)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 select-none">
            <input
              type="checkbox"
              checked={autoPronounce}
              onChange={(e) => setAutoPronounce(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-0 cursor-pointer"
            />
            <span className="text-xs">
              <span className="sm:hidden">Tự phát âm</span>
              <span className="hidden sm:inline">Tự phát âm khi đổi từ</span>
            </span>
          </label>
        </div>
      </div>

      {/* Progress Dots Bar */}
      <div className="w-full flex gap-1 mb-4 overflow-x-auto pb-1 no-scrollbar">
        {words.map((w, idx) => {
          const isMastered = masteredIds.has(w.id);
          const isCurrent = idx === currentIndex;
          return (
            <button
              key={w.id}
              onClick={() => {
                setCurrentIndex(idx);
                setIsFlipped(false);
              }}
              className={`h-2 flex-1 min-w-[10px] rounded-full transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-zinc-900 dark:bg-zinc-100 ring-2 ring-zinc-400 dark:ring-zinc-500'
                  : isMastered
                  ? 'bg-emerald-500'
                  : 'bg-zinc-200 dark:bg-zinc-800'
              }`}
              title={`Từ ${idx + 1}: ${w.word}`}
            />
          );
        })}
      </div>

      {/* Flashcard Component */}
      <div
        className={`w-full min-h-[340px] sm:min-h-[400px] p-5 sm:p-8 rounded-3xl border transition-all duration-300 flex flex-col justify-between relative shadow-sm ${
          isCurrentMastered
            ? 'border-emerald-500/40 bg-white dark:bg-zinc-900'
            : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
        }`}
      >
        {/* Top card metadata & Flip toggle */}
        <div className="flex items-center justify-between text-xs pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2 flex-wrap">
            {currentWord.partOfSpeech && (
              <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                {currentWord.partOfSpeech}
              </span>
            )}
            {isCurrentMastered && (
              <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-medium">
                <Check size={12} />
                <span>Đã thuộc</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Audio Pronunciation Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePlayAudio();
              }}
              className={`p-2 sm:p-2.5 rounded-xl transition-all cursor-pointer active:scale-95 ${
                isPlayingAudio
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400 scale-105'
                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200'
              }`}
              title="Nghe phát âm (Phím R)"
              aria-label="Phát âm từ"
            >
              <Volume2 size={18} className={isPlayingAudio ? 'animate-pulse' : ''} />
            </button>

            {/* Flip Card Toggle Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleFlip();
              }}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium transition-colors cursor-pointer active:scale-95"
              title="Lật thẻ"
            >
              <RefreshCw size={13} className={isFlipped ? 'rotate-180 transition-transform' : 'transition-transform'} />
              <span>{isFlipped ? 'Mặt từ' : 'Xem nghĩa'}</span>
            </button>
          </div>
        </div>

        {/* Center Card Content */}
        {!isFlipped ? (
          /* FRONT SIDE */
          <div
            onClick={handleFlip}
            className="text-center py-10 sm:py-16 space-y-3 cursor-pointer select-none flex-1 flex flex-col justify-center"
          >
            <div className="flex items-center justify-center gap-2.5 flex-wrap">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 break-words px-2">
                {currentWord.word}
              </h2>
            </div>
            {currentWord.phonetic && (
              <div className="inline-flex items-center justify-center gap-2 mx-auto">
                <span className="text-sm sm:text-base font-mono text-zinc-500 dark:text-zinc-400">
                  IPA: {currentWord.phonetic}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayAudio();
                  }}
                  className={`p-1.5 rounded-full transition-all cursor-pointer active:scale-90 ${
                    isPlayingAudio
                      ? 'bg-blue-600 text-white ring-2 ring-blue-300 shadow-xs'
                      : 'text-zinc-400 hover:text-blue-600 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                  title="Nghe phát âm"
                  aria-label="Nghe phát âm"
                >
                  <Volume2 size={16} className={isPlayingAudio ? 'animate-pulse' : ''} />
                </button>
              </div>
            )}
            <div className="pt-6 sm:pt-8 text-xs text-zinc-400 dark:text-zinc-500">
              <span className="sm:hidden">Chạm vào thẻ để lật xem nghĩa & ví dụ</span>
              <span className="hidden sm:inline">
                Bấm vào thẻ hoặc nhấn <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-[11px]">Space</kbd> để lật
              </span>
            </div>
          </div>
        ) : (
          /* BACK SIDE: RICH DETAILS (With independent scroll, doesn't trigger flip) */
          <div
            onClick={(e) => e.stopPropagation()}
            className="py-3 space-y-4 animate-fade-in text-left max-h-[360px] sm:max-h-[460px] overflow-y-auto overscroll-contain pr-1 flex-1"
          >
            {/* Meaning */}
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-0.5">
                Định nghĩa
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                {currentWord.meaning}
              </h3>
            </div>

            {/* Natural Usage & Purpose */}
            {(currentWord.usage || currentWord.purpose) && (
              <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-xs space-y-1.5">
                {currentWord.usage && (
                  <div>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">Cách dùng: </span>
                    <span className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{currentWord.usage}</span>
                  </div>
                )}
                {currentWord.purpose && (
                  <div>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">Mục đích: </span>
                    <span className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{currentWord.purpose}</span>
                  </div>
                )}
              </div>
            )}

            {/* Structures / Collocations */}
            {currentWord.structures && currentWord.structures.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  <Layers size={13} className="text-blue-500" />
                  <span>Cấu trúc thường gặp:</span>
                </div>
                <div className="space-y-1 pl-1">
                  {currentWord.structures.map((st, sIdx) => (
                    <div key={sIdx} className="text-xs text-zinc-600 dark:text-zinc-300 font-mono flex items-start gap-2">
                      <span className="text-zinc-400">•</span>
                      <span>{st}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Common Mistakes */}
            {currentWord.commonMistakes && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Lỗi thường gặp: </span>
                  <span className="leading-relaxed">{currentWord.commonMistakes}</span>
                </div>
              </div>
            )}

            {/* Detailed Examples */}
            {exampleList.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  <BookOpen size={13} className="text-emerald-500" />
                  <span>Ví dụ thực tế:</span>
                </div>
                <div className="space-y-2">
                  {exampleList.map((ex, eIdx) => (
                    <div
                      key={eIdx}
                      className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-xs space-y-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-zinc-800 dark:text-zinc-200 font-medium italic">
                          {eIdx + 1}. "{ex.en}"
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speakWord(ex.en);
                          }}
                          className="p-1 rounded-md text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer shrink-0"
                          title="Nghe câu ví dụ"
                        >
                          <Volume2 size={13} />
                        </button>
                      </div>
                      {ex.vi && (
                        <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                          → {ex.vi}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile quick flip back button */}
            <div className="pt-2 text-center">
              <button
                onClick={handleFlip}
                className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium underline underline-offset-4 py-1"
              >
                ← Quay lại mặt từ vựng
              </button>
            </div>
          </div>
        )}

        {/* Bottom card footer hint */}
        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
          <span>Active Recall</span>
          <span className="hidden sm:inline">
            {isFlipped ? 'Nhấn Space để ẩn' : 'Nhấn Space để lật'}
          </span>
          <span className="sm:hidden text-zinc-400">
            Vuốt ngang để chuyển từ
          </span>
        </div>
      </div>

      {/* Spaced Repetition Buttons: Review Again vs Mastered */}
      <div className="w-full grid grid-cols-2 gap-2.5 sm:gap-3 mt-3.5 sm:mt-4">
        <button
          onClick={() => {
            handleToggleMastered(false);
            handleNext();
          }}
          className="flex items-center justify-center gap-2 py-3 sm:py-3.5 px-3 sm:px-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-amber-400 dark:hover:border-amber-600 transition-all text-xs sm:text-sm font-medium cursor-pointer active:scale-95 shadow-xs"
        >
          <RotateCcw size={15} className="text-amber-500 shrink-0" />
          <span>Cần ôn lại</span>
          <kbd className="hidden sm:inline px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-400 font-mono">1</kbd>
        </button>

        <button
          onClick={() => {
            handleToggleMastered(true);
            handleNext();
          }}
          className={`flex items-center justify-center gap-2 py-3 sm:py-3.5 px-3 sm:px-4 rounded-2xl border transition-all text-xs sm:text-sm font-medium cursor-pointer active:scale-95 shadow-xs ${
            isCurrentMastered
              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-emerald-400'
          }`}
        >
          <Check size={16} className="text-emerald-500 shrink-0" />
          <span>Đã thuộc từ này</span>
          <kbd className="hidden sm:inline px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-400 font-mono">2</kbd>
        </button>
      </div>

      {/* Prev / Next Navigators */}
      <div className="w-full flex items-center justify-between mt-3 sm:mt-4">
        <button
          onClick={handlePrev}
          className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
          <span>Từ trước</span>
          <span className="hidden sm:inline font-mono text-[10px] text-zinc-400">(←)</span>
        </button>

        <div className="hidden sm:block text-[11px] text-zinc-400 font-mono text-center">
          [Space] Lật • [R] Phát âm • [←/→] Chuyển từ
        </div>

        <button
          onClick={handleNext}
          className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <span>Từ tiếp</span>
          <span className="hidden sm:inline font-mono text-[10px] text-zinc-400">(→)</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
      )}
    </div>
  );
};
