export type PartOfSpeech = 'n' | 'v' | 'adj' | 'adv' | 'prep' | 'conj' | 'phrase' | 'idiom' | string;

export interface VocabularyExample {
  en: string;
  vi?: string;
}

export interface VocabularyItem {
  id: string;
  word: string;
  phonetic?: string;
  partOfSpeech?: PartOfSpeech;
  meaning: string;
  
  // Cách dùng tự nhiên
  usage?: string;
  
  // Cấu trúc thường gặp
  structures?: string[];
  
  // Dùng để làm gì
  purpose?: string;
  
  // Lỗi thường gặp / Lưu ý phát âm ngữ pháp
  commonMistakes?: string;
  
  // Danh sách câu ví dụ chi tiết (Song ngữ Anh - Việt)
  examples?: (VocabularyExample | string)[];
  
  // Trường tương thích cũ (nếu có)
  example?: string;
  exampleMeaning?: string;
  
  isMastered?: boolean;
}

export type ExerciseType = 'multiple_choice' | 'fill_in_blank' | 'translation';

export interface ExerciseItem {
  id: string | number;
  type: ExerciseType;
  question: string;
  options?: string[]; // for multiple_choice
  answer: string;
  explanation?: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface DailyLesson {
  date: string; // YYYY-MM-DD
  topic: string;
  vocabulary: VocabularyItem[];
  exercises: ExerciseItem[];
  completedAt?: string;
  progress?: {
    wordsMastered: string[]; // ids
    exerciseResults: Record<string | number, { userAnswer: string; isCorrect: boolean }>;
  };
}

export interface UserStats {
  streak: number;
  lastActiveDate: string;
  totalWordsLearned: number;
  totalExercisesDone: number;
}
