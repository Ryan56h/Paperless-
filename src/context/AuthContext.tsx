import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { BusinessProfile, BusinessType } from '../types';
import { loginApi, registerApi, getMeApi, type RegisterPayload, type UserResponse } from '../services/authApi';

export interface AuthResult {
  success: boolean;
  businessType?: BusinessType;
  error?: string;
}

interface AuthContextType {
  business: BusinessProfile | null;
  user: UserResponse | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password?: string, explicitType?: BusinessType) => Promise<AuthResult>;
  register: (data: Omit<BusinessProfile, 'id' | 'createdAt'> & { password?: string; otpCode: string }) => Promise<AuthResult>;
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
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Verify session on initial mount with getMeApi
  useEffect(() => {
    let isMounted = true;
    const verifySession = async () => {
      const storedToken = localStorage.getItem('paperless_token');
      if (!storedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const data = await getMeApi(storedToken);
        if (isMounted) {
          if (data && data.user) {
            setUser(data.user);
            if (data.business) {
              setBusiness(data.business);
            }
            setToken(storedToken);
          } else {
            logout();
          }
        }
      } catch (err) {
        console.warn('Phiên làm việc hết hạn hoặc không kết nối được server:', err);
        if (isMounted) {
          logout();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    verifySession();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync business type if user exists
  useEffect(() => {
    if (user?.businessType && business && business.type !== user.businessType) {
      setBusiness(prev => (prev ? { ...prev, type: user.businessType as BusinessType } : prev));
    }
  }, [user?.businessType]);

  // Persist state changes to localStorage
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
    password?: string,
    explicitType?: BusinessType
  ): Promise<AuthResult> => {
    const pwd = password || '123456';
    try {
      const res = await loginApi(email, pwd, explicitType);
      if (res && res.token) {
        setToken(res.token);
        setUser(res.user);
        if (res.business) {
          setBusiness(res.business);
        }
        const resolvedType = (res.business?.type || res.user?.businessType || 'grocery') as BusinessType;
        return { success: true, businessType: resolvedType };
      }
      return { success: false, error: 'Đăng nhập không thành công.' };
    } catch (error: any) {
      const errorMsg = error?.message || 'Tài khoản hoặc mật khẩu không chính xác.';
      return { success: false, error: errorMsg };
    }
  };

  const register = async (
    data: Omit<BusinessProfile, 'id' | 'createdAt'> & { password?: string; otpCode: string }
  ): Promise<AuthResult> => {
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
        otpCode: data.otpCode,
      };

      const res = await registerApi(payload);
      if (res && res.token) {
        setToken(res.token);
        setUser(res.user);
        if (res.business) {
          setBusiness(res.business);
        }
        const resolvedType = (res.business?.type || res.user?.businessType || data.type) as BusinessType;
        return { success: true, businessType: resolvedType };
      }
      return { success: false, error: 'Đăng ký không thành công.' };
    } catch (error: any) {
      const errorMsg = error?.message || 'Đăng ký tài khoản thất bại.';
      return { success: false, error: errorMsg };
    }
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
        isLoggedIn: !!token && (!!user || !!business),
        isLoading,
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

