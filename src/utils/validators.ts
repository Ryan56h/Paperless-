/**
 * Chuẩn hoá và kiểm tra ràng buộc dữ liệu Authentication (PaperLess+)
 */

// Regex kiểm tra định dạng email tiêu chuẩn RFC 5322 rút gọn
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Regex kiểm tra số điện thoại Việt Nam (10 chữ số, đầu 03, 05, 07, 08, 09 hoặc +84)
export const VIETNAM_PHONE_REGEX = /^(0|\+84)(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;

// Regex kiểm tra mã OTP đúng 6 chữ số
export const OTP_REGEX = /^\d{6}$/;

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return 'Vui lòng nhập địa chỉ email.';
  }
  if (trimmed.length > 100) {
    return 'Địa chỉ email không được vượt quá 100 ký tự.';
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return 'Email không đúng định dạng (VD: cuahang@gmail.com).';
  }
  return null;
}

export function validatePhone(phone: string): string | null {
  const trimmed = phone.trim().replace(/[\s.-]/g, '');
  if (!trimmed) {
    return 'Vui lòng nhập số điện thoại.';
  }
  if (!VIETNAM_PHONE_REGEX.test(trimmed)) {
    return 'Số điện thoại không hợp lệ (gồm 10 số, bắt đầu bằng 03, 05, 07, 08, 09).';
  }
  return null;
}

export function validatePassword(password: string, fieldName: string = 'Mật khẩu'): string | null {
  if (!password) {
    return `Vui lòng nhập ${fieldName.toLowerCase()}.`;
  }
  if (password.length < 6) {
    return `${fieldName} phải có độ dài tối thiểu 6 ký tự.`;
  }
  if (password.length > 50) {
    return `${fieldName} không được vượt quá 50 ký tự.`;
  }
  return null;
}

export function validateOtp(otp: string): string | null {
  const trimmed = otp.trim();
  if (!trimmed) {
    return 'Vui lòng nhập mã xác thực OTP.';
  }
  if (!OTP_REGEX.test(trimmed)) {
    return 'Mã OTP phải gồm đúng 6 chữ số.';
  }
  return null;
}

export function validateStoreName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return 'Vui lòng nhập tên cửa hàng.';
  }
  if (trimmed.length < 2 || trimmed.length > 100) {
    return 'Tên cửa hàng phải có từ 2 đến 100 ký tự.';
  }
  return null;
}

export function validateOwnerName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return 'Vui lòng nhập họ và tên chủ quán.';
  }
  if (trimmed.length < 2 || trimmed.length > 100) {
    return 'Họ và tên phải có từ 2 đến 100 ký tự.';
  }
  return null;
}
