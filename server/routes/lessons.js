import { Router } from 'express';
import { getSupabase, isSupabaseConfigured } from '../supabase.js';

const router = Router();

// Middleware kiểm tra Supabase
function requireSupabase(_req, res, next) {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({
      success: false,
      message: 'Supabase chưa được cấu hình trên server. Vui lòng kiểm tra file .env.',
    });
  }
  next();
}

/**
 * GET /api/lessons
 * Lấy danh sách tất cả bài học, sắp xếp theo ngày mới nhất
 */
router.get('/', requireSupabase, async (_req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('daily_lessons')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Lỗi truy vấn daily_lessons:', error);
      const isMissingTable =
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        error.message?.includes('Could not find the table');
      const message = isMissingTable
        ? 'Bảng "daily_lessons" chưa được tạo trên Supabase. Hãy chạy script trong file server/schema.sql trên Supabase Dashboard -> SQL Editor.'
        : error.message;
      return res.status(500).json({ success: false, message });
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
    console.error('Lỗi GET /api/lessons:', err);
    return res.status(500).json({ success: false, message: err.message || 'Lỗi server' });
  }
});

/**
 * GET /api/lessons/:date
 * Lấy thông tin bài học theo ngày cụ thể (YYYY-MM-DD)
 */
router.get('/:date', requireSupabase, async (req, res) => {
  const { date } = req.params;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('daily_lessons')
      .select('*')
      .eq('date', date)
      .maybeSingle();

    if (error) {
      console.error(`Lỗi truy vấn bài học ngày ${date}:`, error);
      return res.status(500).json({ success: false, message: error.message });
    }

    if (!data) {
      return res.status(404).json({ success: false, message: `Không tìm thấy bài học cho ngày ${date}` });
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
    console.error(`Lỗi GET /api/lessons/${date}:`, err);
    return res.status(500).json({ success: false, message: err.message || 'Lỗi server' });
  }
});

/**
 * POST /api/lessons
 * Tạo mới hoặc cập nhật bài học (Upsert)
 */
router.post('/', requireSupabase, async (req, res) => {
  const lesson = req.body.lesson || req.body;

  if (!lesson || !lesson.date) {
    return res.status(400).json({ success: false, message: 'Dữ liệu bài học thiếu trường "date" bắt buộc.' });
  }

  const payload = {
    date: String(lesson.date).trim(),
    topic: lesson.topic ? String(lesson.topic).trim() : 'Daily English Lesson',
    vocabulary: Array.isArray(lesson.vocabulary) ? lesson.vocabulary : [],
    exercises: Array.isArray(lesson.exercises) ? lesson.exercises : [],
    progress: lesson.progress || { wordsMastered: [], exerciseResults: {} },
    updated_at: new Date().toISOString(),
  };

  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('daily_lessons')
      .upsert(payload, { onConflict: 'date' });

    if (error) {
      console.error('Lỗi upsert bài học vào Supabase:', error);
      const isMissingTable =
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        error.message?.includes('Could not find the table');
      const message = isMissingTable
        ? 'Bảng "daily_lessons" chưa được tạo trên Supabase. Hãy chạy script trong file server/schema.sql trên Supabase Dashboard -> SQL Editor.'
        : error.message;
      return res.status(500).json({ success: false, message });
    }

    return res.json({ success: true, data: payload });
  } catch (err) {
    console.error('Lỗi POST /api/lessons:', err);
    return res.status(500).json({ success: false, message: err.message || 'Lỗi server' });
  }
});

/**
 * POST /api/lessons/batch
 * Đồng bộ hoặc nạp nhiều bài học cùng lúc
 */
router.post('/batch', requireSupabase, async (req, res) => {
  const list = Array.isArray(req.body) ? req.body : req.body.lessons;

  if (!Array.isArray(list) || list.length === 0) {
    return res.status(400).json({ success: false, message: 'Danh sách bài học rỗng hoặc không đúng định dạng.' });
  }

  const payloads = list.map((l) => ({
    date: String(l.date).trim(),
    topic: l.topic ? String(l.topic).trim() : 'Daily English Lesson',
    vocabulary: Array.isArray(l.vocabulary) ? l.vocabulary : [],
    exercises: Array.isArray(l.exercises) ? l.exercises : [],
    progress: l.progress || { wordsMastered: [], exerciseResults: {} },
    updated_at: new Date().toISOString(),
  }));

  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('daily_lessons')
      .upsert(payloads, { onConflict: 'date' });

    if (error) {
      console.error('Lỗi batch upsert vào Supabase:', error);
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.json({ success: true, count: payloads.length });
  } catch (err) {
    console.error('Lỗi POST /api/lessons/batch:', err);
    return res.status(500).json({ success: false, message: err.message || 'Lỗi server' });
  }
});

/**
 * PUT/PATCH /api/lessons/:date/progress
 * Cập nhật tiến độ học của ngày (wordsMastered, exerciseResults)
 */
const updateProgressHandler = async (req, res) => {
  const { date } = req.params;
  const progress = req.body.progress || req.body;

  if (!progress) {
    return res.status(400).json({ success: false, message: 'Thiếu dữ liệu progress cần cập nhật.' });
  }

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
      console.error(`Lỗi cập nhật progress ngày ${date}:`, error);
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.json({ success: true, data: progress });
  } catch (err) {
    console.error(`Lỗi PUT /api/lessons/${date}/progress:`, err);
    return res.status(500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

router.put('/:date/progress', requireSupabase, updateProgressHandler);
router.patch('/:date/progress', requireSupabase, updateProgressHandler);

/**
 * DELETE /api/lessons/:date
 * Xóa một bài học theo ngày
 */
router.delete('/:date', requireSupabase, async (req, res) => {
  const { date } = req.params;

  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('daily_lessons')
      .delete()
      .eq('date', date);

    if (error) {
      console.error(`Lỗi xóa bài học ngày ${date}:`, error);
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.json({ success: true, message: `Đã xóa bài học ngày ${date}` });
  } catch (err) {
    console.error(`Lỗi DELETE /api/lessons/${date}:`, err);
    return res.status(500).json({ success: false, message: err.message || 'Lỗi server' });
  }
});

export default router;

