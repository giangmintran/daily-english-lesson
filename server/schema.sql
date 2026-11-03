-- ==============================================================================
-- Schema Setup & Phân Quyền Bảo Mật Cho Supabase
-- Chạy toàn bộ script này trong Supabase Dashboard -> SQL Editor -> Run
-- ==============================================================================

-- 1. Tạo bảng lưu trữ bài học tiếng Anh
CREATE TABLE IF NOT EXISTS public.daily_lessons (
  date VARCHAR(10) PRIMARY KEY,
  topic TEXT NOT NULL DEFAULT 'Daily English Lesson',
  vocabulary JSONB NOT NULL DEFAULT '[]'::jsonb,
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  progress JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Bật Row Level Security (RLS)
ALTER TABLE public.daily_lessons ENABLE ROW LEVEL SECURITY;

-- 3. BẢO MẬT: Chỉ cấp quyền cho Backend (service_role) và Admin (postgres)
-- Không cấp quyền cho anon (người ngoài internet có anon key cũng KHÔNG THỂ truy cập trực tiếp)
GRANT USAGE ON SCHEMA public TO postgres, service_role;
GRANT ALL ON TABLE public.daily_lessons TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;

-- Thu hồi quyền từ anon và authenticated công khai
REVOKE ALL ON TABLE public.daily_lessons FROM anon, authenticated;

-- Xóa các policy cũ nếu có
DROP POLICY IF EXISTS "Allow public access for personal use" ON public.daily_lessons;
DROP POLICY IF EXISTS "Allow all operations for personal use" ON public.daily_lessons;
DROP POLICY IF EXISTS "Allow backend service_role full access" ON public.daily_lessons;

-- 4. Tạo Policy cho phép service_role toàn quyền
CREATE POLICY "Allow backend service_role full access"
ON public.daily_lessons
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ==============================================================================
-- 5. Bảng Sổ tay từ vựng (Personal Saved Words Notebook)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.saved_words (
  id TEXT PRIMARY KEY,
  word TEXT NOT NULL,
  meaning TEXT NOT NULL,
  phonetic TEXT,
  part_of_speech TEXT,
  english_definition TEXT,
  context_sentence TEXT,
  source_date VARCHAR(10),
  source_type VARCHAR(20) DEFAULT 'manual',
  notes TEXT,
  audio_url TEXT,
  is_mastered BOOLEAN DEFAULT false,
  review_count INT DEFAULT 0,
  last_reviewed_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.saved_words ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA public TO postgres, service_role;
GRANT ALL ON TABLE public.saved_words TO postgres, service_role;
REVOKE ALL ON TABLE public.saved_words FROM anon, authenticated;

DROP POLICY IF EXISTS "Allow backend service_role full access to saved_words" ON public.saved_words;
CREATE POLICY "Allow backend service_role full access to saved_words"
ON public.saved_words
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
