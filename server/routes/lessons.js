import { Router } from 'express';
import { getSupabase, isSupabaseConfigured } from '../supabase.js';
import {
  isValidDateString,
  validateLessonPayload,
  validateBatchLessons,
  validateProgressPayload,
} from '../utils/validation.js';

const router = Router();

// Middleware checking Supabase configuration
function requireSupabase(_req, res, next) {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({
      success: false,
      message: 'Dịch vụ lưu trữ Supabase chưa được cấu hình trên máy chủ.',
    });
  }
  next();
}

/**
 * GET /api/lessons
 * Retrieve all lessons sorted by date descending
 */
router.get('/', requireSupabase, async (_req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('daily_lessons')
      .select('date, topic, vocabulary, exercises, progress, created_at, updated_at')
      .order('date', { ascending: false });

    if (error) {
      console.error('[Lessons API] Error querying daily_lessons:', error);
      return res.status(500).json({
        success: false,
        message: 'Không thể truy vấn danh sách bài học từ cơ sở dữ liệu.',
      });
    }

    const lessons = (data || []).map((row) => ({
      date: row.date,
      topic: row.topic || 'Daily English Lesson',
      vocabulary: Array.isArray(row.vocabulary) ? row.vocabulary : [],
      exercises: Array.isArray(row.exercises) ? row.exercises : [],
      progress: row.progress || { wordsMastered: [], exerciseResults: {} },
    }));

    return res.json({ success: true, data: lessons });
  } catch (err) {
    console.error('[Lessons API] GET / exception:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách bài học.',
    });
  }
});

/**
 * GET /api/lessons/:date
 * Retrieve lesson for a specific date (YYYY-MM-DD)
 */
router.get('/:date', requireSupabase, async (req, res) => {
  const { date } = req.params;

  if (!isValidDateString(date)) {
    return res.status(400).json({
      success: false,
      message: 'Định dạng ngày không hợp lệ. Vui lòng dùng YYYY-MM-DD.',
    });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('daily_lessons')
      .select('date, topic, vocabulary, exercises, progress, created_at, updated_at')
      .eq('date', date)
      .maybeSingle();

    if (error) {
      console.error(`[Lessons API] Error querying lesson ${date}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi truy vấn bài học từ cơ sở dữ liệu.',
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy bài học cho ngày ${date}.`,
      });
    }

    const lesson = {
      date: data.date,
      topic: data.topic || 'Daily English Lesson',
      vocabulary: Array.isArray(data.vocabulary) ? data.vocabulary : [],
      exercises: Array.isArray(data.exercises) ? data.exercises : [],
      progress: data.progress || { wordsMastered: [], exerciseResults: {} },
    };

    return res.json({ success: true, data: lesson });
  } catch (err) {
    console.error(`[Lessons API] GET /${date} exception:`, err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy thông tin bài học.',
    });
  }
});

/**
 * POST /api/lessons
 * Create or update a lesson (Upsert) with strict schema validation
 * Automatically filters out vocabulary words that already exist in other lessons in the database
 */
router.post('/', requireSupabase, async (req, res) => {
  const rawLesson = req.body.lesson || req.body;
  const validation = validateLessonPayload(rawLesson);

  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: validation.message,
    });
  }

  try {
    const supabase = getSupabase();

    // Query other lessons to check for words that already exist in the database
    const { data: otherLessons, error: queryError } = await supabase
      .from('daily_lessons')
      .select('date, vocabulary')
      .neq('date', validation.lesson.date);

    if (queryError) {
      console.warn('[Lessons API] Could not check existing words from daily_lessons:', queryError);
    }

    const existingWordMap = new Map();
    if (Array.isArray(otherLessons)) {
      for (const row of otherLessons) {
        if (Array.isArray(row.vocabulary)) {
          for (const item of row.vocabulary) {
            if (item && item.word) {
              const key = item.word.trim().toLowerCase();
              if (!existingWordMap.has(key)) {
                existingWordMap.set(key, row.date);
              }
            }
          }
        }
      }
    }

    // Filter out words that already exist in the database and deduplicate within payload
    const skippedWords = [];
    const seenInPayload = new Set();
    const filteredVocab = [];

    for (const item of validation.lesson.vocabulary) {
      const key = item.word.trim().toLowerCase();
      if (existingWordMap.has(key)) {
        skippedWords.push({
          word: item.word,
          existingDate: existingWordMap.get(key),
          reason: 'already_in_database',
        });
      } else if (seenInPayload.has(key)) {
        skippedWords.push({
          word: item.word,
          reason: 'duplicate_in_payload',
        });
      } else {
        seenInPayload.add(key);
        filteredVocab.push(item);
      }
    }

    validation.lesson.vocabulary = filteredVocab;

    const payload = {
      ...validation.lesson,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('daily_lessons')
      .upsert(payload, { onConflict: 'date' });

    if (error) {
      console.error('[Lessons API] Error upserting lesson:', error);
      return res.status(500).json({
        success: false,
        message: 'Không thể lưu bài học vào cơ sở dữ liệu.',
      });
    }

    return res.json({
      success: true,
      data: payload,
      skippedWords,
      importedWordsCount: filteredVocab.length,
    });
  } catch (err) {
    console.error('[Lessons API] POST / exception:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lưu bài học.',
    });
  }
});

/**
 * POST /api/lessons/batch
 * Bulk upsert lessons with count limits and schema validation
 * Automatically filters duplicate vocabulary words against the database
 */
router.post('/batch', requireSupabase, async (req, res) => {
  const rawList = Array.isArray(req.body) ? req.body : req.body.lessons;
  const validation = validateBatchLessons(rawList);

  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: validation.message,
    });
  }

  try {
    const supabase = getSupabase();
    const batchDates = validation.lessons.map((l) => l.date);

    // Query existing lessons not in current batch
    const { data: dbLessons } = await supabase
      .from('daily_lessons')
      .select('date, vocabulary');

    const existingWordMap = new Map();
    if (Array.isArray(dbLessons)) {
      for (const row of dbLessons) {
        if (!batchDates.includes(row.date) && Array.isArray(row.vocabulary)) {
          for (const item of row.vocabulary) {
            if (item && item.word) {
              const key = item.word.trim().toLowerCase();
              if (!existingWordMap.has(key)) {
                existingWordMap.set(key, row.date);
              }
            }
          }
        }
      }
    }

    const now = new Date().toISOString();
    const payloads = validation.lessons.map((lesson) => {
      const filteredVocab = [];
      const seen = new Set();
      for (const item of lesson.vocabulary) {
        const key = item.word.trim().toLowerCase();
        if (!existingWordMap.has(key) && !seen.has(key)) {
          seen.add(key);
          existingWordMap.set(key, lesson.date);
          filteredVocab.push(item);
        }
      }
      return {
        ...lesson,
        vocabulary: filteredVocab,
        updated_at: now,
      };
    });

    const { error } = await supabase
      .from('daily_lessons')
      .upsert(payloads, { onConflict: 'date' });

    if (error) {
      console.error('[Lessons API] Error in batch upsert:', error);
      return res.status(500).json({
        success: false,
        message: 'Không thể thực hiện nạp nhiều bài học.',
      });
    }

    return res.json({ success: true, count: payloads.length });
  } catch (err) {
    console.error('[Lessons API] POST /batch exception:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi nạp dữ liệu hàng loạt.',
    });
  }
});

/**
 * PUT/PATCH /api/lessons/:date/progress
 * Updates learning progress for a specific day
 */
const updateProgressHandler = async (req, res) => {
  const { date } = req.params;

  if (!isValidDateString(date)) {
    return res.status(400).json({
      success: false,
      message: 'Định dạng ngày không hợp lệ. Vui lòng dùng YYYY-MM-DD.',
    });
  }

  const rawProgress = req.body.progress || req.body;
  const { progress } = validateProgressPayload(rawProgress);

  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('daily_lessons')
      .update({
        progress,
        updated_at: new Date().toISOString(),
      })
      .eq('date', date);

    if (error) {
      console.error(`[Lessons API] Error updating progress ${date}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Không thể cập nhật tiến độ học vào cơ sở dữ liệu.',
      });
    }

    return res.json({ success: true, data: progress });
  } catch (err) {
    console.error(`[Lessons API] PUT /${date}/progress exception:`, err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật tiến độ học.',
    });
  }
};

router.put('/:date/progress', requireSupabase, updateProgressHandler);
router.patch('/:date/progress', requireSupabase, updateProgressHandler);

/**
 * DELETE /api/lessons/:date
 * Remove a lesson by date
 */
router.delete('/:date', requireSupabase, async (req, res) => {
  const { date } = req.params;

  if (!isValidDateString(date)) {
    return res.status(400).json({
      success: false,
      message: 'Định dạng ngày không hợp lệ. Vui lòng dùng YYYY-MM-DD.',
    });
  }

  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('daily_lessons')
      .delete()
      .eq('date', date);

    if (error) {
      console.error(`[Lessons API] Error deleting lesson ${date}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Không thể xóa bài học khỏi cơ sở dữ liệu.',
      });
    }

    return res.json({ success: true, message: `Đã xóa bài học ngày ${date}.` });
  } catch (err) {
    console.error(`[Lessons API] DELETE /${date} exception:`, err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xóa bài học.',
    });
  }
});

export default router;
