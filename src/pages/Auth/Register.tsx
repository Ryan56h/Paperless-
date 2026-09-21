import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { sendRegisterOtpApi } from '../../services/authApi';
import {
  validateEmail,
  validatePhone,
  validatePassword,
  validateOtp,
  validateStoreName,
  validateOwnerName,
} from '../../utils/validators';
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
    confirmPassword: '',
    address: '',
    taxCode: '',
  });

  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const startCountdown = () => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errorMessage) setErrorMessage(null);
  };

  // Handle Step 2 -> Request OTP -> Step 3
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const storeNameErr = validateStoreName(formData.name);
    if (storeNameErr) {
      setErrorMessage(storeNameErr);
      return;
    }

    const ownerErr = validateOwnerName(formData.ownerName);
    if (ownerErr) {
      setErrorMessage(ownerErr);
      return;
    }

    const phoneErr = validatePhone(formData.phone);
    if (phoneErr) {
      setErrorMessage(phoneErr);
      return;
    }

    const emailErr = validateEmail(formData.email);
    if (emailErr) {
      setErrorMessage(emailErr);
      return;
    }

    const passErr = validatePassword(formData.password);
    if (passErr) {
      setErrorMessage(passErr);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    const emailTrimmed = formData.email.trim();
    setIsSendingOtp(true);
    try {
      const res = await sendRegisterOtpApi(emailTrimmed, formData.ownerName.trim());
      setSuccessMessage(res.message || `Mã OTP đã được gửi đến email ${emailTrimmed}.`);
      setOtpCode('');
      startCountdown();
      setStep(3);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Không thể gửi mã OTP, vui lòng kiểm tra lại.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Resend OTP in Step 3
  const handleResendOtp = async () => {
    if (countdown > 0 || isSendingOtp) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    setIsSendingOtp(true);
    try {
      const res = await sendRegisterOtpApi(formData.email.trim(), formData.ownerName.trim());
      setSuccessMessage(res.message || 'Mã OTP mới đã được gửi tới email của bạn.');
      startCountdown();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Không thể gửi lại mã OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Final submit with OTP
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const otpErr = validateOtp(otpCode);
    if (otpErr) {
      setErrorMessage(otpErr);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await register({
        name: formData.name || (businessType === 'grocery' ? 'Cửa Hàng Tạp Hoá' : 'Quán Cafe'),
        type: businessType,
        ownerName: formData.ownerName || 'Chủ Cửa Hàng',
        phone: formData.phone || '0901 234 567',
        email: formData.email.trim() || 'business@paperless.vn',
        password: formData.password || '123456',
        address: formData.address || 'Hồ Chí Minh',
        taxCode: formData.taxCode || '0319888999',
        otpCode: otpCode.trim(),
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Đăng ký không thành công. Vui lòng kiểm tra lại mã OTP.');
        return;
      }

      if (businessType === 'cafe') {
        navigate('/app/cafe/order');
      } else {
        navigate('/app/grocery/order');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Đã có lỗi xảy ra trong quá trình kích hoạt tài khoản.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Đăng ký doanh nghiệp"
      subtitle={
        step === 1
          ? 'Bước 1: Chọn mô hình kinh doanh'
          : step === 2
            ? 'Bước 2: Thông tin cửa hàng'
            : 'Bước 3: Xác thực mã OTP qua Email'
      }
    >
      {/* Progress */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-border text-xs text-text-dim">
        <span className={step >= 1 ? 'font-bold text-text' : ''}>1. Mô hình</span>
        <span>—</span>
        <span className={step >= 2 ? 'font-bold text-text' : ''}>2. Thông tin</span>
        <span>—</span>
        <span className={step >= 3 ? 'font-bold text-text' : ''}>3. Xác thực OTP</span>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="mb-4 p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && step === 3 && (
        <div className="mb-4 p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

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
        <form onSubmit={handleRequestOtp} className="space-y-3">
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
            <label className="block text-xs font-medium text-text mb-1">Email đăng nhập & nhận mã OTP *</label>
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

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-text mb-1">Mật khẩu *</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                maxLength={50}
                placeholder="Tối thiểu 6 ký tự"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded bg-surface-2 border border-border text-text text-xs focus:outline-none focus:border-text"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text mb-1">Xác nhận mật khẩu *</label>
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={6}
                maxLength={50}
                placeholder="Nhập lại mật khẩu"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded bg-surface-2 border border-border text-text text-xs focus:outline-none focus:border-text"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              disabled={isSendingOtp}
              onClick={() => {
                setErrorMessage(null);
                setStep(1);
              }}
              className="w-1/3 py-2.5 rounded text-xs bg-surface-2 border border-border text-text hover:bg-border/60 cursor-pointer disabled:opacity-50"
            >
              Quay lại
            </button>
            <button
              type="submit"
              disabled={isSendingOtp}
              className="w-2/3 py-2.5 rounded text-xs font-bold bg-text text-bg hover:opacity-90 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSendingOtp ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-bg/30 border-t-bg animate-spin" />
                  <span>Đang gửi mã OTP...</span>
                </>
              ) : (
                'Gửi mã OTP xác thực'
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: OTP Verification & Finalize */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 rounded bg-surface-2 border border-border space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-text-dim">Cửa hàng:</span>
              <span className="font-semibold text-text">{formData.name || 'Cửa hàng mới'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Email nhận OTP:</span>
              <span className="font-semibold text-text">{formData.email}</span>
            </div>
          </div>

         

          <div>
            <label className="block text-xs font-medium text-text mb-1">Mã xác thực OTP (6 chữ số) *</label>
            <input
              type="text"
              maxLength={6}
              required
              autoFocus
              disabled={isSubmitting}
              placeholder="••••••"
              value={otpCode}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-2.5 text-center tracking-[0.5em] font-mono text-lg font-bold rounded bg-surface-2 border border-border text-text focus:outline-none focus:border-text disabled:opacity-50"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setErrorMessage(null);
                setSuccessMessage(null);
                setOtpCode('');
                setStep(2);
              }}
              className="w-1/3 py-2.5 rounded text-xs bg-surface-2 border border-border text-text hover:bg-border/60 cursor-pointer disabled:opacity-50"
            >
              Đổi thông tin
            </button>
            <button
              type="submit"
              disabled={isSubmitting || otpCode.length !== 6}
              className="w-2/3 py-2.5 rounded text-xs font-bold bg-text text-bg hover:opacity-90 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-bg/30 border-t-bg animate-spin" />
                  <span>Đang kích hoạt...</span>
                </>
              ) : (
                'Xác nhận & Vào bán hàng'
              )}
            </button>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              disabled={isSendingOtp || countdown > 0}
              onClick={handleResendOtp}
              className="text-xs text-text font-semibold hover:underline disabled:opacity-50 disabled:no-underline"
            >
              {countdown > 0 ? `Gửi lại mã OTP (${countdown}s)` : 'Gửi lại mã OTP qua email'}
            </button>
          </div>
        </form>
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
