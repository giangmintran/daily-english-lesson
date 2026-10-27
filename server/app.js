import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import lessonsRouter from './routes/lessons.js';
import authRouter, { requireAuth } from './routes/auth.js';
import { checkSupabaseConnection, isSupabaseConfigured } from './supabase.js';
import { generalApiLimiter } from './utils/rateLimiter.js';

dotenv.config();

const app = express();

// Security headers middleware
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Restrictive CORS configuration (F-07)
// Nguồn gốc được phép (origins) được cấu hình tập trung qua biến môi trường ALLOWED_ORIGINS
const envAllowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  'https://dailyenglishlesson.vercel.app,http://localhost:5173,http://localhost:5050,http://127.0.0.1:5173,http://127.0.0.1:5050'
)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

if (process.env.APP_URL) {
  envAllowedOrigins.push(process.env.APP_URL.trim());
}

const allowedOriginsSet = new Set(envAllowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server, mobile, or requests without Origin header
    if (!origin || allowedOriginsSet.has(origin)) {
      return callback(null, true);
    }
    // Allow any localhost / 127.0.0.1 development origin
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    // Allow vercel preview deployments for the project
    if (origin.endsWith('.vercel.app') && origin.includes('dailyenglishlesson')) {
      return callback(null, true);
    }
    return callback(new Error('Chính sách CORS không cho phép truy cập từ nguồn gốc này.'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token'],
  credentials: true,
  maxAge: 86400,
};

app.use(cors(corsOptions));

// JSON body size limit set to 1MB (F-08)
app.use(express.json({ limit: '1mb' }));

// Health endpoint returning minimal sanitized status (F-06)
const healthHandler = async (_req, res) => {
  try {
    const isConfigured = isSupabaseConfigured();
    let isConnected = false;

    if (isConfigured) {
      const supabaseStatus = await checkSupabaseConnection();
      isConnected = Boolean(supabaseStatus.ok);
    }

    res.json({
      status: isConnected ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      database: isConnected ? 'connected' : 'disconnected',
    });
  } catch (err) {
    console.error('[Health] Health check error:', err);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    });
  }
};

const apiRouter = express.Router();

// General rate limiter for all API routes (F-04)
apiRouter.use(generalApiLimiter.middleware());

apiRouter.get('/health', healthHandler);
apiRouter.use('/auth', authRouter);
apiRouter.use('/lessons', requireAuth, lessonsRouter);

// Support both local/proxy (/api/...) and Vercel serverless (direct mount)
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Global error handler (prevents leaking stack traces in responses)
app.use((err, _req, res, _next) => {
  if (err.message?.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  console.error('[App] Uncaught error:', err);
  return res.status(500).json({
    success: false,
    message: 'Đã xảy ra lỗi máy chủ nội bộ.',
  });
});

export default app;
