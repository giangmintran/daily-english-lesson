import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Volume2,
  CheckCircle2,
  Calendar,
  Flame,
} from 'lucide-react';
import { SrsWordRecord, SrsRating, recordSrsReview } from '../utils/srs';
import { speakWord } from '../utils/speech';
import { triggerFireworks } from '../utils/confetti';

interface SrsReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  dueWords: SrsWordRecord[];
  onReviewCompleted?: () => void;
}

export const SrsReviewModal: React.FC<SrsReviewModalProps> = ({
  isOpen,
  onClose,
  dueWords,
  onReviewCompleted,
}) => {
  const [queue, setQueue] = useState<SrsWordRecord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Initialize queue when modal opens
  useEffect(() => {
    if (isOpen) {
      setQueue([...dueWords]);
      setCurrentIndex(0);
      setIsFlipped(false);
      setCompletedCount(0);
      setIsFinished(dueWords.length === 0);
    }
  }, [isOpen, dueWords]);

  const currentItem = queue[currentIndex];

  const handlePlayAudio = useCallback(() => {
    if (!currentItem) return;
    setIsPlayingAudio(true);
    speakWord(
      currentItem.word,
      0.9,
      () => setIsPlayingAudio(false),
      () => setIsPlayingAudio(true)
    );
  }, [currentItem]);

  // Pronounce word when flipping or moving to next
  useEffect(() => {
    if (!isOpen || !currentItem || isFinished) return;
    const timer = setTimeout(() => {
      handlePlayAudio();
    }, 150);
    return () => clearTimeout(timer);
  }, [isOpen, currentIndex, isFinished, handlePlayAudio, currentItem]);

  const handleRate = useCallback(
    (rating: SrsRating) => {
      if (!currentItem) return;

      recordSrsReview(currentItem.id, rating);
      setCompletedCount((c) => c + 1);

      if (rating === 'again') {
        // Nếu chọn quên, đẩy lại từ này về cuối hàng đợi của buổi hôm nay để ôn lại
        setQueue((prev) => [...prev, currentItem]);
      }

      if (currentIndex + 1 >= queue.length) {
        setIsFinished(true);
        triggerFireworks();
        if (onReviewCompleted) onReviewCompleted();
      } else {
        setIsFlipped(false);
        setCurrentIndex((i) => i + 1);
      }
    },
    [currentItem, currentIndex, queue.length, onReviewCompleted]
  );

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || isFinished) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handlePlayAudio();
      } else if (isFlipped) {
        if (e.key === '1') {
          e.preventDefault();
          handleRate('again');
        } else if (e.key === '2') {
          e.preventDefault();
          handleRate('hard');
        } else if (e.key === '3') {
          e.preventDefault();
          handleRate('good');
        } else if (e.key === '4') {
          e.preventDefault();
          handleRate('easy');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFinished, isFlipped, handleFlip, handlePlayAudio, handleRate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/60 dark:bg-zinc-950/40">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Flame size={16} />
            </span>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                Ôn Tập Spaced Repetition (SRS)
              </h3>
              <p className="text-[11px] text-zinc-400">
                {!isFinished
                  ? `Từ ${currentIndex + 1} / ${queue.length} (Đã hoàn thành: ${completedCount})`
                  : 'Đã hoàn thành toàn bộ'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto flex flex-col items-center justify-center min-h-[300px]">
          {isFinished ? (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Xuất sắc! Bạn đã hoàn thành phiên ôn tập
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                  Bạn đã củng cố {completedCount} từ vào trí nhớ dài hạn theo thuật toán Spaced Repetition.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold cursor-pointer shadow-sm hover:opacity-90 transition-opacity"
              >
                Đóng & Tiếp tục học bài hôm nay
              </button>
            </div>
          ) : currentItem ? (
            <div className="w-full space-y-5">
              {/* Flashcard container */}
              <div
                onClick={handleFlip}
                className="w-full min-h-[220px] p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-all select-none shadow-xs group"
              >
                {/* Card Top Meta */}
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar size={12} />
                    <span>Học từ ngày {currentItem.sourceDate}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-zinc-200/60 dark:bg-zinc-800 text-[10px] font-medium">
                    Cấp độ SRS: {currentItem.srsStage}/5
                  </span>
                </div>

                {/* Card Body */}
                <div className="text-center py-4 space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
                      {currentItem.word}
                    </h2>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayAudio();
                      }}
                      className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                      title="Nghe phát âm (Phím R)"
                    >
                      <Volume2 size={20} className={isPlayingAudio ? 'animate-pulse' : ''} />
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 font-mono">
                    {currentItem.phonetic && <span>{currentItem.phonetic}</span>}
                    {currentItem.partOfSpeech && (
                      <span className="italic text-zinc-400 font-sans">({currentItem.partOfSpeech})</span>
                    )}
                  </div>

                  {/* Context sentence if available on front */}
                  {currentItem.context && !isFlipped && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 italic max-w-sm mx-auto pt-2">
                      "{currentItem.context}"
                    </p>
                  )}

                  {/* Flipped side content */}
                  {isFlipped ? (
                    <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800/80 space-y-1.5 animate-fade-in">
                      <p className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
                        {currentItem.meaning}
                      </p>
                      {currentItem.contextVi && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          → {currentItem.contextVi}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="pt-4 text-[11px] text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                      [Chạm hoặc bấm Phím Cách để xem nghĩa]
                    </div>
                  )}
                </div>

                <div className="text-center text-[10px] text-zinc-400">
                  {isFlipped ? 'Đánh giá độ nhớ bên dưới để lên lịch chu kỳ ôn tập' : 'Lật thẻ để kích hoạt các nút đánh giá'}
                </div>
              </div>

              {/* Rating Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <button
                  disabled={!isFlipped}
                  onClick={() => handleRate('again')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all text-xs font-semibold cursor-pointer ${
                    isFlipped
                      ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                      : 'opacity-40 cursor-not-allowed border-zinc-200 dark:border-zinc-800 text-zinc-400'
                  }`}
                  title="Phím 1"
                >
                  <span>1. Quên</span>
                  <span className="text-[10px] font-normal opacity-75">Ôn lại ngay</span>
                </button>

                <button
                  disabled={!isFlipped}
                  onClick={() => handleRate('hard')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all text-xs font-semibold cursor-pointer ${
                    isFlipped
                      ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                      : 'opacity-40 cursor-not-allowed border-zinc-200 dark:border-zinc-800 text-zinc-400'
                  }`}
                  title="Phím 2"
                >
                  <span>2. Khó</span>
                  <span className="text-[10px] font-normal opacity-75">Sau 1-2 ngày</span>
                </button>

                <button
                  disabled={!isFlipped}
                  onClick={() => handleRate('good')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all text-xs font-semibold cursor-pointer ${
                    isFlipped
                      ? 'border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                      : 'opacity-40 cursor-not-allowed border-zinc-200 dark:border-zinc-800 text-zinc-400'
                  }`}
                  title="Phím 3"
                >
                  <span>3. Tốt</span>
                  <span className="text-[10px] font-normal opacity-75">Chu kỳ chuẩn</span>
                </button>

                <button
                  disabled={!isFlipped}
                  onClick={() => handleRate('easy')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all text-xs font-semibold cursor-pointer ${
                    isFlipped
                      ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                      : 'opacity-40 cursor-not-allowed border-zinc-200 dark:border-zinc-800 text-zinc-400'
                  }`}
                  title="Phím 4"
                >
                  <span>4. Dễ</span>
                  <span className="text-[10px] font-normal opacity-75">Nhảy bậc SRS</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
