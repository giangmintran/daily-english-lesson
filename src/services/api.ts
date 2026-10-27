import { DailyLesson } from '../types/lesson';

const API_BASE = '/api';
const TOKEN_KEY = 'daily_english_auth_token_v1';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

function getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = { ...customHeaders };
  if (token) {
    headers['x-access-token'] = token;
  }
  return headers;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  supabase: {
    configured: boolean;
    connected: boolean;
    message: string;
  };
}

/**
 * Đăng nhập bằng mật khẩu
 */
export async function loginApi(password: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success && data.token) {
      setAuthToken(data.token);
      return { success: true };
    }

    return {
      success: false,
      message: data.message || 'Mật khẩu không chính xác.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Không thể kết nối đến máy chủ.',
    };
  }
}

/**
 * Kiểm tra xem phiên làm việc hiện tại còn hiệu lực không
 */
export async function verifyAuthApi(): Promise<boolean> {
  const token = getAuthToken();
  if (!token) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/verify`, {
      headers: getHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Kiểm tra trạng thái kết nối backend và supabase
 */
export async function getBackendHealth(): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Lấy tất cả bài học từ backend (Supabase)
 */
export async function fetchLessonsFromApi(): Promise<DailyLesson[] | null> {
  try {
    const res = await fetch(`${API_BASE}/lessons`, {
      headers: getHeaders(),
    });

    if (res.status === 401) {
      clearAuthToken();
      window.dispatchEvent(new Event('auth_unauthorized'));
      return null;
    }

    if (!res.ok) {
      console.warn(`[API] fetchLessons failed with status ${res.status}`);
      return null;
    }
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      return data.data;
    }
    return null;
  } catch (err) {
    console.warn('[API] Could not connect to backend server:', err);
    return null;
  }
}

/**
 * Lấy bài học theo ngày từ backend
 */
export async function fetchLessonByDateFromApi(date: string): Promise<DailyLesson | null> {
  try {
    const res = await fetch(`${API_BASE}/lessons/${date}`, {
      headers: getHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (err) {
    console.warn(`[API] Failed to fetch lesson for date ${date}:`, err);
    return null;
  }
}

/**
 * Lưu hoặc cập nhật bài học lên backend (Supabase)
 */
export async function saveLessonToApi(lesson: DailyLesson): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/lessons`, {
      method: 'POST',
      headers: getHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({ lesson }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.message || `Lỗi server (${res.status})`,
      };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Không thể kết nối đến server backend.',
    };
  }
}

/**
 * Cập nhật tiến độ học của ngày lên backend (Supabase)
 */
export async function updateProgressToApi(
  date: string,
  progress: DailyLesson['progress']
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/lessons/${date}/progress`, {
      method: 'PUT',
      headers: getHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({ progress }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.message || `Lỗi cập nhật tiến độ (${res.status})`,
      };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Không thể kết nối đến server backend.',
    };
  }
}

/**
 * Xóa một bài học trên backend (Supabase)
 */
export async function deleteLessonFromApi(date: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/lessons/${date}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.message || `Lỗi xóa bài học (${res.status})`,
      };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Không thể kết nối đến server backend.',
    };
  }
}
