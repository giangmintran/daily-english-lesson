import { useState, useEffect } from 'react';
import { DailyLesson } from './types/lesson';
import {
  getLessonByDate,
  getActiveDate,
  setActiveDate,
  getUserStats,
  saveUserStats,
  saveLesson,
} from './services/storage';
import {
  fetchLessonsFromApi,
  saveLessonToApi,
  updateProgressToApi,
  getAuthToken,
  clearAuthToken,
  verifyAuthApi,
  logoutApi,
} from './services/api';
import { Navbar } from './components/Navbar';
import { DailyOverview } from './components/DailyOverview';
import { VocabularyView } from './components/VocabularyView';
import { ExerciseView } from './components/ExerciseView';
import { HistoryView } from './components/HistoryView';
import { ImportModal } from './components/ImportModal';
import { LoginView } from './components/LoginView';
import { TenseHandbookModal } from './components/TenseHandbookModal';
import { TenseHandbookButton } from './components/TenseHandbookButton';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(getAuthToken()));
  const [currentTab, setCurrentTab] = useState<'overview' | 'vocabulary' | 'exercises' | 'history'>('overview');
  const [activeDate, setActiveDateState] = useState<string>(() => getActiveDate());
  const [currentLesson, setCurrentLesson] = useState<DailyLesson | null>(() => getLessonByDate(getActiveDate()));
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isHandbookOpen, setIsHandbookOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [userStats, setUserStats] = useState(() => getUserStats());

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Listen for unauthorized 401 events
  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuthToken();
      setIsAuthenticated(false);
    };
    window.addEventListener('auth_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth_unauthorized', handleUnauthorized);
  }, []);

  // Verify token on mount if exists
  useEffect(() => {
    if (isAuthenticated) {
      verifyAuthApi().then((valid) => {
        if (!valid) {
          clearAuthToken();
          setIsAuthenticated(false);
        }
      });
    }
  }, [isAuthenticated]);

  // Sync latest lesson from Supabase when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    async function loadBackendLessons() {
      const apiLessons = await fetchLessonsFromApi();
      if (apiLessons && apiLessons.length > 0) {
        const savedActive = getActiveDate();
        const target = apiLessons.find((l) => l.date === savedActive) || apiLessons[0];
        saveLesson(target);
        setActiveDate(target.date);
        setActiveDateState(target.date);
        setCurrentLesson(target);
      }
    }
    loadBackendLessons();
  }, [isAuthenticated]);

  const handleLessonImported = (lesson: DailyLesson) => {
    saveLesson(lesson);
    setActiveDateState(lesson.date);
    setCurrentLesson(lesson);
    setCurrentTab('overview');

    saveLessonToApi(lesson).catch((e) => console.warn('Backend lesson auto-save failed', e));

    const today = new Date().toISOString().split('T')[0];
    if (lesson.date === today) {
      const stats = getUserStats();
      if (stats.lastActiveDate !== today) {
        stats.streak += 1;
        stats.lastActiveDate = today;
        saveUserStats(stats);
        setUserStats(stats);
      }
    }
  };

  const handleUpdateLesson = (updated: DailyLesson) => {
    saveLesson(updated);
    setCurrentLesson(updated);

    updateProgressToApi(updated.date, updated.progress).catch((e) =>
      console.warn('Backend progress auto-save failed', e)
    );
  };

  const handleLogout = () => {
    logoutApi();
    setIsAuthenticated(false);
  };

  // If not authenticated, show mandatory Login View
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors">
      {/* Top Minimalist Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenImport={() => setIsImportOpen(true)}
        vocabularyCount={currentLesson?.vocabulary.length || 0}
        exerciseCount={currentLesson?.exercises.length || 0}
        streak={userStats.streak}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
        currentDate={activeDate}
        onLogout={handleLogout}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 pb-20 md:pb-12">
        {currentTab === 'history' ? (
          <HistoryView
            onSelectDate={(date, selectedLesson) => {
              saveLesson(selectedLesson);
              setActiveDate(date);
              setActiveDateState(date);
              setCurrentLesson(selectedLesson);
              setCurrentTab('overview');
            }}
          />
        ) : currentLesson ? (
          <>
            {currentTab === 'overview' && (
              <DailyOverview
                lesson={currentLesson}
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'vocabulary' && (
              <VocabularyView
                lesson={currentLesson}
                onUpdateLesson={handleUpdateLesson}
              />
            )}

            {currentTab === 'exercises' && (
              <ExerciseView
                lesson={currentLesson}
                onUpdateLesson={handleUpdateLesson}
                onOpenHandbook={() => setIsHandbookOpen(true)}
              />
            )}
          </>
        ) : (
          <div className="max-w-md mx-auto text-center py-20 px-4 space-y-4">
            <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
              Chưa có dữ liệu bài học cho ngày {activeDate}
            </h3>
            <p className="text-xs text-zinc-500">
              Hãy bấm vào nút "Import JSON" ở góc trên bên phải để nạp bài học hôm nay.
            </p>
            <button
              onClick={() => setIsImportOpen(true)}
              className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium cursor-pointer"
            >
              Nạp bài học ngay
            </button>
          </div>
        )}
      </main>

      {/* Floating Tense Handbook Button (Góc dưới bên phải) */}
      <TenseHandbookButton
        onClick={() => setIsHandbookOpen(true)}
        isOpen={isHandbookOpen}
      />

      {/* Tense Handbook Modal */}
      <TenseHandbookModal
        isOpen={isHandbookOpen}
        onClose={() => setIsHandbookOpen(false)}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onLessonImported={handleLessonImported}
      />
    </div>
  );
}

export default App;
