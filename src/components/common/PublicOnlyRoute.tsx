import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { BusinessType } from '../../types';

interface PublicOnlyRouteProps {
  children: ReactNode;
}

export default function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { isLoggedIn, isLoading, business, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg text-text">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-text/20 border-t-text animate-spin" />
          <p className="text-xs text-text-muted font-medium">Đang kiểm tra phiên đăng nhập...</p>
        </div>
      </div>
    );
  }

  if (isLoggedIn) {
    const currentType = (business?.type || user?.businessType || 'grocery') as BusinessType;
    const target = currentType === 'cafe' ? '/app/cafe/order' : '/app/grocery/order';
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
}
