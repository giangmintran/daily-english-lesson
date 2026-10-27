import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { loginApi } from '../services/api';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage('Vui lòng nhập mật khẩu truy cập.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await loginApi(password);
      if (res.success) {
        onLoginSuccess();
      } else {
        setErrorMessage(res.message || 'Mật khẩu không chính xác.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center items-center px-4 py-12 transition-colors">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo & Header */}
        <div className="text-center mb-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 mx-auto flex items-center justify-center font-bold text-lg shadow-md">
            En
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Daily English Study
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Ứng dụng cá nhân. Vui lòng nhập mật khẩu để tiếp tục.
            </p>
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl shadow-zinc-200/50 dark:shadow-none space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Mật khẩu truy cập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  autoFocus
                  placeholder="Nhập mật khẩu của bạn..."
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 animate-shake">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 font-medium text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <span>{loading ? 'Đang kiểm tra...' : 'Mở khóa ứng dụng'}</span>
              {!loading && <ArrowRight size={14} />}
            </button>
          </form>

          {/* Privacy Note */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
            <ShieldCheck size={13} className="text-emerald-500" />
            <span>Mật khẩu được lưu tự động trên trình duyệt này</span>
          </div>
        </div>
      </div>
    </div>
  );
};

