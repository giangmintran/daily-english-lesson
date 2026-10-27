import { Router } from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { loginRateLimiter } from '../utils/rateLimiter.js';

dotenv.config();

const router = Router();

// Token duration: 7 days
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Generates a signed, expiring session token using HMAC-SHA256.
 * Payload includes expiration timestamp and random nonce (jti).
 */
export function generateSignedToken(secret) {
  const now = Date.now();
  const payload = {
    iat: now,
    exp: now + TOKEN_TTL_MS,
    jti: crypto.randomBytes(8).toString('hex'),
  };

  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadEncoded)
    .digest('base64url');

  return `${payloadEncoded}.${signature}`;
}

/**
 * Validates a signed session token.
 * Performs constant-time HMAC signature verification and checks expiration.
 */
export function verifySignedToken(token, secret) {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'missing_token' };
  }

  const parts = token.trim().split('.');
  if (parts.length !== 2) {
    return { valid: false, reason: 'malformed_token' };
  }

  const [payloadEncoded, receivedSignature] = parts;

  // Re-compute expected signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payloadEncoded)
    .digest('base64url');

  // Constant-time comparison to prevent timing attacks
  const recBuffer = Buffer.from(receivedSignature);
  const expBuffer = Buffer.from(expectedSignature);

  if (recBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(recBuffer, expBuffer)) {
    return { valid: false, reason: 'invalid_signature' };
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadEncoded, 'base64url').toString('utf8'));
    if (!payload.exp || typeof payload.exp !== 'number') {
      return { valid: false, reason: 'invalid_payload' };
    }

    if (Date.now() > payload.exp) {
      return { valid: false, reason: 'expired' };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, reason: 'invalid_payload' };
  }
}

/**
 * Constant-time comparison of candidate password against configured password.
 */
function isPasswordValid(candidate, configured) {
  if (typeof candidate !== 'string' || typeof configured !== 'string') {
    return false;
  }
  const candHash = crypto.createHash('sha256').update(candidate.trim()).digest();
  const confHash = crypto.createHash('sha256').update(configured.trim()).digest();
  return crypto.timingSafeEqual(candHash, confHash);
}

/**
 * Authentication middleware for protected API endpoints.
 * FAILS CLOSED if APP_PASSWORD is not configured.
 */
export function requireAuth(req, res, next) {
  const configuredPassword = process.env.APP_PASSWORD;

  // Fail closed if server has not configured authentication
  if (!configuredPassword || !configuredPassword.trim()) {
    console.error('[Security] Access denied: APP_PASSWORD is not configured in server environment.');
    return res.status(503).json({
      success: false,
      message: 'Hệ thống bảo mật máy chủ chưa được cấu hình. Vui lòng thiết lập biến môi trường APP_PASSWORD.',
    });
  }

  const authHeader = req.headers['authorization'];
  const clientToken =
    req.headers['x-access-token'] ||
    (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : null);

  const verification = verifySignedToken(clientToken, configuredPassword.trim());

  if (!verification.valid) {
    const message =
      verification.reason === 'expired'
        ? 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.'
        : 'Yêu cầu đăng nhập. Phiên làm việc không hợp lệ.';

    return res.status(401).json({
      success: false,
      message,
    });
  }

  next();
}

/**
 * POST /api/auth/login
 * Login with application password.
 * Protected with rate limiting to prevent brute-force attacks.
 */
router.post('/login', loginRateLimiter.middleware(), (req, res) => {
  const { password } = req.body || {};
  const configuredPassword = process.env.APP_PASSWORD;

  // Fail closed if server has not configured authentication
  if (!configuredPassword || !configuredPassword.trim()) {
    console.error('[Security] Login denied: APP_PASSWORD is not configured.');
    return res.status(503).json({
      success: false,
      message: 'Hệ thống xác thực máy chủ chưa được cấu hình. Vui lòng thiết lập biến môi trường APP_PASSWORD.',
    });
  }

  if (!password || typeof password !== 'string' || !password.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng nhập mật khẩu.',
    });
  }

  if (isPasswordValid(password, configuredPassword)) {
    // Reset rate limiter hits on successful login
    loginRateLimiter.reset(req);

    const token = generateSignedToken(configuredPassword.trim());
    return res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      token,
      expiresIn: TOKEN_TTL_MS,
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Mật khẩu không đúng. Vui lòng thử lại!',
  });
});

/**
 * GET /api/auth/verify
 * Checks if current token is valid and unexpired.
 */
router.get('/verify', (req, res) => {
  const configuredPassword = process.env.APP_PASSWORD;

  if (!configuredPassword || !configuredPassword.trim()) {
    return res.status(401).json({
      success: false,
      authenticated: false,
      message: 'Hệ thống xác thực chưa được cấu hình.',
    });
  }

  const authHeader = req.headers['authorization'];
  const clientToken =
    req.headers['x-access-token'] ||
    (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : null);

  const verification = verifySignedToken(clientToken, configuredPassword.trim());

  if (verification.valid) {
    return res.json({ success: true, authenticated: true });
  }

  return res.status(401).json({
    success: false,
    authenticated: false,
    message: verification.reason === 'expired' ? 'Phiên đã hết hạn.' : 'Chưa xác thực.',
  });
});

/**
 * POST /api/auth/logout
 * Acknowledges user logout
 */
router.post('/logout', (_req, res) => {
  return res.json({
    success: true,
    message: 'Đăng xuất thành công.',
  });
});

export default router;
