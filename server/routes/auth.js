import { Router } from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

// Lấy token chuẩn được băm từ APP_PASSWORD
export function getExpectedToken() {
  const secret = process.env.APP_PASSWORD || 'english2026';
  return crypto.createHash('sha256').update(`daily_english_auth_${secret}`).digest('hex');
}

// Middleware xác thực cho các route cần bảo vệ
export function requireAuth(req, res, next) {
  const configuredPassword = process.env.APP_PASSWORD;
  
  // Nếu chưa đặt APP_PASSWORD trong .env thì cảnh báo và cho qua
  if (!configuredPassword) {
    return next();
  }

  const clientToken = req.headers['x-access-token'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!clientToken || clientToken !== getExpectedToken()) {
    return res.status(401).json({
      success: false,
      message: 'Yêu cầu đăng nhập. Mật khẩu không hợp lệ hoặc phiên làm việc đã hết hạn.',
    });
  }

  next();
}

/**
 * POST /api/auth/login
 * Đăng nhập bằng mật khẩu bảo vệ
 */
router.post('/login', (req, res) => {
  const { password } = req.body;
  const configuredPassword = process.env.APP_PASSWORD || 'english2026';

  if (!password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu.' });
  }

  if (password.trim() === configuredPassword.trim()) {
    const token = getExpectedToken();
    return res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      token,
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Mật khẩu không đúng. Vui lòng thử lại!',
  });
});

/**
 * GET /api/auth/verify
 * Kiểm tra xem token hiện tại của trình duyệt có còn hợp lệ không
 */
router.get('/verify', (req, res) => {
  const clientToken = req.headers['x-access-token'] || req.headers['authorization']?.replace('Bearer ', '');
  const configuredPassword = process.env.APP_PASSWORD;

  if (!configuredPassword) {
    return res.json({ success: true, authenticated: true });
  }

  if (clientToken && clientToken === getExpectedToken()) {
    return res.json({ success: true, authenticated: true });
  }

  return res.status(401).json({ success: false, authenticated: false, message: 'Chưa xác thực.' });
});

export default router;

