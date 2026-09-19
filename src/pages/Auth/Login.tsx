import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import type { BusinessType } from '../../types';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('grocery');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, businessType);
    if (businessType === 'cafe') {
      navigate('/app/cafe/order');
    } else {
      navigate('/app/grocery/order');
    }
  };

  const handleQuickDemo = (type: BusinessType) => {
    login(type === 'cafe' ? 'moclan.coffee@gmail.com' : 'minhphat.mart@gmail.com', type);
    if (type === 'cafe') {
      navigate('/app/cafe/order');
    } else {
      navigate('/app/grocery/order');
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

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-3.5">
        <div>
          <label className="block text-xs font-medium text-text mb-1">
            Loại hình cửa hàng
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setBusinessType('grocery')}
              className={`py-1.5 px-3 rounded text-xs font-medium border text-center cursor-pointer transition-colors ${
                businessType === 'grocery'
                  ? 'bg-text text-bg border-text font-semibold'
                  : 'bg-surface-2 border-border text-text-muted hover:text-text'
              }`}
            >
              Tạp hoá
            </button>

            <button
              type="button"
              onClick={() => setBusinessType('cafe')}
              className={`py-1.5 px-3 rounded text-xs font-medium border text-center cursor-pointer transition-colors ${
                businessType === 'cafe'
                  ? 'bg-text text-bg border-text font-semibold'
                  : 'bg-surface-2 border-border text-text-muted hover:text-text'
              }`}
            >
              Quán Cafe
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-text mb-1">
            Email tài khoản
          </label>
          <input
            type="email"
            required
            placeholder="cuahang@paperless.vn"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded bg-surface-2 border border-border text-text text-xs focus:outline-none focus:border-text"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text mb-1">Mật khẩu</label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded bg-surface-2 border border-border text-text text-xs focus:outline-none focus:border-text"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded font-bold bg-text text-bg hover:opacity-90 transition-opacity cursor-pointer text-xs"
        >
          Đăng nhập
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
