# Daily English Study (Minimalist & Scientific)

Ứng dụng web ôn tập 20 từ mới & 60 bài tập tiếng Anh mỗi ngày theo phong cách **Minimalism** và phương pháp **Active Recall & Spaced Repetition**.

Dự án hiện có kiến trúc **Full-stack**:
- **Backend (Node.js / Express + TypeScript)**: Kết nối và quản lý dữ liệu trên Supabase Database, cung cấp REST API cho toàn bộ bài học.
- **Frontend (React 18 + Vite + Tailwind CSS)**: Giao diện trực quan, tối giản, tự động đồng bộ dữ liệu với Backend. Toàn bộ thông tin cấu hình Supabase được bảo mật phía server, không xuất hiện trên giao diện người dùng.

---

## ⚡ Bắt đầu nhanh

### 1. Cấu hình Backend & Supabase
1. Copy file `.env.example` thành `.env`:
   ```bash
   cp .env.example .env
   ```
2. Điền thông tin kết nối Supabase vào file `.env`:
   ```env
   PORT=5000
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-supabase-key-here
   ```
3. Tạo bảng và cấp quyền trong Supabase SQL Editor bằng script trong file `server/schema.sql`:
   ```sql
   CREATE TABLE IF NOT EXISTS public.daily_lessons (
     date VARCHAR(10) PRIMARY KEY,
     topic TEXT NOT NULL DEFAULT 'Daily English Lesson',
     vocabulary JSONB NOT NULL DEFAULT '[]'::jsonb,
     exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
     progress JSONB NOT NULL DEFAULT '{}'::jsonb,
     created_at TIMESTAMPTZ DEFAULT now(),
     updated_at TIMESTAMPTZ DEFAULT now()
   );

   -- Cấp quyền bảo mật: Chỉ cho phép Backend (service_role) và Admin (postgres)
   GRANT USAGE ON SCHEMA public TO postgres, service_role;
   GRANT ALL ON TABLE public.daily_lessons TO postgres, service_role;
   GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
   REVOKE ALL ON TABLE public.daily_lessons FROM anon, authenticated;

   ALTER TABLE public.daily_lessons ENABLE ROW LEVEL SECURITY;
   DROP POLICY IF EXISTS "Allow backend service_role full access" ON public.daily_lessons;
   CREATE POLICY "Allow backend service_role full access"
   ON public.daily_lessons FOR ALL
   TO service_role
   USING (true)
   WITH CHECK (true);
   ```

### 2. Khởi chạy ứng dụng tại máy (Local)
Chạy cả Backend (cổng 5000) và Frontend (cổng 5173) cùng lúc:
```bash
npm run dev
```

Hoặc chạy riêng biệt:
- **Chỉ Backend:** `npm run dev:server` (http://localhost:5000)
- **Chỉ Frontend:** `npm run dev:client` (http://localhost:5173)

---

## 🚀 Hướng dẫn Deploy lên Vercel (Miễn phí 100%)

Dự án đã được cấu hình sẵn file [`vercel.json`](file:///d:/Personal/Code/daily-englishl-lesson/vercel.json) và Serverless Function [`api/index.js`](file:///d:/Personal/Code/daily-englishl-lesson/api/index.js) để deploy Full-stack (cả Frontend và Backend API) lên Vercel trong 1 nốt nhạc:

1. **Đẩy code lên GitHub:**
   ```bash
   git init
   git add .
   git commit -m "feat: daily english fullstack app"
   git remote add origin <url-repo-cua-ban>
   git push -u origin main
   ```

2. **Tạo Project trên Vercel:**
   - Đăng nhập vào [Vercel](https://vercel.com/) và chọn **"Add New..."** ➔ **"Project"**.
   - Chọn kho lưu trữ GitHub của bạn và bấm **Import**.

3. **Thêm Environment Variables trên Vercel:**
   Tại mục **Environment Variables**, thêm các biến sau:
   - `APP_PASSWORD`: `mat_khau_cua_ban` *(Mật khẩu riêng tư để đăng nhập)*
   - `SUPABASE_URL`: `https://your-project.supabase.co`
   - `SUPABASE_SECRET_KEY`: `your-supabase-secret-key-here`

4. **Bấm "Deploy":**
   Vercel sẽ tự động:
   - Build giao diện React (Vite) thành file tĩnh.
   - Build API backend thành **Serverless Function** (tự động xử lý routing `/api/...`).
   - Cung cấp link website dạng `https://your-project.vercel.app` để bạn có thể truy cập học tiếng Anh trên cả máy tính lẫn điện thoại!

---

## 🔌 Backend REST API

- `GET /api/health`: Kiểm tra trạng thái server và kết nối Supabase.
- `GET /api/lessons`: Lấy danh sách tất cả bài học (sắp xếp theo ngày mới nhất).
- `GET /api/lessons/:date`: Lấy thông tin bài học của một ngày cụ thể (YYYY-MM-DD).
- `POST /api/lessons`: Lưu hoặc cập nhật bài học (Upsert).
- `POST /api/lessons/batch`: Nạp hoặc đồng bộ nhiều bài học cùng lúc.
- `PUT /api/lessons/:date/progress`: Cập nhật tiến độ học của ngày (từ đã thuộc, bài tập đã làm).
- `DELETE /api/lessons/:date`: Xóa bài học theo ngày.

---

## 🎯 Các tính năng chính

1. **Import JSON hằng ngày:**
   - Kéo-thả file `.json` hoặc dán trực tiếp JSON vào giao diện.
   - Dữ liệu tự động lưu vào cơ sở dữ liệu Supabase thông qua backend API.
   - Hỗ trợ lưu trữ tạm thời trên LocalStorage giúp trải nghiệm liền mạch kể cả khi mất mạng.

2. **Học từ vựng (Active Recall Flashcards):**
   - Lật thẻ 3D mượt mà để kiểm tra trí nhớ.
   - Phát âm tự động hoặc bấm loa qua Web Speech API (giọng bản xứ, không cần API key).
   - Đánh dấu từ **[Đã thuộc]** hoặc **[Cần ôn lại]** - tự động đồng bộ lên Supabase.

3. **Thực hành 60 Bài tập (Chia Session khoa học):**
   - Chia 60 câu thành 3 phiên học: **Phiên 1 (1 - 20)**, **Phiên 2 (21 - 40)**, **Phiên 3 (41 - 60)**.
   - Lọc riêng danh sách **Câu làm sai** để ôn tập lại ngay lập tức.
   - Hỗ trợ câu hỏi Trắc nghiệm và Điền từ khuyết kèm giải thích chi tiết.
   - Hiệu ứng pháo hoa chúc mừng khi hoàn thành mục tiêu ngày.

4. **Lịch sử & Sao lưu:**
   - Xem lại bài học của các ngày trước đó bất cứ lúc nào.
   - Xuất (Export) toàn bộ dữ liệu ra file backup JSON.

---

## ⌨️ Phím tắt nhanh (Keyboard-first)

| Phím | Tác vụ |
| :--- | :--- |
| `Space` | Lật thẻ từ vựng (Hiện / Ẩn nghĩa) |
| `1` / `2` | Đánh dấu: `1` = Cần ôn lại, `2` = Đã thuộc |
| `←` / `→` | Chuyển sang từ hoặc câu hỏi trước / sau |
| `R` | Nghe lại phát âm từ vựng |
| `1`, `2`, `3`, `4` | Chọn nhanh đáp án trắc nghiệm |
| `Enter` | Nộp câu trả lời điền từ |

---

## 🤖 Prompt tạo JSON mỗi ngày với AI

Copy đoạn prompt sau gửi cho ChatGPT / Claude / Gemini:

```text
Hãy tạo cho tôi 20 từ vựng tiếng Anh theo chủ đề [Nhập chủ đề] kèm 60 bài tập (30 câu trắc nghiệm multiple_choice và 30 câu điền từ fill_in_blank). Trả về duy nhất một đối tượng JSON hợp lệ theo cấu trúc sau:
{
  "date": "YYYY-MM-DD",
  "topic": "Tên chủ đề",
  "vocabulary": [
    {
      "id": "v1",
      "word": "từ",
      "phonetic": "/phát âm/",
      "partOfSpeech": "v | n | adj | adv",
      "meaning": "nghĩa tiếng Việt",
      "example": "câu ví dụ tiếng Anh"
    }
  ],
  "exercises": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "Câu hỏi _______",
      "options": ["A", "B", "C", "D"],
      "answer": "đáp_án",
      "explanation": "giải thích"
    },
    {
      "id": 2,
      "type": "fill_in_blank",
      "question": "Câu hỏi điền từ _______ (gợi ý nghĩa)",
      "answer": "từ_cần_điền",
      "explanation": "giải thích"
    }
  ]
}
```
