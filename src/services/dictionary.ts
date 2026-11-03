/**
 * Dictionary & Translation Service
 * - Fetches IPA phonetic, part of speech, English definition, and audio from Free Dictionary API
 * - Suggests Vietnamese translation via MyMemory API
 * - In-memory cache for fast repeated lookups
 */

export interface WordLookupResult {
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  englishDefinition?: string;
  englishExample?: string;
  audioUrl?: string;
  suggestedMeaningVi?: string;
  foundInDictionary: boolean;
}

const lookupCache = new Map<string, WordLookupResult>();

/**
 * Clean text to extract pure word or phrase
 */
export function sanitizeWord(raw: string): string {
  if (!raw) return '';
  return raw
    .trim()
    .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '')
    .toLowerCase();
}

/**
 * Fetch word details from Free Dictionary API and Vietnamese translation suggestion
 */
export async function lookupWord(rawWord: string): Promise<WordLookupResult> {
  const cleanWord = sanitizeWord(rawWord);
  if (!cleanWord) {
    return {
      word: rawWord.trim(),
      foundInDictionary: false,
    };
  }

  // Check cache first
  if (lookupCache.has(cleanWord)) {
    return lookupCache.get(cleanWord)!;
  }

  const result: WordLookupResult = {
    word: cleanWord,
    foundInDictionary: false,
  };

  // Helper with timeout
  const fetchWithTimeout = async (url: string, timeoutMs = 4500) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      return null;
    }
  };

  // Parallel requests: Dictionary API + Vietnamese Translation
  const dictPromise = (async () => {
    try {
      const res = await fetchWithTimeout(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`
      );
      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const entry = data[0];
          result.foundInDictionary = true;

          // Phonetic
          let phonetic = entry.phonetic;
          if (!phonetic && Array.isArray(entry.phonetics)) {
            const phonWithText = entry.phonetics.find((p: any) => Boolean(p.text));
            if (phonWithText) phonetic = phonWithText.text;
          }
          if (phonetic) result.phonetic = phonetic;

          // Audio URL
          if (Array.isArray(entry.phonetics)) {
            const phonWithAudio = entry.phonetics.find((p: any) => Boolean(p.audio));
            if (phonWithAudio) result.audioUrl = phonWithAudio.audio;
          }

          // Part of Speech & Definition
          if (Array.isArray(entry.meanings) && entry.meanings.length > 0) {
            const firstMeaning = entry.meanings[0];
            if (firstMeaning.partOfSpeech) {
              result.partOfSpeech = firstMeaning.partOfSpeech;
            }
            if (Array.isArray(firstMeaning.definitions) && firstMeaning.definitions.length > 0) {
              const firstDef = firstMeaning.definitions[0];
              if (firstDef.definition) {
                result.englishDefinition = firstDef.definition;
              }
              if (firstDef.example) {
                result.englishExample = firstDef.example;
              }
            }
          }
        }
      }
    } catch {
      // Ignore network errors
    }
  })();

  const transPromise = (async () => {
    try {
      const res = await fetchWithTimeout(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanWord)}&langpair=en|vi`
      );
      if (res && res.ok) {
        const data = await res.json();
        const text = data?.responseData?.translatedText;
        if (
          text &&
          typeof text === 'string' &&
          text.trim().toLowerCase() !== cleanWord.toLowerCase() &&
          !text.includes('MYMEMORY WARNING')
        ) {
          result.suggestedMeaningVi = text.trim();
        }
      }
    } catch {
      // Ignore translation errors
    }
  })();

  await Promise.allSettled([dictPromise, transPromise]);

  // Save to cache
  lookupCache.set(cleanWord, result);
  return result;
}

