import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { BusinessProfile, BusinessType } from '../types';

interface AuthContextType {
  business: BusinessProfile | null;
  isLoggedIn: boolean;
  login: (email: string, businessType?: BusinessType) => void;
  register: (data: Omit<BusinessProfile, 'id' | 'createdAt'>) => void;
  switchBusinessType: (type: BusinessType) => void;
  logout: () => void;
}

const defaultProfiles: Record<BusinessType, BusinessProfile> = {
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
  const [business, setBusiness] = useState<BusinessProfile | null>(() => {
    try {
      const saved = localStorage.getItem('paperless_business');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return defaultProfiles.grocery; // Mặc định mở đầu để người dùng trải nghiệm ngay
  });

  useEffect(() => {
    if (business) {
      localStorage.setItem('paperless_business', JSON.stringify(business));
    } else {
      localStorage.removeItem('paperless_business');
    }
  }, [business]);

  const login = (email: string, businessType: BusinessType = 'grocery') => {
    const base = defaultProfiles[businessType];
    const userProfile: BusinessProfile = {
      ...base,
      email: email || base.email,
    };
    setBusiness(userProfile);
  };

  const register = (data: Omit<BusinessProfile, 'id' | 'createdAt'>) => {
    const newProfile: BusinessProfile = {
      ...data,
      id: `BIZ-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setBusiness(newProfile);
  };

  const switchBusinessType = (type: BusinessType) => {
    setBusiness(defaultProfiles[type]);
  };

  const logout = () => {
    setBusiness(null);
  };

  return (
    <AuthContext.Provider
      value={{
        business,
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
