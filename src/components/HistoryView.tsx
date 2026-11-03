import React, { useState, useEffect, useMemo } from 'react';
import { getActiveDate, setActiveDate, clearCurrentLesson, normalizeExerciseResults } from '../services/storage';
import { fetchLessonsFromApi, deleteLessonFromApi } from '../services/api';
import { DailyLesson } from '../types/lesson';
import { Calendar, Download, Trash2, ArrowRight, Flame, CheckCircle, BookOpen, RefreshCw, AlertCircle } from 'lucide-react';

interface HistoryViewProps {
  onSelectDate: (date: string, lesson: DailyLesson) => void;
  onRefresh?: () => void;
  onLessonsChanged?: (lessons: DailyLesson[]) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onSelectDate, onLessonsChanged }) => {
  const [lessons, setLessons] = useState<DailyLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeDate = getActiveDate();

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLessonsFromApi();
      if (data) {
        setLessons(data);
      } else {
        setError('Không thể tải dữ liệu từ Supabase hoặc chưa có bài học nào.');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối khi tải lịch sử bài học.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Aggregate global metrics from Supabase data
  let totalMasteredWords = 0;
  let totalDoneExercises = 0;

  lessons.forEach((l) => {
    const wordsCount = l.progress?.wordsMastered?.length || 0;
    const exResults = normalizeExerciseResults(l.progress?.exerciseResults);
    const exDone = Object.keys(exResults).length;

    totalMasteredWords += wordsCount;
    totalDoneExercises += exDone;
  });

  // Generate 70 days (10 weeks) for GitHub-style Activity Heatmap
  const heatmapDays = useMemo(() => {
    const days: {
      date: string;
      level: 0 | 1 | 2 | 3;
      hasLesson: boolean;
      wordsCount: number;
      exercisesCount: number;
    }[] = [];
    const lessonMap = new Map(lessons.map((l) => [l.date, l]));
    const today = new Date();

    for (let i = 69; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const l = lessonMap.get(dateStr);

      if (!l) {
        days.push({ date: dateStr, level: 0, hasLesson: false, wordsCount: 0, exercisesCount: 0 });
      } else {
        const words = l.progress?.wordsMastered?.length || 0;
        const ex = Object.keys(normalizeExerciseResults(l.progress?.exerciseResults)).length;
        let level: 0 | 1 | 2 | 3 = 1;
        if (words >= 15 && ex >= 40) {
          level = 3;
        } else if (words >= 8 || ex >= 20) {
          level = 2;
        }
        days.push({ date: dateStr, level, hasLesson: true, wordsCount: words, exercisesCount: ex });
      }
    }
    return days;
  }, [lessons]);

  const handleExportBackup = () => {
    if (lessons.length === 0) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(lessons, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `daily_english_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDeleteDate = async (date: string) => {
    if (confirm(`Bạn có chắc muốn xóa vĩnh viễn bài học ngày ${date} trên Supabase?`)) {
      const remaining = lessons.filter((l) => l.date !== date);
      setLessons(remaining);
      if (activeDate === date) {
        clearCurrentLesson();
      }
      const res = await deleteLessonFromApi(date);
      if (!res.success) {
        alert(res.error || 'Lỗi khi xóa bài học trên Supabase');
        loadHistory();
      } else if (onLessonsChanged) {
        onLessonsChanged(remaining);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-6 px-3 sm:px-4 animate-fade-in space-y-4 sm:space-y-6">
      {/* Overview Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
            <Flame size={14} className="text-amber-500" />
            <span>Ngày học</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
            {lessons.length}
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
            <BookOpen size={14} className="text-blue-500" />
            <span>Từ đã thuộc</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
            {totalMasteredWords}
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
            <CheckCircle size={14} className="text-emerald-500" />
            <span>Bài đã làm</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {totalDoneExercises}
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
            <Download size={14} className="text-zinc-400" />
            <span>Sao lưu</span>
          </div>
          <button
            onClick={handleExportBackup}
            disabled={lessons.length === 0}
            className="text-xs font-medium text-zinc-900 dark:text-zinc-100 underline decoration-zinc-400 hover:text-blue-600 text-left cursor-pointer disabled:opacity-40"
          >
            Tải file JSON
          </button>
        </div>
      </div>

      {/* Activity Heatmap Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
            <Flame size={14} className="text-amber-500" />
            <span>Biểu đồ chuyên cần (10 tuần gần nhất)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
            <span>Chưa học</span>
            <span className="w-2.5 h-2.5 rounded-xs bg-zinc-100 dark:bg-zinc-800" />
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-200 dark:bg-emerald-950" />
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400 dark:bg-emerald-700" />
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 dark:bg-emerald-400" />
            <span>Hoàn thành tốt</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
          {heatmapDays.map((d) => (
            <div
              key={d.date}
              title={`${d.date}: ${
                d.hasLesson
                  ? `${d.wordsCount} từ đã thuộc, ${d.exercisesCount} bài tập`
                  : 'Chưa có bài học'
              }`}
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-xs transition-colors cursor-pointer ${
                d.level === 3
                  ? 'bg-emerald-600 dark:bg-emerald-500 ring-1 ring-emerald-400/50'
                  : d.level === 2
                  ? 'bg-emerald-400 dark:bg-emerald-700'
                  : d.level === 1
                  ? 'bg-emerald-200 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-zinc-100 dark:bg-zinc-800/70 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Date timeline cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Lịch Sử Các Ngày Học (Cloud Supabase)
          </h3>
          <button
            onClick={loadHistory}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer disabled:opacity-50"
            title="Tải lại từ Supabase"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="py-12 text-center space-y-2">
            <RefreshCw size={20} className="animate-spin mx-auto text-zinc-400" />
            <p className="text-xs text-zinc-500">Đang tải lịch sử các ngày học từ Supabase...</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && lessons.length === 0 && (
          <div className="py-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-2">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Chưa có bài học nào được lưu trên Supabase
            </p>
            <p className="text-xs text-zinc-400">
              Hãy bấm "Import JSON" ở góc trên để nạp bài học mới.
            </p>
          </div>
        )}

        {/* List of lessons */}
        {!loading &&
          lessons.map((item) => {
            const isCurrentActive = item.date === activeDate;
            const wordsMastered = item.progress?.wordsMastered?.length || 0;
            const exResults = normalizeExerciseResults(item.progress?.exerciseResults);
            const exDone = Object.keys(exResults).length;
            const exCorrect = Object.values(exResults).filter((r) => r.isCorrect).length;

            const totalWords = item.vocabulary.length;
            const totalExercises = item.exercises.length;
            const totalItems = totalWords + totalExercises;
            const totalDone = wordsMastered + exDone;

            const totalPercent = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;
            const wordPercent = totalWords > 0 ? Math.round((wordsMastered / totalWords) * 100) : 0;
            const exPercent = totalExercises > 0 ? Math.round((exDone / totalExercises) * 100) : 0;

            return (
              <div
                key={item.date}
                onClick={() => {
                  setActiveDate(item.date);
                  onSelectDate(item.date, item);
                }}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-xs group ${
                  isCurrentActive
                    ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50/80 dark:bg-zinc-800/40 ring-1 ring-zinc-900 dark:ring-zinc-100'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  {/* Header: Date + Badges + Progress % */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-zinc-400 shrink-0" />
                      <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {item.date}
                      </span>
                      {isCurrentActive && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shrink-0">
                          Đang chọn
                        </span>
                      )}
                    </div>

                    {/* % Progress Badge */}
                    <div className="flex items-center gap-1.5">
                      {totalPercent === 100 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle size={12} className="text-emerald-600 dark:text-emerald-400" />
                          <span>100% Hoàn thành</span>
                        </span>
                      ) : totalPercent > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                          <span>{totalPercent}% đã học</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                          0% Chưa học
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Topic name */}
                  <div className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 font-medium truncate">
                    {item.topic}
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        totalPercent === 100
                          ? 'bg-emerald-500'
                          : totalPercent > 0
                          ? 'bg-blue-600 dark:bg-blue-500'
                          : 'bg-transparent'
                      }`}
                      style={{ width: `${totalPercent}%` }}
                    />
                  </div>

                  {/* Detailed metrics */}
                  <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono pt-0.5 flex-wrap">
                    {totalWords > 0 && (
                      <span>
                        Từ vựng: <strong className="text-zinc-700 dark:text-zinc-300">{wordsMastered}/{totalWords}</strong> ({wordPercent}%)
                      </span>
                    )}
                    {totalWords > 0 && totalExercises > 0 && <span>•</span>}
                    {totalExercises > 0 && (
                      <span>
                        Bài tập: <strong className="text-zinc-700 dark:text-zinc-300">{exDone}/{totalExercises}</strong> ({exPercent}%)
                      </span>
                    )}
                    {exDone > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          Đúng: {exCorrect}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right actions */}
                <div className="flex items-center justify-end sm:justify-center gap-1.5 sm:gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800/60">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDate(item.date);
                    }}
                    className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    title="Xóa vĩnh viễn bài này trên Supabase"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-900 transition-colors">
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
