import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, Bookmark, Check, Sparkles, X, Loader2 } from 'lucide-react';
import { speakWord } from '../utils/speech';
import { lookupWord, WordLookupResult, sanitizeWord } from '../services/dictionary';
import { saveWord, isWordSaved, getSavedWordByWord } from '../services/savedWordStorage';

interface SelectionWordPopoverProps {
  currentDate?: string;
  onOpenNotebook?: () => void;
}

interface ContextInfo {
  word: string;
  sentence: string;
  rect: DOMRect;
}

interface ModalTarget {
  word: string;
  sentence: string;
}

/**
 * Extract sentence surrounding the text selection range
 */
function extractContextSentence(range: Range): string {
  try {
    const container = range.commonAncestorContainer;
    const fullText = container.textContent || '';
    if (!fullText) return '';

    const selectedText = range.toString().trim();
    const startIndex = fullText.indexOf(selectedText);
    if (startIndex === -1) return selectedText;

    // Look backwards for sentence start (. ! ? \n)
    let sentenceStart = 0;
    for (let i = startIndex - 1; i >= 0; i--) {
      if (['.', '!', '?', '\n'].includes(fullText[i])) {
        sentenceStart = i + 1;
        break;
      }
    }

    // Look forward for sentence end (. ! ? \n)
    let sentenceEnd = fullText.length;
    for (let i = startIndex + selectedText.length; i < fullText.length; i++) {
      if (['.', '!', '?', '\n'].includes(fullText[i])) {
        sentenceEnd = i + 1;
        break;
      }
    }

    const sentence = fullText.substring(sentenceStart, sentenceEnd).trim();
    return sentence.length > 250 ? sentence.slice(0, 250) + '...' : sentence;
  } catch {
    return range.toString().trim();
  }
}

export const SelectionWordPopover: React.FC<SelectionWordPopoverProps> = ({
  currentDate,
  onOpenNotebook,
}) => {
  const [contextInfo, setContextInfo] = useState<ContextInfo | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [isSaved, setIsSaved] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Quick Save Modal State (Strictly decoupled from text selection range)
  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupData, setLookupData] = useState<WordLookupResult | null>(null);
  const [customMeaning, setCustomMeaning] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Refs to avoid stale closures in event listeners
  const modalTargetRef = useRef<ModalTarget | null>(null);
  modalTargetRef.current = modalTarget;

  const contextInfoRef = useRef<ContextInfo | null>(null);
  contextInfoRef.current = contextInfo;

  const selectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Clear toast after 3s
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Handle text selection logic
  const checkSelection = useCallback(() => {
    // If modal is open, do not alter selection states
    if (modalTargetRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      // Only clear popover if modal is not open
      setContextInfo(null);
      return;
    }

    const text = selection.toString().trim();
    // Validate: 2 to 45 chars, contains English letters
    if (text.length < 2 || text.length > 45 || !/[a-zA-Z]/.test(text)) {
      setContextInfo(null);
      return;
    }

    // Check if selection is inside form inputs, buttons, or dialogs
    const anchorNode = selection.anchorNode;
    const parentEl = anchorNode instanceof HTMLElement ? anchorNode : anchorNode?.parentElement;
    if (
      parentEl?.closest('input') ||
      parentEl?.closest('textarea') ||
      parentEl?.closest('button') ||
      parentEl?.closest('[data-no-word-select]') ||
      parentEl?.closest('#selection-popover-portal') ||
      parentEl?.closest('#quick-save-modal-portal')
    ) {
      setContextInfo(null);
      return;
    }

    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (!rect || (rect.width === 0 && rect.height === 0)) {
        setContextInfo(null);
        return;
      }

      const sentence = extractContextSentence(range);
      const clean = sanitizeWord(text);
      setIsSaved(isWordSaved(clean));

      // Calculate FIXED position relative to viewport
      const popoverWidth = 230;
      const popoverHeight = 44;

      // Position above selection by default
      let top = rect.top - popoverHeight - 10;
      if (top < 50) {
        // If too close to viewport top, show below selection
        top = rect.bottom + 10;
      }

      let left = rect.left + rect.width / 2 - popoverWidth / 2;
      // Clamp within screen boundaries
      left = Math.max(12, Math.min(left, window.innerWidth - popoverWidth - 12));

      setPopoverPos({ top, left });
      setContextInfo({
        word: text,
        sentence,
        rect,
      });
    } catch {
      setContextInfo(null);
    }
  }, []);

  // Global event listeners
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent | TouchEvent) => {
      // If modal is open, ignore
      if (modalTargetRef.current) return;

      const target = e.target as HTMLElement | null;
      // If click was inside the popover or modal, do not close or re-evaluate
      if (
        target?.closest('#selection-popover-portal') ||
        target?.closest('#quick-save-modal-portal')
      ) {
        return;
      }

      // Clear any pending timeout
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }

      // Small delay for selection to settle
      selectionTimeoutRef.current = setTimeout(() => {
        checkSelection();
      }, 90);
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      // If modal is open, let modal backdrop handle its own clicks
      if (modalTargetRef.current) return;

      const target = e.target as HTMLElement | null;
      // If user clicks outside the popover, dismiss the popover
      if (
        contextInfoRef.current &&
        !target?.closest('#selection-popover-portal')
      ) {
        // Small delay so if user is clicking to select new text, it transitions smoothly
        setTimeout(() => {
          const sel = window.getSelection();
          if (!sel || sel.isCollapsed) {
            setContextInfo(null);
          }
        }, 50);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (modalTargetRef.current) {
          setModalTarget(null);
        } else {
          setContextInfo(null);
        }
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keyup', handleKeyUp);
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, [checkSelection]);

  // Pronounce word
  const handlePronounce = (e: React.MouseEvent) => {
    e.stopPropagation();
    const wordToPronounce = contextInfo?.word || modalTarget?.word;
    if (!wordToPronounce) return;

    setIsPlayingAudio(true);
    speakWord(
      wordToPronounce,
      0.9,
      () => setIsPlayingAudio(false),
      () => setIsPlayingAudio(true)
    );
  };

  // Open Quick Save Dialog and trigger Dictionary API lookup
  const handleOpenSaveDialog = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!contextInfo?.word) return;

    const targetWord = contextInfo.word;
    const targetSentence = contextInfo.sentence;
    const existing = getSavedWordByWord(targetWord);

    // Freeze modal target into state and dismiss mini popover
    setModalTarget({
      word: targetWord,
      sentence: targetSentence,
    });
    setContextInfo(null);

    setLookupLoading(true);
    setLookupData(null);
    setCustomMeaning(existing?.meaning || '');
    setCustomNotes(existing?.notes || '');

    // Auto lookup dictionary
    try {
      const data = await lookupWord(targetWord);
      setLookupData(data);
      if (!existing?.meaning && data.suggestedMeaningVi) {
        setCustomMeaning(data.suggestedMeaningVi);
      }
    } catch {
      // ignore
    } finally {
      setLookupLoading(false);
    }
  };

  // Submit Save Word
  const handleConfirmSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!modalTarget?.word) return;

    const meaningToSave =
      customMeaning.trim() ||
      lookupData?.suggestedMeaningVi ||
      lookupData?.englishDefinition ||
      'Chưa có định nghĩa';

    saveWord({
      word: modalTarget.word,
      meaning: meaningToSave,
      phonetic: lookupData?.phonetic,
      partOfSpeech: lookupData?.partOfSpeech,
      englishDefinition: lookupData?.englishDefinition,
      contextSentence: modalTarget.sentence,
      sourceDate: currentDate,
      sourceType: 'selection',
      notes: customNotes.trim() || undefined,
      audioUrl: lookupData?.audioUrl,
    });

    const savedWordName = modalTarget.word;
    setIsSaved(true);
    setModalTarget(null);
    setToastMessage(`Đã lưu "${savedWordName}" vào Sổ từ vựng!`);

    // Clear document text selection
    try {
      window.getSelection()?.removeAllRanges();
    } catch {
      // ignore
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-bounce bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold">
          <Sparkles size={15} className="text-amber-400" />
          <span>{toastMessage}</span>
          {onOpenNotebook && (
            <button
              onClick={() => {
                setToastMessage(null);
                onOpenNotebook();
              }}
              className="ml-2 underline text-amber-300 dark:text-amber-600 hover:text-white cursor-pointer"
            >
              Mở sổ
            </button>
          )}
        </div>
      )}

      {/* Floating Mini Popover (Fixed in viewport, above selection) */}
      {contextInfo && !modalTarget && (
        <div
          id="selection-popover-portal"
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: `${popoverPos.top}px`,
            left: `${popoverPos.left}px`,
            zIndex: 48,
          }}
          className="animate-fade-in flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900/95 dark:bg-zinc-800/95 text-white shadow-2xl backdrop-blur-md border border-zinc-700/60 dark:border-zinc-700 text-xs font-medium"
        >
          {/* Word Label */}
          <span className="px-2 py-0.5 font-bold tracking-tight max-w-[120px] truncate text-zinc-100">
            {contextInfo.word}
          </span>

          {/* Pronounce Button */}
          <button
            onClick={handlePronounce}
            disabled={isPlayingAudio}
            type="button"
            className="p-1.5 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Nghe phát âm"
          >
            <Volume2 size={14} className={isPlayingAudio ? 'animate-pulse text-amber-400' : ''} />
          </button>

          {/* Save / Saved Button */}
          <button
            onClick={handleOpenSaveDialog}
            type="button"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              isSaved
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold shadow-xs'
            }`}
          >
            {isSaved ? (
              <>
                <Check size={13} />
                <span>Đã lưu</span>
              </>
            ) : (
              <>
                <Bookmark size={13} />
                <span>Lưu từ</span>
              </>
            )}
          </button>

          {/* Close mini popover */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setContextInfo(null);
            }}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Quick Save Modal (Completely independent of text selection lifecycle) */}
      {modalTarget && (
        <div
          id="quick-save-modal-portal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={(e) => {
            // Only close if clicking directly on backdrop
            if (e.target === e.currentTarget) {
              setModalTarget(null);
            }
          }}
        >
          <div
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 capitalize">
                    {modalTarget.word}
                  </h3>
                  <button
                    onClick={handlePronounce}
                    type="button"
                    className="p-1 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                    title="Nghe phát âm"
                  >
                    <Volume2 size={16} />
                  </button>
                </div>

                {/* Phonetic & Part of speech from Dictionary API */}
                <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {lookupLoading ? (
                    <span className="flex items-center gap-1 text-[11px] text-amber-500">
                      <Loader2 size={11} className="animate-spin" />
                      Đang tra Free Dictionary...
                    </span>
                  ) : (
                    <>
                      {lookupData?.phonetic && (
                        <span className="font-mono text-zinc-600 dark:text-zinc-400">
                          {lookupData.phonetic}
                        </span>
                      )}
                      {lookupData?.partOfSpeech && (
                        <span className="px-1.5 py-0.2 rounded-md bg-zinc-100 dark:bg-zinc-800 font-semibold text-[10px] text-zinc-700 dark:text-zinc-300 uppercase">
                          {lookupData.partOfSpeech}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={() => setModalTarget(null)}
                type="button"
                className="p-1 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* English Definition Hint (if found in Free Dictionary API) */}
            {lookupData?.englishDefinition && (
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 text-xs text-zinc-600 dark:text-zinc-300">
                <span className="font-semibold text-zinc-700 dark:text-zinc-200">Định nghĩa EN: </span>
                {lookupData.englishDefinition}
              </div>
            )}

            {/* Context Sentence Preview */}
            {modalTarget.sentence && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  Ngữ cảnh gặp từ:
                </label>
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-zinc-800 dark:text-zinc-200 italic leading-relaxed">
                  "{modalTarget.sentence}"
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleConfirmSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nghĩa tiếng Việt: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={customMeaning}
                  onChange={(e) => setCustomMeaning(e.target.value)}
                  placeholder="Nhập nghĩa tiếng Việt (VD: miễn cưỡng, không sẵn lòng)"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Ghi chú riêng (không bắt buộc):
                </label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Ghi chú cách nhớ, từ đồng nghĩa..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalTarget(null)}
                  className="px-3.5 py-2 text-xs font-medium rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 shadow-md cursor-pointer transition-all active:scale-95"
                >
                  <Bookmark size={14} />
                  <span>Lưu vào Sổ tay</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
