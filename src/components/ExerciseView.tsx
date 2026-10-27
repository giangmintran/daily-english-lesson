import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DailyLesson, ExerciseItem } from '../types/lesson';
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, RotateCcw, Award, Lightbulb, ListFilter } from 'lucide-react';
import { updateLessonProgress } from '../services/storage';
import confetti from 'canvas-confetti';

interface ExerciseViewProps {
  lesson: DailyLesson;
  onUpdateLesson: (updated: DailyLesson) => void;
}

export const ExerciseView: React.FC<ExerciseViewProps> = ({ lesson, onUpdateLesson }) => {
  const [activeSession, setActiveSession] = useState<'all' | 's1' | 's2' | 's3' | 'wrong'>('s1');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [fillInput, setFillInput] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [viewMode, setViewMode] = useState<'focus' | 'list'>('focus');

  const exerciseResults = useMemo(
    () => lesson.progress?.exerciseResults || {},
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

  const currentExercise: ExerciseItem | undefined = filteredExercises[currentIdx];
  const currentResult = currentExercise ? exerciseResults[currentExercise.id] : undefined;

  // Sync state when current question changes
  useEffect(() => {
    if (currentResult) {
      setFillInput(currentResult.userAnswer || '');
      setIsAnswered(true);
    } else {
      setFillInput('');
      setIsAnswered(false);
    }
  }, [currentIdx, currentResult, activeSession]);

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

      const updated = updateLessonProgress(lesson.date, (prev) => {
        const nextResults = { ...(prev?.exerciseResults || {}) };
        nextResults[currentExercise.id] = {
          userAnswer: userAnswerText.trim(),
          isCorrect,
        };
        return {
          wordsMastered: prev?.wordsMastered || [],
          exerciseResults: nextResults,
        };
      });

      if (updated) {
        onUpdateLesson(updated);
      }

      setIsAnswered(true);

      // Check if this was the last question in the session and user finished all
      const newDoneCount = Object.keys(updated?.progress?.exerciseResults || {}).length;
      if (newDoneCount === lesson.exercises.length) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    },
    [currentExercise, lesson.date, lesson.exercises.length, onUpdateLesson]
  );

  // Keyboard shortcut for Multiple Choice (1, 2, 3, 4) & Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentExercise) return;

      // Allow typing in fill_in_blank input
      if (currentExercise.type === 'fill_in_blank') {
        if (e.key === 'Enter' && !isAnswered && fillInput.trim()) {
          e.preventDefault();
          handleAnswerSubmit(fillInput);
        } else if (e.key === 'Enter' && isAnswered) {
          e.preventDefault();
          handleNext();
        }
        return;
      }

      // Multiple choice shortcuts (1, 2, 3, 4)
      if (currentExercise.type === 'multiple_choice' && currentExercise.options && !isAnswered) {
        const optNum = parseInt(e.key, 10);
        if (optNum >= 1 && optNum <= currentExercise.options.length) {
          e.preventDefault();
          handleAnswerSubmit(currentExercise.options[optNum - 1]);
        }
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
  }, [currentExercise, isAnswered, fillInput, handleAnswerSubmit, handleNext, handlePrev]);

  // Count wrong exercises
  const wrongCount = useMemo(() => {
    return Object.values(exerciseResults).filter((r) => !r.isCorrect).length;
  }, [exerciseResults]);

  if (lesson.exercises.length === 0) {
    return (
      <div className="text-center py-20 text-zinc-500">
        Không có bài tập nào trong bài học này.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 animate-fade-in space-y-6">
      {/* Session Chunk Filters (Scientific Learning) */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => {
              setActiveSession('s1');
              setCurrentIdx(0);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeSession === 's1'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Phiên 1 (1 - 20)
          </button>

          {lesson.exercises.length > 20 && (
            <button
              onClick={() => {
                setActiveSession('s2');
                setCurrentIdx(0);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeSession === 's2'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              Phiên 2 (21 - 40)
            </button>
          )}

          {lesson.exercises.length > 40 && (
            <button
              onClick={() => {
                setActiveSession('s3');
                setCurrentIdx(0);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeSession === 's3'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              Phiên 3 (41 - 60)
            </button>
          )}

          <button
            onClick={() => {
              setActiveSession('all');
              setCurrentIdx(0);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeSession === 'all'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Tất cả ({lesson.exercises.length})
          </button>

          {wrongCount > 0 && (
            <button
              onClick={() => {
                setActiveSession('wrong');
                setCurrentIdx(0);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 ${
                activeSession === 'wrong'
                  ? 'bg-red-500 text-white shadow-xs'
                  : 'text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20'
              }`}
            >
              <span>Làm lại câu sai ({wrongCount})</span>
            </button>
          )}
        </div>

        {/* View Mode Switcher */}
        <button
          onClick={() => setViewMode(viewMode === 'focus' ? 'list' : 'focus')}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800 text-xs flex items-center gap-1"
          title="Chuyển chế độ xem"
        >
          <ListFilter size={14} />
          <span className="hidden sm:inline">{viewMode === 'focus' ? 'Xem dạng danh sách' : 'Chế độ tập trung'}</span>
        </button>
      </div>

      {filteredExercises.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-2xl border-zinc-200 dark:border-zinc-800">
          <Award size={32} className="mx-auto text-emerald-500 mb-2" />
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {activeSession === 'wrong' ? 'Tuyệt vời! Không có câu sai nào.' : 'Không có câu hỏi trong phiên này.'}
          </h4>
          <button
            onClick={() => setActiveSession('s1')}
            className="mt-4 px-3 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs"
          >
            Về Phiên 1
          </button>
        </div>
      ) : viewMode === 'focus' ? (
        /* FOCUS MODE: 1 QUESTION AT A TIME */
        <div className="space-y-6">
          {/* Question Grid Dots */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {filteredExercises.map((e, idx) => {
              const res = exerciseResults[e.id];
              const isCur = idx === currentIdx;
              return (
                <button
                  key={e.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-7 h-7 rounded-lg text-[11px] font-mono font-medium flex items-center justify-center transition-all ${
                    isCur
                      ? 'ring-2 ring-zinc-900 dark:ring-zinc-100 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold'
                      : res
                      ? res.isCorrect
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-red-500/15 text-red-600 dark:text-red-400'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {currentExercise && (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 bg-white dark:bg-zinc-900 shadow-xs space-y-6">
              {/* Question Header */}
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-mono">
                  Câu hỏi #{currentExercise.id} •{' '}
                  <span className="capitalize">{currentExercise.type === 'multiple_choice' ? 'Trắc nghiệm' : 'Điền từ'}</span>
                </span>
                {currentResult && (
                  <span
                    className={`flex items-center gap-1 font-medium font-mono text-xs px-2 py-0.5 rounded-md ${
                      currentResult.isCorrect
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}
                  >
                    {currentResult.isCorrect ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    <span>{currentResult.isCorrect ? 'Chính xác' : 'Chưa đúng'}</span>
                  </span>
                )}
              </div>

              {/* Question Text */}
              <div className="text-base sm:text-lg font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed">
                {currentExercise.question}
              </div>

              {/* Answer Interaction */}
              {currentExercise.type === 'multiple_choice' && currentExercise.options ? (
                <div className="grid grid-cols-1 gap-2.5 pt-2">
                  {currentExercise.options.map((option, optIdx) => {
                    const isSelected = currentResult?.userAnswer === option;
                    const isCorrectAnswer = option === currentExercise.answer;

                    let btnStyle = 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 text-zinc-800 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-600';

                    if (isAnswered) {
                      if (isCorrectAnswer) {
                        btnStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium';
                      } else if (isSelected && !currentResult?.isCorrect) {
                        btnStyle = 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-300';
                      } else {
                        btnStyle = 'border-zinc-200 dark:border-zinc-800 opacity-40';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        disabled={isAnswered}
                        onClick={() => handleAnswerSubmit(option)}
                        className={`w-full p-4 rounded-xl border text-left text-sm transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-mono flex items-center justify-center shrink-0">
                            {optIdx + 1}
                          </span>
                          <span>{option}</span>
                        </div>
                        {isAnswered && isCorrectAnswer && <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />}
                        {isAnswered && isSelected && !currentResult?.isCorrect && <XCircle size={16} className="text-red-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Fill in the blank input */
                <div className="space-y-3 pt-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      disabled={isAnswered}
                      value={fillInput}
                      onChange={(e) => setFillInput(e.target.value)}
                      placeholder="Gõ từ cần điền và bấm Enter..."
                      className="flex-1 px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-hidden focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 disabled:opacity-75"
                    />
                    {!isAnswered ? (
                      <button
                        disabled={!fillInput.trim()}
                        onClick={() => handleAnswerSubmit(fillInput)}
                        className="px-5 py-3 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium hover:bg-zinc-800 disabled:opacity-40"
                      >
                        Kiểm tra (Enter)
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setIsAnswered(false);
                          setFillInput('');
                        }}
                        className="px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs"
                        title="Thử lại"
                      >
                        <RotateCcw size={16} />
                      </button>
                    )}
                  </div>

                  {isAnswered && (
                    <div className="text-xs">
                      Đáp án đúng:{' '}
                      <strong className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {currentExercise.answer}
                      </strong>
                    </div>
                  )}
                </div>
              )}

              {/* Explanation Card */}
              {isAnswered && currentExercise.explanation && (
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 text-xs space-y-1 animate-fade-in">
                  <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200">
                    <Lightbulb size={14} className="text-amber-500" />
                    <span>Giải thích chi tiết</span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {currentExercise.explanation}
                  </p>
                </div>
              )}

              {/* Question Navigation Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                <button
                  disabled={currentIdx === 0}
                  onClick={handlePrev}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 rounded-lg transition-colors"
                >
                  <ChevronLeft size={16} />
                  <span>Câu trước</span>
                </button>

                <span className="text-xs text-zinc-400 font-mono">
                  {currentIdx + 1} / {filteredExercises.length}
                </span>

                <button
                  disabled={currentIdx === filteredExercises.length - 1}
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                >
                  <span>Câu tiếp theo</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* LIST MODE: SCROLL THROUGH ALL QUESTIONS */
        <div className="space-y-4">
          {filteredExercises.map((ex, idx) => {
            const res = exerciseResults[ex.id];
            return (
              <div
                key={ex.id}
                className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-mono font-medium">#{idx + 1}</span>
                  {res && (
                    <span
                      className={`font-mono text-[11px] px-2 py-0.5 rounded-md ${
                        res.isCorrect
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {res.isCorrect ? 'Đúng' : 'Sai'}
                    </span>
                  )}
                </div>

                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {ex.question}
                </p>

                {ex.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                    {ex.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`p-2.5 rounded-lg border text-left ${
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

                {res && ex.explanation && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-1 italic">
                    💡 {ex.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

