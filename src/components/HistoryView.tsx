import React, { useState, useEffect } from 'react';
import { getActiveDate, setActiveDate, clearCurrentLesson } from '../services/storage';
import { fetchLessonsFromApi, deleteLessonFromApi } from '../services/api';
import { DailyLesson } from '../types/lesson';
import { Calendar, Download, Trash2, ArrowRight, Flame, CheckCircle, BookOpen, RefreshCw, AlertCircle } from 'lucide-react';

interface HistoryViewProps {
  onSelectDate: (date: string, lesson: DailyLesson) => void;
  onRefresh?: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onSelectDate }) => {
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
    const exResults = l.progress?.exerciseResults || {};
    const exDone = Object.keys(exResults).length;

    totalMasteredWords += wordsCount;
    totalDoneExercises += exDone;
  });

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
      setLessons((prev) => prev.filter((l) => l.date !== date));
      if (activeDate === date) {
        clearCurrentLesson();
      }
      const res = await deleteLessonFromApi(date);
      if (!res.success) {
        alert(res.error || 'Lỗi khi xóa bài học trên Supabase');
        loadHistory();
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
            const exResults = item.progress?.exerciseResults || {};
            const exDone = Object.keys(exResults).length;

            return (
              <div
                key={item.date}
                onClick={() => {
                  setActiveDate(item.date);
                  onSelectDate(item.date, item);
                }}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 sm:gap-4 shadow-xs ${
                  isCurrentActive
                    ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800/40'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-zinc-400 shrink-0" />
                    <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.date}
                    </span>
                    {isCurrentActive && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium shrink-0">
                        Đang chọn
                      </span>
                    )}
                  </div>

                  <div className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 font-medium truncate">
                    {item.topic}
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-zinc-400 font-mono pt-0.5">
                    <span>{wordsMastered}/{item.vocabulary.length} từ</span>
                    <span>•</span>
                    <span>{exDone}/{item.exercises.length} bài tập</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDate(item.date);
                    }}
                    className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Xóa vĩnh viễn bài này trên Supabase"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
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
