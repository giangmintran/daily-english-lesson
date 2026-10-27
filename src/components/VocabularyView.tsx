import React, { useState, useEffect, useCallback } from 'react';
import { DailyLesson, VocabularyExample } from '../types/lesson';
import { Volume2, ChevronLeft, ChevronRight, Check, RotateCcw, AlertTriangle, BookOpen, Layers } from 'lucide-react';
import { speakWord } from '../utils/speech';
import { updateLessonProgress } from '../services/storage';

interface VocabularyViewProps {
  lesson: DailyLesson;
  onUpdateLesson: (updated: DailyLesson) => void;
}

export const VocabularyView: React.FC<VocabularyViewProps> = ({ lesson, onUpdateLesson }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [autoPronounce, setAutoPronounce] = useState(true);

  const words = lesson.vocabulary;
  const currentWord = words[currentIndex] || words[0];
  const masteredIds = new Set(lesson.progress?.wordsMastered || []);
  const isCurrentMastered = currentWord ? masteredIds.has(currentWord.id) : false;

  const totalWords = words.length;

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

    const updated = updateLessonProgress(lesson.date, (prev) => {
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
    });

    if (updated) {
      onUpdateLesson(updated);
    }
  }, [currentWord, lesson.date, onUpdateLesson]);

  // Pronounce word when navigating if autoPronounce is true
  useEffect(() => {
    if (autoPronounce && currentWord) {
      const timer = setTimeout(() => {
        speakWord(currentWord.word);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, autoPronounce, currentWord]);

  // Global Keyboard Navigation
  useEffect(() => {
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
        if (currentWord) speakWord(currentWord.word);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNext, handlePrev, handleToggleMastered, currentWord]);

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

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 animate-fade-in flex flex-col items-center">
      {/* Top Controls: Counter & Sound toggle */}
      <div className="w-full flex items-center justify-between text-xs text-zinc-500 mb-4 px-1">
        <div className="font-mono">
          Từ <span className="font-semibold text-zinc-900 dark:text-zinc-100">{currentIndex + 1}</span> / {totalWords}
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
            <input
              type="checkbox"
              checked={autoPronounce}
              onChange={(e) => setAutoPronounce(e.target.checked)}
              className="rounded border-zinc-300 text-zinc-900 focus:ring-0 cursor-pointer"
            />
            <span>Tự phát âm khi qua từ mới</span>
          </label>
        </div>
      </div>

      {/* Progress Dots */}
      <div className="w-full flex gap-1 mb-6 overflow-x-auto pb-1">
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
              className={`h-1.5 flex-1 rounded-full transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-zinc-900 dark:bg-zinc-100 ring-2 ring-zinc-400 dark:ring-zinc-600'
                  : isMastered
                  ? 'bg-emerald-500'
                  : 'bg-zinc-200 dark:bg-zinc-800'
              }`}
              title={`Từ ${idx + 1}: ${w.word}`}
            />
          );
        })}
      </div>

      {/* Minimalist Flashcard Container */}
      <div
        onClick={handleFlip}
        className={`w-full min-h-[380px] p-6 sm:p-8 rounded-3xl border cursor-pointer select-none transition-all duration-300 flex flex-col justify-between relative shadow-xs ${
          isCurrentMastered
            ? 'border-emerald-500/30 bg-white dark:bg-zinc-900'
            : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
        }`}
      >
        {/* Top card metadata */}
        <div className="flex items-center justify-between text-xs pb-2">
          <div className="flex items-center gap-2">
            {currentWord.partOfSpeech && (
              <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                {currentWord.partOfSpeech}
              </span>
            )}
            {isCurrentMastered && (
              <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                <Check size={12} />
                <span>Đã thuộc</span>
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              speakWord(currentWord.word);
            }}
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Nghe phát âm (Phím R)"
          >
            <Volume2 size={18} />
          </button>
        </div>

        {/* Center Card Content */}
        {!isFlipped ? (
          /* FRONT SIDE */
          <div className="text-center py-12 space-y-3">
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {currentWord.word}
            </h2>
            {currentWord.phonetic && (
              <div className="text-sm font-mono text-zinc-500 dark:text-zinc-400">
                IPA: {currentWord.phonetic}
              </div>
            )}
            <p className="text-xs text-zinc-400 pt-8">
              Bấm vào thẻ hoặc nhấn <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">Space</kbd> để xem nghĩa & cách dùng
            </p>
          </div>
        ) : (
          /* BACK SIDE: RICH DETAILS */
          <div className="py-2 space-y-4 animate-fade-in text-left max-h-[520px] overflow-y-auto pr-1">
            {/* Meaning */}
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-0.5">
                Định nghĩa
              </span>
              <h3 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                {currentWord.meaning}
              </h3>
            </div>

            {/* Natural Usage & Purpose */}
            {(currentWord.usage || currentWord.purpose) && (
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-xs space-y-1.5">
                {currentWord.usage && (
                  <div>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">Cách dùng tự nhiên: </span>
                    <span className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{currentWord.usage}</span>
                  </div>
                )}
                {currentWord.purpose && (
                  <div>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">Dùng để làm gì: </span>
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
                      <p className="text-zinc-800 dark:text-zinc-200 font-medium italic">
                        {eIdx + 1}. "{ex.en}"
                      </p>
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
          </div>
        )}

        {/* Bottom card hint */}
        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
          <span>Active Recall</span>
          <span>{isFlipped ? 'Nhấn Space để ẩn' : 'Nhấn Space để lật'}</span>
        </div>
      </div>

      {/* Spaced Repetition Buttons: Review Again vs Mastered */}
      <div className="w-full grid grid-cols-2 gap-3 mt-4">
        <button
          onClick={() => {
            handleToggleMastered(false);
            handleNext();
          }}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-amber-400 dark:hover:border-amber-600 transition-all text-xs font-medium cursor-pointer"
        >
          <RotateCcw size={14} className="text-amber-500" />
          <span>Cần ôn lại</span>
          <kbd className="hidden sm:inline px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-400 font-mono">1</kbd>
        </button>

        <button
          onClick={() => {
            handleToggleMastered(true);
            handleNext();
          }}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all text-xs font-medium cursor-pointer ${
            isCurrentMastered
              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-emerald-400'
          }`}
        >
          <Check size={14} className="text-emerald-500" />
          <span>Đã thuộc từ này</span>
          <kbd className="hidden sm:inline px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-400 font-mono">2</kbd>
        </button>
      </div>

      {/* Prev / Next Navigators */}
      <div className="w-full flex items-center justify-between mt-4">
        <button
          onClick={handlePrev}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
          <span>Từ trước (←)</span>
        </button>

        <div className="text-[11px] text-zinc-400 font-mono">
          Phím tắt: [Space] Lật | [R] Phát âm | [←/→] Chuyển từ
        </div>

        <button
          onClick={handleNext}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg transition-colors cursor-pointer"
        >
          <span>Từ tiếp theo (→)</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
