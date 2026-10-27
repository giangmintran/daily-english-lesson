import app from './app.js';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { isSupabaseConfigured } from './supabase.js';

const PORT = process.env.PORT || 5000;

// Phục vụ frontend tĩnh khi chạy production độc lập bằng Node
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

app.use(express.static(distPath));

// Fallback to index.html for SPA client-side routing
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      next();
    }
  });
});

app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Node.js Server running at: http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📚 Lessons API:  http://localhost:${PORT}/api/lessons`);

  if (!isSupabaseConfigured()) {
    console.warn(`⚠️  [Cảnh báo] Supabase CHƯA được cấu hình trong file .env!`);
    console.warn(`   Vui lòng điền SUPABASE_URL và SUPABASE_SECRET_KEY vào file .env.`);
  } else {
    console.log(`✅ Supabase đã được cấu hình trong .env.`);
  }
  console.log(`==================================================\n`);
});

