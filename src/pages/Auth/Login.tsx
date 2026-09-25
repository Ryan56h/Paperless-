import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePassword } from '../../utils/validators';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoggedIn, business, user, logout } = useAuth();

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
      title="ĐĂNG NHẬP HỆ THỐNG"
      subtitle="Đăng nhập để vào hệ thống quản lý bán hàng PaperLess POS"
    >
      {/* Thông báo nếu đã có phiên đăng nhập */}
      {isLoggedIn && (
        <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
          <p className="text-emerald-950 font-bold uppercase tracking-wider mb-1">
            Đang đăng nhập: {business?.name || user?.fullName || 'Chủ cửa hàng'}
          </p>
          <p className="text-slate-600 text-[11px] mb-3">
            Bạn đang có phiên hoạt động. Bạn có thể vào thẳng màn hình bán hàng hoặc đăng nhập tài khoản khác.
          </p>
          <div className="flex gap-2">
            <Link
              to={business?.type === 'cafe' ? '/app/cafe/order' : '/app/grocery/order'}
              className="flex-1 py-2 text-center rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs"
            >
              Vào POS ngay
            </Link>
            <button
              type="button"
              onClick={logout}
              className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
          {errorMessage}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Email tài khoản
          </label>
          <input
            type="email"
            required
            disabled={isSubmitting}
            placeholder="cuahang@paperless.vn"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Mật khẩu
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              disabled={isSubmitting}
              placeholder="Nhập mật khẩu..."
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full pl-4 pr-16 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white disabled:opacity-50"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 text-[11px] font-bold uppercase cursor-pointer"
            >
              {showPassword ? 'Ẩn' : 'Hiện'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 hover:text-slate-900">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-0 cursor-pointer w-4 h-4"
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>
          <Link to="/forgot-password" className="text-emerald-700 hover:underline font-semibold text-[11px]">
            Quên mật khẩu?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl font-black uppercase tracking-wider bg-amber-400 hover:bg-amber-500 text-slate-950 transition-colors cursor-pointer text-xs disabled:opacity-60 shadow-sm"
        >
          {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập vào hệ thống'}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
        Chưa có tài khoản cửa hàng?{' '}
        <Link to="/register" className="text-emerald-700 font-bold uppercase tracking-wider hover:underline">
          Đăng ký ngay
        </Link>
      </div>
    </AuthLayout>
  );
}
