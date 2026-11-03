import { DailyLesson } from '../types/lesson';
import { getSavedWords, updateSavedWord } from '../services/savedWordStorage';

export type SrsRating = 'again' | 'hard' | 'good' | 'easy';

export interface SrsWordRecord {
  id: string;
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  meaning: string;
  context?: string;
  contextVi?: string;
  sourceDate: string;
  sourceType: 'lesson' | 'saved_word';
  srsStage: number; // 0 to 5
  srsInterval: number; // in days
  nextReviewDate: string; // YYYY-MM-DD
  lastReviewedDate?: string; // YYYY-MM-DD
  reviewCount: number;
}

const STAGE_INTERVALS = [1, 3, 7, 14, 30, 60];

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function addDaysToDateStr(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const SRS_STORAGE_KEY = 'daily_english_srs_records_v1';

/**
 * Lấy toàn bộ bản ghi SRS từ local cache
 */
export function getLocalSrsRecords(): Record<string, SrsWordRecord> {
  try {
    const raw = localStorage.getItem(SRS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Lưu toàn bộ bản ghi SRS vào local cache
 */
export function saveLocalSrsRecords(records: Record<string, SrsWordRecord>): void {
  try {
    localStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save SRS records:', err);
  }
}

/**
 * Tính toán trạng thái SRS sau khi người dùng đánh giá
 */
export function calculateNextSrsState(
  current: SrsWordRecord,
  rating: SrsRating
): { stage: number; interval: number; nextReviewDate: string } {
  const today = getTodayStr();
  let nextStage = current.srsStage || 0;
  let nextInterval = current.srsInterval || 1;

  switch (rating) {
    case 'again':
      nextStage = 0;
      nextInterval = 1;
      break;
    case 'hard':
      nextStage = Math.max(0, nextStage);
      nextInterval = Math.max(1, Math.round(nextInterval * 1.2));
      break;
    case 'good':
      nextStage = Math.min(5, nextStage + 1);
      nextInterval = STAGE_INTERVALS[nextStage] || 30;
      break;
    case 'easy':
      nextStage = Math.min(5, nextStage + 2);
      nextInterval = Math.round((STAGE_INTERVALS[nextStage] || 30) * 1.5);
      break;
  }

  const nextReviewDate = addDaysToDateStr(today, nextInterval);

  return {
    stage: nextStage,
    interval: nextInterval,
    nextReviewDate,
  };
}

/**
 * Tổng hợp tất cả các từ cần ôn tập hôm nay (nextReviewDate <= today)
 * Quét từ các bài học trước đó (dbLessons) và từ sổ tay (savedWords)
 */
export function getDueSrsWords(allLessons: DailyLesson[]): SrsWordRecord[] {
  const today = getTodayStr();
  const srsRecords = getLocalSrsRecords();
  const savedWords = getSavedWords();
  const dueMap = new Map<string, SrsWordRecord>();

  // 1. Quét từ tất cả bài học trong database (trừ bài của ngày hôm nay chưa hoàn thành)
  for (const lesson of allLessons) {
    if (!lesson.vocabulary || lesson.vocabulary.length === 0) continue;

    // Không đưa từ của chính ngày hôm nay vào danh sách ôn tập (vì vừa mới học)
    if (lesson.date >= today) continue;

    for (const v of lesson.vocabulary) {
      if (!v || !v.word) continue;
      const key = `lesson_${lesson.date}_${v.id}`;
      let record = srsRecords[key];

      if (!record) {
        // Khởi tạo mặc định: ngày ôn đầu tiên là 1 ngày sau ngày học
        record = {
          id: key,
          word: v.word,
          phonetic: v.phonetic,
          partOfSpeech: v.partOfSpeech,
          meaning: v.meaning,
          context: v.examples?.[0]
            ? typeof v.examples[0] === 'string'
              ? v.examples[0]
              : v.examples[0].en
            : v.example || v.usage,
          contextVi: v.examples?.[0] && typeof v.examples[0] !== 'string'
            ? v.examples[0].vi
            : v.exampleMeaning,
          sourceDate: lesson.date,
          sourceType: 'lesson',
          srsStage: 0,
          srsInterval: 1,
          nextReviewDate: addDaysToDateStr(lesson.date, 1),
          reviewCount: 0,
        };
        srsRecords[key] = record;
      }

      if (record.nextReviewDate <= today) {
        dueMap.set(key, record);
      }
    }
  }

  // 2. Quét từ sổ tay từ vựng
  for (const sw of savedWords) {
    if (!sw || !sw.word) continue;
    const key = `saved_${sw.id}`;
    let record = srsRecords[key];

    if (!record) {
      const addedDate = sw.sourceDate || sw.dateAdded?.split('T')[0] || today;
      record = {
        id: key,
        word: sw.word,
        phonetic: sw.phonetic,
        partOfSpeech: sw.partOfSpeech,
        meaning: sw.meaning,
        context: sw.contextSentence,
        sourceDate: addedDate,
        sourceType: 'saved_word',
        srsStage: sw.srsStage || 0,
        srsInterval: sw.srsInterval || 1,
        nextReviewDate: sw.nextReviewDate || addDaysToDateStr(addedDate, 1),
        lastReviewedDate: sw.lastReviewedDate,
        reviewCount: sw.reviewCount || 0,
      };
      srsRecords[key] = record;
    }

    if (record.nextReviewDate <= today) {
      dueMap.set(key, record);
    }
  }

  // Lưu lại cache đã khởi tạo
  saveLocalSrsRecords(srsRecords);

  return Array.from(dueMap.values());
}

/**
 * Áp dụng kết quả ôn tập cho một từ
 */
export function recordSrsReview(recordId: string, rating: SrsRating): SrsWordRecord | null {
  const srsRecords = getLocalSrsRecords();
  const target = srsRecords[recordId];
  if (!target) return null;

  const today = getTodayStr();
  const next = calculateNextSrsState(target, rating);

  const updated: SrsWordRecord = {
    ...target,
    srsStage: next.stage,
    srsInterval: next.interval,
    nextReviewDate: next.nextReviewDate,
    lastReviewedDate: today,
    reviewCount: (target.reviewCount || 0) + 1,
  };

  srsRecords[recordId] = updated;
  saveLocalSrsRecords(srsRecords);

  // Nếu là từ thuộc sổ tay thì đồng bộ thêm vào savedWordStorage
  if (target.sourceType === 'saved_word') {
    const rawId = target.id.replace(/^saved_/, '');
    updateSavedWord(rawId, {
      srsStage: next.stage,
      srsInterval: next.interval,
      nextReviewDate: next.nextReviewDate,
      lastReviewedDate: today,
      reviewCount: (target.reviewCount || 0) + 1,
      isMastered: next.stage >= 4,
    });
  }

  return updated;
}
