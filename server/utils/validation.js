/**
 * Validation utility for Daily English Lesson API
 * Enforces strict date formats, string lengths, and payload constraints (F-08).
 */

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Checks if a string is a valid ISO date (YYYY-MM-DD) and a real calendar date.
 */
export function isValidDateString(dateStr) {
  if (typeof dateStr !== 'string' || !DATE_REGEX.test(dateStr.trim())) {
    return false;
  }

  const [year, month, day] = dateStr.trim().split('-').map(Number);
  if (year < 2000 || year > 2100) return false;
  if (month < 1 || month > 12) return false;

  const dateObj = new Date(Date.UTC(year, month - 1, day));
  return (
    dateObj.getUTCFullYear() === year &&
    dateObj.getUTCMonth() === month - 1 &&
    dateObj.getUTCDate() === day
  );
}

/**
 * Sanitizes and validates a single lesson payload
 */
export function validateLessonPayload(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, message: 'Dữ liệu bài học phải là một đối tượng JSON (Object).' };
  }

  const rawDate = typeof raw.date === 'string' ? raw.date.trim() : '';
  if (!rawDate) {
    return { valid: false, message: 'Trường "date" (ngày học) là bắt buộc.' };
  }

  if (!isValidDateString(rawDate)) {
    return { valid: false, message: 'Định dạng ngày không hợp lệ. Vui lòng sử dụng định dạng YYYY-MM-DD.' };
  }

  const topic = typeof raw.topic === 'string' ? raw.topic.trim().slice(0, 200) : 'Daily English Lesson';

  // Validate vocabulary array (max 100 words per day)
  const rawVocab = Array.isArray(raw.vocabulary) ? raw.vocabulary : [];
  if (rawVocab.length > 100) {
    return { valid: false, message: 'Số lượng từ vựng trong một ngày tối đa là 100 từ.' };
  }

  const vocabulary = [];
  for (let i = 0; i < rawVocab.length; i++) {
    const item = rawVocab[i];
    if (!item || typeof item !== 'object') {
      return { valid: false, message: `Từ vựng ở vị trí ${i + 1} không hợp lệ.` };
    }

    const word = typeof item.word === 'string' ? item.word.trim() : '';
    const meaning = typeof item.meaning === 'string' ? item.meaning.trim() : '';

    if (!word) {
      return { valid: false, message: `Từ vựng ở vị trí ${i + 1} thiếu trường "word" bắt buộc.` };
    }
    if (word.length > 200) {
      return { valid: false, message: `Từ "${word.slice(0, 30)}..." vượt quá độ dài tối đa 200 ký tự.` };
    }
    if (!meaning) {
      return { valid: false, message: `Từ vựng "${word}" thiếu trường "meaning" (nghĩa).` };
    }
    if (meaning.length > 500) {
      return { valid: false, message: `Nghĩa của từ "${word}" vượt quá độ dài tối đa 500 ký tự.` };
    }

    // Sanitize optional fields
    const structures = Array.isArray(item.structures)
      ? item.structures.slice(0, 20).map((s) => String(s).trim().slice(0, 300))
      : undefined;

    let examples = undefined;
    if (Array.isArray(item.examples)) {
      examples = item.examples.slice(0, 20).map((ex) => {
        if (typeof ex === 'string') return ex.trim().slice(0, 500);
        return {
          en: String(ex.en || '').trim().slice(0, 500),
          vi: ex.vi ? String(ex.vi).trim().slice(0, 500) : undefined,
        };
      });
    }

    vocabulary.push({
      id: item.id ? String(item.id).trim().slice(0, 50) : `v_${i + 1}`,
      word,
      phonetic: typeof item.phonetic === 'string' ? item.phonetic.trim().slice(0, 100) : '',
      partOfSpeech: typeof item.partOfSpeech === 'string' ? item.partOfSpeech.trim().slice(0, 50) : '',
      meaning,
      usage: typeof item.usage === 'string' ? item.usage.trim().slice(0, 500) : undefined,
      structures,
      purpose: typeof item.purpose === 'string' ? item.purpose.trim().slice(0, 500) : undefined,
      commonMistakes: typeof item.commonMistakes === 'string' ? item.commonMistakes.trim().slice(0, 500) : undefined,
      examples,
      example: typeof item.example === 'string' ? item.example.trim().slice(0, 500) : '',
      exampleMeaning: typeof item.exampleMeaning === 'string' ? item.exampleMeaning.trim().slice(0, 500) : '',
    });
  }

  // Validate exercises array (max 200 exercises per day)
  const rawExercises = Array.isArray(raw.exercises) ? raw.exercises : [];
  if (rawExercises.length > 200) {
    return { valid: false, message: 'Số lượng bài tập trong một ngày tối đa là 200 bài.' };
  }

  const exercises = [];
  const validTypes = new Set([
    'multiple_choice',
    'fill_in_blank',
    'translation',
    'verb_conjugation',
    'meaning_check',
    'sentence_writing',
  ]);

  for (let i = 0; i < rawExercises.length; i++) {
    const ex = rawExercises[i];
    if (!ex || typeof ex !== 'object') {
      return { valid: false, message: `Bài tập ở vị trí ${i + 1} không hợp lệ.` };
    }

    const question = typeof ex.question === 'string' ? ex.question.trim() : '';
    const answer = ex.answer !== undefined && ex.answer !== null ? String(ex.answer).trim() : '';

    if (!question) {
      return { valid: false, message: `Bài tập ở vị trí ${i + 1} thiếu câu hỏi "question".` };
    }
    if (question.length > 1000) {
      return { valid: false, message: `Câu hỏi bài tập ${i + 1} vượt quá 1000 ký tự.` };
    }
    if (!answer) {
      return { valid: false, message: `Bài tập ở vị trí ${i + 1} thiếu đáp án "answer".` };
    }
    if (answer.length > 500) {
      return { valid: false, message: `Đáp án bài tập ${i + 1} vượt quá 500 ký tự.` };
    }

    const options = Array.isArray(ex.options)
      ? ex.options.slice(0, 10).map((opt) => String(opt).trim().slice(0, 300))
      : undefined;

    const type = validTypes.has(ex.type)
      ? ex.type
      : options && options.length > 0
      ? 'multiple_choice'
      : 'fill_in_blank';

    const wordBank = Array.isArray(ex.wordBank || ex.word_bank)
      ? (ex.wordBank || ex.word_bank).slice(0, 50).map((w) => String(w).trim().slice(0, 100))
      : undefined;

    exercises.push({
      id: ex.id !== undefined ? (typeof ex.id === 'number' ? ex.id : String(ex.id).slice(0, 50)) : i + 1,
      section: typeof ex.section === 'string' ? ex.section.trim().slice(0, 100) : undefined,
      type,
      question,
      options,
      wordBank,
      answer,
      explanation: typeof ex.explanation === 'string' ? ex.explanation.trim().slice(0, 1000) : '',
    });
  }

  // Validate progress
  const progress = validateProgressPayload(raw.progress).progress;

  return {
    valid: true,
    lesson: {
      date: rawDate,
      topic,
      vocabulary,
      exercises,
      progress,
    },
  };
}

/**
 * Validates progress object
 */
export function validateProgressPayload(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      valid: true,
      progress: { wordsMastered: [], exerciseResults: {} },
    };
  }

  const wordsMastered = Array.isArray(raw.wordsMastered)
    ? raw.wordsMastered.slice(0, 500).map((w) => String(w).trim().slice(0, 200))
    : [];

  const exerciseResults = {};
  if (raw.exerciseResults && typeof raw.exerciseResults === 'object' && !Array.isArray(raw.exerciseResults)) {
    const keys = Object.keys(raw.exerciseResults).slice(0, 500);
    for (const k of keys) {
      const item = raw.exerciseResults[k];
      const safeKey = String(k).slice(0, 50);
      if (item && typeof item === 'object') {
        exerciseResults[safeKey] = {
          userAnswer: typeof item.userAnswer === 'string' ? item.userAnswer.slice(0, 500) : String(item.userAnswer ?? '').slice(0, 500),
          isCorrect: Boolean(item.isCorrect),
        };
      } else if (typeof item === 'boolean') {
        exerciseResults[safeKey] = {
          userAnswer: '',
          isCorrect: item,
        };
      }
    }
  }

  return {
    valid: true,
    progress: {
      wordsMastered,
      exerciseResults,
    },
  };
}

/**
 * Validates batch lesson array (max 50 lessons per batch)
 */
export function validateBatchLessons(rawList) {
  if (!Array.isArray(rawList) || rawList.length === 0) {
    return { valid: false, message: 'Danh sách bài học phải là một mảng và không được để trống.' };
  }

  if (rawList.length > 50) {
    return { valid: false, message: 'Chỉ có thể đồng bộ tối đa 50 bài học trong một lượt nạp batch.' };
  }

  const validatedLessons = [];
  for (let i = 0; i < rawList.length; i++) {
    const result = validateLessonPayload(rawList[i]);
    if (!result.valid) {
      return { valid: false, message: `Lỗi ở bài học thứ ${i + 1}: ${result.message}` };
    }
    validatedLessons.push(result.lesson);
  }

  return { valid: true, lessons: validatedLessons };
}

