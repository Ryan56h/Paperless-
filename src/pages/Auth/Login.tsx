import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePassword } from '../../utils/validators';
import type { BusinessType } from '../../types';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('grocery');
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
      const result = await login(email.trim(), password, businessType);
      if (result.success) {
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

  const handleQuickDemo = async (type: BusinessType) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const demoEmail = type === 'cafe' ? 'moclan.coffee@gmail.com' : 'minhphat.mart@gmail.com';
      const result = await login(demoEmail, '123456', type);
      if (result.success) {
        if (result.businessType === 'cafe') {
          navigate('/app/cafe/order');
        } else {
          navigate('/app/grocery/order');
        }
      } else {
        setErrorMessage(result.error || 'Không thể đăng nhập tài khoản dùng thử.');
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
      {/* Quick Demo */}
      <div className="mb-5 p-3 rounded bg-surface-2 border border-border">
        <p className="text-[11px] font-semibold text-text-dim uppercase tracking-wider mb-2">
          Dùng thử nhanh
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickDemo('grocery')}
            className="p-2 rounded bg-surface border border-border text-xs font-medium text-text hover:bg-border/40 cursor-pointer text-left transition-colors"
          >
            <span className="block font-semibold">Tạp Hoá</span>
            <span className="text-[10px] text-text-dim">Minh Phát</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo('cafe')}
            className="p-2 rounded bg-surface border border-border text-xs font-medium text-text hover:bg-border/40 cursor-pointer text-left transition-colors"
          >
            <span className="block font-semibold">Quán Cafe</span>
            <span className="text-[10px] text-text-dim">Mộc Lan</span>
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center mb-5">
        <div className="border-t border-border w-full" />
        <span className="bg-surface px-2 text-[10px] text-text-dim uppercase tracking-wider absolute">
          Hoặc
        </span>
      </div>

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
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-text">Mật khẩu</label>
            <Link to="/forgot-password" className="text-[11px] text-text-muted hover:text-text hover:underline">
              Quên mật khẩu?
            </Link>
          </div>
          <input
            type="password"
            required
            disabled={isSubmitting}
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded bg-surface-2 border border-border text-text text-xs focus:outline-none focus:border-text disabled:opacity-50"
          />
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
