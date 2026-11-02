import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  UploadCloud,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  Download,
  BookOpen,
  CheckSquare,
  Calendar,
  Layers,
  AlertTriangle,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import {
  validateAndParseVocabularyJson,
  validateAndParseExercisesJson,
  validateAndParseLessonJson,
  saveLesson,
  getLessonByDate,
  setActiveDate,
  getCurrentLesson,
  extractDatabaseWordsMap,
  filterDuplicateVocabulary,
} from '../services/storage';
import { fetchLessonsFromApi } from '../services/api';
import { DailyLesson, VocabularyItem, ExerciseItem } from '../types/lesson';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLessonImported: (lesson: DailyLesson) => void;
}

// Template chuẩn từ assets/template.json (Bao gồm cả từ mới và bài tập)
export const sampleTemplate = {
  date: "2026-10-27",
  topic: "Daily Routine & Morning Habits",
  vocabulary: [
    {
      id: "v1",
      word: "wake up",
      phonetic: "/weɪk ʌp/",
      partOfSpeech: "Cụm động từ",
      meaning: "Thức giấc.",
      usage: "Dùng khi nói về thời điểm bạn tỉnh giấc sau khi ngủ.",
      purpose: "Kể về lịch sinh hoạt và thói quen buổi sáng.",
      structures: [
        "wake up at + giờ — thức giấc lúc nào",
        "wake someone up — đánh thức ai",
        "wake up early/late — thức giấc sớm/muộn"
      ],
      commonMistakes: "wake up là thức giấc; get up là ra khỏi giường.",
      examples: [
        {
          en: "I usually wake up at 6:30 on weekdays.",
          vi: "Tôi thường thức giấc lúc 6 giờ 30 vào các ngày trong tuần."
        },
        {
          en: "My alarm didn't wake me up this morning.",
          vi: "Chuông báo thức sáng nay đã không đánh thức được tôi."
        }
      ]
    },
    {
      id: "v2",
      word: "oversleep",
      phonetic: "/ˌoʊvərˈsliːp/",
      partOfSpeech: "Động từ",
      meaning: "Ngủ quên, ngủ quá giờ dự định.",
      usage: "Dùng khi bạn ngủ lâu hơn dự kiến, thường dẫn đến việc thức dậy muộn.",
      purpose: "Giải thích vì sao bạn thức dậy muộn hoặc đến muộn.",
      structures: [
        "oversleep and miss something — ngủ quên và bỏ lỡ việc gì",
        "oversleep by + khoảng thời gian — ngủ quá giờ bao lâu"
      ],
      commonMistakes: "Quá khứ của oversleep là overslept, không phải oversleeped.",
      examples: [
        {
          en: "I overslept and missed the first bus.",
          vi: "Tôi ngủ quên và lỡ chuyến xe buýt đầu tiên."
        }
      ]
    },
    {
      id: "v3",
      word: "unwind",
      phonetic: "/ˌʌnˈwaɪnd/",
      partOfSpeech: "Động từ",
      meaning: "Thư giãn, thả lỏng sau khi làm việc hoặc trải qua căng thẳng.",
      usage: "Dùng khi nói về việc nghỉ ngơi để giải tỏa căng thẳng sau một ngày dài.",
      purpose: "Miêu tả hoạt động giúp bạn thoải mái về tinh thần sau công việc.",
      structures: [
        "unwind after work — thư giãn sau giờ làm",
        "unwind by + V-ing — thư giãn bằng cách làm gì",
        "take time to unwind — dành thời gian để thư giãn"
      ],
      commonMistakes: "Trọng âm rơi vào âm tiết thứ hai: un-WIND. Quá khứ của động từ này là unwound.",
      examples: [
        {
          en: "I like to unwind by listening to music after work.",
          vi: "Tôi thích thư giãn bằng cách nghe nhạc sau giờ làm."
        },
        {
          en: "She needs some time to unwind after a stressful day.",
          vi: "Cô ấy cần chút thời gian để thư giãn sau một ngày căng thẳng."
        }
      ]
    }
  ],
  exercises: [
    {
      id: 1,
      type: "multiple_choice",
      question: "If you stay in bed after your alarm rings, you might _______ and arrive late for work.",
      options: [
        "oversleep",
        "unwind",
        "wake up",
        "streamline"
      ],
      answer: "oversleep",
      explanation: "'Oversleep' có nghĩa là ngủ quên, ngủ quá giờ dự định."
    },
    {
      id: 2,
      type: "fill_in_blank",
      question: "I usually _______ (thức giấc) at 6:30 on weekdays, but I get up at 6:45.",
      answer: "wake up",
      explanation: "'Wake up' là thức giấc, còn 'get up' là rời khỏi giường."
    },
    {
      id: 3,
      type: "fill_in_blank",
      question: "They were so exhausted that they _______ (unwind) at home all evening.",
      answer: "unwound",
      explanation: "Động từ bất quy tắc 'unwind' có dạng quá khứ là 'unwound'."
    },
    {
      id: 4,
      type: "multiple_choice",
      question: "Listening to soft instrumental music is a great way to _______ after a stressful shift.",
      options: [
        "unwind",
        "oversleep",
        "procrastinate",
        "scrutinize"
      ],
      answer: "unwind",
      explanation: "'Unwind' nghĩa là thư giãn, thả lỏng sau khi trải qua căng thẳng."
    }
  ]
};

// Mẫu tách rời cho từ vựng và bài tập (hỗ trợ chế độ split)
export const sampleVocabTemplate = {
  date: sampleTemplate.date,
  topic: sampleTemplate.topic,
  vocabulary: sampleTemplate.vocabulary,
};

export const sampleExerciseTemplate = {
  date: sampleTemplate.date,
  topic: sampleTemplate.topic,
  exercises: sampleTemplate.exercises,
};

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onLessonImported }) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Tab: 'unified' (mặc định theo template.json) hoặc 'split' (2 ô riêng biệt)
  const [activeTab, setActiveTab] = useState<'unified' | 'split'>('unified');

  // Common Meta
  const [lessonDate, setLessonDate] = useState<string>(todayStr);
  const [lessonTopic, setLessonTopic] = useState<string>('Daily English Lesson');

  // Database words map (được load từ Supabase & LocalStorage)
  const [dbLessons, setDbLessons] = useState<DailyLesson[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(false);

  // Tab 1: Unified Import State
  const [unifiedInputMode, setUnifiedInputMode] = useState<'paste' | 'upload'>('paste');
  const [unifiedText, setUnifiedText] = useState('');
  const [rawParsedVocab, setRawParsedVocab] = useState<VocabularyItem[] | null>(null);
  const [parsedExercises, setParsedExercises] = useState<ExerciseItem[] | null>(null);
  const [unifiedError, setUnifiedError] = useState<string | null>(null);
  const [isDraggingUnified, setIsDraggingUnified] = useState(false);
  const unifiedFileRef = useRef<HTMLInputElement>(null);

  // Tab 2: Split Import State (Tách rời)
  const [vocabInputMode, setVocabInputMode] = useState<'paste' | 'upload'>('paste');
  const [vocabText, setVocabText] = useState('');
  const [rawSplitVocab, setRawSplitVocab] = useState<VocabularyItem[] | null>(null);
  const [vocabError, setVocabError] = useState<string | null>(null);
  const [isDraggingVocab, setIsDraggingVocab] = useState(false);
  const vocabFileRef = useRef<HTMLInputElement>(null);

  const [exerciseInputMode, setExerciseInputMode] = useState<'paste' | 'upload'>('paste');
  const [exerciseText, setExerciseText] = useState('');
  const [splitExercises, setSplitExercises] = useState<ExerciseItem[] | null>(null);
  const [exerciseError, setExerciseError] = useState<string | null>(null);
  const [isDraggingExercise, setIsDraggingExercise] = useState(false);
  const exerciseFileRef = useRef<HTMLInputElement>(null);

  // Copy state
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  // Load database lessons when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingDb(true);

    async function loadDb() {
      try {
        const apiLessons = await fetchLessonsFromApi();
        if (isMounted) {
          if (apiLessons && apiLessons.length > 0) {
            setDbLessons(apiLessons);
          } else {
            const current = getCurrentLesson();
            setDbLessons(current ? [current] : []);
          }
        }
      } catch (err) {
        console.warn('Could not fetch lessons from API in ImportModal:', err);
        const current = getCurrentLesson();
        if (isMounted) {
          setDbLessons(current ? [current] : []);
        }
      } finally {
        if (isMounted) setIsLoadingDb(false);
      }
    }

    loadDb();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Map tất cả từ vựng đã tồn tại trong database (ngoại trừ chính ngày đang import nếu đang sửa lại bài đó)
  const existingWordsMap = useMemo(() => {
    return extractDatabaseWordsMap(dbLessons, lessonDate);
  }, [dbLessons, lessonDate]);

  // Tính tổng số từ đã lưu trong toàn bộ database (để hiển thị thống kê)
  const totalDbWordsCount = useMemo(() => {
    const fullMap = extractDatabaseWordsMap(dbLessons);
    return fullMap.size;
  }, [dbLessons]);

  // Lọc từ vựng cho tab Unified
  const { uniqueVocab: filteredUnifiedVocab, duplicateWords: unifiedDuplicates } = useMemo(() => {
    if (!rawParsedVocab) return { uniqueVocab: [], duplicateWords: [] };
    return filterDuplicateVocabulary(rawParsedVocab, existingWordsMap);
  }, [rawParsedVocab, existingWordsMap]);

  // Lọc từ vựng cho tab Split
  const { uniqueVocab: filteredSplitVocab, duplicateWords: splitDuplicates } = useMemo(() => {
    if (!rawSplitVocab) return { uniqueVocab: [], duplicateWords: [] };
    return filterDuplicateVocabulary(rawSplitVocab, existingWordsMap);
  }, [rawSplitVocab, existingWordsMap]);

  if (!isOpen) return null;

  // Xử lý khi text ở tab Unified thay đổi
  const handleUnifiedChange = (text: string) => {
    setUnifiedText(text);
    setUnifiedError(null);
    if (!text.trim()) {
      setRawParsedVocab(null);
      setParsedExercises(null);
      return;
    }

    try {
      const lesson = validateAndParseLessonJson(text);
      if (lesson.date) setLessonDate(lesson.date);
      if (lesson.topic) setLessonTopic(lesson.topic);
      setRawParsedVocab(lesson.vocabulary.length > 0 ? lesson.vocabulary : null);
      setParsedExercises(lesson.exercises.length > 0 ? lesson.exercises : null);
      setUnifiedError(null);
    } catch (err: any) {
      setRawParsedVocab(null);
      setParsedExercises(null);
      setUnifiedError(err.message || 'JSON không hợp lệ');
    }
  };

  // Nạp mẫu Unified (từ assets/template.json)
  const handleLoadUnifiedTemplate = () => {
    const formatted = JSON.stringify(sampleTemplate, null, 2);
    setUnifiedInputMode('paste');
    handleUnifiedChange(formatted);
  };

  // Tải file template.json
  const handleDownloadTemplateFile = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sampleTemplate, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = 'template.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Copy template.json
  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(JSON.stringify(sampleTemplate, null, 2));
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  // Split tab: Xử lý ô Từ vựng
  const handleVocabChange = (text: string) => {
    setVocabText(text);
    setVocabError(null);
    if (!text.trim()) {
      setRawSplitVocab(null);
      return;
    }

    try {
      const res = validateAndParseVocabularyJson(text);
      setRawSplitVocab(res.vocabulary);
      if (res.date) setLessonDate(res.date);
      if (res.topic) setLessonTopic(res.topic);
      setVocabError(null);
    } catch (err: any) {
      setRawSplitVocab(null);
      setVocabError(err.message || 'JSON từ vựng không hợp lệ');
    }
  };

  // Split tab: Xử lý ô Bài tập
  const handleExerciseChange = (text: string) => {
    setExerciseText(text);
    setExerciseError(null);
    if (!text.trim()) {
      setSplitExercises(null);
      return;
    }

    try {
      const res = validateAndParseExercisesJson(text);
      setSplitExercises(res.exercises);
      if (res.date && !rawSplitVocab) setLessonDate(res.date);
      if (res.topic && !rawSplitVocab) setLessonTopic(res.topic);
      setExerciseError(null);
    } catch (err: any) {
      setSplitExercises(null);
      setExerciseError(err.message || 'JSON bài tập không hợp lệ');
    }
  };

  // Nạp mẫu cho 2 ô Split
  const handleLoadSplitTemplate = () => {
    setVocabInputMode('paste');
    handleVocabChange(JSON.stringify(sampleVocabTemplate, null, 2));
    setExerciseInputMode('paste');
    handleExerciseChange(JSON.stringify(sampleExerciseTemplate, null, 2));
  };

  // Dữ liệu cuối cùng chuẩn bị lưu theo tab đang chọn
  const activeVocab = activeTab === 'unified' ? filteredUnifiedVocab : filteredSplitVocab;
  const activeDuplicates = activeTab === 'unified' ? unifiedDuplicates : splitDuplicates;
  const activeRawVocab = activeTab === 'unified' ? rawParsedVocab : rawSplitVocab;
  const activeExercises = activeTab === 'unified' ? parsedExercises : splitExercises;

  const hasValidData = Boolean(
    (activeVocab && activeVocab.length > 0) ||
    (activeExercises && activeExercises.length > 0)
  );

  // Lưu và áp dụng
  const handleSaveAndApply = () => {
    const targetDate = lessonDate.trim() || todayStr;
    const existing = getLessonByDate(targetDate);

    // Từ vựng được lưu CHỈ LÀ NHỮNG TỪ KHÔNG BỊ TRÙNG trong database
    const finalVocab = activeVocab && activeVocab.length > 0 ? activeVocab : (existing?.vocabulary || []);
    const finalExercises = activeExercises && activeExercises.length > 0 ? activeExercises : (existing?.exercises || []);

    if (finalVocab.length === 0 && finalExercises.length === 0) {
      alert('Vui lòng nhập ít nhất Từ mới (không trùng lặp) hoặc Bài tập!');
      return;
    }

    const newLesson: DailyLesson = {
      date: targetDate,
      topic: lessonTopic.trim() || existing?.topic || 'Daily English Lesson',
      vocabulary: finalVocab,
      exercises: finalExercises,
      progress: existing?.progress || {
        wordsMastered: [],
        exerciseResults: {},
      },
    };

    saveLesson(newLesson);
    setActiveDate(newLesson.date);
    onLessonImported(newLesson);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 border-0 sm:border border-zinc-200 dark:border-zinc-800 rounded-none sm:rounded-3xl w-full max-w-5xl h-full sm:h-auto sm:max-h-[92vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs shrink-0">
              <Layers size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
                  Import Bài Học
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 font-mono font-medium border border-blue-500/20">
                  <ShieldCheck size={12} />
                  <span>Chống trùng từ vựng</span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-500">
                Nhập bài học theo mẫu chuẩn template.json (tự động lọc bỏ các từ đã có trong database)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Template Actions */}
            <button
              onClick={activeTab === 'unified' ? handleLoadUnifiedTemplate : handleLoadSplitTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-medium transition-colors cursor-pointer border border-blue-200/50 dark:border-blue-800/50"
              title="Điền dữ liệu từ template.json mẫu"
            >
              <Sparkles size={13} className="text-amber-500" />
              <span>Nạp template mẫu</span>
            </button>
            <button
              onClick={handleCopyTemplate}
              className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Sao chép template.json"
            >
              {copiedTemplate ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            </button>
            <button
              onClick={handleDownloadTemplateFile}
              className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Tải file template.json"
            >
              <Download size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Selector & Database status bar */}
        <div className="px-4 sm:px-6 py-2 bg-zinc-50/80 dark:bg-zinc-950/40 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs shrink-0 flex-wrap">
          <div className="flex items-center gap-1 bg-zinc-200/70 dark:bg-zinc-800/70 p-0.5 rounded-xl">
            <button
              onClick={() => setActiveTab('unified')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'unified'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <FileText size={13} />
              <span>Mẫu chuẩn Template (Khuyên dùng)</span>
            </button>
            <button
              onClick={() => setActiveTab('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'split'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Layers size={13} />
              <span>Nhập tách rời 2 ô</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-zinc-500 font-mono text-[11px]">
            <ShieldCheck size={13} className="text-emerald-500" />
            <span>
              Database hiện có: <strong className="text-zinc-700 dark:text-zinc-300">{totalDbWordsCount} từ</strong> đã lưu
            </span>
            {isLoadingDb && <span className="animate-pulse text-zinc-400">(đang đồng bộ...)</span>}
          </div>
        </div>

        {/* Date & Topic Settings Bar */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-4 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-zinc-400 shrink-0" />
            <span className="text-zinc-500 font-medium shrink-0">Ngày học:</span>
            <input
              type="date"
              value={lessonDate}
              onChange={(e) => setLessonDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-mono text-xs"
            />
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-zinc-500 font-medium shrink-0">Chủ đề:</span>
            <input
              type="text"
              value={lessonTopic}
              onChange={(e) => setLessonTopic(e.target.value)}
              placeholder="Nhập chủ đề bài học..."
              className="flex-1 px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-xs"
            />
          </div>
        </div>

        {/* DUPLICATE WORDS ALERT BANNER (Nếu phát hiện từ đã có trong database) */}
        {activeDuplicates.length > 0 && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-900 dark:text-amber-200 shrink-0 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
              <AlertTriangle size={15} className="shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                Đã tự động loại bỏ {activeDuplicates.length} từ đã tồn tại trong database (sẽ không import thêm):
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {activeDuplicates.map((d, idx) => (
                <span
                  key={`${d.word}_${idx}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/20 font-mono text-[11px]"
                  title={d.existingDate ? `Đã có trong bài ngày ${d.existingDate}` : 'Trùng lặp trong dữ liệu'}
                >
                  <strong>{d.word}</strong>
                  {d.existingDate && (
                    <span className="text-[10px] text-amber-700/80 dark:text-amber-300/80">({d.existingDate})</span>
                  )}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-amber-700/90 dark:text-amber-300/80">
              Hệ thống chỉ import các từ mới tinh chưa từng xuất hiện trong các bài học trước để tránh trùng lặp từ vựng.
            </p>
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'unified' ? (
            /* TAB 1: UNIFIED IMPORT (THEO TEMPLATE.JSON) */
            <div className="space-y-4">
              {/* Input Mode Selector */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setUnifiedInputMode('paste')}
                    className={`flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                      unifiedInputMode === 'paste'
                        ? 'text-zinc-900 dark:text-zinc-100 font-semibold underline underline-offset-4 decoration-2'
                        : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    <FileCode size={13} />
                    <span>Dán JSON đầy đủ (template.json)</span>
                  </button>
                  <button
                    onClick={() => setUnifiedInputMode('upload')}
                    className={`flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                      unifiedInputMode === 'upload'
                        ? 'text-zinc-900 dark:text-zinc-100 font-semibold underline underline-offset-4 decoration-2'
                        : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    <UploadCloud size={13} />
                    <span>Tải file .json</span>
                  </button>
                </div>

                <span className="text-[11px] text-zinc-400">
                  Hỗ trợ định dạng đầy đủ: date, topic, vocabulary, exercises
                </span>
              </div>

              {/* Input Box */}
              {unifiedInputMode === 'paste' ? (
                <textarea
                  value={unifiedText}
                  onChange={(e) => handleUnifiedChange(e.target.value)}
                  placeholder={`Dán nội dung file JSON theo template.json vào đây:\n{\n  "date": "${todayStr}",\n  "topic": "Daily Routine",\n  "vocabulary": [...],\n  "exercises": [...]\n}`}
                  className="w-full h-56 sm:h-64 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 resize-none leading-relaxed"
                />
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingUnified(true);
                  }}
                  onDragLeave={() => setIsDraggingUnified(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingUnified(false);
                    if (e.dataTransfer.files?.[0]) {
                      const reader = new FileReader();
                      reader.onload = (ev) => handleUnifiedChange(ev.target?.result as string);
                      reader.readAsText(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => unifiedFileRef.current?.click()}
                  className={`h-56 sm:h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
                    isDraggingUnified
                      ? 'border-blue-500 bg-blue-50/20'
                      : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 bg-zinc-50/50 dark:bg-zinc-950'
                  }`}
                >
                  <input
                    ref={unifiedFileRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        const reader = new FileReader();
                        reader.onload = (ev) => handleUnifiedChange(ev.target?.result as string);
                        reader.readAsText(e.target.files[0]);
                      }
                    }}
                  />
                  <UploadCloud size={32} className="text-zinc-400 mb-2" />
                  <span className="text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    Chọn hoặc kéo thả file JSON bài học
                  </span>
                  <span className="text-[11px] text-zinc-400 mt-1">
                    Hỗ trợ template.json, vocabulary_YYYY-MM-DD.json hoặc bất kỳ file bài học nào
                  </span>
                </div>
              )}

              {/* Status / Errors */}
              {unifiedError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{unifiedError}</span>
                </div>
              )}

              {/* Valid Data Preview Cards */}
              {(rawParsedVocab || parsedExercises) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Card Vocabulary */}
                  <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen size={15} className="text-blue-500" />
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Từ Vựng</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                        {filteredUnifiedVocab.length} từ mới
                        {unifiedDuplicates.length > 0 && ` (${unifiedDuplicates.length} từ đã lọc)`}
                      </span>
                    </div>

                    {filteredUnifiedVocab.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                        {filteredUnifiedVocab.slice(0, 15).map((v) => (
                          <span
                            key={v.id || v.word}
                            className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 font-mono text-[11px]"
                          >
                            {v.word}
                          </span>
                        ))}
                        {filteredUnifiedVocab.length > 15 && (
                          <span className="text-[11px] text-zinc-400 self-center">
                            +{filteredUnifiedVocab.length - 15} từ nữa
                          </span>
                        )}
                      </div>
                    ) : rawParsedVocab && rawParsedVocab.length > 0 ? (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400">
                        Tất cả các từ trong file đã có trong database. Không có từ mới nào để thêm.
                      </p>
                    ) : (
                      <p className="text-[11px] text-zinc-400">Không có dữ liệu từ vựng trong file này.</p>
                    )}
                  </div>

                  {/* Card Exercises */}
                  <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckSquare size={15} className="text-emerald-500" />
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Bài Tập</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {parsedExercises ? `${parsedExercises.length} câu` : '0 câu'}
                      </span>
                    </div>

                    {parsedExercises && parsedExercises.length > 0 ? (
                      <div className="text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1">
                        <div className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 size={13} />
                          <span>Hợp lệ: Đã nhận {parsedExercises.length} câu hỏi bài tập</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 font-mono truncate">
                          Câu 1: {parsedExercises[0]?.question}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-400">Không có dữ liệu bài tập trong file này.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: SPLIT IMPORT (2 Ô TÁCH RỜI) */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Ô 1: IMPORT TỪ MỚI */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 bg-white dark:bg-zinc-900/60 shadow-xs flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <BookOpen size={16} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                          Ô 1: Import Từ Mới
                        </h4>
                        <span className="text-[11px] text-zinc-400">
                          Tự động lọc từ đã có trong DB
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mode switch */}
                  <div className="flex items-center gap-3 pt-3 pb-2 text-xs">
                    <button
                      onClick={() => setVocabInputMode('paste')}
                      className={`flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                        vocabInputMode === 'paste'
                          ? 'text-zinc-900 dark:text-zinc-100 font-semibold underline underline-offset-4 decoration-2'
                          : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                      }`}
                    >
                      <FileCode size={13} />
                      <span>Dán JSON Từ Mới</span>
                    </button>
                    <button
                      onClick={() => setVocabInputMode('upload')}
                      className={`flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                        vocabInputMode === 'upload'
                          ? 'text-zinc-900 dark:text-zinc-100 font-semibold underline underline-offset-4 decoration-2'
                          : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                      }`}
                    >
                      <UploadCloud size={13} />
                      <span>Tải file .json</span>
                    </button>
                  </div>

                  {vocabInputMode === 'paste' ? (
                    <textarea
                      value={vocabText}
                      onChange={(e) => handleVocabChange(e.target.value)}
                      placeholder='Dán JSON từ vựng (ví dụ: { "vocabulary": [...] } hoặc [...])'
                      className="w-full h-44 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 resize-none leading-relaxed"
                    />
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingVocab(true);
                      }}
                      onDragLeave={() => setIsDraggingVocab(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingVocab(false);
                        if (e.dataTransfer.files?.[0]) {
                          const reader = new FileReader();
                          reader.onload = (ev) => handleVocabChange(ev.target?.result as string);
                          reader.readAsText(e.dataTransfer.files[0]);
                        }
                      }}
                      onClick={() => vocabFileRef.current?.click()}
                      className={`h-44 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all ${
                        isDraggingVocab
                          ? 'border-blue-500 bg-blue-50/20'
                          : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 bg-zinc-50/50 dark:bg-zinc-950'
                      }`}
                    >
                      <input
                        ref={vocabFileRef}
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            const reader = new FileReader();
                            reader.onload = (ev) => handleVocabChange(ev.target?.result as string);
                            reader.readAsText(e.target.files[0]);
                          }
                        }}
                      />
                      <UploadCloud size={24} className="text-zinc-400 mb-2" />
                      <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                        Chọn file JSON từ vựng
                      </span>
                    </div>
                  )}
                </div>

                {/* Status / Error */}
                <div>
                  {vocabError && (
                    <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-1.5">
                      <AlertCircle size={14} className="shrink-0" />
                      <span className="truncate">{vocabError}</span>
                    </div>
                  )}

                  {rawSplitVocab && (
                    <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-medium">
                        <CheckCircle2 size={14} className="text-blue-500" />
                        <span>Sẵn sàng: {filteredSplitVocab.length} từ mới</span>
                      </div>
                      {splitDuplicates.length > 0 && (
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">
                          (Đã lọc {splitDuplicates.length} từ trùng)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Ô 2: IMPORT BÀI TẬP */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 bg-white dark:bg-zinc-900/60 shadow-xs flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <CheckSquare size={16} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                          Ô 2: Import Bài Tập
                        </h4>
                        <span className="text-[11px] text-zinc-400">
                          Trắc nghiệm & điền từ khuyết
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mode switch */}
                  <div className="flex items-center gap-3 pt-3 pb-2 text-xs">
                    <button
                      onClick={() => setExerciseInputMode('paste')}
                      className={`flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                        exerciseInputMode === 'paste'
                          ? 'text-zinc-900 dark:text-zinc-100 font-semibold underline underline-offset-4 decoration-2'
                          : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                      }`}
                    >
                      <FileCode size={13} />
                      <span>Dán JSON Bài Tập</span>
                    </button>
                    <button
                      onClick={() => setExerciseInputMode('upload')}
                      className={`flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                        exerciseInputMode === 'upload'
                          ? 'text-zinc-900 dark:text-zinc-100 font-semibold underline underline-offset-4 decoration-2'
                          : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                      }`}
                    >
                      <UploadCloud size={13} />
                      <span>Tải file .json</span>
                    </button>
                  </div>

                  {exerciseInputMode === 'paste' ? (
                    <textarea
                      value={exerciseText}
                      onChange={(e) => handleExerciseChange(e.target.value)}
                      placeholder='Dán JSON bài tập (ví dụ: { "exercises": [...] } hoặc [...])'
                      className="w-full h-44 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 resize-none leading-relaxed"
                    />
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingExercise(true);
                      }}
                      onDragLeave={() => setIsDraggingExercise(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingExercise(false);
                        if (e.dataTransfer.files?.[0]) {
                          const reader = new FileReader();
                          reader.onload = (ev) => handleExerciseChange(ev.target?.result as string);
                          reader.readAsText(e.dataTransfer.files[0]);
                        }
                      }}
                      onClick={() => exerciseFileRef.current?.click()}
                      className={`h-44 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all ${
                        isDraggingExercise
                          ? 'border-emerald-500 bg-emerald-50/20'
                          : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 bg-zinc-50/50 dark:bg-zinc-950'
                      }`}
                    >
                      <input
                        ref={exerciseFileRef}
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            const reader = new FileReader();
                            reader.onload = (ev) => handleExerciseChange(ev.target?.result as string);
                            reader.readAsText(e.target.files[0]);
                          }
                        }}
                      />
                      <UploadCloud size={24} className="text-zinc-400 mb-2" />
                      <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                        Chọn file JSON bài tập
                      </span>
                    </div>
                  )}
                </div>

                {/* Status / Error */}
                <div>
                  {exerciseError && (
                    <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-1.5">
                      <AlertCircle size={14} className="shrink-0" />
                      <span className="truncate">{exerciseError}</span>
                    </div>
                  )}

                  {splitExercises && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-medium">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <span>Hợp lệ: Đã nhận {splitExercises.length} bài tập</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-50/80 dark:bg-zinc-900/80 shrink-0">
          <div className="text-xs text-zinc-500 text-center sm:text-left">
            {hasValidData ? (
              <span className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span>Sẵn sàng lưu:</span>
                <strong className="text-blue-600 dark:text-blue-400 font-mono">
                  {activeVocab ? `${activeVocab.length} từ mới` : 'giữ từ cũ'}
                </strong>
                <span>+</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                  {activeExercises ? `${activeExercises.length} bài tập` : 'giữ bài tập cũ'}
                </strong>
                {activeDuplicates.length > 0 && (
                  <span className="text-amber-600 dark:text-amber-400 font-mono">
                    (đã lọc {activeDuplicates.length} từ trùng)
                  </span>
                )}
              </span>
            ) : activeRawVocab && activeRawVocab.length > 0 && activeVocab.length === 0 ? (
              <span className="text-amber-600 dark:text-amber-400">
                Toàn bộ các từ đều đã tồn tại trong database! Không có từ mới nào để import.
              </span>
            ) : (
              <span>Vui lòng nạp ít nhất Từ mới hoặc Bài tập để lưu.</span>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-medium rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-center"
            >
              Hủy
            </button>
            <button
              disabled={!hasValidData}
              onClick={handleSaveAndApply}
              className={`flex-1 sm:flex-none px-5 py-2.5 text-xs font-semibold rounded-xl transition-all shadow-xs text-center cursor-pointer ${
                hasValidData
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-95'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed opacity-50'
              }`}
            >
              Lưu và Bắt đầu học
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
