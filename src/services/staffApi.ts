const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  businessType: string;
  branchId?: string;
  branchName?: string;
  createdAt: string;
}

export interface CreateStaffPayload {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
  role?: string;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('paperless_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchStaffListApi(): Promise<StaffMember[]> {
  const res = await fetch(`${API_URL}/staff`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Không thể tải danh sách nhân viên.');
  }
  return res.json();
}

export async function createStaffApi(payload: CreateStaffPayload): Promise<StaffMember> {
  const res = await fetch(`${API_URL}/staff`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Tạo tài khoản nhân viên thất bại.');
  }
  return data;
}

export async function resetStaffPasswordApi(id: string, newPassword: string): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/staff/${id}/reset-password`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ newPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Đặt lại mật khẩu thất bại.');
  }
  return data;
}

export async function deleteStaffApi(id: string): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/staff/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Xóa nhân viên thất bại.');
  }
  return data;
}
