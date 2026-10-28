import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DailyLesson, VocabularyItem } from '../types/lesson';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Trophy,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { updateLessonProgress } from '../services/storage';
import confetti from 'canvas-confetti';

interface VocabQuizProps {
  lesson: DailyLesson;
  onUpdateLesson: (updated: DailyLesson) => void;
  onBackToFlashcards: () => void;
}

interface QuizOption {
  text: string;
  isCorrect: boolean;
  word?: string;
}

interface QuizQuestion {
  id: string;
  targetWord: VocabularyItem;
  type: 'word_to_meaning' | 'meaning_to_word';
  promptTitle: string;
  promptText: string;
  promptSub?: string;
  options: QuizOption[];
  correctAnswerText: string;
}

interface QuizResultItem {
  questionId: string;
  targetWord: VocabularyItem;
  isCorrect: boolean;
  selectedText: string;
  correctAnswerText: string;
}

// Fallback pool of common English distractors if lesson has fewer than 4 words
const FALLBACK_DISTRACTORS = [
  { word: 'achieve', meaning: 'đạt được mục tiêu, hoàn thành xuất sắc' },
  { word: 'improve', meaning: 'cải thiện, nâng cao chất lượng' },
  { word: 'maintain', meaning: 'duy trì, giữ gìn trạng thái ổn định' },
  { word: 'consider', meaning: 'cân nhắc, suy xét kỹ lưỡng' },
  { word: 'explain', meaning: 'giải thích, làm sáng tỏ vấn đề' },
  { word: 'explore', meaning: 'khám phá, tìm hiểu sâu hơn' },
  { word: 'encourage', meaning: 'động viên, khích lệ tinh thần' },
  { word: 'prepare', meaning: 'chuẩn bị sẵn sàng cho tương lai' },
  { word: 'develop', meaning: 'phát triển, mở rộng quy mô' },
  { word: 'support', meaning: 'hỗ trợ, trợ giúp, đồng hành' },
];

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateQuizQuestions(
  targetWords: VocabularyItem[],
  allWords: VocabularyItem[]
): QuizQuestion[] {
  if (!targetWords || targetWords.length === 0) return [];
  const safeAllWords = allWords || [];

  const shuffledTargets = shuffleArray(targetWords);

  return shuffledTargets.map((target, idx) => {
    // Alternate between question types
    const type: 'word_to_meaning' | 'meaning_to_word' =
      idx % 2 === 0 ? 'word_to_meaning' : 'meaning_to_word';

    const isWordToMeaning = type === 'word_to_meaning';

    const promptTitle = isWordToMeaning
      ? 'Chọn nghĩa tiếng Việt chính xác:'
      : 'Chọn từ tiếng Anh có nghĩa sau:';

    const promptText = isWordToMeaning
      ? (target.word || '')
      : (target.meaning || '');

    const promptSub = isWordToMeaning
      ? [
          target.phonetic ? `IPA: ${target.phonetic}` : '',
          target.partOfSpeech ? `(${target.partOfSpeech})` : '',
        ]
          .filter(Boolean)
          .join(' • ')
      : target.partOfSpeech
      ? `Từ loại: ${target.partOfSpeech}`
      : undefined;

    const correctAnswerText = isWordToMeaning
      ? (target.meaning || target.word || '')
      : (target.word || target.meaning || '');

    // Build distractors (need 3 distractors)
    const otherLessonWords = safeAllWords.filter((w) => w.id !== target.id);
    const shuffledOthers = shuffleArray(otherLessonWords);

    const distractorTexts: { text: string; word?: string }[] = [];
    const usedTexts = new Set<string>([correctAnswerText.trim().toLowerCase()]);

    for (const other of shuffledOthers) {
      if (distractorTexts.length >= 3) break;
      const text = isWordToMeaning ? other.meaning : other.word;
      const cleanText = (text || '').trim();
      if (cleanText && !usedTexts.has(cleanText.toLowerCase())) {
        usedTexts.add(cleanText.toLowerCase());
        distractorTexts.push({
          text: cleanText,
          word: isWordToMeaning ? undefined : other.word,
        });
      }
    }

    // If still need more distractors (e.g. lesson has < 4 words), use fallback
    if (distractorTexts.length < 3) {
      const shuffledFallback = shuffleArray(FALLBACK_DISTRACTORS);
      for (const fb of shuffledFallback) {
        if (distractorTexts.length >= 3) break;
        const text = isWordToMeaning ? fb.meaning : fb.word;
        const cleanText = (text || '').trim();
        if (cleanText && !usedTexts.has(cleanText.toLowerCase())) {
          usedTexts.add(cleanText.toLowerCase());
          distractorTexts.push({
            text: cleanText,
            word: isWordToMeaning ? undefined : fb.word,
          });
        }
      }
    }

    const rawOptions: QuizOption[] = [
      {
        text: correctAnswerText,
        isCorrect: true,
        word: isWordToMeaning ? undefined : target.word,
      },
      ...distractorTexts.map((d) => ({
        text: d.text,
        isCorrect: false,
        word: d.word,
      })),
    ];

    const shuffledOptions = shuffleArray(rawOptions);

    return {
      id: `${target.id}-${idx}`,
      targetWord: target,
      type,
      promptTitle,
      promptText,
      promptSub,
      options: shuffledOptions,
      correctAnswerText,
    };
  });
}

export const VocabQuiz: React.FC<VocabQuizProps> = ({
  lesson,
  onUpdateLesson,
  onBackToFlashcards,
}) => {
  const allWords = useMemo(() => lesson.vocabulary || [], [lesson.vocabulary]);
  const masteredIds = useMemo(
    () => new Set(lesson.progress?.wordsMastered || []),
    [lesson.progress?.wordsMastered]
  );

  const [scope, setScope] = useState<'all' | 'unmastered'>('all');

  // Lazy initialize questions on first render
  const [questions, setQuestions] = useState<QuizQuestion[]>(() =>
    generateQuizQuestions(allWords, allWords)
  );

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [results, setResults] = useState<QuizResultItem[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  // If lesson.date changes (e.g. user chooses another lesson), re-generate
  const prevDateRef = useRef(lesson.date);
  useEffect(() => {
    if (prevDateRef.current !== lesson.date) {
      prevDateRef.current = lesson.date;
      setScope('all');
      const qs = generateQuizQuestions(allWords, allWords);
      setQuestions(qs);
      setCurrentIdx(0);
      setSelectedOptionIdx(null);
      setResults([]);
      setIsFinished(false);
    }
  }, [lesson.date, allWords]);

  // Handle switching quiz scope (Tất cả / Chưa thuộc)
  const handleScopeChange = useCallback(
    (newScope: 'all' | 'unmastered') => {
      setScope(newScope);
      let wordsToUse = allWords;
      if (newScope === 'unmastered') {
        const unmastered = allWords.filter((w) => !masteredIds.has(w.id));
        wordsToUse = unmastered.length > 0 ? unmastered : allWords;
      }
      const qs = generateQuizQuestions(wordsToUse, allWords);
      setQuestions(qs);
      setCurrentIdx(0);
      setSelectedOptionIdx(null);
      setResults([]);
      setIsFinished(false);
    },
    [allWords, masteredIds]
  );

  // Handle restarting quiz (optionally with custom subset, e.g. wrong words)
  const handleRestart = useCallback(
    (customWords?: VocabularyItem[]) => {
      let wordsToUse = customWords;
      if (!wordsToUse) {
        if (scope === 'unmastered') {
          const unmastered = allWords.filter((w) => !masteredIds.has(w.id));
          wordsToUse = unmastered.length > 0 ? unmastered : allWords;
        } else {
          wordsToUse = allWords;
        }
      }
      const qs = generateQuizQuestions(wordsToUse, allWords);
      setQuestions(qs);
      setCurrentIdx(0);
      setSelectedOptionIdx(null);
      setResults([]);
      setIsFinished(false);
    },
    [allWords, masteredIds, scope]
  );

  const currentQuestion = questions[currentIdx];
  const isAnswered = selectedOptionIdx !== null;
  const isCorrectAnswer =
    isAnswered && currentQuestion?.options[selectedOptionIdx]?.isCorrect;

  // Handle selecting an option
  const handleSelectOption = useCallback(
    (optIdx: number) => {
      if (isAnswered || !currentQuestion) return;

      setSelectedOptionIdx(optIdx);
      const chosenOption = currentQuestion.options[optIdx];
      if (!chosenOption) return;

      const correct = chosenOption.isCorrect;
      const targetWord = currentQuestion.targetWord;

      // Update quiz results
      const resultItem: QuizResultItem = {
        questionId: currentQuestion.id,
        targetWord,
        isCorrect: correct,
        selectedText: chosenOption.text,
        correctAnswerText: currentQuestion.correctAnswerText,
      };
      setResults((prev) => [...prev, resultItem]);

      // Auto-sync mastery with storage
      const updated = updateLessonProgress(
        lesson.date,
        (prev) => {
          const currentSet = new Set(prev?.wordsMastered || []);
          if (correct) {
            currentSet.add(targetWord.id);
          } else {
            // If answered incorrectly, remove from mastered to reinforce active learning
            currentSet.delete(targetWord.id);
          }
          return {
            wordsMastered: Array.from(currentSet),
            exerciseResults: prev?.exerciseResults || {},
          };
        },
        lesson
      );

      if (updated) {
        onUpdateLesson(updated);
      }
    },
    [isAnswered, currentQuestion, lesson, onUpdateLesson]
  );

  // Proceed to next question or end screen
  const handleNextQuestion = useCallback(() => {
    if (!isAnswered) return;

    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOptionIdx(null);
    } else {
      setIsFinished(true);
    }
  }, [isAnswered, currentIdx, questions.length]);

  // Trigger confetti if high score on finish
  useEffect(() => {
    if (isFinished && results.length > 0) {
      const correctCount = results.filter((r) => r.isCorrect).length;
      const scoreRatio = correctCount / results.length;
      if (scoreRatio >= 0.8) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
  }, [isFinished, results]);

  // Keyboard navigation: 1-4 for options, Space/Enter for Next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (!isFinished && currentQuestion) {
        if (!isAnswered) {
          if (['1', '2', '3', '4'].includes(e.key)) {
            e.preventDefault();
            const idx = parseInt(e.key, 10) - 1;
            if (idx >= 0 && idx < currentQuestion.options.length) {
              handleSelectOption(idx);
            }
          }
        } else {
          if (e.key === 'Enter' || e.code === 'Space') {
            e.preventDefault();
            handleNextQuestion();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isFinished,
    currentQuestion,
    isAnswered,
    handleSelectOption,
    handleNextQuestion,
  ]);

  if (allWords.length === 0) {
    return (
      <div className="text-center py-20 text-zinc-500">
        Không có từ vựng nào trong bài học này để kiểm tra.
      </div>
    );
  }

  // -------------------------------------------------------------
  // END OF QUIZ SCREEN (SCOREBOARD)
  // -------------------------------------------------------------
  if (isFinished) {
    const totalAnswered = results.length;
    const correctCount = results.filter((r) => r.isCorrect).length;
    const wrongCount = totalAnswered - correctCount;
    const percent = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
    const wrongWords = results
      .filter((r) => !r.isCorrect)
      .map((r) => r.targetWord);

    let feedbackTitle = 'Luyện tập hoàn tất!';
    let feedbackSubtitle = 'Hãy tiếp tục ôn tập để ghi nhớ lâu hơn!';
    if (percent === 100) {
      feedbackTitle = 'Tuyệt đối 100%! Xuất sắc! 🌟';
      feedbackSubtitle = 'Bạn đã làm chủ hoàn toàn các từ vựng này!';
    } else if (percent >= 80) {
      feedbackTitle = 'Rất ấn tượng! 🎉';
      feedbackSubtitle = 'Bạn đã nhớ rất tốt phần lớn từ vựng.';
    } else if (percent >= 50) {
      feedbackTitle = 'Khá tốt! Cần ôn thêm một chút 💪';
      feedbackSubtitle = 'Hãy kiểm tra lại các từ chưa đúng để nhớ sâu hơn.';
    } else {
      feedbackTitle = 'Cần luyện tập thêm 📖';
      feedbackSubtitle = 'Hãy quay lại xem thẻ flashcards và thử lại nhé!';
    }

    return (
      <div className="max-w-xl mx-auto py-4 sm:py-6 px-3 sm:px-4 animate-fade-in space-y-6">
        {/* Score Card Header */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 bg-white dark:bg-zinc-900 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
            {percent >= 80 ? (
              <Trophy size={32} className="text-amber-500" />
            ) : (
              <Sparkles size={32} className="text-blue-500" />
            )}
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {feedbackTitle}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {feedbackSubtitle}
            </p>
          </div>

          {/* Big Score Stats */}
          <div className="grid grid-cols-3 gap-3 pt-3 pb-1 border-y border-zinc-100 dark:border-zinc-800">
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40">
              <span className="text-[11px] text-zinc-400 block mb-0.5">Điểm số</span>
              <span className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                {percent}%
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <span className="text-[11px] block mb-0.5">Đã thuộc</span>
              <span className="text-xl font-bold font-mono">
                {correctCount}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <span className="text-[11px] block mb-0.5">Cần ôn</span>
              <span className="text-xl font-bold font-mono">
                {wrongCount}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            {wrongWords.length > 0 && (
              <button
                onClick={() => handleRestart(wrongWords)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs sm:text-sm transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <RotateCcw size={16} />
                <span>Chỉ kiểm tra lại {wrongWords.length} từ chưa đúng</span>
              </button>
            )}

            <button
              onClick={() => handleRestart()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 font-semibold text-xs sm:text-sm transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <RotateCcw size={16} />
              <span>Làm lại bài kiểm tra</span>
            </button>

            <button
              onClick={onBackToFlashcards}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium text-xs transition-all cursor-pointer"
            >
              <BookOpen size={15} />
              <span>Quay lại Thẻ ghi nhớ (Flashcards)</span>
            </button>
          </div>
        </div>

        {/* Detailed Breakdown List */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-1">
            Chi tiết câu trả lời
          </h3>
          <div className="space-y-2">
            {results.map((res, rIdx) => (
              <div
                key={rIdx}
                className={`p-3.5 sm:p-4 rounded-2xl border flex items-start justify-between gap-3 ${
                  res.isCorrect
                    ? 'border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10'
                    : 'border-rose-500/20 bg-rose-500/5 dark:bg-rose-500/10'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    {res.isCorrect ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <XCircle size={16} className="text-rose-500" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                        {res.targetWord.word}
                      </span>
                      {res.targetWord.phonetic && (
                        <span className="text-xs font-mono text-zinc-400">
                          {res.targetWord.phonetic}
                        </span>
                      )}
                      {res.targetWord.partOfSpeech && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {res.targetWord.partOfSpeech}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-300">
                      Nghĩa: <span className="font-medium">{res.targetWord.meaning}</span>
                    </p>

                    {!res.isCorrect && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 pt-0.5">
                        Bạn đã chọn: <span className="line-through">{res.selectedText}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If questions not available or index out of range
  if (!currentQuestion || questions.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4 space-y-4">
        <p className="text-sm text-zinc-500">Đang chuẩn bị câu hỏi kiểm tra...</p>
        <button
          onClick={() => handleRestart()}
          className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium cursor-pointer"
        >
          Bắt đầu kiểm tra
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ACTIVE QUESTION SCREEN
  // -------------------------------------------------------------
  const targetWord = currentQuestion.targetWord;
  const correctSoFar = results.filter((r) => r.isCorrect).length;
  const progressRatio = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0;

  // Example sentence if available
  let exampleEn: string | undefined;
  let exampleVi: string | undefined;
  if (targetWord.examples && targetWord.examples.length > 0) {
    const first = targetWord.examples[0];
    if (typeof first === 'string') {
      exampleEn = first;
    } else if (first && first.en) {
      exampleEn = first.en;
      exampleVi = first.vi;
    }
  } else if (targetWord.example) {
    exampleEn = targetWord.example;
    exampleVi = targetWord.exampleMeaning;
  }

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-6 px-3 sm:px-4 animate-fade-in flex flex-col items-center">
      {/* Top Bar: Scope Filter, Counter & Score */}
      <div className="w-full flex items-center justify-between text-xs text-zinc-500 mb-2 px-1">
        <div className="flex items-center gap-2">
          {/* Scope Selector */}
          <div className="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200/60 dark:border-zinc-700/60">
            <button
              onClick={() => handleScopeChange('all')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                scope === 'all'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Tất cả ({allWords.length})
            </button>
            <button
              onClick={() => handleScopeChange('unmastered')}
              disabled={allWords.every((w) => masteredIds.has(w.id))}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                scope === 'unmastered'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Chưa thuộc ({allWords.filter((w) => !masteredIds.has(w.id)).length})
            </button>
          </div>
        </div>

        <div className="font-mono flex items-center gap-2 text-xs">
          <span className="font-bold text-zinc-900 dark:text-zinc-100">
            Câu {currentIdx + 1}/{questions.length}
          </span>
          <span className="text-zinc-400">•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            Đúng {correctSoFar}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progressRatio}%` }}
        />
      </div>

      {/* Question Prompt Card */}
      <div className="w-full border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 bg-white dark:bg-zinc-900 shadow-sm relative mb-4">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
          <span className="font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
            <HelpCircle size={14} />
            <span>{currentQuestion.promptTitle}</span>
          </span>
        </div>

        <div className="text-center py-4 space-y-2">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 break-words px-2">
            {currentQuestion.promptText}
          </h2>

          {currentQuestion.promptSub && (
            <p className="text-xs sm:text-sm font-mono text-zinc-500 dark:text-zinc-400">
              {currentQuestion.promptSub}
            </p>
          )}
        </div>
      </div>

      {/* 4 Option Buttons */}
      <div className="w-full grid grid-cols-1 gap-2.5 sm:gap-3 mb-4">
        {currentQuestion.options.map((option, oIdx) => {
          const isSelected = selectedOptionIdx === oIdx;
          const isOptionCorrect = option.isCorrect;

          let btnStyle =
            'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 text-zinc-800 dark:text-zinc-200';

          if (isAnswered) {
            if (isOptionCorrect) {
              btnStyle =
                'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30 font-semibold';
            } else if (isSelected && !isOptionCorrect) {
              btnStyle =
                'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/30';
            } else {
              btnStyle =
                'border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-400 dark:text-zinc-600 opacity-60';
            }
          }

          return (
            <button
              key={oIdx}
              onClick={() => handleSelectOption(oIdx)}
              disabled={isAnswered}
              className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 shadow-xs cursor-pointer active:scale-[0.99] ${btnStyle}`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono text-xs flex items-center justify-center shrink-0">
                  {oIdx + 1}
                </span>
                <span className="break-words leading-relaxed">{option.text}</span>
              </div>

              {isAnswered && (
                <div className="shrink-0">
                  {isOptionCorrect && (
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  )}
                  {isSelected && !isOptionCorrect && (
                    <XCircle size={18} className="text-rose-500" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Answer Feedback & Explanation Card */}
      {isAnswered && (
        <div className="w-full space-y-3 animate-fade-in mb-4">
          <div
            className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start justify-between gap-3 ${
              isCorrectAnswer
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300'
            }`}
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-1.5 font-semibold">
                {isCorrectAnswer ? (
                  <>
                    <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Chính xác! Đã lưu tiến độ thuộc từ này.</span>
                  </>
                ) : (
                  <>
                    <XCircle size={16} className="text-rose-600 dark:text-rose-400" />
                    <span>
                      Chưa chính xác! Đáp án đúng: <strong>{currentQuestion.correctAnswerText}</strong>
                    </span>
                  </>
                )}
              </div>

              {/* Quick Word Context */}
              <div className="text-xs pt-1 border-t border-zinc-200/40 dark:border-zinc-700/40 space-y-1">
                <div className="flex items-center gap-2 flex-wrap text-zinc-900 dark:text-zinc-100 font-medium">
                  <span>{targetWord.word}</span>
                  {targetWord.phonetic && (
                    <span className="font-mono text-zinc-500 dark:text-zinc-400 text-[11px]">
                      {targetWord.phonetic}
                    </span>
                  )}
                  <span>: {targetWord.meaning}</span>
                </div>

                {exampleEn && (
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 italic">
                    "{exampleEn}" {exampleVi && <span>→ {exampleVi}</span>}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={handleNextQuestion}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 font-semibold text-xs sm:text-sm transition-all shadow-xs cursor-pointer active:scale-98"
          >
            <span>
              {currentIdx < questions.length - 1 ? 'Câu tiếp theo' : 'Xem tổng kết kết quả'}
            </span>
            <ArrowRight size={15} />
            <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 rounded bg-zinc-700 dark:bg-zinc-300 text-zinc-200 dark:text-zinc-800 text-[10px] font-mono">
              Enter ↵
            </kbd>
          </button>
        </div>
      )}

      {/* Keyboard Shortcuts Hint */}
      <div className="text-[11px] text-zinc-400 font-mono text-center pt-2">
        Phím tắt: [1-4] Chọn đáp án {isAnswered && '• [Enter] Tiếp tục'}
      </div>
    </div>
  );
};
