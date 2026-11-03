import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Bookmark,
  Search,
  X,
  Volume2,
  Check,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Download,
  Upload,
  BrainCircuit,
  Loader2,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { SavedWordItem } from '../types/savedWord';
import {
  getSavedWords,
  saveWord,
  updateSavedWord,
  deleteSavedWord,
  toggleWordMastered,
  exportSavedWordsAsJson,
  importSavedWords,
  subscribeSavedWords,
} from '../services/savedWordStorage';
import { lookupWord, WordLookupResult } from '../services/dictionary';
import { speakWord } from '../utils/speech';

interface SavedWordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate?: string;
}

export const SavedWordsModal: React.FC<SavedWordsModalProps> = ({
  isOpen,
  onClose,
  currentDate,
}) => {
  const [words, setWords] = useState<SavedWordItem[]>(() => getSavedWords());
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'learning' | 'mastered'>('all');
  const [activeView, setActiveView] = useState<'list' | 'flashcards' | 'quiz'>('list');

  // Add / Edit Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [formWord, setFormWord] = useState('');
  const [formPhonetic, setFormPhonetic] = useState('');
  const [formPartOfSpeech, setFormPartOfSpeech] = useState('');
  const [formMeaning, setFormMeaning] = useState('');
  const [formContext, setFormContext] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupFeedback, setLookupFeedback] = useState<string | null>(null);

  // Flashcards state
  const [flashcardIdx, setFlashcardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz state
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Import JSON state
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync words from storage
  useEffect(() => {
    if (isOpen) {
      setWords(getSavedWords());
    }

    const unsubscribe = subscribeSavedWords(() => {
      setWords(getSavedWords());
    });

    return () => unsubscribe();
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFormOpen) {
          setIsFormOpen(false);
        } else if (activeView !== 'list') {
          setActiveView('list');
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFormOpen, activeView, onClose]);

  // Filtered and searched words
  const filteredWords = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return words.filter((item) => {
      // Filter status
      if (activeFilter === 'learning' && item.isMastered) return false;
      if (activeFilter === 'mastered' && !item.isMastered) return false;

      // Filter search
      if (!term) return true;
      const matchWord = item.word.toLowerCase().includes(term);
      const matchMeaning = item.meaning.toLowerCase().includes(term);
      const matchContext = item.contextSentence?.toLowerCase().includes(term);
      const matchNotes = item.notes?.toLowerCase().includes(term);
      return matchWord || matchMeaning || matchContext || matchNotes;
    });
  }, [words, searchTerm, activeFilter]);

  const learningCount = useMemo(() => words.filter((w) => !w.isMastered).length, [words]);
  const masteredCount = useMemo(() => words.filter((w) => w.isMastered).length, [words]);

  // Handle Free Dictionary Auto Lookup in Form
  const handleTriggerLookup = async (wordToLookup: string) => {
    if (!wordToLookup.trim()) return;
    setIsLookingUp(true);
    setLookupFeedback(null);

    try {
      const data: WordLookupResult = await lookupWord(wordToLookup);
      if (data.phonetic) setFormPhonetic(data.phonetic);
      if (data.partOfSpeech) setFormPartOfSpeech(data.partOfSpeech);
      if (data.suggestedMeaningVi && !formMeaning) {
        setFormMeaning(data.suggestedMeaningVi);
      }
      if (data.englishExample && !formContext) {
        setFormContext(data.englishExample);
      }

      if (data.foundInDictionary) {
        setLookupFeedback('Đã tìm thấy thông tin từ Free Dictionary!');
      } else {
        setLookupFeedback('Không tìm thấy trong từ điển, bạn có thể tự nhập nghĩa.');
      }
    } catch {
      setLookupFeedback('Lỗi tra cứu từ điển.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleOpenAddForm = () => {
    setEditingWordId(null);
    setFormWord('');
    setFormPhonetic('');
    setFormPartOfSpeech('');
    setFormMeaning('');
    setFormContext('');
    setFormNotes('');
    setLookupFeedback(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (item: SavedWordItem) => {
    setEditingWordId(item.id);
    setFormWord(item.word);
    setFormPhonetic(item.phonetic || '');
    setFormPartOfSpeech(item.partOfSpeech || '');
    setFormMeaning(item.meaning);
    setFormContext(item.contextSentence || '');
    setFormNotes(item.notes || '');
    setLookupFeedback(null);
    setIsFormOpen(true);
  };

  const handleSaveFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formWord.trim() || !formMeaning.trim()) return;

    if (editingWordId) {
      updateSavedWord(editingWordId, {
        word: formWord.trim(),
        phonetic: formPhonetic.trim() || undefined,
        partOfSpeech: formPartOfSpeech.trim() || undefined,
        meaning: formMeaning.trim(),
        contextSentence: formContext.trim() || undefined,
        notes: formNotes.trim() || undefined,
      });
    } else {
      saveWord({
        word: formWord.trim(),
        phonetic: formPhonetic.trim() || undefined,
        partOfSpeech: formPartOfSpeech.trim() || undefined,
        meaning: formMeaning.trim(),
        contextSentence: formContext.trim() || undefined,
        notes: formNotes.trim() || undefined,
        sourceDate: currentDate,
        sourceType: 'manual',
      });
    }

    setIsFormOpen(false);
  };

  const handleDeleteWord = (id: string, word: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa từ "${word}" khỏi Sổ tay không?`)) {
      deleteSavedWord(id);
    }
  };

  const handleToggleMasteredStatus = (id: string) => {
    toggleWordMastered(id);
  };

  // Export JSON
  const handleExport = () => {
    const dataStr = exportSavedWordsAsJson();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `daily-english-saved-words-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const { imported, updated } = importSavedWords(parsed);
        alert(`Đã nạp thành công! Thêm mới: ${imported} từ, cập nhật: ${updated} từ.`);
      } catch (err) {
        alert('File JSON không hợp lệ!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Quiz Options Generator
  const quizCurrentWord = filteredWords[quizIdx];
  const quizOptions = useMemo(() => {
    if (!quizCurrentWord) return [];
    const correct = quizCurrentWord.meaning;
    const others = words
      .filter((w) => w.id !== quizCurrentWord.id && w.meaning !== correct)
      .map((w) => w.meaning);

    // Shuffle and pick 3 wrong options
    const shuffledOthers = [...others].sort(() => 0.5 - Math.random()).slice(0, 3);
    const combined = [correct, ...shuffledOthers].sort(() => 0.5 - Math.random());
    return combined;
  }, [quizCurrentWord, words]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-4xl h-[92vh] sm:h-[88vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500 text-zinc-950 flex items-center justify-center font-bold shadow-xs">
              <Bookmark size={20} className="fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Sổ tay từ vựng
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                  {words.length} từ
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-zinc-500 dark:text-zinc-400">
                Các từ mới được bạn lưu lại khi đọc ví dụ và làm bài tập
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {words.length > 0 && activeView === 'list' && (
              <button
                onClick={() => {
                  setActiveView('flashcards');
                  setFlashcardIdx(0);
                  setIsFlipped(false);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                title="Luyện tập Flashcard"
              >
                <Layers size={14} />
                <span className="hidden sm:inline">Luyện tập</span>
              </button>
            )}

            {activeView === 'list' && (
              <button
                onClick={handleOpenAddForm}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus size={15} />
                <span className="hidden sm:inline">Thêm từ</span>
              </button>
            )}

            {activeView !== 'list' && (
              <button
                onClick={() => setActiveView('list')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Về danh sách</span>
              </button>
            )}

            {/* Export / Import Menu */}
            <button
              onClick={handleExport}
              className="p-2 rounded-xl text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              title="Xuất file JSON sao lưu"
            >
              <Download size={16} />
            </button>

            <label
              className="p-2 rounded-xl text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              title="Nạp file JSON từ vựng"
            >
              <Upload size={16} />
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* VIEW 1: WORD LIST */}
        {activeView === 'list' && (
          <>
            {/* Filter & Search Bar */}
            <div className="p-3 sm:p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              {/* Status Filter Tabs */}
              <div className="flex items-center space-x-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl text-xs font-medium self-start sm:self-auto">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeFilter === 'all'
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                  }`}
                >
                  Tất cả ({words.length})
                </button>
                <button
                  onClick={() => setActiveFilter('learning')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeFilter === 'learning'
                      ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-xs font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                  }`}
                >
                  Đang học ({learningCount})
                </button>
                <button
                  onClick={() => setActiveFilter('mastered')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeFilter === 'mastered'
                      ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                  }`}
                >
                  Đã thuộc ({masteredCount})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm từ, nghĩa, ngữ cảnh..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Word List Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3">
              {filteredWords.length === 0 ? (
                <div className="py-16 text-center max-w-sm mx-auto space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
                    <Bookmark size={24} />
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {searchTerm
                      ? 'Không tìm thấy từ vựng nào khớp với tìm kiếm'
                      : 'Sổ tay của bạn hiện đang trống'}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    💡 <strong>Mẹo hay:</strong> Khi đang làm bài tập hoặc học từ mới, bạn chỉ cần{' '}
                    <strong className="text-amber-500">bôi đen bất kỳ từ nào</strong> trên màn hình,
                    nút lưu từ sẽ xuất hiện tức thì kèm câu ngữ cảnh!
                  </p>
                  <button
                    onClick={handleOpenAddForm}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs shadow-xs cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Thêm từ đầu tiên ngay</span>
                  </button>
                </div>
              ) : (
                filteredWords.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 sm:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:border-amber-500/40 dark:hover:border-amber-500/30 transition-all shadow-2xs space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            {item.word}
                          </span>

                          {/* Phonetic */}
                          {item.phonetic && (
                            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                              {item.phonetic}
                            </span>
                          )}

                          {/* Part of Speech */}
                          {item.partOfSpeech && (
                            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                              {item.partOfSpeech}
                            </span>
                          )}

                          {/* Audio button */}
                          <button
                            onClick={() => speakWord(item.word)}
                            className="p-1 rounded-full text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Nghe phát âm"
                          >
                            <Volume2 size={16} />
                          </button>
                        </div>

                        {/* Meaning */}
                        <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                          {item.meaning}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Toggle Mastered button */}
                        <button
                          onClick={() => handleToggleMasteredStatus(item.id)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                            item.isMastered
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                          }`}
                          title={item.isMastered ? 'Đã nhớ từ này' : 'Bấm để đánh dấu đã nhớ'}
                        >
                          <Check size={13} className={item.isMastered ? 'text-emerald-500' : ''} />
                          <span className="hidden sm:inline">
                            {item.isMastered ? 'Đã nhớ' : 'Chưa nhớ'}
                          </span>
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEditForm(item)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                          title="Sửa từ"
                        >
                          <Edit2 size={14} />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteWord(item.id, item.word)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                          title="Xóa từ"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Context sentence */}
                    {item.contextSentence && (
                      <div className="p-2 sm:p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed italic">
                        <span className="font-semibold text-zinc-500 dark:text-zinc-400 not-italic mr-1">
                          Ngữ cảnh:
                        </span>
                        "{item.contextSentence}"
                      </div>
                    )}

                    {/* Meta info & Notes */}
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                      <div className="flex items-center gap-2">
                        {item.sourceType && (
                          <span className="px-1.5 py-0.2 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                            {item.sourceType === 'exercise'
                              ? 'Từ bài tập'
                              : item.sourceType === 'lesson_vocab'
                              ? 'Từ bài học'
                              : item.sourceType === 'selection'
                              ? 'Bôi đen tra cứu'
                              : 'Tự thêm'}
                          </span>
                        )}
                        {item.sourceDate && <span>• Ngày: {item.sourceDate}</span>}
                      </div>

                      {item.notes && (
                        <span className="italic text-zinc-500 max-w-xs truncate">
                          Ghi chú: {item.notes}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* VIEW 2: FLASHCARDS PRACTICE */}
        {activeView === 'flashcards' && filteredWords.length > 0 && (
          <div className="flex-1 flex flex-col justify-between p-4 sm:p-8 max-w-xl mx-auto w-full">
            {/* Progress Header */}
            <div className="flex items-center justify-between text-xs text-zinc-500 font-medium mb-4">
              <span className="font-mono">
                Thẻ {flashcardIdx + 1} / {filteredWords.length}
              </span>
              <button
                onClick={() => {
                  setActiveView('quiz');
                  setQuizIdx(0);
                  setQuizScore(0);
                  setQuizAnswered(false);
                }}
                className="text-amber-500 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <BrainCircuit size={14} />
                <span>Chuyển sang làm Quiz</span>
              </button>
            </div>

            {/* Flashcard Card */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="flex-1 min-h-[260px] sm:min-h-[300px] border-2 border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-white dark:bg-zinc-900 shadow-lg transition-all relative select-none"
            >
              <span className="absolute top-4 right-4 text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                {isFlipped ? 'Mặt sau (Nghĩa)' : 'Mặt trước (Từ)'}
              </span>

              {!isFlipped ? (
                /* Front Side */
                <div className="space-y-4">
                  <h3 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100">
                    {filteredWords[flashcardIdx]?.word}
                  </h3>

                  {filteredWords[flashcardIdx]?.phonetic && (
                    <div className="text-sm font-mono text-zinc-500">
                      {filteredWords[flashcardIdx].phonetic}
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakWord(filteredWords[flashcardIdx]?.word);
                    }}
                    className="p-3 rounded-full bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-zinc-950 transition-colors mx-auto cursor-pointer"
                    title="Nghe phát âm"
                  >
                    <Volume2 size={24} />
                  </button>

                  <p className="text-xs text-zinc-400 mt-4">
                    (Nhấp chuột hoặc chạm vào thẻ để lật xem nghĩa)
                  </p>
                </div>
              ) : (
                /* Back Side */
                <div className="space-y-4">
                  <div className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">
                    {filteredWords[flashcardIdx]?.meaning}
                  </div>

                  {filteredWords[flashcardIdx]?.partOfSpeech && (
                    <span className="inline-block text-xs uppercase px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 font-semibold text-zinc-600 dark:text-zinc-300">
                      {filteredWords[flashcardIdx].partOfSpeech}
                    </span>
                  )}

                  {filteredWords[flashcardIdx]?.contextSentence && (
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 italic max-w-md">
                      "{filteredWords[flashcardIdx].contextSentence}"
                    </div>
                  )}

                  {filteredWords[flashcardIdx]?.notes && (
                    <div className="text-xs text-zinc-400">
                      Ghi chú: {filteredWords[flashcardIdx].notes}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between gap-4 mt-6">
              <button
                onClick={() => {
                  setIsFlipped(false);
                  setFlashcardIdx((prev) => (prev > 0 ? prev - 1 : filteredWords.length - 1));
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                <ChevronLeft size={16} />
                <span>Thẻ trước</span>
              </button>

              <button
                onClick={() => {
                  const targetId = filteredWords[flashcardIdx]?.id;
                  if (targetId) toggleWordMastered(targetId);
                }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold cursor-pointer transition-all ${
                  filteredWords[flashcardIdx]?.isMastered
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200'
                }`}
              >
                {filteredWords[flashcardIdx]?.isMastered ? '✓ Đã thuộc' : 'Đánh dấu đã thuộc'}
              </button>

              <button
                onClick={() => {
                  setIsFlipped(false);
                  setFlashcardIdx((prev) => (prev < filteredWords.length - 1 ? prev + 1 : 0));
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                <span>Thẻ tiếp</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: MINI QUIZ PRACTICE */}
        {activeView === 'quiz' && filteredWords.length > 0 && quizCurrentWord && (
          <div className="flex-1 flex flex-col justify-between p-4 sm:p-8 max-w-xl mx-auto w-full">
            {/* Quiz Header */}
            <div className="flex items-center justify-between text-xs text-zinc-500 font-medium mb-4">
              <span className="font-mono">
                Câu hỏi {quizIdx + 1} / {filteredWords.length}
              </span>
              <span className="font-bold text-amber-500">
                Điểm: {quizScore} / {quizIdx + (quizAnswered ? 1 : 0)}
              </span>
            </div>

            {/* Quiz Question Card */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 bg-white dark:bg-zinc-900 shadow-md space-y-6">
              <div className="text-center space-y-2">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Chọn nghĩa đúng của từ:
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                  {quizCurrentWord.word}
                </h3>
                <div className="flex items-center justify-center gap-2">
                  {quizCurrentWord.phonetic && (
                    <span className="font-mono text-xs text-zinc-500">
                      {quizCurrentWord.phonetic}
                    </span>
                  )}
                  <button
                    onClick={() => speakWord(quizCurrentWord.word)}
                    className="p-1 rounded-full text-zinc-400 hover:text-amber-500 cursor-pointer"
                  >
                    <Volume2 size={16} />
                  </button>
                </div>
              </div>

              {/* 4 Options */}
              <div className="space-y-2.5">
                {quizOptions.map((opt, i) => {
                  const isCorrect = opt === quizCurrentWord.meaning;
                  const isSelected = selectedOption === opt;

                  let btnStyle =
                    'border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 hover:border-amber-500';

                  if (quizAnswered) {
                    if (isCorrect) {
                      btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold';
                    } else if (isSelected && !isCorrect) {
                      btnStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold';
                    }
                  }

                  return (
                    <button
                      key={i}
                      disabled={quizAnswered}
                      onClick={() => {
                        setSelectedOption(opt);
                        setQuizAnswered(true);
                        if (isCorrect) {
                          setQuizScore((prev) => prev + 1);
                        }
                      }}
                      className={`w-full p-3 rounded-2xl border text-xs sm:text-sm text-left transition-all cursor-pointer flex items-center justify-between ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {quizAnswered && isCorrect && <Check size={16} className="text-emerald-500" />}
                    </button>
                  );
                })}
              </div>

              {/* Context Hint after answered */}
              {quizAnswered && quizCurrentWord.contextSentence && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-zinc-800 dark:text-zinc-200 italic">
                  "{quizCurrentWord.contextSentence}"
                </div>
              )}
            </div>

            {/* Next Quiz Button */}
            <div className="pt-4 flex justify-end">
              {quizAnswered ? (
                <button
                  onClick={() => {
                    if (quizIdx < filteredWords.length - 1) {
                      setQuizIdx((prev) => prev + 1);
                      setQuizAnswered(false);
                      setSelectedOption(null);
                    } else {
                      alert(`Hoàn thành Quiz! Điểm của bạn: ${quizScore + (selectedOption === quizCurrentWord.meaning ? 1 : 0)} / ${filteredWords.length}`);
                      setActiveView('list');
                    }
                  }}
                  className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs cursor-pointer shadow-md"
                >
                  {quizIdx < filteredWords.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
                </button>
              ) : (
                <div className="text-xs text-zinc-400 italic">Hãy chọn 1 đáp án</div>
              )}
            </div>
          </div>
        )}

        {/* MODAL SUB-FORM: ADD / EDIT WORD (With Free Dictionary Lookup) */}
        {isFormOpen && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={() => setIsFormOpen(false)}
          >
            <div
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Bookmark size={18} className="text-amber-500" />
                  <span>{editingWordId ? 'Chỉnh sửa từ vựng' : 'Thêm từ mới vào Sổ tay'}</span>
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveFormSubmit} className="space-y-3.5">
                {/* Word Input & Dictionary Lookup Button */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Từ tiếng Anh: <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      autoFocus
                      value={formWord}
                      onChange={(e) => setFormWord(e.target.value)}
                      placeholder="Ví dụ: reluctant, diligent, mitigate..."
                      className="flex-1 px-3 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      disabled={isLookingUp || !formWord.trim()}
                      onClick={() => handleTriggerLookup(formWord)}
                      className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                      title="Tra phiên âm & nghĩa tự động từ Free Dictionary"
                    >
                      {isLookingUp ? (
                        <>
                          <Loader2 size={13} className="animate-spin text-amber-500" />
                          <span>Đang tra...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={13} className="text-amber-500" />
                          <span>Tra từ điển</span>
                        </>
                      )}
                    </button>
                  </div>
                  {lookupFeedback && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                      {lookupFeedback}
                    </p>
                  )}
                </div>

                {/* Phonetic & Part of Speech */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Phiên âm IPA:
                    </label>
                    <input
                      type="text"
                      value={formPhonetic}
                      onChange={(e) => setFormPhonetic(e.target.value)}
                      placeholder="/rɪˈlʌk.tənt/"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Loại từ:
                    </label>
                    <input
                      type="text"
                      value={formPartOfSpeech}
                      onChange={(e) => setFormPartOfSpeech(e.target.value)}
                      placeholder="adj, noun, verb, idiom..."
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Meaning */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Nghĩa tiếng Việt: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formMeaning}
                    onChange={(e) => setFormMeaning(e.target.value)}
                    placeholder="Nghĩa của từ..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Context Sentence */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Câu ví dụ / Ngữ cảnh gặp từ:
                  </label>
                  <textarea
                    rows={2}
                    value={formContext}
                    onChange={(e) => setFormContext(e.target.value)}
                    placeholder="Ví dụ: She was reluctant to admit her mistake..."
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 italic focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Ghi chú cá nhân:
                  </label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Cách nhớ, từ đồng nghĩa/trái nghĩa..."
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 text-xs font-medium rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    {editingWordId ? 'Cập nhật' : 'Lưu vào Sổ tay'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
