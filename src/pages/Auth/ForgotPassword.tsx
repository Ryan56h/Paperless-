import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import { forgotPasswordApi, verifyResetCodeApi, resetPasswordApi } from '../../services/authApi';

type Step = 'REQUEST' | 'VERIFY' | 'RESET' | 'SUCCESS';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('REQUEST');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Request Reset Code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedInput = emailOrPhone.trim();
    if (!trimmedInput) {
      setErrorMessage('Vui lòng nhập email hoặc số điện thoại của bạn.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await forgotPasswordApi(trimmedInput);
      if (res.resetCode) {
        setDevCode(res.resetCode);
        setCode(res.resetCode); // Pre-fill for convenience
      }
      setSuccessMessage('Mã xác nhận gồm 6 chữ số đã được gửi!');
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

    const trimmedCode = code.trim();
    if (trimmedCode.length !== 6) {
      setErrorMessage('Mã xác nhận phải gồm đúng 6 chữ số.');
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyResetCodeApi(emailOrPhone.trim(), trimmedCode);
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

    if (newPassword.length < 6) {
      setErrorMessage('Mật khẩu mới phải có độ dài ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPasswordApi(emailOrPhone.trim(), code.trim(), newPassword);
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
        return 'Nhập email hoặc số điện thoại đã đăng ký để nhận mã khôi phục.';
      case 'VERIFY':
        return `Mã 6 chữ số đã được gửi tới ${emailOrPhone}.`;
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
            <label className="block text-xs font-medium text-text mb-1">Email hoặc Số điện thoại</label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              placeholder="cuahang@paperless.vn hoặc 0912345678"
              value={emailOrPhone}
              onChange={e => setEmailOrPhone(e.target.value)}
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
          {devCode && (
            <div className="p-2.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs">
              <span className="font-semibold">Mã thử nghiệm nhanh (Demo OTP): </span>
              <span className="font-mono font-bold tracking-widest text-sm bg-surface px-1.5 py-0.5 rounded border border-blue-500/30">
                {devCode}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text mb-1">Mã xác nhận (6 chữ số)</label>
            <input
              type="text"
              maxLength={6}
              required
              disabled={isSubmitting}
              placeholder="123456"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-2.5 text-center tracking-[0.5em] font-mono text-base font-bold rounded bg-surface-2 border border-border text-text focus:outline-none focus:border-text disabled:opacity-50"
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
                setStep('REQUEST');
              }}
              className="text-text-muted hover:text-text underline"
            >
              Đổi số / email
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleRequestCode}
              className="text-text font-semibold hover:underline"
            >
              Gửi lại mã
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: Reset Password */}
      {step === 'RESET' && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text mb-1">Mật khẩu mới</label>
            <input
              type="password"
              required
              disabled={isSubmitting}
              placeholder="Tối thiểu 6 ký tự"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded bg-surface-2 border border-border text-text text-xs focus:outline-none focus:border-text disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text mb-1">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              required
              disabled={isSubmitting}
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
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
                <span>Đang lưu mật khẩu mới...</span>
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
            Mật khẩu mới cho tài khoản <span className="font-semibold text-text">{emailOrPhone}</span> đã được thiết lập thành công.
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
