import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  '';

let clientInstance = null;

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl.trim() && supabaseKey.trim());
}

export function getSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase chưa được cấu hình. Vui lòng thêm SUPABASE_URL và SUPABASE_SECRET_KEY vào file .env.');
  }

  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl.trim(), supabaseKey.trim(), {
      auth: {
        persistSession: false,
      },
    });
  }

  return clientInstance;
}

export async function checkSupabaseConnection() {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message: 'Chưa cấu hình SUPABASE_URL hoặc SUPABASE_SECRET_KEY trong file .env trên server.',
    };
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('daily_lessons').select('date').limit(1);

    if (error) {
      console.error('[Supabase Diagnostics]', error.message);
      return {
        ok: false,
        message: error.message,
      };
    }

    return {
      ok: true,
      message: `Kết nối thành công tới Supabase! (Tìm thấy ${data ? data.length : 0} bản ghi mẫu).`,
    };
  } catch (err) {
    console.error('[Supabase Diagnostics]', err.message);
    return {
      ok: false,
      message: err.message || 'Không thể kết nối đến Supabase.',
    };
  }
}
