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
