import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
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
      message: 'Chưa cấu hình SUPABASE_URL hoặc SUPABASE_KEY trong file .env trên server.',
    };
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('daily_lessons').select('date').limit(1);

    if (error) {
      if (
        error.code === '42501' ||
        error.message?.includes('Grant the required privileges') ||
        error.message?.includes('permission denied')
      ) {
        return {
          ok: false,
          message:
            'Chưa cấp quyền bảng cho service_role. Vui lòng mở SQL Editor và chạy lệnh trong file server/schema.sql.',
        };
      }

      if (
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        error.message?.includes('Could not find the table')
      ) {
        return {
          ok: false,
          message:
            'Kết nối thành công đến Supabase! Bảng "daily_lessons" chưa được tạo. Vui lòng mở Supabase Dashboard -> SQL Editor và chạy mã trong file server/schema.sql.',
        };
      }

      return {
        ok: false,
        message: `Lỗi Supabase: ${error.message}`,
      };
    }

    return {
      ok: true,
      message: `Kết nối thành công tới Supabase! (Tìm thấy ${data ? data.length : 0} bản ghi mẫu).`,
    };
  } catch (err) {
    return {
      ok: false,
      message: err.message || 'Không thể kết nối đến Supabase.',
    };
  }
}

