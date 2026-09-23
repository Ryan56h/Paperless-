import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import { forgotPasswordApi, verifyResetCodeApi, resetPasswordApi } from '../../services/authApi';
import { validateEmail, validateOtp, validatePassword } from '../../utils/validators';

type Step = 'REQUEST' | 'VERIFY' | 'RESET' | 'SUCCESS';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('REQUEST');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Countdown timer for resend
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

  // Step 1: Request Reset Code
  const handleRequestCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (countdown > 0 && step === 'VERIFY') return;

    setErrorMessage(null);
    setSuccessMessage(null);

    const emailErr = validateEmail(email);
    if (emailErr) {
      setErrorMessage(emailErr);
      return;
    }

    const trimmedInput = email.trim();
    setIsSubmitting(true);
    try {
      const res = await forgotPasswordApi(trimmedInput);
      setSuccessMessage(res.message || 'Mã xác thực OTP đã được gửi đến email của bạn.');
      setCode('');
      startCountdown();
      setStep('VERIFY');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify Code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const otpErr = validateOtp(code);
    if (otpErr) {
      setErrorMessage(otpErr);
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyResetCodeApi(email.trim(), code.trim());
      setSuccessMessage('Xác thực mã thành công! Hãy nhập mật khẩu mới.');
      setStep('RESET');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Mã xác nhận không đúng hoặc đã hết hạn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const passErr = validatePassword(newPassword, 'Mật khẩu mới');
    if (passErr) {
      setErrorMessage(passErr);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPasswordApi(email.trim(), code.trim(), newPassword);
      setStep('SUCCESS');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (step) {
      case 'REQUEST':
        return 'Quên mật khẩu';
      case 'VERIFY':
        return 'Nhập mã xác nhận';
      case 'RESET':
        return 'Tạo mật khẩu mới';
      case 'SUCCESS':
        return 'Thành công!';
    }
  };

  const getSubtitle = () => {
    switch (step) {
      case 'REQUEST':
        return 'Nhập địa chỉ email đã đăng ký để nhận mã xác thực OTP.';
      case 'VERIFY':
        return `Mã 6 chữ số đã được gửi tới email ${email}.`;
      case 'RESET':
        return 'Vui lòng thiết lập mật khẩu mới an toàn cho tài khoản.';
      case 'SUCCESS':
        return 'Mật khẩu của bạn đã được cập nhật thành công.';
    }
  };

  return (
    <AuthLayout title={getTitle()} subtitle={getSubtitle()}>
      {/* Notifications */}
      {errorMessage && (
        <div className="mb-4 p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && step !== 'SUCCESS' && (
        <div className="mb-4 p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {/* STEP 1: Request Code */}
      {step === 'REQUEST' && (
        <form onSubmit={handleRequestCode} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text mb-1">Địa chỉ Email *</label>
            <input
              type="email"
              required
              disabled={isSubmitting}
              placeholder="cuahang@gmail.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
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
                <span>Đang gửi mã...</span>
              </>
            ) : (
              'Gửi mã xác nhận'
            )}
          </button>

          <div className="pt-2 text-center text-xs text-text-muted">
            Nhớ mật khẩu rồi?{' '}
            <Link to="/login" className="text-text font-semibold underline">
              Đăng nhập
            </Link>
          </div>
        </form>
      )}

      {/* STEP 2: Verify Code */}
      {step === 'VERIFY' && (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          

          <div>
            <label className="block text-xs font-medium text-text mb-1">Mã xác nhận (6 chữ số)</label>
            <input
              type="text"
              maxLength={6}
              required
              autoFocus
              disabled={isSubmitting}
              placeholder="••••••"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-2.5 text-center tracking-[0.5em] font-mono text-lg font-bold rounded bg-surface-2 border border-border text-text focus:outline-none focus:border-text disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || code.length !== 6}
            className="w-full py-2.5 rounded font-bold bg-text text-bg hover:opacity-90 transition-opacity cursor-pointer text-xs disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-bg/30 border-t-bg animate-spin" />
                <span>Đang xác thực...</span>
              </>
            ) : (
              'Xác nhận mã'
            )}
          </button>

          <div className="flex items-center justify-between pt-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setSuccessMessage(null);
                setCode('');
                setStep('REQUEST');
              }}
              className="text-text-muted hover:text-text underline"
            >
              Đổi email
            </button>
            <button
              type="button"
              disabled={isSubmitting || countdown > 0}
              onClick={() => handleRequestCode()}
              className="text-text font-semibold hover:underline disabled:opacity-50 disabled:no-underline"
            >
              {countdown > 0 ? `Gửi lại mã (${countdown}s)` : 'Gửi lại mã'}
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: Reset Password */}
      {step === 'RESET' && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text mb-1">Mật khẩu mới</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                disabled={isSubmitting}
                placeholder="Tối thiểu 6 ký tự"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full pl-3 pr-9 py-2 rounded bg-surface-2 border border-border text-text text-xs focus:outline-none focus:border-text disabled:opacity-50"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text cursor-pointer p-0.5"
                title={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showNewPassword ? (
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

          <div>
            <label className="block text-xs font-medium text-text mb-1">Xác nhận mật khẩu mới</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                disabled={isSubmitting}
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full pl-3 pr-9 py-2 rounded bg-surface-2 border border-border text-text text-xs focus:outline-none focus:border-text disabled:opacity-50"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text cursor-pointer p-0.5"
                title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showConfirmPassword ? (
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded font-bold bg-text text-bg hover:opacity-90 transition-opacity cursor-pointer text-xs disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-bg/30 border-t-bg animate-spin" />
                <span>Đang cập nhật...</span>
              </>
            ) : (
              'Đổi mật khẩu'
            )}
          </button>
        </form>
      )}

      {/* STEP 4: Success */}
      {step === 'SUCCESS' && (
        <div className="text-center py-2 space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <p className="text-xs text-text-muted">
            Mật khẩu mới cho tài khoản <span className="font-semibold text-text">{email}</span> đã được thiết lập thành công.
          </p>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full py-2.5 rounded font-bold bg-text text-bg hover:opacity-90 transition-opacity cursor-pointer text-xs flex items-center justify-center"
          >
            Đăng nhập ngay
          </button>
        </div>
      )}
    </AuthLayout>
  );
}
