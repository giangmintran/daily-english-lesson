import { DailyLesson, UserStats, VocabularyItem, ExerciseItem } from '../types/lesson';
import { sampleLesson } from '../data/sampleLesson';

// Key chỉ lưu trữ DUY NHẤT 1 bài học của ngày hôm nay/ngày đang chọn
const STORAGE_KEY_CURRENT_LESSON = 'daily_english_current_lesson_v1';
const STORAGE_KEY_STATS = 'daily_english_stats_v1';
const STORAGE_KEY_ACTIVE_DATE = 'daily_english_active_date_v1';

/**
 * Lấy bài học duy nhất đang lưu trong localStorage
 */
export function getCurrentLesson(): DailyLesson | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT_LESSON);
    if (raw) return JSON.parse(raw);

    // Dọn dẹp key cũ nếu có và lấy 1 bài ra làm cache
    const oldRaw = localStorage.getItem('daily_english_lessons_v1');
    if (oldRaw) {
      const oldObj = JSON.parse(oldRaw);
      const dates = Object.keys(oldObj);
      if (dates.length > 0) {
        const first = oldObj[dates[0]];
        localStorage.setItem(STORAGE_KEY_CURRENT_LESSON, JSON.stringify(first));
        localStorage.removeItem('daily_english_lessons_v1');
        return first;
      }
    }

    // Mặc định nạp sampleLesson nếu chưa có bài nào
    return sampleLesson;
  } catch (err) {
    console.error('Failed to read current lesson from storage', err);
    return sampleLesson;
  }
}

/**
 * Lấy bài học theo ngày. Nếu ngày đó khớp với bài học duy nhất trong localStorage thì trả về
 */
export function getLessonByDate(date: string): DailyLesson | null {
  const current = getCurrentLesson();
  if (current && current.date === date) {
    return current;
  }
  return null;
}

/**
 * Lưu bài học vào localStorage.
 * CHỈ LƯU DUY NHẤT 1 BÀI HỌC (khoảng 25KB), dọn sạch các bài cũ để tiết kiệm bộ nhớ.
 */
export function saveLesson(lesson: DailyLesson): void {
  try {
    localStorage.setItem(STORAGE_KEY_CURRENT_LESSON, JSON.stringify(lesson));
    localStorage.setItem(STORAGE_KEY_ACTIVE_DATE, lesson.date);
    // Dọn dẹp key lịch sử cũ nếu còn sót
    localStorage.removeItem('daily_english_lessons_v1');
  } catch (err) {
    console.error('Failed to save lesson to localStorage', err);
  }
}

export function clearCurrentLesson(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_CURRENT_LESSON);
  } catch {
    // ignore
  }
}

export function getActiveDate(): string {
  const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_DATE);
  if (saved) return saved;
  const current = getCurrentLesson();
  return current?.date || new Date().toISOString().split('T')[0];
}

export function setActiveDate(date: string): void {
  localStorage.setItem(STORAGE_KEY_ACTIVE_DATE, date);
}

export function updateLessonProgress(
  date: string,
  updater: (prevProgress: DailyLesson['progress']) => DailyLesson['progress']
): DailyLesson | null {
  const current = getCurrentLesson();
  if (!current || current.date !== date) return null;

  const currentProgress = current.progress || {
    wordsMastered: [],
    exerciseResults: {},
  };

  current.progress = updater(currentProgress);
  saveLesson(current);
  return current;
}

export function getUserStats(): UserStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STATS);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }

  return {
    streak: 1,
    lastActiveDate: new Date().toISOString().split('T')[0],
    totalWordsLearned: 0,
    totalExercisesDone: 0,
  };
}

export function saveUserStats(stats: UserStats): void {
  localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
}

/**
 * Validates and parses Vocabulary JSON
 */
export function validateAndParseVocabularyJson(jsonString: string): {
  vocabulary: VocabularyItem[];
  date?: string;
  topic?: string;
} {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString.trim());
  } catch {
    throw new Error('Định dạng JSON từ vựng không hợp lệ! Vui lòng kiểm tra lại cú pháp dấu ngoặc.');
  }

  let rawList: any[] = [];
  let date: string | undefined = undefined;
  let topic: string | undefined = undefined;

  if (Array.isArray(parsed)) {
    rawList = parsed;
  } else if (typeof parsed === 'object' && parsed !== null) {
    if (typeof parsed.date === 'string' && parsed.date.trim()) {
      date = parsed.date.trim();
    }
    if (typeof parsed.topic === 'string' && parsed.topic.trim()) {
      topic = parsed.topic.trim();
    }

    if (Array.isArray(parsed.vocabulary)) {
      rawList = parsed.vocabulary;
    } else if (Array.isArray(parsed.words)) {
      rawList = parsed.words;
    } else {
      throw new Error('JSON từ vựng cần chứa thuộc tính "vocabulary" dạng mảng hoặc một danh sách [...] các từ.');
    }
  } else {
    throw new Error('Dữ liệu JSON từ vựng phải là Object hoặc Array.');
  }

  if (rawList.length === 0) {
    throw new Error('Danh sách từ vựng rỗng.');
  }

  const vocabulary: VocabularyItem[] = rawList.map((v: any, index: number) => {
    if (!v.word || typeof v.word !== 'string') {
      throw new Error(`Từ vựng thứ ${index + 1} thiếu trường "word" bắt buộc.`);
    }
    if (!v.meaning || typeof v.meaning !== 'string') {
      throw new Error(`Từ vựng "${v.word}" thiếu trường "meaning" (nghĩa).`);
    }

    const structures = Array.isArray(v.structures) ? v.structures.map(String) : undefined;
    let examples: VocabularyItem['examples'] = undefined;
    if (Array.isArray(v.examples)) {
      examples = v.examples.map((item: any) => {
        if (typeof item === 'string') return item;
        return {
          en: String(item.en || '').trim(),
          vi: item.vi ? String(item.vi).trim() : undefined,
        };
      });
    }

    return {
      id: v.id ? String(v.id) : `v_${index + 1}`,
      word: v.word.trim(),
      phonetic: v.phonetic?.trim() || '',
      partOfSpeech: v.partOfSpeech?.trim() || '',
      meaning: v.meaning.trim(),
      usage: v.usage?.trim() || undefined,
      structures,
      purpose: v.purpose?.trim() || undefined,
      commonMistakes: v.commonMistakes?.trim() || undefined,
      examples,
      example: v.example?.trim() || '',
      exampleMeaning: v.exampleMeaning?.trim() || '',
    };
  });

  return { vocabulary, date, topic };
}

/**
 * Validates and parses Exercises JSON
 */
export function validateAndParseExercisesJson(jsonString: string): {
  exercises: ExerciseItem[];
  date?: string;
  topic?: string;
} {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString.trim());
  } catch {
    throw new Error('Định dạng JSON bài tập không hợp lệ! Vui lòng kiểm tra lại cú pháp dấu ngoặc.');
  }

  let rawList: any[] = [];
  let date: string | undefined = undefined;
  let topic: string | undefined = undefined;

  if (Array.isArray(parsed)) {
    rawList = parsed;
  } else if (typeof parsed === 'object' && parsed !== null) {
    if (typeof parsed.date === 'string' && parsed.date.trim()) {
      date = parsed.date.trim();
    }
    if (typeof parsed.topic === 'string' && parsed.topic.trim()) {
      topic = parsed.topic.trim();
    }

    if (Array.isArray(parsed.exercises)) {
      rawList = parsed.exercises;
    } else if (Array.isArray(parsed.questions)) {
      rawList = parsed.questions;
    } else {
      throw new Error('JSON bài tập cần chứa thuộc tính "exercises" dạng mảng hoặc một danh sách [...] các bài tập.');
    }
  } else {
    throw new Error('Dữ liệu JSON bài tập phải là Object hoặc Array.');
  }

  if (rawList.length === 0) {
    throw new Error('Danh sách bài tập rỗng.');
  }

  const exercises: ExerciseItem[] = rawList.map((e: any, index: number) => {
    if (!e.question || typeof e.question !== 'string') {
      throw new Error(`Bài tập thứ ${index + 1} thiếu trường "question" (câu hỏi).`);
    }
    if (e.answer === undefined || e.answer === null) {
      throw new Error(`Bài tập thứ ${index + 1} thiếu trường "answer" (đáp án).`);
    }

    const type = e.type === 'fill_in_blank' || e.type === 'translation' ? e.type : 'multiple_choice';
    const options = Array.isArray(e.options) ? e.options.map(String) : undefined;

    return {
      id: e.id !== undefined ? e.id : index + 1,
      type,
      question: e.question.trim(),
      options,
      answer: String(e.answer).trim(),
      explanation: e.explanation?.trim() || '',
    };
  });

  return { exercises, date, topic };
}

/**
 * Validates and imports combined JSON string.
 */
export function validateAndParseLessonJson(jsonString: string): DailyLesson {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString.trim());
  } catch {
    throw new Error('Định dạng JSON không hợp lệ! Vui lòng kiểm tra lại cú pháp (dấu ngoặc, phẩy, ngoặc kép).');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Dữ liệu JSON phải là một đối tượng (Object) hợp lệ.');
  }

  const date = typeof parsed.date === 'string' && parsed.date.trim() ? parsed.date.trim() : new Date().toISOString().split('T')[0];
  const topic = typeof parsed.topic === 'string' && parsed.topic.trim() ? parsed.topic.trim() : 'Daily English Lesson';

  const vocabResult = Array.isArray(parsed.vocabulary) ? validateAndParseVocabularyJson(JSON.stringify(parsed.vocabulary)) : { vocabulary: [] };
  const exResult = Array.isArray(parsed.exercises) ? validateAndParseExercisesJson(JSON.stringify(parsed.exercises)) : { exercises: [] };

  return {
    date,
    topic,
    vocabulary: vocabResult.vocabulary,
    exercises: exResult.exercises,
    progress: {
      wordsMastered: [],
      exerciseResults: {},
    },
  };
}
