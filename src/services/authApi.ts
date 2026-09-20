import type { BusinessProfile, BusinessType } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5195/api';

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
    throw new Error(errorData.message || `Đăng nhập thất bại (${response.status})`);
  }

  return response.json();
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
      }),
    });
  } catch {
    throw new Error('Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra xem server backend đã được khởi động chưa.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Đăng ký thất bại (${response.status})`);
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
