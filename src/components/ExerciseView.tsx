import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { DailyLesson, ExerciseItem } from '../types/lesson';
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, RotateCcw, Award, Lightbulb, ListFilter, LayoutList, Layers } from 'lucide-react';
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

  // Ref for active question button to auto-scroll into view if scrollable
  const activeBtnRef = useRef<HTMLButtonElement>(null);

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

      // Check if user finished all exercises in the lesson
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
                  btnStyle =
                    'ring-2 ring-zinc-900 dark:ring-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold shadow-xs scale-105 z-10';
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
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 capitalize">
                    {currentExercise.type === 'multiple_choice' ? 'Trắc nghiệm' : 'Điền từ'}
                  </span>
                </div>

                {currentResult && (
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
                )}
              </div>

              {/* Nội dung đề bài */}
              <div className="text-base sm:text-lg font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed">
                {currentExercise.question}
              </div>

              {/* Tương tác đáp án: Trắc nghiệm hoặc Điền từ */}
              {currentExercise.type === 'multiple_choice' && currentExercise.options ? (
                <div className="grid grid-cols-1 gap-2 pt-1">
                  {currentExercise.options.map((option, optIdx) => {
                    const isSelected = currentResult?.userAnswer === option;
                    const isCorrectAnswer = option === currentExercise.answer;

                    let btnStyle =
                      'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 text-zinc-800 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-600';

                    if (isAnswered) {
                      if (isCorrectAnswer) {
                        btnStyle =
                          'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold';
                      } else if (isSelected && !currentResult?.isCorrect) {
                        btnStyle =
                          'border-red-500 bg-red-500/15 text-red-700 dark:text-red-300 font-medium';
                      } else {
                        btnStyle = 'border-zinc-200 dark:border-zinc-800 opacity-40';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        disabled={isAnswered}
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
              ) : (
                /* Điền từ khuyết */
                <div className="space-y-3 pt-1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      disabled={isAnswered}
                      value={fillInput}
                      onChange={(e) => setFillInput(e.target.value)}
                      placeholder="Gõ từ cần điền..."
                      className="flex-1 px-4 py-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-base focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 disabled:opacity-75"
                    />
                    {!isAnswered ? (
                      <button
                        disabled={!fillInput.trim()}
                        onClick={() => handleAnswerSubmit(fillInput)}
                        className="px-5 sm:px-6 py-3 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs sm:text-sm font-semibold hover:bg-zinc-800 disabled:opacity-40 cursor-pointer transition-all active:scale-95"
                      >
                        Kiểm tra
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setIsAnswered(false);
                          setFillInput('');
                        }}
                        className="px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs cursor-pointer active:scale-95"
                        title="Thử lại câu này"
                      >
                        <RotateCcw size={16} />
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
