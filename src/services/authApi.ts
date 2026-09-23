import type { BusinessProfile, BusinessType } from '../types';

const API_URL = import.meta.env.VITE_API_URL || "/api";

export interface UserResponse {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role?: string;
  tenantId?: string;
  tenantName?: string;
  businessType?: string;
  branchId?: string;
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
  business: BusinessProfile;
}

export interface RegisterPayload {
  name: string;
  type: BusinessType;
  ownerName: string;
  phone: string;
  email: string;
  password?: string;
  address?: string;
  taxCode?: string;
  otpCode: string;
}

export async function loginApi(
  emailOrPhone: string,
  password?: string,
  businessType?: BusinessType
): Promise<AuthResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailOrPhone,
        email: emailOrPhone,
        password: password || '123456',
        businessType,
      }),
    });
  } catch {
    throw new Error('Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra xem server backend đã được khởi động chưa.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let errorMessage = errorData.message;
    if (!errorMessage && errorData.errors) {
      const firstKey = Object.keys(errorData.errors)[0];
      if (firstKey && errorData.errors[firstKey].length > 0) {
        errorMessage = errorData.errors[firstKey][0];
      }
    }
    throw new Error(errorMessage || `Đăng nhập thất bại (${response.status})`);
  }

  return response.json();
}

export async function sendRegisterOtpApi(email: string, fullName?: string): Promise<{ message: string }> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/send-register-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        fullName,
      }),
    });
  } catch {
    throw new Error('Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra lại server.');
  }

  const errorData = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(errorData.message || `Gửi mã OTP thất bại (${response.status})`);
  }

  return errorData;
}

export async function registerApi(payload: RegisterPayload): Promise<AuthResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: payload.name,
        storeName: payload.name,
        type: payload.type,
        ownerName: payload.ownerName,
        ownerFullName: payload.ownerName,
        phone: payload.phone,
        email: payload.email,
        password: payload.password || '123456',
        address: payload.address,
        taxCode: payload.taxCode,
        otpCode: payload.otpCode,
      }),
    });
  } catch {
    throw new Error('Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra xem server backend đã được khởi động chưa.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let errorMessage = errorData.message;
    if (!errorMessage && errorData.errors) {
      const firstKey = Object.keys(errorData.errors)[0];
      if (firstKey && errorData.errors[firstKey].length > 0) {
        errorMessage = errorData.errors[firstKey][0];
      }
    }
    throw new Error(errorMessage || `Đăng ký thất bại (${response.status})`);
  }

  return response.json();
}

export async function getMeApi(token: string): Promise<{ user: UserResponse; business: BusinessProfile }> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new Error('Không thể kết nối đến máy chủ Backend.');
  }

  if (!response.ok) {
    throw new Error(`Xác thực phiên làm việc thất bại (${response.status})`);
  }

  return response.json();
}

export interface ForgotPasswordResponse {
  message: string;
  identifier: string;
  email?: string;
  resetCode?: string;
}

export async function forgotPasswordApi(email: string): Promise<ForgotPasswordResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
  } catch {
    throw new Error('Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra lại server.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Yêu cầu thất bại (${response.status})`);
  }

  return data;
}

export async function verifyResetCodeApi(email: string, code: string): Promise<{ message: string }> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/verify-reset-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    });
  } catch {
    throw new Error('Không thể kết nối đến máy chủ Backend.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Mã xác nhận không hợp lệ (${response.status})`);
  }

  return data;
}

export async function resetPasswordApi(
  email: string,
  code: string,
  newPassword: string
): Promise<{ message: string }> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code, newPassword }),
    });
  } catch {
    throw new Error('Không thể kết nối đến máy chủ Backend.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Đặt lại mật khẩu thất bại (${response.status})`);
  }

  return data;
}
