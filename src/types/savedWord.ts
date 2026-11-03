export type SavedWordSourceType = 'exercise' | 'lesson_vocab' | 'selection' | 'manual';

export interface SavedWordItem {
  id: string; // Unique ID (timestamp or uuid)
  word: string; // English word or phrase
  phonetic?: string; // IPA phonetic, e.g. "/rɪˈlʌk.tənt/"
  partOfSpeech?: string; // e.g. "adj", "verb", "noun"
  meaning: string; // Vietnamese meaning
  englishDefinition?: string; // English definition from dictionary
  contextSentence?: string; // Original sentence where word was found
  sourceDate?: string; // Lesson date, e.g. "2026-11-02"
  sourceType?: SavedWordSourceType;
  notes?: string; // Personal notes
  audioUrl?: string; // Optional audio URL from dictionary API
  dateAdded: string; // ISO date string
  isMastered: boolean; // false = learning / need practice, true = mastered
  reviewCount?: number;
  lastReviewedDate?: string; // ISO date string
  srsInterval?: number; // Days until next review (1, 3, 7, 14, 30)
  srsStage?: number; // Leitner stage 0..5
  nextReviewDate?: string; // YYYY-MM-DD
}

