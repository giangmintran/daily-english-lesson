import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import lessonsRouter from './routes/lessons.js';
import authRouter, { requireAuth } from './routes/auth.js';
import { checkSupabaseConnection, isSupabaseConfigured } from './supabase.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const healthHandler = async (_req, res) => {
  const supabaseStatus = await checkSupabaseConnection();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    supabase: {
      configured: isSupabaseConfigured(),
      connected: supabaseStatus.ok,
      message: supabaseStatus.message,
    },
  });
};

const apiRouter = express.Router();
apiRouter.get('/health', healthHandler);
apiRouter.use('/auth', authRouter);
apiRouter.use('/lessons', requireAuth, lessonsRouter);

// Hỗ trợ cả 2 trường hợp: /api/... (Local & Vite Proxy) và /... (Vercel Serverless)
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;

