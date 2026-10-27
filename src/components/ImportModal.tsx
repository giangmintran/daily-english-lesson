import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import {
  validateAndParseVocabularyJson,
  validateAndParseExercisesJson,
  saveLesson,
  getLessonByDate,
  setActiveDate,
} from '../services/storage';
import { DailyLesson, VocabularyItem, ExerciseItem } from '../types/lesson';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLessonImported: (lesson: DailyLesson) => void;
}

// 1. Template cho Ô Từ Mới
export const sampleVocabTemplate = {
  date: new Date().toISOString().split('T')[0],
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
      commonMistakes: "Trọng âm rơi vào âm tiết thứ hai: un-WIND. Quá khứ là unwound.",
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
  ]
};

// 2. Template cho Ô Bài Tập
export const sampleExerciseTemplate = {
  date: new Date().toISOString().split('T')[0],
  topic: "Daily Routine & Morning Habits",
  exercises: [
    {
      id: 1,
      type: "multiple_choice",
      question: "If you stay in bed after your alarm rings, you might _______ and arrive late for work.",
      options: ["oversleep", "unwind", "wake up", "streamline"],
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
      options: ["unwind", "oversleep", "procrastinate", "scrutinize"],
      answer: "unwind",
      explanation: "'Unwind' nghĩa là thư giãn, thả lỏng sau khi trải qua căng thẳng."
    }
  ]
};

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onLessonImported }) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Common Meta
  const [lessonDate, setLessonDate] = useState<string>(todayStr);
  const [lessonTopic, setLessonTopic] = useState<string>('Daily English Lesson');

  // Ô 1: Vocabulary State
  const [vocabInputMode, setVocabInputMode] = useState<'paste' | 'upload'>('paste');
  const [vocabText, setVocabText] = useState('');
  const [parsedVocab, setParsedVocab] = useState<VocabularyItem[] | null>(null);
  const [vocabError, setVocabError] = useState<string | null>(null);
  const [copiedVocab, setCopiedVocab] = useState(false);
  const [isDraggingVocab, setIsDraggingVocab] = useState(false);
  const vocabFileRef = useRef<HTMLInputElement>(null);

  // Ô 2: Exercises State
  const [exerciseInputMode, setExerciseInputMode] = useState<'paste' | 'upload'>('paste');
  const [exerciseText, setExerciseText] = useState('');
  const [parsedExercises, setParsedExercises] = useState<ExerciseItem[] | null>(null);
  const [exerciseError, setExerciseError] = useState<string | null>(null);
  const [copiedExercise, setCopiedExercise] = useState(false);
  const [isDraggingExercise, setIsDraggingExercise] = useState(false);
  const exerciseFileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Vocab Input Change
  const handleVocabChange = (text: string) => {
    setVocabText(text);
    setVocabError(null);
    if (!text.trim()) {
      setParsedVocab(null);
      return;
    }

    try {
      const res = validateAndParseVocabularyJson(text);
      setParsedVocab(res.vocabulary);
      if (res.date) setLessonDate(res.date);
      if (res.topic) setLessonTopic(res.topic);
      setVocabError(null);
    } catch (err: any) {
      setParsedVocab(null);
      setVocabError(err.message || 'JSON từ vựng không hợp lệ');
    }
  };

  // Handle Exercise Input Change
  const handleExerciseChange = (text: string) => {
    setExerciseText(text);
    setExerciseError(null);
    if (!text.trim()) {
      setParsedExercises(null);
      return;
    }

    try {
      const res = validateAndParseExercisesJson(text);
      setParsedExercises(res.exercises);
      if (res.date && !parsedVocab) setLessonDate(res.date);
      if (res.topic && !parsedVocab) setLessonTopic(res.topic);
      setExerciseError(null);
    } catch (err: any) {
      setParsedExercises(null);
      setExerciseError(err.message || 'JSON bài tập không hợp lệ');
    }
  };

  // Load Template for Vocab
  const handleLoadVocabTemplate = () => {
    const formatted = JSON.stringify(sampleVocabTemplate, null, 2);
    setVocabInputMode('paste');
    handleVocabChange(formatted);
  };

  // Download Vocab Template file
  const handleDownloadVocabFile = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sampleVocabTemplate, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = 'vocabulary_template.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Copy Vocab Template
  const handleCopyVocab = () => {
    navigator.clipboard.writeText(JSON.stringify(sampleVocabTemplate, null, 2));
    setCopiedVocab(true);
    setTimeout(() => setCopiedVocab(false), 2000);
  };

  // Load Template for Exercise
  const handleLoadExerciseTemplate = () => {
    const formatted = JSON.stringify(sampleExerciseTemplate, null, 2);
    setExerciseInputMode('paste');
    handleExerciseChange(formatted);
  };

  // Download Exercise Template file
  const handleDownloadExerciseFile = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sampleExerciseTemplate, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = 'exercise_template.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Copy Exercise Template
  const handleCopyExercise = () => {
    navigator.clipboard.writeText(JSON.stringify(sampleExerciseTemplate, null, 2));
    setCopiedExercise(true);
    setTimeout(() => setCopiedExercise(false), 2000);
  };

  // Load both templates at once
  const handleLoadBothTemplates = () => {
    handleLoadVocabTemplate();
    handleLoadExerciseTemplate();
  };

  // Save and apply
  const handleSaveAndApply = () => {
    const targetDate = lessonDate.trim() || todayStr;
    const existing = getLessonByDate(targetDate);

    const finalVocab = parsedVocab || existing?.vocabulary || [];
    const finalExercises = parsedExercises || existing?.exercises || [];

    if (finalVocab.length === 0 && finalExercises.length === 0) {
      alert('Vui lòng nhập ít nhất Từ mới hoặc Bài tập!');
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

  const hasValidData = Boolean((parsedVocab && parsedVocab.length > 0) || (parsedExercises && parsedExercises.length > 0));

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
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
                Import Bài Học (2 Ô Riêng Biệt)
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-500">
                Nhập độc lập Từ mới và Bài tập với 2 template mẫu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadBothTemplates}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
              title="Điền mẫu cho cả 2 ô"
            >
              <Sparkles size={13} className="text-amber-500" />
              <span>Nạp mẫu cả 2 ô</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
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

        {/* 2 MAIN BOXES (GRID 2 COLS) */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 overflow-y-auto">
          {/* Ô 1: IMPORT TỪ MỚI (VOCABULARY) */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 bg-white dark:bg-zinc-900/60 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              {/* Header Box 1 */}
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
                      Kèm cách dùng, cấu trúc & ví dụ
                    </span>
                  </div>
                </div>

                {/* Template Actions for Vocab */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleLoadVocabTemplate}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 text-[11px] font-medium transition-colors cursor-pointer"
                    title="Nạp mẫu từ vựng chuẩn"
                  >
                    <Sparkles size={11} />
                    <span>Nạp mẫu</span>
                  </button>
                  <button
                    onClick={handleCopyVocab}
                    className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Copy mẫu từ vựng"
                  >
                    {copiedVocab ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  </button>
                  <button
                    onClick={handleDownloadVocabFile}
                    className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Tải file mẫu vocabulary_template.json"
                  >
                    <Download size={13} />
                  </button>
                </div>
              </div>

              {/* Mode switch for Vocab */}
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

              {/* Input Area */}
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
                    Chọn hoặc kéo thả file JSON từ vựng
                  </span>
                  <span className="text-[11px] text-zinc-400 mt-1">Hỗ trợ file vocabulary.json</span>
                </div>
              )}
            </div>

            {/* Vocab Status / Error */}
            <div>
              {vocabError && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0" />
                  <span className="truncate">{vocabError}</span>
                </div>
              )}

              {parsedVocab && (
                <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 size={14} className="text-blue-500" />
                    <span>Hợp lệ: Đã nhận {parsedVocab.length} từ mới</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {parsedVocab[0]?.word ? `(Ví dụ: ${parsedVocab[0].word}...)` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Ô 2: IMPORT BÀI TẬP (EXERCISES) */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 bg-white dark:bg-zinc-900/60 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              {/* Header Box 2 */}
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

                {/* Template Actions for Exercise */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleLoadExerciseTemplate}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 text-[11px] font-medium transition-colors cursor-pointer"
                    title="Nạp mẫu bài tập chuẩn"
                  >
                    <Sparkles size={11} />
                    <span>Nạp mẫu</span>
                  </button>
                  <button
                    onClick={handleCopyExercise}
                    className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Copy mẫu bài tập"
                  >
                    {copiedExercise ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  </button>
                  <button
                    onClick={handleDownloadExerciseFile}
                    className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Tải file mẫu exercise_template.json"
                  >
                    <Download size={13} />
                  </button>
                </div>
              </div>

              {/* Mode switch for Exercises */}
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

              {/* Input Area */}
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
                    Chọn hoặc kéo thả file JSON bài tập
                  </span>
                  <span className="text-[11px] text-zinc-400 mt-1">Hỗ trợ file exercise.json</span>
                </div>
              )}
            </div>

            {/* Exercise Status / Error */}
            <div>
              {exerciseError && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0" />
                  <span className="truncate">{exerciseError}</span>
                </div>
              )}

              {parsedExercises && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span>Hợp lệ: Đã nhận {parsedExercises.length} bài tập</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {parsedExercises.length > 0 ? `(Câu #1: ${parsedExercises[0].type})` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-50/80 dark:bg-zinc-900/80 shrink-0">
          <div className="text-xs text-zinc-500 text-center sm:text-left">
            {hasValidData ? (
              <span className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span>Sẵn sàng lưu:</span>
                <strong className="text-blue-600 dark:text-blue-400 font-mono">
                  {parsedVocab ? `${parsedVocab.length} từ` : 'giữ từ cũ'}
                </strong>
                <span>+</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                  {parsedExercises ? `${parsedExercises.length} bài tập` : 'giữ bài tập cũ'}
                </strong>
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
