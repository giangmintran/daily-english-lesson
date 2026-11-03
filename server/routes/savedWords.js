import { Router } from 'express';
import { getSupabase, isSupabaseConfigured } from '../supabase.js';
import {
  validateSavedWordPayload,
  validateBatchSavedWords,
} from '../utils/validation.js';

const router = Router();

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
 * Format database row to frontend SavedWordItem
 */
function mapRowToSavedWord(row) {
  return {
    id: row.id,
    word: row.word,
    phonetic: row.phonetic || undefined,
    partOfSpeech: row.part_of_speech || undefined,
    meaning: row.meaning,
    englishDefinition: row.english_definition || undefined,
    contextSentence: row.context_sentence || undefined,
    sourceDate: row.source_date || undefined,
    sourceType: row.source_type || 'manual',
    notes: row.notes || undefined,
    audioUrl: row.audio_url || undefined,
    dateAdded: row.created_at || new Date().toISOString(),
    isMastered: Boolean(row.is_mastered),
    reviewCount: Number(row.review_count || 0),
    lastReviewedDate: row.last_reviewed_date || undefined,
  };
}

/**
 * GET /api/saved-words
 * Lấy tất cả từ trong sổ tay từ vựng
 */
router.get('/', requireSupabase, async (_req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('saved_words')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Nếu bảng chưa tạo trong Supabase
      if (error.code === '42P01') {
        return res.status(200).json({
          success: true,
          data: [],
          notice: 'Bảng saved_words chưa được tạo trong Supabase. Vui lòng chạy schema.sql.',
        });
      }
      console.error('[SavedWords API] GET error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách từ đã lưu từ Supabase.',
      });
    }

    const words = (data || []).map(mapRowToSavedWord);
    return res.json({ success: true, data: words });
  } catch (err) {
    console.error('[SavedWords API] GET exception:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách từ đã lưu.',
    });
  }
});

/**
 * POST /api/saved-words
 * Lưu hoặc cập nhật 1 từ (Upsert)
 */
router.post('/', requireSupabase, async (req, res) => {
  const result = validateSavedWordPayload(req.body);
  if (!result.valid) {
    return res.status(400).json({ success: false, message: result.message });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('saved_words')
      .upsert(result.word, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') {
        return res.status(503).json({
          success: false,
          message: 'Bảng saved_words chưa được tạo trong Supabase. Vui lòng chạy lệnh SQL trong server/schema.sql.',
        });
      }
      console.error('[SavedWords API] Upsert error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lưu từ vào Supabase.',
      });
    }

    return res.json({
      success: true,
      data: mapRowToSavedWord(data),
      message: `Đã lưu từ "${result.word.word}" thành công.`,
    });
  } catch (err) {
    console.error('[SavedWords API] POST exception:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lưu từ vựng.',
    });
  }
});

/**
 * POST /api/saved-words/sync
 * Đồng bộ hàng loạt từ vựng (Batch Upsert)
 */
router.post('/sync', requireSupabase, async (req, res) => {
  const rawList = Array.isArray(req.body) ? req.body : req.body.words;
  const result = validateBatchSavedWords(rawList);

  if (!result.valid) {
    return res.status(400).json({ success: false, message: result.message });
  }

  if (result.words.length === 0) {
    return res.json({ success: true, count: 0, message: 'Không có từ nào cần đồng bộ.' });
  }

  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('saved_words')
      .upsert(result.words, { onConflict: 'id' });

    if (error) {
      if (error.code === '42P01') {
        return res.status(503).json({
          success: false,
          message: 'Bảng saved_words chưa được tạo trong Supabase. Vui lòng chạy lệnh SQL trong server/schema.sql.',
        });
      }
      console.error('[SavedWords API] Batch sync error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi đồng bộ từ vựng vào Supabase.',
      });
    }

    return res.json({
      success: true,
      count: result.words.length,
      message: `Đã đồng bộ ${result.words.length} từ vào Supabase.`,
    });
  } catch (err) {
    console.error('[SavedWords API] Batch sync exception:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi đồng bộ từ vựng.',
    });
  }
});

/**
 * DELETE /api/saved-words/:id
 * Xóa 1 từ khỏi sổ tay
 */
router.delete('/:id', requireSupabase, async (req, res) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'ID từ vựng không hợp lệ.' });
  }

  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('saved_words').delete().eq('id', id);

    if (error) {
      console.error('[SavedWords API] DELETE error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa từ khỏi Supabase.',
      });
    }

    return res.json({ success: true, message: 'Đã xóa từ thành công.' });
  } catch (err) {
    console.error('[SavedWords API] DELETE exception:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xóa từ.',
    });
  }
});

export default router;

