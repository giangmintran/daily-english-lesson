import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { DailyLesson, ExerciseItem } from '../types/lesson';
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, RotateCcw, Award, Lightbulb, ListFilter, LayoutList, Layers, BookOpen, GripVertical, ArrowLeftRight } from 'lucide-react';
import { saveLesson, normalizeExerciseResults } from '../services/storage';
import { triggerFireworks } from '../utils/confetti';

interface ExerciseViewProps {
  lesson: DailyLesson;
  onUpdateLesson: (updated: DailyLesson) => void;
  onOpenHandbook?: () => void;
}

interface TranslationWordToken {
  id: string;
  word: string;
}

function isTranslationExercise(exercise?: ExerciseItem): boolean {
  if (!exercise) return false;
  return (
    exercise.type === 'translation' ||
    Boolean(exercise.section?.toLowerCase().includes('dịch'))
  );
}

function getShuffledTranslationTokens(
  exerciseId: string | number,
  answer: string
): TranslationWordToken[] {
  const words = answer
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/^[.,!?;:"'()]+|[.,!?;:"'()]+$/g, ''))
    .filter(Boolean);

  const tokens: TranslationWordToken[] = words.map((w, idx) => ({
    id: `${exerciseId}-${idx}`,
    word: w,
  }));

  const shuffled = [...tokens];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // If words.length > 1 and shuffled is accidentally identical to original words order, swap first two
  if (shuffled.length > 1 && shuffled.every((t, i) => t.word === words[i])) {
    const temp = shuffled[0];
    shuffled[0] = shuffled[1];
    shuffled[1] = temp;
  }

  return shuffled;
}

export const ExerciseView: React.FC<ExerciseViewProps> = ({ lesson, onUpdateLesson, onOpenHandbook }) => {
  const [activeSession, setActiveSession] = useState<'all' | 's1' | 's2' | 's3' | 'wrong'>('s1');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [fillInput, setFillInput] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [viewMode, setViewMode] = useState<'focus' | 'list'>('focus');

  // Translation sentence builder state
  const [translationTokensMap, setTranslationTokensMap] = useState<
    Record<string | number, TranslationWordToken[]>
  >({});
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [selectedSwapTokenId, setSelectedSwapTokenId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const touchStateRef = useRef<{
    startX: number;
    startY: number;
    index: number;
    isDragging: boolean;
    targetIndex: number | null;
  } | null>(null);

  // Ref for active question button to auto-scroll into view if scrollable
  const activeBtnRef = useRef<HTMLButtonElement>(null);

  const exerciseResults = useMemo(
    () => normalizeExerciseResults(lesson.progress?.exerciseResults),
    [lesson.progress?.exerciseResults]
  );

  // Filter exercises based on selected session chunk
  const filteredExercises = useMemo(() => {
    const all = lesson.exercises;
    if (activeSession === 's1') return all.slice(0, 20);
    if (activeSession === 's2') return all.slice(20, 40);
    if (activeSession === 's3') return all.slice(40, 60);
    if (activeSession === 'wrong') {
      return all.filter((e) => {
        const res = exerciseResults[e.id];
        return res && !res.isCorrect;
      });
    }
    return all;
  }, [lesson.exercises, activeSession, exerciseResults]);

  // Keep currentIdx within valid range if filtered list size changes (e.g. fixing a wrong question)
  useEffect(() => {
    if (filteredExercises.length > 0 && currentIdx >= filteredExercises.length) {
      setCurrentIdx(filteredExercises.length - 1);
    }
  }, [filteredExercises.length, currentIdx]);

  const currentExercise: ExerciseItem | undefined = filteredExercises[currentIdx];
  const currentResult = currentExercise ? exerciseResults[currentExercise.id] : undefined;

  // Translation tokens for current exercise
  const currentTokens = useMemo(() => {
    if (!currentExercise || !isTranslationExercise(currentExercise)) return [];
    if (translationTokensMap[currentExercise.id]) {
      return translationTokensMap[currentExercise.id];
    }
    return getShuffledTranslationTokens(currentExercise.id, currentExercise.answer);
  }, [currentExercise, translationTokensMap]);

  const tokenMap = useMemo(() => {
    const map = new Map<string, TranslationWordToken>();
    currentTokens.forEach((t) => map.set(t.id, t));
    return map;
  }, [currentTokens]);

  const assembledSentence = useMemo(() => {
    return selectedWordIds
      .map((id) => tokenMap.get(id)?.word)
      .filter(Boolean)
      .join(' ');
  }, [selectedWordIds, tokenMap]);

  const selectedSwapToken = useMemo(() => {
    if (!selectedSwapTokenId) return null;
    return tokenMap.get(selectedSwapTokenId) || null;
  }, [selectedSwapTokenId, tokenMap]);

  const isCurrentSessionComplete = useMemo(() => {
    return (
      filteredExercises.length > 0 &&
      filteredExercises.every((e) => Boolean(exerciseResults[e.id]))
    );
  }, [filteredExercises, exerciseResults]);

  // Sync state when current question changes
  useEffect(() => {
    if (!currentExercise) return;

    if (isTranslationExercise(currentExercise)) {
      // Ensure tokens exist in translationTokensMap
      let tokens = translationTokensMap[currentExercise.id];
      if (!tokens) {
        tokens = getShuffledTranslationTokens(currentExercise.id, currentExercise.answer);
        setTranslationTokensMap((prev) => ({
          ...prev,
          [currentExercise.id]: tokens,
        }));
      }

      // If already answered, restore selected word chips
      if (currentResult?.userAnswer) {
        const userWords = currentResult.userAnswer
          .trim()
          .split(/\s+/)
          .map((w) => w.replace(/^[.,!?;:"'()]+|[.,!?;:"'()]+$/g, ''))
          .filter(Boolean);

        const restoredIds: string[] = [];
        const usedTokenIds = new Set<string>();

        userWords.forEach((word) => {
          const matched = tokens.find(
            (t) =>
              !usedTokenIds.has(t.id) &&
              t.word.toLowerCase() === word.toLowerCase()
          );
          if (matched) {
            restoredIds.push(matched.id);
            usedTokenIds.add(matched.id);
          }
        });

        setSelectedWordIds(restoredIds);
        setIsAnswered(true);
      } else {
        setSelectedWordIds([]);
        setIsAnswered(false);
      }
      setSelectedSwapTokenId(null);
      setDraggedIndex(null);
      setDragOverIndex(null);
    } else {
      // Regular fill in the blank / other inputs
      if (currentResult) {
        setFillInput(currentResult.userAnswer || '');
        setIsAnswered(true);
      } else {
        setFillInput('');
        setIsAnswered(false);
      }
    }
  }, [currentIdx, currentResult, activeSession, currentExercise]);

  // Auto-scroll active question button into view if in a scrollable list
  useEffect(() => {
    if (activeBtnRef.current) {
      activeBtnRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentIdx]);

  const handleNext = useCallback(() => {
    if (currentIdx < filteredExercises.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  }, [currentIdx, filteredExercises.length]);

  const handlePrev = useCallback(() => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  }, [currentIdx]);

  const handleAnswerSubmit = useCallback(
    (userAnswerText: string) => {
      if (!currentExercise) return;

      const cleanUser = userAnswerText.trim().toLowerCase().replace(/[.,!?;:]/g, '');
      const cleanTarget = currentExercise.answer.trim().toLowerCase().replace(/[.,!?;:]/g, '');
      const isCorrect = cleanUser === cleanTarget;

      const currentProgress = lesson.progress || {
        wordsMastered: [],
        exerciseResults: {},
      };
      const nextResults = { ...(currentProgress.exerciseResults || {}) };
      nextResults[currentExercise.id] = {
        userAnswer: userAnswerText.trim(),
        isCorrect,
      };

      const updatedProgress = {
        wordsMastered: currentProgress.wordsMastered || [],
        exerciseResults: nextResults,
      };

      const updated: DailyLesson = {
        ...lesson,
        progress: updatedProgress,
      };

      saveLesson(updated);
      onUpdateLesson(updated);

      setIsAnswered(true);
      setSelectedSwapTokenId(null);
      setDraggedIndex(null);
      setDragOverIndex(null);

      // Bắn hiệu ứng pháo hoa khi hoàn thành bài tập / phiên học và làm đúng câu cuối
      if (isCorrect) {
        const wasAlreadyCorrect = Boolean(exerciseResults[currentExercise.id]?.isCorrect);

        // Chỉ kích hoạt khi câu này chưa đúng trước đó (lần đầu làm đúng hoặc vừa sửa từ sai sang đúng)
        if (!wasAlreadyCorrect) {
          // Kiểm tra xem tất cả câu trong phiên hiện tại đã được làm hay chưa
          const isSessionComplete =
            filteredExercises.length > 0 &&
            filteredExercises.every((e) => Boolean(nextResults[e.id]));

          // Kiểm tra xem tất cả câu trong toàn bộ bài học đã được làm hay chưa
          const isLessonComplete =
            lesson.exercises.length > 0 &&
            lesson.exercises.every((e) => Boolean(nextResults[e.id]));

          if (isSessionComplete || isLessonComplete) {
            triggerFireworks();
          }
        }
      }
    },
    [currentExercise, lesson, exerciseResults, filteredExercises, onUpdateLesson]
  );

  // Word token click handlers for translation sentence builder
  const handleSelectWordToken = useCallback(
    (tokenId: string) => {
      if (isAnswered) setIsAnswered(false);
      setSelectedSwapTokenId(null);
      setSelectedWordIds((prev) => {
        if (prev.includes(tokenId)) return prev;
        return [...prev, tokenId];
      });
    },
    [isAnswered]
  );

  const handleRemoveSelectedWord = useCallback(
    (tokenId: string) => {
      if (isAnswered) setIsAnswered(false);
      setSelectedSwapTokenId((prev) => (prev === tokenId ? null : prev));
      setSelectedWordIds((prev) => prev.filter((id) => id !== tokenId));
    },
    [isAnswered]
  );

  const handleUndoWord = useCallback(() => {
    if (isAnswered) setIsAnswered(false);
    setSelectedWordIds((prev) => {
      const removedId = prev[prev.length - 1];
      if (removedId) {
        setSelectedSwapTokenId((s) => (s === removedId ? null : s));
      }
      return prev.slice(0, -1);
    });
  }, [isAnswered]);

  const handleResetWords = useCallback(() => {
    if (isAnswered) setIsAnswered(false);
    setSelectedSwapTokenId(null);
    setSelectedWordIds([]);
  }, [isAnswered]);

  // Word position manipulation handlers (Drag & Drop, Swap, Shift)
  const handleMoveWord = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      if (isAnswered) setIsAnswered(false);
      setSelectedWordIds((prev) => {
        if (fromIndex < 0 || fromIndex >= prev.length || toIndex < 0 || toIndex >= prev.length) {
          return prev;
        }
        const updated = [...prev];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        return updated;
      });
    },
    [isAnswered]
  );

  const handleSwapWords = useCallback(
    (indexA: number, indexB: number) => {
      if (indexA === indexB) return;
      if (isAnswered) setIsAnswered(false);
      setSelectedWordIds((prev) => {
        if (indexA < 0 || indexA >= prev.length || indexB < 0 || indexB >= prev.length) {
          return prev;
        }
        const updated = [...prev];
        const temp = updated[indexA];
        updated[indexA] = updated[indexB];
        updated[indexB] = temp;
        return updated;
      });
    },
    [isAnswered]
  );

  const handleShiftWordLeft = useCallback(
    (index: number) => {
      if (index <= 0) return;
      handleMoveWord(index, index - 1);
    },
    [handleMoveWord]
  );

  const handleShiftWordRight = useCallback(
    (index: number) => {
      handleMoveWord(index, index + 1);
    },
    [handleMoveWord]
  );

  // Switch question to edit mode so user can change answer freely
  const handleStartEdit = useCallback(() => {
    setIsAnswered(false);
    setSelectedSwapTokenId(null);
    setDraggedIndex(null);
    setDragOverIndex(null);
    if (currentResult && currentExercise) {
      if (!isTranslationExercise(currentExercise) && currentExercise.type === 'fill_in_blank') {
        setFillInput(currentResult.userAnswer || fillInput);
      }
    }
  }, [currentResult, currentExercise, fillInput]);

  // Keyboard shortcut for Multiple Choice, Translation & Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentExercise) return;

      // Allow typing in fill_in_blank input
      if (!isTranslationExercise(currentExercise) && currentExercise.type === 'fill_in_blank') {
        if (e.key === 'Enter' && !isAnswered && fillInput.trim()) {
          e.preventDefault();
          handleAnswerSubmit(fillInput);
        } else if (e.key === 'Enter' && isAnswered) {
          e.preventDefault();
          handleNext();
        }
        return;
      }

      // Translation sentence builder keyboard shortcuts
      if (isTranslationExercise(currentExercise)) {
        // Translation word reordering shortcuts when a word is selected
        if (selectedSwapTokenId) {
          const sIdx = selectedWordIds.indexOf(selectedSwapTokenId);
          if (sIdx !== -1) {
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              handleShiftWordLeft(sIdx);
              return;
            }
            if (e.key === 'ArrowRight') {
              e.preventDefault();
              handleShiftWordRight(sIdx);
              return;
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              setSelectedSwapTokenId(null);
              return;
            }
          }
        }

        if (e.key === 'Enter') {
          e.preventDefault();
          if (!isAnswered) {
            if (selectedWordIds.length > 0) {
              handleAnswerSubmit(assembledSentence);
            }
          } else {
            handleNext();
          }
          return;
        }

        if (e.key === 'Backspace' && !isAnswered && selectedWordIds.length > 0) {
          if (!['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
            e.preventDefault();
            handleUndoWord();
            return;
          }
        }
      }

      // Multiple choice shortcuts (1, 2, 3, 4) - allows answering or changing answer
      if (currentExercise.type === 'multiple_choice' && currentExercise.options) {
        const optNum = parseInt(e.key, 10);
        if (optNum >= 1 && optNum <= currentExercise.options.length) {
          e.preventDefault();
          handleAnswerSubmit(currentExercise.options[optNum - 1]);
          return;
        }
      }

      // Shortcut 'r' or 'R' to retry/edit
      if ((e.key === 'r' || e.key === 'R') && isAnswered) {
        e.preventDefault();
        handleStartEdit();
        return;
      }

      if (e.key === 'ArrowRight' && isAnswered) {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentExercise,
    isAnswered,
    fillInput,
    selectedWordIds,
    assembledSentence,
    selectedSwapTokenId,
    handleAnswerSubmit,
    handleStartEdit,
    handleNext,
    handlePrev,
    handleUndoWord,
    handleShiftWordLeft,
    handleShiftWordRight,
  ]);

  // Count wrong exercises
  const wrongCount = useMemo(() => {
    return Object.values(exerciseResults).filter((r) => !r.isCorrect).length;
  }, [exerciseResults]);

  // Compute stats for each session
  const sessionStats = useMemo(() => {
    const calc = (items: ExerciseItem[]) => {
      const total = items.length;
      let done = 0;
      let correct = 0;
      items.forEach((item) => {
        const res = exerciseResults[item.id];
        if (res) {
          done++;
          if (res.isCorrect) correct++;
        }
      });
      return {
        total,
        done,
        correct,
        isComplete: total > 0 && done === total,
      };
    };

    const all = lesson.exercises;
    return {
      s1: calc(all.slice(0, 20)),
      s2: calc(all.slice(20, 40)),
      s3: calc(all.slice(40, 60)),
      all: calc(all),
    };
  }, [lesson.exercises, exerciseResults]);

  const getSessionLabel = (sessionKey: 's1' | 's2' | 's3' | 'all' | 'wrong') => {
    switch (sessionKey) {
      case 's1':
        return 'Phiên 1 (1 - 20)';
      case 's2':
        return 'Phiên 2 (21 - 40)';
      case 's3':
        return 'Phiên 3 (41 - 60)';
      case 'all':
        return `Tất cả (${lesson.exercises.length} câu)`;
      case 'wrong':
        return `Làm lại (${wrongCount} câu sai)`;
    }
  };

  if (lesson.exercises.length === 0) {
    return (
      <div className="text-center py-20 text-zinc-500">
        Không có bài tập nào trong bài học này.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-3 sm:py-6 px-3 sm:px-4 animate-fade-in space-y-4">
      {/* ========================================================= */}
      {/* 1. KHU VỰC CHỌN PHIÊN HỌC (TỐI ƯU CHO ĐIỆN THOẠI & MÁY TÍNH) */}
      {/* ========================================================= */}
      <div className="space-y-2">
        {/* Hàng 1: 3 Phiên học chính (Chia 3 cột đều trên điện thoại, không bị cuộn ngang hay mất nút) */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {/* Phiên 1 */}
          <button
            onClick={() => {
              setActiveSession('s1');
              setCurrentIdx(0);
            }}
            className={`p-2 sm:px-3 sm:py-2.5 rounded-2xl transition-all cursor-pointer text-left flex flex-col justify-between ${
              activeSession === 's1'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm ring-1 ring-zinc-900 dark:ring-zinc-100'
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs sm:text-sm">Phiên 1</span>
              {sessionStats.s1.isComplete && (
                <CheckCircle2
                  size={13}
                  className={activeSession === 's1' ? 'text-emerald-400 dark:text-emerald-600' : 'text-emerald-500'}
                />
              )}
            </div>
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono mt-1 opacity-80">
              <span>1 - 20</span>
              <span className="font-semibold">{sessionStats.s1.done}/20</span>
            </div>
          </button>

          {/* Phiên 2 */}
          {lesson.exercises.length > 20 ? (
            <button
              onClick={() => {
                setActiveSession('s2');
                setCurrentIdx(0);
              }}
              className={`p-2 sm:px-3 sm:py-2.5 rounded-2xl transition-all cursor-pointer text-left flex flex-col justify-between ${
                activeSession === 's2'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm ring-1 ring-zinc-900 dark:ring-zinc-100'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs sm:text-sm">Phiên 2</span>
                {sessionStats.s2.isComplete && (
                  <CheckCircle2
                    size={13}
                    className={activeSession === 's2' ? 'text-emerald-400 dark:text-emerald-600' : 'text-emerald-500'}
                  />
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono mt-1 opacity-80">
                <span>21 - 40</span>
                <span className="font-semibold">{sessionStats.s2.done}/20</span>
              </div>
            </button>
          ) : (
            <div className="opacity-30 p-2 border border-dashed rounded-2xl text-center text-xs flex items-center justify-center">
              --
            </div>
          )}

          {/* Phiên 3 */}
          {lesson.exercises.length > 40 ? (
            <button
              onClick={() => {
                setActiveSession('s3');
                setCurrentIdx(0);
              }}
              className={`p-2 sm:px-3 sm:py-2.5 rounded-2xl transition-all cursor-pointer text-left flex flex-col justify-between ${
                activeSession === 's3'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm ring-1 ring-zinc-900 dark:ring-zinc-100'
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs sm:text-sm">Phiên 3</span>
                {sessionStats.s3.isComplete && (
                  <CheckCircle2
                    size={13}
                    className={activeSession === 's3' ? 'text-emerald-400 dark:text-emerald-600' : 'text-emerald-500'}
                  />
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono mt-1 opacity-80">
                <span>41 - 60</span>
                <span className="font-semibold">{sessionStats.s3.done}/20</span>
              </div>
            </button>
          ) : (
            <div className="opacity-30 p-2 border border-dashed rounded-2xl text-center text-xs flex items-center justify-center">
              --
            </div>
          )}
        </div>

        {/* Hàng 2: Tất cả, Làm lại câu sai & Chuyển chế độ xem */}
        <div className="flex items-center justify-between gap-1.5 pt-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Nút Tất cả */}
            <button
              onClick={() => {
                setActiveSession('all');
                setCurrentIdx(0);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeSession === 'all'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <span>Tất cả ({lesson.exercises.length})</span>
            </button>

            {/* Nút Làm lại câu sai */}
            {wrongCount > 0 && (
              <button
                onClick={() => {
                  setActiveSession('wrong');
                  setCurrentIdx(0);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeSession === 'wrong'
                    ? 'bg-red-500 text-white shadow-xs'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20'
                }`}
              >
                <XCircle size={13} />
                <span>Làm lại câu sai ({wrongCount})</span>
              </button>
            )}
          </div>

          {/* Nút Mở Sổ tay các thì */}
          {onOpenHandbook && (
            <button
              onClick={onOpenHandbook}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              title="Mở Sổ tay 12 thì Tiếng Anh"
            >
              <BookOpen size={14} />
              <span className="hidden sm:inline">Sổ tay các thì</span>
            </button>
          )}

          {/* Nút Đổi chế độ xem */}
          <button
            onClick={() => setViewMode(viewMode === 'focus' ? 'list' : 'focus')}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
            title="Đổi giữa chế độ tập trung và danh sách"
          >
            {viewMode === 'focus' ? <LayoutList size={14} /> : <ListFilter size={14} />}
            <span className="hidden sm:inline">
              {viewMode === 'focus' ? 'Xem danh sách' : 'Tập trung'}
            </span>
          </button>
        </div>
      </div>

      {filteredExercises.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-3xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6">
          <Award size={36} className="mx-auto text-emerald-500 mb-3" />
          <h4 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            {activeSession === 'wrong' ? 'Tuyệt vời! Không có câu sai nào.' : 'Không có câu hỏi trong phiên này.'}
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            {activeSession === 'wrong' ? 'Bạn đã làm chính xác toàn bộ bài tập.' : 'Hãy chọn phiên khác để tiếp tục.'}
          </p>
          <button
            onClick={() => setActiveSession('s1')}
            className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium cursor-pointer"
          >
            Về Phiên 1
          </button>
        </div>
      ) : viewMode === 'focus' ? (
        /* ========================================================= */
        /* 2. CHẾ ĐỘ TẬP TRUNG (FOCUS MODE): 1 CÂU TẠI 1 THỜI ĐIỂM  */
        /* ========================================================= */
        <div className="space-y-4">
          {/* ======================================================= */}
          {/* 3. BẢNG SỐ THỨ TỰ (QUESTION NUMBERS MATRIX TRÊN MOBILE) */}
          {/* ======================================================= */}
          <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2.5 sm:p-3 space-y-2">
            {/* Thanh tiêu đề bảng số thứ tự & thống kê tiến độ */}
            <div className="flex items-center justify-between text-xs text-zinc-500 px-0.5">
              <div className="flex items-center gap-1.5 font-medium">
                <Layers size={13} className="text-blue-500" />
                <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                  {getSessionLabel(activeSession)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Đúng: {filteredExercises.filter((e) => exerciseResults[e.id]?.isCorrect).length}
                </span>
                <span>•</span>
                <span className="text-zinc-500">
                  Đã làm: {filteredExercises.filter((e) => exerciseResults[e.id]).length}/{filteredExercises.length}
                </span>
              </div>
            </div>

            {/* BẢNG SỐ THỨ TỰ:
                - Đối với các phiên 20 câu: Hiển thị 2 hàng x 10 cột vừa khít màn hình điện thoại, KHÔNG cần cuộn ngang!
                - Mỗi nút số hiển thị ĐÚNG ID câu hỏi (e.id), ví dụ Phiên 2 là câu 21..40 chứ không bị nhầm thành 1..20!
            */}
            <div
              className={`grid grid-cols-10 gap-1 sm:gap-1.5 ${
                filteredExercises.length > 20 ? 'max-h-32 sm:max-h-40 overflow-y-auto no-scrollbar pr-0.5' : ''
              }`}
            >
              {filteredExercises.map((e, idx) => {
                const res = exerciseResults[e.id];
                const isCur = idx === currentIdx;
                const questionNumber = e.id; // Hiển thị số thứ tự gốc chính xác (1..20, 21..40, 41..60)

                let btnStyle =
                  'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700';

                if (isCur) {
                  if (res?.isCorrect) {
                    btnStyle =
                      'ring-2 ring-emerald-500 bg-emerald-600 text-white font-bold shadow-xs scale-105 z-10';
                  } else if (res && !res.isCorrect) {
                    btnStyle =
                      'ring-2 ring-red-500 bg-red-600 text-white font-bold shadow-xs scale-105 z-10';
                  } else {
                    btnStyle =
                      'ring-2 ring-zinc-900 dark:ring-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold shadow-xs scale-105 z-10';
                  }
                } else if (res) {
                  if (res.isCorrect) {
                    btnStyle =
                      'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30';
                  } else {
                    btnStyle =
                      'bg-red-500/20 text-red-700 dark:text-red-300 font-bold border border-red-500/30';
                  }
                }

                return (
                  <button
                    key={e.id}
                    ref={isCur ? activeBtnRef : undefined}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-8 sm:h-9 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-mono font-medium flex items-center justify-center transition-all cursor-pointer active:scale-95 ${btnStyle}`}
                    title={`Câu ${questionNumber}`}
                  >
                    {questionNumber}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ======================================================= */}
          {/* 4. KHUNG NỘI DUNG CÂU HỎI HIỆN TẠI                      */}
          {/* ======================================================= */}
          {currentExercise && (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 sm:p-7 md:p-8 bg-white dark:bg-zinc-900 shadow-xs space-y-4 sm:space-y-6">
              {/* Tiêu đề & Thông tin câu hỏi */}
              <div className="flex items-center justify-between text-xs text-zinc-400 gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    Câu #{currentExercise.id}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    {currentIdx + 1}/{filteredExercises.length} trong phiên
                  </span>
                  {currentExercise.section && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      {currentExercise.section}
                    </span>
                  )}
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 capitalize">
                    {currentExercise.type === 'multiple_choice'
                      ? 'Trắc nghiệm'
                      : isTranslationExercise(currentExercise)
                      ? 'Dịch câu (Ghép từ)'
                      : currentExercise.type === 'verb_conjugation'
                      ? 'Chia động từ'
                      : currentExercise.type === 'meaning_check'
                      ? 'Kiểm tra nghĩa'
                      : currentExercise.type === 'sentence_writing'
                      ? 'Tự đặt câu'
                      : 'Điền từ'}
                  </span>
                </div>

                {currentResult && (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span
                      className={`flex items-center gap-1 font-semibold font-mono text-xs px-2.5 py-1 rounded-md shrink-0 ${
                        currentResult.isCorrect
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {currentResult.isCorrect ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      <span>{currentResult.isCorrect ? 'Chính xác' : 'Chưa đúng'}</span>
                    </span>

                    {isAnswered ? (
                      <button
                        onClick={handleStartEdit}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                        title="Sửa lại đáp án (phím tắt R)"
                      >
                        <RotateCcw size={12} />
                        <span>Sửa đáp án</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                        Đang sửa...
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Nội dung đề bài */}
              <div className="text-base sm:text-lg font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed">
                {currentExercise.question}
              </div>

              {/* Tương tác đáp án: Trắc nghiệm hoặc Điền từ */}
              {currentExercise.type === 'multiple_choice' && currentExercise.options ? (
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-1 gap-2">
                    {currentExercise.options.map((option, optIdx) => {
                      const isSelected = currentResult?.userAnswer === option;
                      const isCorrectAnswer = option === currentExercise.answer;

                      let btnStyle =
                        'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 text-zinc-800 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-600';

                      if (isAnswered) {
                        if (isCorrectAnswer) {
                          btnStyle =
                            'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs';
                        } else if (isSelected && !currentResult?.isCorrect) {
                          btnStyle =
                            'border-red-500 bg-red-500/15 text-red-700 dark:text-red-300 font-medium';
                        } else {
                          btnStyle =
                            'border-zinc-200 dark:border-zinc-800 opacity-60 hover:opacity-100 hover:border-zinc-400 dark:hover:border-zinc-600';
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleAnswerSubmit(option)}
                          className={`w-full p-3 sm:p-4 rounded-2xl border text-left text-sm sm:text-base transition-all flex items-start sm:items-center justify-between gap-3 cursor-pointer active:scale-[0.99] ${btnStyle}`}
                        >
                          <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-semibold flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                              {optIdx + 1}
                            </span>
                            <span className="break-words leading-snug sm:leading-normal">{option}</span>
                          </div>
                          {isAnswered && isCorrectAnswer && (
                            <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5 sm:mt-0" />
                          )}
                          {isAnswered && isSelected && !currentResult?.isCorrect && (
                            <XCircle size={18} className="text-red-500 shrink-0 mt-0.5 sm:mt-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Nút hỗ trợ chọn lại khi đã kiểm tra xong */}
                  {isAnswered && (
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={handleStartEdit}
                        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <RotateCcw size={13} />
                        <span>Sửa lại / Chọn lại đáp án</span>
                      </button>
                      <span className="text-[11px] text-zinc-400 hidden sm:inline">
                        (Bạn cũng có thể bấm trực tiếp vào đáp án khác để sửa)
                      </span>
                    </div>
                  )}
                </div>
              ) : isTranslationExercise(currentExercise) ? (
                /* Ghép từ dịch sang tiếng Anh (Translation Sentence Builder) */
                <div className="space-y-3 pt-1">
                  {/* Hướng dẫn & Nút chức năng */}
                  <div className="flex items-center justify-between text-xs text-zinc-500 flex-wrap gap-2">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      Chọn các từ bên dưới để ghép thành câu dịch hoàn chỉnh:
                    </span>

                    {selectedWordIds.length > 0 && !isAnswered && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleUndoWord}
                          className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs flex items-center gap-1 cursor-pointer"
                          title="Xóa từ vừa chọn cuối cùng (Backspace)"
                        >
                          <RotateCcw size={12} />
                          <span>Xóa từ cuối</span>
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={handleResetWords}
                          className="text-rose-500 hover:text-rose-600 text-xs cursor-pointer font-medium"
                        >
                          Xóa hết
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Thanh thông báo & Hướng dẫn đổi vị trí khi đang chọn từ */}
                  {selectedSwapToken && !isAnswered ? (
                    <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-xl text-xs animate-fade-in shadow-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <ArrowLeftRight size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>
                          Đang chọn: <strong className="font-semibold underline decoration-blue-400">"{selectedSwapToken.word}"</strong>
                        </span>
                        <span className="text-[11px] opacity-85">
                          • Bấm từ khác để đổi chỗ, hoặc bấm ‹ › để dịch chuyển
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedSwapTokenId(null)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 ml-2 cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : selectedWordIds.length >= 2 && !isAnswered ? (
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 px-1">
                      <ArrowLeftRight size={12} className="text-blue-500 shrink-0" />
                      <span>
                        Mẹo: Bạn có thể kéo thả từ hoặc bấm chọn 2 từ để đổi vị trí cho nhau
                      </span>
                    </div>
                  ) : null}

                  {/* Khung câu đang ghép (Assembled Sentence Box - Hỗ trợ kéo thả & đổi vị trí) */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                      if (e.target === e.currentTarget && draggedIndex !== null) {
                        e.preventDefault();
                        handleMoveWord(draggedIndex, selectedWordIds.length - 1);
                        setDraggedIndex(null);
                        setDragOverIndex(null);
                      }
                    }}
                    className={`w-full min-h-[75px] sm:min-h-[90px] p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex flex-wrap gap-2 items-center ${
                      isAnswered
                        ? currentResult?.isCorrect
                          ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10'
                          : 'border-rose-500/40 bg-rose-500/5 dark:bg-rose-500/10'
                        : selectedWordIds.length > 0
                        ? 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950'
                        : 'border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40'
                    }`}
                  >
                    {selectedWordIds.length === 0 ? (
                      <span className="text-zinc-400 dark:text-zinc-500 text-xs sm:text-sm select-none italic">
                        Bấm vào các từ bên dưới theo thứ tự để ghép thành câu dịch...
                      </span>
                    ) : (
                      selectedWordIds.map((id, index) => {
                        const token = tokenMap.get(id);
                        if (!token) return null;

                        const isSelectedForSwap = selectedSwapTokenId === id;
                        const isBeingDragged = draggedIndex === index;
                        const isDropTarget = dragOverIndex === index && draggedIndex !== index;

                        return (
                          <div
                            key={id}
                            data-word-index={index}
                            draggable={!isAnswered}
                            onDragStart={(e) => {
                              if (isAnswered) setIsAnswered(false);
                              e.dataTransfer.setData('text/plain', String(index));
                              e.dataTransfer.effectAllowed = 'move';
                              setDraggedIndex(index);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                            }}
                            onDragEnter={(e) => {
                              e.preventDefault();
                              if (draggedIndex !== null && draggedIndex !== index) {
                                setDragOverIndex(index);
                              }
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (draggedIndex !== null && draggedIndex !== index) {
                                handleMoveWord(draggedIndex, index);
                              }
                              setDraggedIndex(null);
                              setDragOverIndex(null);
                            }}
                            onDragEnd={() => {
                              setDraggedIndex(null);
                              setDragOverIndex(null);
                            }}
                            onTouchStart={(e) => {
                              if (isAnswered) setIsAnswered(false);
                              const touch = e.touches[0];
                              touchStateRef.current = {
                                startX: touch.clientX,
                                startY: touch.clientY,
                                index,
                                isDragging: false,
                                targetIndex: null,
                              };
                            }}
                            onTouchMove={(e) => {
                              if (!touchStateRef.current) return;
                              const touch = e.touches[0];
                              const dx = Math.abs(touch.clientX - touchStateRef.current.startX);
                              const dy = Math.abs(touch.clientY - touchStateRef.current.startY);

                              if (!touchStateRef.current.isDragging && (dx > 7 || dy > 7)) {
                                touchStateRef.current.isDragging = true;
                                setDraggedIndex(index);
                              }

                              if (touchStateRef.current.isDragging) {
                                const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
                                const chipEl = targetEl?.closest('[data-word-index]');
                                if (chipEl) {
                                  const targetIdx = Number(chipEl.getAttribute('data-word-index'));
                                  if (!isNaN(targetIdx) && targetIdx !== touchStateRef.current.targetIndex) {
                                    touchStateRef.current.targetIndex = targetIdx;
                                    setDragOverIndex(targetIdx);
                                  }
                                }
                              }
                            }}
                            onTouchEnd={() => {
                              if (touchStateRef.current) {
                                if (
                                  touchStateRef.current.isDragging &&
                                  touchStateRef.current.targetIndex !== null &&
                                  touchStateRef.current.targetIndex !== touchStateRef.current.index
                                ) {
                                  handleMoveWord(touchStateRef.current.index, touchStateRef.current.targetIndex);
                                }
                                touchStateRef.current = null;
                                setDraggedIndex(null);
                                setDragOverIndex(null);
                              }
                            }}
                            onClick={() => {
                              if (isAnswered) setIsAnswered(false);
                              if (!selectedSwapTokenId) {
                                setSelectedSwapTokenId(id);
                              } else if (selectedSwapTokenId === id) {
                                setSelectedSwapTokenId(null);
                              } else {
                                const idxA = selectedWordIds.indexOf(selectedSwapTokenId);
                                const idxB = index;
                                if (idxA !== -1 && idxB !== -1) {
                                  handleSwapWords(idxA, idxB);
                                }
                                setSelectedSwapTokenId(null);
                              }
                            }}
                            className={`relative px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border text-xs sm:text-sm font-medium transition-all shadow-xs flex items-center gap-1.5 select-none touch-none cursor-pointer ${
                              isAnswered
                                ? currentResult?.isCorrect
                                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-rose-500/15 border-rose-500/30 text-rose-800 dark:text-rose-300'
                                : isBeingDragged
                                ? 'opacity-40 scale-95 border-dashed border-blue-400 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-400'
                                : isDropTarget
                                ? 'ring-2 ring-blue-500 scale-105 border-blue-500 bg-blue-100/70 dark:bg-blue-900/50 z-10'
                                : isSelectedForSwap
                                ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shadow-sm'
                                : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:border-blue-400 dark:hover:border-blue-500 active:scale-95'
                            }`}
                            title={
                              isAnswered
                                ? ''
                                : isSelectedForSwap
                                ? 'Đang chọn từ này. Bấm từ khác để đổi chỗ hoặc dùng ‹ › để dịch chuyển'
                                : 'Kéo thả để di chuyển, hoặc bấm để đổi chỗ với từ khác'
                            }
                          >
                            {/* Drag Grip Handle */}
                            {!isAnswered && (
                              <GripVertical
                                size={13}
                                className={`shrink-0 cursor-grab active:cursor-grabbing ${
                                  isSelectedForSwap
                                    ? 'text-blue-500'
                                    : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
                                }`}
                              />
                            )}

                            {/* Shift Left Arrow (shown when selected) */}
                            {!isAnswered && isSelectedForSwap && (
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShiftWordLeft(index);
                                }}
                                className="p-0.5 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 disabled:opacity-20 cursor-pointer transition-colors"
                                title="Dịch sang trái"
                              >
                                <ChevronLeft size={13} />
                              </button>
                            )}

                            {/* Word text */}
                            <span className="leading-none">{token.word}</span>

                            {/* Shift Right Arrow (shown when selected) */}
                            {!isAnswered && isSelectedForSwap && (
                              <button
                                type="button"
                                disabled={index === selectedWordIds.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShiftWordRight(index);
                                }}
                                className="p-0.5 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 disabled:opacity-20 cursor-pointer transition-colors"
                                title="Dịch sang phải"
                              >
                                <ChevronRight size={13} />
                              </button>
                            )}

                            {/* Remove Button */}
                            {!isAnswered && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (selectedSwapTokenId === id) setSelectedSwapTokenId(null);
                                  handleRemoveSelectedWord(id);
                                }}
                                className="w-4 h-4 rounded-full flex items-center justify-center text-xs text-zinc-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 transition-colors ml-0.5 cursor-pointer"
                                title="Gỡ từ này ra khỏi câu"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Ngân hàng từ sắp xếp ngẫu nhiên (Shuffled Word Pool) */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/30 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Ngân hàng từ:</span>
                      <span className="font-mono text-[11px]">
                        {selectedWordIds.length}/{currentTokens.length} từ đã chọn
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {currentTokens.map((token) => {
                        const isChosen = selectedWordIds.includes(token.id);
                        return isChosen ? (
                          <div
                            key={token.id}
                            className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-zinc-200/40 dark:bg-zinc-800/40 border border-dashed border-zinc-200 dark:border-zinc-700/60 text-transparent select-none text-xs sm:text-sm"
                            aria-hidden="true"
                          >
                            {token.word}
                          </div>
                        ) : (
                          <button
                            key={token.id}
                            type="button"
                            disabled={isAnswered}
                            onClick={() => handleSelectWordToken(token.id)}
                            className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium text-xs sm:text-sm shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                          >
                            {token.word}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Nút Kiểm tra / Sửa đáp án */}
                  <div className="flex items-center gap-2 pt-1">
                    {!isAnswered ? (
                      <button
                        type="button"
                        disabled={selectedWordIds.length === 0}
                        onClick={() => handleAnswerSubmit(assembledSentence)}
                        className="px-6 py-3 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs sm:text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 cursor-pointer transition-all active:scale-95 shadow-xs"
                      >
                        {currentResult ? 'Cập nhật đáp án' : 'Kiểm tra đáp án'}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={handleStartEdit}
                          className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-xs"
                        >
                          <RotateCcw size={13} />
                          <span>Sửa lại câu này</span>
                        </button>
                        <span className="text-xs text-zinc-400">
                          (Bạn có thể kéo thả, đổi chỗ hoặc gỡ từ để chọn lại)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Hiển thị đáp án đúng sau khi kiểm tra */}
                  {isAnswered && (
                    <div className="text-xs sm:text-sm font-medium pt-1">
                      Đáp án chính xác:{' '}
                      <strong className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {currentExercise.answer}
                      </strong>
                    </div>
                  )}
                </div>
              ) : (
                /* Điền từ khuyết / Chia động từ */
                <div className="space-y-3 pt-1">
                  {/* Ngân hàng từ (Word Bank) nếu có */}
                  {currentExercise.wordBank && currentExercise.wordBank.length > 0 && (
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <span className="font-medium flex items-center gap-1.5">
                          <span className="text-zinc-800 dark:text-zinc-200 font-semibold">Ngân hàng từ:</span>
                          <span className="text-[11px] text-zinc-400 font-normal">(Bấm để chọn từ)</span>
                        </span>
                        <span className="text-[10px] font-mono opacity-70">
                          {currentExercise.wordBank.length} từ
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {currentExercise.wordBank.map((word, wIdx) => {
                          const isChosen = fillInput.trim().toLowerCase() === word.trim().toLowerCase();
                          return (
                            <button
                              key={wIdx}
                              type="button"
                              onClick={() => {
                                setFillInput(word);
                                if (isAnswered) setIsAnswered(false);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer active:scale-95 ${
                                isChosen
                                  ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400'
                                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-300'
                              }`}
                            >
                              {word}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={fillInput}
                      onChange={(e) => {
                        setFillInput(e.target.value);
                        if (isAnswered) setIsAnswered(false);
                      }}
                      placeholder="Gõ từ cần điền..."
                      className="flex-1 px-4 py-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-base focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    />
                    {!isAnswered ? (
                      <button
                        disabled={!fillInput.trim()}
                        onClick={() => handleAnswerSubmit(fillInput)}
                        className="px-5 sm:px-6 py-3 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs sm:text-sm font-semibold hover:bg-zinc-800 disabled:opacity-40 cursor-pointer transition-all active:scale-95 shrink-0"
                      >
                        {currentResult ? 'Cập nhật' : 'Kiểm tra'}
                      </button>
                    ) : (
                      <button
                        onClick={handleStartEdit}
                        className="px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs cursor-pointer active:scale-95 flex items-center gap-1.5 shrink-0"
                        title="Sửa lại câu này"
                      >
                        <RotateCcw size={15} />
                        <span className="hidden sm:inline">Sửa lại</span>
                      </button>
                    )}
                  </div>

                  {isAnswered && (
                    <div className="text-xs sm:text-sm font-medium">
                      Đáp án đúng:{' '}
                      <strong className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {currentExercise.answer}
                      </strong>
                    </div>
                  )}
                </div>
              )}

              {/* Giải thích chi tiết */}
              {isAnswered && currentExercise.explanation && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 text-xs sm:text-sm space-y-1 animate-fade-in">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300">
                    <Lightbulb size={15} className="text-amber-500 shrink-0" />
                    <span>Giải thích chi tiết</span>
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed pl-5">
                    {currentExercise.explanation}
                  </p>
                </div>
              )}

              {/* Thông báo chúc mừng khi hoàn thành phiên */}
              {isAnswered && isCurrentSessionComplete && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3 animate-fade-in flex-wrap">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Award size={20} />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300">
                        Chúc mừng bạn đã hoàn thành {getSessionLabel(activeSession)}!
                      </div>
                      <div className="text-[11px] sm:text-xs text-emerald-700/80 dark:text-emerald-400/80 font-mono">
                        Đúng {filteredExercises.filter((e) => exerciseResults[e.id]?.isCorrect).length}/{filteredExercises.length} câu
                      </div>
                    </div>
                  </div>
                  {activeSession === 's1' && lesson.exercises.length > 20 && (
                    <button
                      onClick={() => {
                        setActiveSession('s2');
                        setCurrentIdx(0);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shrink-0 cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
                    >
                      <span>Sang Phiên 2</span>
                      <ChevronRight size={14} />
                    </button>
                  )}
                  {activeSession === 's2' && lesson.exercises.length > 40 && (
                    <button
                      onClick={() => {
                        setActiveSession('s3');
                        setCurrentIdx(0);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shrink-0 cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
                    >
                      <span>Sang Phiên 3</span>
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              )}

              {/* Chuyển câu trước / câu sau */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800/80 gap-2">
                <button
                  disabled={currentIdx === 0}
                  onClick={handlePrev}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                  <span>Câu trước</span>
                </button>

                <div className="text-center font-mono">
                  <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Câu #{currentExercise.id}
                  </span>
                  <span className="text-[11px] text-zinc-400 block">
                    {currentIdx + 1} / {filteredExercises.length}
                  </span>
                </div>

                {currentIdx === filteredExercises.length - 1 && isAnswered ? (
                  activeSession === 's1' && lesson.exercises.length > 20 ? (
                    <button
                      onClick={() => {
                        setActiveSession('s2');
                        setCurrentIdx(0);
                      }}
                      className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer transition-all"
                    >
                      <span>Sang Phiên 2</span>
                      <ChevronRight size={16} />
                    </button>
                  ) : activeSession === 's2' && lesson.exercises.length > 40 ? (
                    <button
                      onClick={() => {
                        setActiveSession('s3');
                        setCurrentIdx(0);
                      }}
                      className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer transition-all"
                    >
                      <span>Sang Phiên 3</span>
                      <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    >
                      <CheckCircle2 size={15} />
                      <span>Đã xong phiên</span>
                    </button>
                  )
                ) : (
                  <button
                    disabled={currentIdx === filteredExercises.length - 1}
                    onClick={handleNext}
                    className={`flex items-center gap-1.5 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                      isAnswered && currentIdx < filteredExercises.length - 1
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-xs'
                        : 'border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30'
                    }`}
                  >
                    <span>Câu tiếp</span>
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================= */
        /* 5. CHẾ ĐỘ DANH SÁCH (LIST MODE)                           */
        /* ========================================================= */
        <div className="space-y-3 sm:space-y-4">
          {filteredExercises.map((ex, idx) => {
            const res = exerciseResults[ex.id];
            return (
              <div
                key={ex.id}
                className="p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      Câu #{ex.id}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      ({idx + 1}/{filteredExercises.length})
                    </span>
                  </div>
                  {res && (
                    <span
                      className={`font-mono text-[11px] px-2 py-0.5 rounded-md font-medium ${
                        res.isCorrect
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {res.isCorrect ? 'Đúng' : 'Sai'}
                    </span>
                  )}
                </div>

                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed">
                  {ex.question}
                </p>

                {ex.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                    {ex.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`p-2.5 rounded-xl border text-left ${
                          res
                            ? opt === ex.answer
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium'
                              : res.userAnswer === opt
                              ? 'border-red-500 bg-red-500/10 text-red-600'
                              : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                            : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 gap-2">
                  {res && ex.explanation ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 italic flex-1">
                      💡 {ex.explanation}
                    </p>
                  ) : (
                    <div className="flex-1" />
                  )}
                  <button
                    onClick={() => {
                      setCurrentIdx(idx);
                      setViewMode('focus');
                      if (res) setIsAnswered(false);
                    }}
                    className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0 font-medium cursor-pointer px-2.5 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30"
                  >
                    <RotateCcw size={12} />
                    <span>{res ? 'Sửa đáp án' : 'Làm câu này'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
