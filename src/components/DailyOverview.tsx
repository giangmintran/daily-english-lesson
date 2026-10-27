import React, { useState } from 'react';
import { DailyLesson } from '../types/lesson';
import { Volume2, ArrowRight, BookOpen, CheckCircle, BrainCircuit, Sparkles, Eye, EyeOff } from 'lucide-react';
import { speakWord } from '../utils/speech';

interface DailyOverviewProps {
  lesson: DailyLesson;
  onNavigateTab: (tab: 'vocabulary' | 'exercises') => void;
  onSelectExerciseSession?: (sessionIndex: number) => void;
}

export const DailyOverview: React.FC<DailyOverviewProps> = ({
  lesson,
  onNavigateTab,
}) => {
  const [revealedMeanings, setRevealedMeanings] = useState<Record<string, boolean>>({});
  const [showAllMeanings, setShowAllMeanings] = useState(false);

  const masteredWordIds = lesson.progress?.wordsMastered || [];
  const exerciseResults = lesson.progress?.exerciseResults || {};

  const totalWords = lesson.vocabulary.length;
  const masteredWordsCount = masteredWordIds.length;
  const wordPercent = totalWords > 0 ? Math.round((masteredWordsCount / totalWords) * 100) : 0;

  const totalExercises = lesson.exercises.length;
  const doneExercisesCount = Object.keys(exerciseResults).length;
  const correctExercisesCount = Object.values(exerciseResults).filter((r) => r.isCorrect).length;
  const exercisePercent = totalExercises > 0 ? Math.round((doneExercisesCount / totalExercises) * 100) : 0;
  const accuracyPercent = doneExercisesCount > 0 ? Math.round((correctExercisesCount / doneExercisesCount) * 100) : 0;

  const toggleMeaning = (id: string) => {
    setRevealedMeanings((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleAllMeanings = () => {
    setShowAllMeanings(!showAllMeanings);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-4xl mx-auto py-4 sm:py-6 px-3 sm:px-4">
      {/* Hero Topic Banner */}
      <div className="border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-5 sm:p-7 md:p-8 bg-white dark:bg-zinc-900/60 shadow-xs relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-2">
            <Sparkles size={14} className="text-amber-500" />
            <span>MỤC TIÊU HÔM NAY • {lesson.date}</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2 sm:mb-3">
            {lesson.topic}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed">
            Hôm nay bạn có <strong className="text-zinc-900 dark:text-zinc-200 font-semibold">{totalWords} từ vựng mới</strong> và{' '}
            <strong className="text-zinc-900 dark:text-zinc-200 font-semibold">{totalExercises} bài tập thực hành</strong>. Hãy bắt đầu từ việc làm quen từ vựng trước khi làm bài tập!
          </p>
        </div>

        {/* Minimal geometric background subtle accent */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-zinc-100 to-transparent dark:from-zinc-800/20 dark:to-transparent pointer-events-none" />
      </div>

      {/* Main Dual Modules: Vocabulary & Exercises */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Module 1: Vocabulary */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 bg-white dark:bg-zinc-900 shadow-xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <BookOpen size={20} />
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                {masteredWordsCount}/{totalWords} từ đã thuộc
              </span>
            </div>

            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              Ôn tập {totalWords} Từ Vựng
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5 sm:mb-6 leading-relaxed">
              Active Recall với flashcards tương tác. Lật thẻ để kiểm tra trí nhớ và luyện nghe phát âm chuẩn bản xứ.
            </p>

            {/* Progress Bar */}
            <div className="space-y-1.5 mb-5 sm:mb-6">
              <div className="flex justify-between text-[11px] text-zinc-500">
                <span>Tiến độ ghi nhớ</span>
                <span className="font-mono font-medium">{wordPercent}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${wordPercent}%` }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('vocabulary')}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 font-semibold text-xs sm:text-sm transition-all shadow-xs group cursor-pointer active:scale-95"
          >
            <span>{masteredWordsCount > 0 ? 'Tiếp tục học từ mới' : 'Bắt đầu học từ mới'}</span>
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Module 2: Exercises */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 bg-white dark:bg-zinc-900 shadow-xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle size={20} />
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                {doneExercisesCount}/{totalExercises} câu đã làm
              </span>
            </div>

            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              Thực hành {totalExercises} Bài Tập
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5 sm:mb-6 leading-relaxed">
              Trắc nghiệm & điền từ chia làm 3 phiên (20 câu/phiên) kèm giải thích chi tiết ngay khi chọn đáp án.
            </p>

            {/* Progress Bar */}
            <div className="space-y-1.5 mb-5 sm:mb-6">
              <div className="flex justify-between text-[11px] text-zinc-500">
                <span>Hoàn thành: {doneExercisesCount}/{totalExercises}</span>
                {doneExercisesCount > 0 && (
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                    Độ chính xác: {accuracyPercent}%
                  </span>
                )}
              </div>
              <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${exercisePercent}%` }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('exercises')}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 font-semibold text-xs sm:text-sm transition-all shadow-xs group cursor-pointer active:scale-95"
          >
            <span>{doneExercisesCount > 0 ? 'Tiếp tục làm bài tập' : 'Bắt đầu làm bài tập'}</span>
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Scientific Tip Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-100/70 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-3">
        <BrainCircuit size={18} className="text-indigo-500 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-zinc-900 dark:text-zinc-200 font-medium">Phương pháp học khoa học đề xuất:</strong>{' '}
          Đừng làm một lèo 60 câu. Hãy chia làm 3 phiên nhỏ (mỗi phiên 20 câu, khoảng 15 phút), xen kẽ bằng 5 phút nghỉ ngơi (Pomodoro). Nghiên cứu cho thấy phương pháp này tăng khả năng ghi nhớ dài hạn lên 300%.
        </div>
      </div>

      {/* Quick Word Reference List */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 sm:p-6 bg-white dark:bg-zinc-900 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
              Danh Sách {totalWords} Từ Mới Hôm Nay
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Bấm vào loa để nghe, bấm vào từ để ẩn/hiện nghĩa</p>
          </div>
          <button
            onClick={toggleAllMeanings}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {showAllMeanings ? <EyeOff size={13} /> : <Eye size={13} />}
            <span>{showAllMeanings ? 'Ẩn toàn bộ nghĩa' : 'Hiện toàn bộ nghĩa'}</span>
          </button>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 mt-2">
          {lesson.vocabulary.map((v, idx) => {
            const isRevealed = showAllMeanings || revealedMeanings[v.id];
            const isMastered = masteredWordIds.includes(v.id);

            return (
              <div
                key={v.id}
                className="py-3 px-2 sm:px-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
              >
                {/* Top line: Index, Word, POS, Audio, Mastered */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-baseline gap-2 flex-wrap min-w-0">
                    <span className="text-xs font-mono text-zinc-400 w-5 shrink-0 text-right">
                      {idx + 1}.
                    </span>
                    <span className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                      {v.word}
                    </span>
                    {v.partOfSpeech && (
                      <span className="text-[11px] font-mono text-zinc-400 italic">
                        ({v.partOfSpeech})
                      </span>
                    )}
                    {v.phonetic && (
                      <span className="text-xs text-zinc-500 font-mono hidden sm:inline">
                        {v.phonetic}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Mastered badge indicator */}
                    {isMastered && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1" title="Đã thuộc" />
                    )}

                    {/* Audio button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakWord(v.word);
                      }}
                      className="p-1.5 sm:p-2 rounded-lg text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Nghe phát âm"
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Sub line: Phonetic on mobile if present */}
                {v.phonetic && (
                  <div className="sm:hidden text-xs text-zinc-400 font-mono pl-7 mt-0.5">
                    {v.phonetic}
                  </div>
                )}

                {/* Meaning line: Tap to reveal */}
                <div
                  onClick={() => toggleMeaning(v.id)}
                  className="mt-1 pl-7 cursor-pointer text-xs sm:text-sm"
                >
                  {isRevealed ? (
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                      {v.meaning}
                    </span>
                  ) : (
                    <span className="text-zinc-400 italic hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                      [Chạm để xem nghĩa]
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
