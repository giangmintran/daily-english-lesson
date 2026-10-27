/**
 * In-memory sliding-window rate limiter for Express
 * Prevents brute-force attacks and abuse.
 */

class MemoryRateLimiter {
  constructor({ windowMs = 15 * 60 * 1000, max = 5, message = 'Too many requests' }) {
    this.windowMs = windowMs;
    this.max = max;
    this.message = message;
    this.hits = new Map();

    // Clean up expired entries every 5 minutes to avoid memory leaks
    setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.hits.entries()) {
        if (now > record.resetTime) {
          this.hits.delete(key);
        }
      }
    }, 5 * 60 * 1000).unref();
  }

  getClientKey(req) {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || 'unknown';
    return ip;
  }

  middleware() {
    return (req, res, next) => {
      const key = this.getClientKey(req);
      const now = Date.now();
      let record = this.hits.get(key);

      if (!record || now > record.resetTime) {
        record = { count: 1, resetTime: now + this.windowMs };
        this.hits.set(key, record);
        return next();
      }

      if (record.count >= this.max) {
        const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
        res.setHeader('Retry-After', retryAfterSeconds);
        return res.status(429).json({
          success: false,
          message: this.message,
          retryAfter: retryAfterSeconds,
        });
      }

      record.count += 1;
      next();
    };
  }

  reset(req) {
    const key = this.getClientKey(req);
    this.hits.delete(key);
  }
}

// 5 failed login attempts per 15 minutes per IP
export const loginRateLimiter = new MemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.',
});

// General API rate limiter: max 120 requests per minute per IP
export const generalApiLimiter = new MemoryRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Quá nhiều yêu cầu gửi tới máy chủ. Vui lòng thử lại sau ít phút.',
});

