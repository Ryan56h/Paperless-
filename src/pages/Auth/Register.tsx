import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import type { BusinessType } from '../../types';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [businessType, setBusinessType] = useState<BusinessType>('grocery');
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    phone: '',
    email: '',
    password: '',
    address: '',
    taxCode: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await register({
      name: formData.name || (businessType === 'grocery' ? 'Cửa Hàng Tạp Hoá' : 'Quán Cafe'),
      type: businessType,
      ownerName: formData.ownerName || 'Chủ Cửa Hàng',
      phone: formData.phone || '0901 234 567',
      email: formData.email || 'business@paperless.vn',
      password: formData.password || '123456',
      address: formData.address || 'Hồ Chí Minh',
      taxCode: formData.taxCode || '0319888999',
    });

    if (businessType === 'cafe') {
      navigate('/app/cafe/order');
    } else {
      navigate('/app/grocery/order');
    }
  };

  return (
    <AuthLayout
      title="Đăng ký doanh nghiệp"
      subtitle={
        step === 1
          ? 'Bước 1: Chọn loại hình kinh doanh'
          : step === 2
            ? 'Bước 2: Thông tin cửa hàng'
            : 'Bước 3: Xác nhận'
      }
    >
      {/* Progress */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-border text-xs text-text-dim">
        <span className={step >= 1 ? 'font-bold text-text' : ''}>1. Loại hình</span>
        <span>—</span>
        <span className={step >= 2 ? 'font-bold text-text' : ''}>2. Thông tin</span>
        <span>—</span>
        <span className={step >= 3 ? 'font-bold text-text' : ''}>3. Kích hoạt</span>
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="space-y-3">
          <div
            onClick={() => setBusinessType('grocery')}
            className={`p-3.5 rounded border transition-colors cursor-pointer ${businessType === 'grocery'
                ? 'border-text bg-surface-2'
                : 'border-border bg-surface hover:border-text-dim'
              }`}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-text">Cửa hàng tạp hoá & tiện lợi</h4>
              {businessType === 'grocery' && (
                <span className="text-[11px] font-semibold text-text">Đã chọn</span>
              )}
            </div>
            <p className="text-[11px] text-text-muted mt-1">
              Bán hàng trực tiếp tại quầy, tính tiền nhanh và xuất hoá đơn điện tử.
            </p>
          </div>

          <div
            onClick={() => setBusinessType('cafe')}
            className={`p-3.5 rounded border transition-colors cursor-pointer ${businessType === 'cafe'
                ? 'border-text bg-surface-2'
                : 'border-border bg-surface hover:border-text-dim'
              }`}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-text">Quán cafe & đồ uống</h4>
              {businessType === 'cafe' && (
                <span className="text-[11px] font-semibold text-text">Đã chọn</span>
              )}
            </div>
            <p className="text-[11px] text-text-muted mt-1">
              Quản lý sơ đồ bàn, ghi chú pha chế và chuyển đơn tới màn hình bếp.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full mt-4 py-2.5 rounded font-bold bg-text text-bg hover:opacity-90 cursor-pointer text-xs"
          >
            Tiếp tục
          </button>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <form
          onSubmit={e => {
            e.preventDefault();
            setStep(3);
          }}
          className="space-y-3"
        >
          <div>
            <label className="block text-xs font-medium text-text mb-1">
              Tên cửa hàng *
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder={businessType === 'grocery' ? 'Tạp Hoá Tuấn Linh' : 'Cafe Góc Phố'}
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded bg-surface-2 border border-border text-text text-xs focus:outline-none focus:border-text"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-text mb-1">Họ tên chủ quán *</label>
              <input
                type="text"
                name="ownerName"
                required
                placeholder="Nguyễn Văn A"
                value={formData.ownerName}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded bg-surface-2 border border-border text-text text-xs focus:outline-none focus:border-text"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text mb-1">Số điện thoại *</label>
              <input
                type="tel"
                name="phone"
                required
                placeholder="0912345678"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded bg-surface-2 border border-border text-text text-xs focus:outline-none focus:border-text"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text mb-1">Email đăng nhập *</label>
            <input
              type="email"
              name="email"
              required
              placeholder="cuahang@paperless.vn"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded bg-surface-2 border border-border text-text text-xs focus:outline-none focus:border-text"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text mb-1">Mật khẩu *</label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded bg-surface-2 border border-border text-text text-xs focus:outline-none focus:border-text"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-1/3 py-2 rounded text-xs bg-surface-2 border border-border text-text hover:bg-border/60 cursor-pointer"
            >
              Quay lại
            </button>
            <button
              type="submit"
              className="w-2/3 py-2 rounded text-xs font-bold bg-text text-bg hover:opacity-90 cursor-pointer"
            >
              Tiếp tục
            </button>
          </div>
        </form>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="space-y-3">
          <div className="p-3 rounded bg-surface-2 border border-border space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-text-dim">Loại hình:</span>
              <span className="font-semibold text-text">
                {businessType === 'grocery' ? 'Tạp hoá' : 'Quán Cafe'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Tên cửa hàng:</span>
              <span className="font-semibold text-text">{formData.name || 'Cửa hàng mới'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Chủ sở hữu:</span>
              <span className="text-text">{formData.ownerName || 'Quản lý'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Email:</span>
              <span className="text-text">{formData.email || 'cuahang@paperless.vn'}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-1/3 py-2.5 rounded text-xs bg-surface-2 border border-border text-text hover:bg-border/60 cursor-pointer"
            >
              Sửa
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="w-2/3 py-2.5 rounded text-xs font-bold bg-text text-bg hover:opacity-90 cursor-pointer"
            >
              Vào bán hàng
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 pt-3 border-t border-border text-center text-xs text-text-muted">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-text font-semibold underline">
          Đăng nhập
        </Link>
      </div>
    </AuthLayout>
  );
}
