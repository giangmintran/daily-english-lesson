import { SavedWordItem } from '../types/savedWord';
import { sanitizeWord } from './dictionary';
import {
  fetchSavedWordsFromApi,
  saveSavedWordToApi,
  deleteSavedWordFromApi,
  syncSavedWordsToApi,
  getAuthToken,
} from './api';

const STORAGE_KEY_SAVED_WORDS = 'daily_english_saved_words_v1';
export const EVENT_SAVED_WORDS_CHANGED = 'saved_words_changed';

function dispatchChangeEvent(count: number) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(EVENT_SAVED_WORDS_CHANGED, {
        detail: { count },
      })
    );
  }
}

/**
 * Get all saved words from local storage, sorted newest first
 */
export function getSavedWords(): SavedWordItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_WORDS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    console.error('Failed to load saved words from storage', err);
    return [];
  }
}

/**
 * Check if a word is already in the saved list
 */
export function isWordSaved(word: string): boolean {
  const clean = sanitizeWord(word);
  if (!clean) return false;
  const list = getSavedWords();
  return list.some((item) => sanitizeWord(item.word) === clean);
}

/**
 * Get a saved word item by word
 */
export function getSavedWordByWord(word: string): SavedWordItem | undefined {
  const clean = sanitizeWord(word);
  if (!clean) return undefined;
  const list = getSavedWords();
  return list.find((item) => sanitizeWord(item.word) === clean);
}

/**
 * Save or update a word in the notebook
 */
export function saveWord(
  item: Partial<SavedWordItem> & { word: string; meaning: string }
): SavedWordItem {
  const list = getSavedWords();
  const clean = sanitizeWord(item.word);

  const existingIndex = list.findIndex(
    (existing) => sanitizeWord(existing.word) === clean
  );

  let finalItem: SavedWordItem;

  if (existingIndex >= 0) {
    // Update existing word
    finalItem = {
      ...list[existingIndex],
      ...item,
      word: item.word.trim(),
      meaning: item.meaning.trim(),
      // Preserve context if new context isn't provided
      contextSentence: item.contextSentence || list[existingIndex].contextSentence,
    };
    list[existingIndex] = finalItem;
  } else {
    // Insert new word at the beginning
    finalItem = {
      id: `sw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      word: item.word.trim(),
      phonetic: item.phonetic?.trim(),
      partOfSpeech: item.partOfSpeech?.trim(),
      meaning: item.meaning.trim(),
      englishDefinition: item.englishDefinition?.trim(),
      contextSentence: item.contextSentence?.trim(),
      sourceDate: item.sourceDate || new Date().toISOString().split('T')[0],
      sourceType: item.sourceType || 'manual',
      notes: item.notes?.trim(),
      audioUrl: item.audioUrl,
      dateAdded: new Date().toISOString(),
      isMastered: item.isMastered ?? false,
      reviewCount: 0,
    };
    list.unshift(finalItem);
  }

  try {
    localStorage.setItem(STORAGE_KEY_SAVED_WORDS, JSON.stringify(list));
    dispatchChangeEvent(list.length);
  } catch (err) {
    console.error('Failed to save word to storage', err);
  }

  // Tự động đồng bộ lên Supabase nếu có phiên đăng nhập
  if (getAuthToken()) {
    saveSavedWordToApi(finalItem).catch((err) =>
      console.warn('[Sync] Could not save word to Supabase:', err)
    );
  }

  return finalItem;
}

/**
 * Update an existing word by ID
 */
export function updateSavedWord(
  id: string,
  updates: Partial<SavedWordItem>
): SavedWordItem | null {
  const list = getSavedWords();
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const updated: SavedWordItem = {
    ...list[index],
    ...updates,
  };

  list[index] = updated;

  try {
    localStorage.setItem(STORAGE_KEY_SAVED_WORDS, JSON.stringify(list));
    dispatchChangeEvent(list.length);
  } catch (err) {
    console.error('Failed to update saved word', err);
  }

  // Đồng bộ thay đổi lên Supabase
  if (getAuthToken()) {
    saveSavedWordToApi(updated).catch((err) =>
      console.warn('[Sync] Could not update word on Supabase:', err)
    );
  }

  return updated;
}

/**
 * Delete a word from the notebook
 */
export function deleteSavedWord(id: string): boolean {
  const list = getSavedWords();
  const filtered = list.filter((item) => item.id !== id);
  if (filtered.length === list.length) return false;

  try {
    localStorage.setItem(STORAGE_KEY_SAVED_WORDS, JSON.stringify(filtered));
    dispatchChangeEvent(filtered.length);
  } catch (err) {
    console.error('Failed to delete saved word', err);
    return false;
  }

  // Xóa khỏi Supabase
  if (getAuthToken()) {
    deleteSavedWordFromApi(id).catch((err) =>
      console.warn('[Sync] Could not delete word from Supabase:', err)
    );
  }

  return true;
}

/**
 * Toggle word mastered status
 */
export function toggleWordMastered(id: string): SavedWordItem | null {
  const list = getSavedWords();
  const target = list.find((item) => item.id === id);
  if (!target) return null;

  return updateSavedWord(id, { isMastered: !target.isMastered });
}

/**
 * Export saved words as JSON string
 */
export function exportSavedWordsAsJson(): string {
  const list = getSavedWords();
  return JSON.stringify(list, null, 2);
}

/**
 * Import a list of saved words
 */
export function importSavedWords(items: any[]): { imported: number; updated: number } {
  if (!Array.isArray(items)) return { imported: 0, updated: 0 };
  const current = getSavedWords();
  let imported = 0;
  let updated = 0;

  for (const raw of items) {
    if (!raw || typeof raw.word !== 'string' || !raw.meaning) continue;
    const clean = sanitizeWord(raw.word);
    const existingIdx = current.findIndex((c) => sanitizeWord(c.word) === clean);

    if (existingIdx >= 0) {
      current[existingIdx] = {
        ...current[existingIdx],
        ...raw,
        word: raw.word.trim(),
        meaning: String(raw.meaning).trim(),
      };
      updated++;
    } else {
      current.unshift({
        id: raw.id || `sw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        word: raw.word.trim(),
        phonetic: raw.phonetic,
        partOfSpeech: raw.partOfSpeech,
        meaning: String(raw.meaning).trim(),
        englishDefinition: raw.englishDefinition,
        contextSentence: raw.contextSentence,
        sourceDate: raw.sourceDate || new Date().toISOString().split('T')[0],
        sourceType: raw.sourceType || 'manual',
        notes: raw.notes,
        audioUrl: raw.audioUrl,
        dateAdded: raw.dateAdded || new Date().toISOString(),
        isMastered: Boolean(raw.isMastered),
        reviewCount: raw.reviewCount || 0,
      });
      imported++;
    }
  }

  try {
    localStorage.setItem(STORAGE_KEY_SAVED_WORDS, JSON.stringify(current));
    dispatchChangeEvent(current.length);
  } catch (err) {
    console.error('Failed to import saved words', err);
  }

  return { imported, updated };
}

/**
 * Subscribe to saved word changes
 */
export function subscribeSavedWords(callback: (count: number) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const custom = e as CustomEvent<{ count: number }>;
    callback(custom.detail?.count ?? getSavedWords().length);
  };

  window.addEventListener(EVENT_SAVED_WORDS_CHANGED, handler);
  return () => window.removeEventListener(EVENT_SAVED_WORDS_CHANGED, handler);
}

/**
 * Đồng bộ hai chiều giữa LocalStorage và Supabase khi khởi động hoặc đăng nhập
 */
export async function syncSavedWordsWithBackend(): Promise<SavedWordItem[]> {
  if (!getAuthToken()) {
    return getSavedWords();
  }

  try {
    const apiWords = await fetchSavedWordsFromApi();
    if (!apiWords) {
      return getSavedWords();
    }

    const localWords = getSavedWords();
    const wordMap = new Map<string, SavedWordItem>();

    // Nạp từ server trước
    for (const w of apiWords) {
      if (w && w.id) {
        wordMap.set(w.id, w);
      }
    }

    // Ghép với local (nếu local có từ chưa lên server thì giữ lại)
    const newLocalToPush: SavedWordItem[] = [];
    for (const lw of localWords) {
      if (!wordMap.has(lw.id)) {
        wordMap.set(lw.id, lw);
        newLocalToPush.push(lw);
      } else {
        // Cả 2 đều có: so sánh thời gian cập nhật/thêm
        const serverItem = wordMap.get(lw.id)!;
        const localTime = new Date(lw.dateAdded || 0).getTime();
        const serverTime = new Date(serverItem.dateAdded || 0).getTime();
        if (localTime > serverTime) {
          wordMap.set(lw.id, lw);
          newLocalToPush.push(lw);
        }
      }
    }

    const mergedList = Array.from(wordMap.values()).sort((a, b) => {
      const timeA = new Date(a.dateAdded || 0).getTime();
      const timeB = new Date(b.dateAdded || 0).getTime();
      return timeB - timeA;
    });

    localStorage.setItem(STORAGE_KEY_SAVED_WORDS, JSON.stringify(mergedList));
    dispatchChangeEvent(mergedList.length);

    // Đẩy các từ mới từ local lên server nếu có
    if (newLocalToPush.length > 0) {
      syncSavedWordsToApi(newLocalToPush).catch((err) =>
        console.warn('[Sync] Could not push offline words to Supabase:', err)
      );
    }

    return mergedList;
  } catch (err) {
    console.warn('[Sync] Failed to sync saved words with backend:', err);
    return getSavedWords();
  }
}

