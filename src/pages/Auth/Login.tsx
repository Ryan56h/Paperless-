import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePassword } from '../../utils/validators';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState(() => {
    return localStorage.getItem('paperless_remember_email') || '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return !!localStorage.getItem('paperless_remember_email');
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const emailErr = validateEmail(email);
    if (emailErr) {
      setErrorMessage(emailErr);
      return;
    }

    const passErr = validatePassword(password);
    if (passErr) {
      setErrorMessage(passErr);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        if (rememberMe) {
          localStorage.setItem('paperless_remember_email', email.trim());
        } else {
          localStorage.removeItem('paperless_remember_email');
        }

        if (result.businessType === 'cafe') {
          navigate('/app/cafe/order');
        } else {
          navigate('/app/grocery/order');
        }
      } else {
        setErrorMessage(result.error || 'Tài khoản hoặc mật khẩu không chính xác.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Đăng nhập"
      subtitle="Đăng nhập để vào hệ thống quản lý bán hàng"
    >


      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-3.5">
        

        <div>
          <label className="block text-xs font-medium text-text mb-1">
            Email tài khoản
          </label>
          <input
            type="email"
            required
            disabled={isSubmitting}
            placeholder="cuahang@paperless.vn"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded bg-surface-2 border border-border text-text text-xs focus:outline-none focus:border-text disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text mb-1">Mật khẩu</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              disabled={isSubmitting}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full pl-3 pr-9 py-2 rounded bg-surface-2 border border-border text-text text-xs focus:outline-none focus:border-text disabled:opacity-50"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text cursor-pointer p-0.5"
              title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none text-text-muted hover:text-text">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="rounded border-border bg-surface-2 text-text focus:ring-0 focus:outline-none accent-text cursor-pointer w-3.5 h-3.5"
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>
          <Link to="/forgot-password" className="text-text-muted hover:text-text hover:underline text-[11px]">
            Quên mật khẩu?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 rounded font-bold bg-text text-bg hover:opacity-90 transition-opacity cursor-pointer text-xs disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-3.5 h-3.5 rounded-full border-2 border-bg/30 border-t-bg animate-spin" />
              <span>Đang đăng nhập...</span>
            </>
          ) : (
            'Đăng nhập'
          )}
        </button>
      </form>

      <div className="mt-5 pt-3 border-t border-border text-center text-xs text-text-muted">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-text font-semibold underline">
          Đăng ký
        </Link>
      </div>
    </AuthLayout>
  );
}
