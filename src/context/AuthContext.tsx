import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { BusinessProfile, BusinessType } from '../types';
import { loginApi, registerApi, type RegisterPayload, type UserResponse } from '../services/authApi';

interface AuthContextType {
  business: BusinessProfile | null;
  user: UserResponse | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (email: string, passwordOrType?: string | BusinessType, explicitType?: BusinessType) => Promise<BusinessType | null>;
  register: (data: Omit<BusinessProfile, 'id' | 'createdAt'> & { password?: string }) => Promise<boolean>;
  switchBusinessType: (type: BusinessType) => void;
  logout: () => void;
}

export const defaultProfiles: Record<BusinessType, BusinessProfile> = {
  grocery: {
    id: 'BIZ-GROCERY-01',
    name: 'Tạp Hóa & Siêu Thị Mini Minh Phát',
    type: 'grocery',
    ownerName: 'Nguyễn Văn Minh',
    phone: '0908 123 456',
    email: 'minhphat.mart@gmail.com',
    address: '124 Đường 3/2, Quận 10, TP. Hồ Chí Minh',
    taxCode: '0312984512',
    createdAt: '2025-01-10',
  },
  cafe: {
    id: 'BIZ-CAFE-01',
    name: 'Mộc Lan Cafe & Bakery',
    type: 'cafe',
    ownerName: 'Trần Thu Hương',
    phone: '0912 888 999',
    email: 'moclan.coffee@gmail.com',
    address: '45 Nguyễn Đình Chiểu, Quận 3, TP. Hồ Chí Minh',
    taxCode: '0318524796',
    createdAt: '2025-02-15',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('paperless_token');
  });

  const [user, setUser] = useState<UserResponse | null>(() => {
    try {
      const savedUser = localStorage.getItem('paperless_user');
      if (savedUser) return JSON.parse(savedUser);
    } catch {
      // fallback
    }
    return null;
  });

  const [business, setBusiness] = useState<BusinessProfile | null>(() => {
    try {
      const saved = localStorage.getItem('paperless_business');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    try {
      const savedUser = localStorage.getItem('paperless_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u.businessType === 'cafe') return defaultProfiles.cafe;
      }
    } catch {
      // fallback
    }
    return defaultProfiles.grocery;
  });

  useEffect(() => {
    if (user?.businessType && business && business.type !== user.businessType) {
      setBusiness(prev => prev ? { ...prev, type: user.businessType as BusinessType } : prev);
    }
  }, [user?.businessType]);

  useEffect(() => {
    if (business) {
      localStorage.setItem('paperless_business', JSON.stringify(business));
    } else {
      localStorage.removeItem('paperless_business');
    }
  }, [business]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('paperless_token', token);
    } else {
      localStorage.removeItem('paperless_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('paperless_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('paperless_user');
    }
  }, [user]);

  const login = async (
    email: string,
    passwordOrType?: string | BusinessType,
    explicitType?: BusinessType
  ): Promise<BusinessType | null> => {
    let password = '123456';
    let type: BusinessType = 'grocery';

    if (passwordOrType === 'grocery' || passwordOrType === 'cafe') {
      type = passwordOrType;
    } else if (typeof passwordOrType === 'string' && passwordOrType.trim()) {
      password = passwordOrType;
      if (explicitType) type = explicitType;
    }

    try {
      const res = await loginApi(email, password, type);
      if (res && res.token) {
        setToken(res.token);
        setUser(res.user);
        if (res.business) {
          setBusiness(res.business);
        }
        const resolvedType = (res.business?.type || res.user?.businessType || type) as BusinessType;
        return resolvedType;
      }
    } catch (error) {
      console.warn('Lỗi kết nối Backend Auth hoặc sai thông tin, chuyển sang chế độ Demo Local Storage:', error);
    }

    const base = defaultProfiles[type];
    const fallbackProfile: BusinessProfile = {
      ...base,
      email: email || base.email,
    };
    setBusiness(fallbackProfile);
    return type;
  };

  const register = async (
    data: Omit<BusinessProfile, 'id' | 'createdAt'> & { password?: string }
  ): Promise<boolean> => {
    try {
      const payload: RegisterPayload = {
        name: data.name,
        type: data.type,
        ownerName: data.ownerName,
        phone: data.phone,
        email: data.email,
        password: data.password || '123456',
        address: data.address,
        taxCode: data.taxCode,
      };

      const res = await registerApi(payload);
      if (res && res.business) {
        setToken(res.token);
        setUser(res.user);
        setBusiness(res.business);
        return true;
      }
    } catch (error) {
      console.warn('Lỗi đăng ký Backend, chuyển sang lưu dữ liệu mẫu vào Local Storage:', error);
    }

    const newProfile: BusinessProfile = {
      ...data,
      id: `BIZ-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setBusiness(newProfile);
    return true;
  };

  const switchBusinessType = (type: BusinessType) => {
    setBusiness(defaultProfiles[type]);
  };

  const logout = () => {
    setBusiness(null);
    setUser(null);
    setToken(null);
    localStorage.removeItem('paperless_business');
    localStorage.removeItem('paperless_token');
    localStorage.removeItem('paperless_user');
  };

  return (
    <AuthContext.Provider
      value={{
        business,
        user,
        token,
        isLoggedIn: !!business,
        login,
        register,
        switchBusinessType,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
