import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { BusinessType } from '../../types';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredBusinessType?: BusinessType;
}

export default function ProtectedRoute({ children, requiredBusinessType }: ProtectedRouteProps) {
  const { isLoggedIn, isDemo, isLoading, business, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg text-text">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-text/20 border-t-text animate-spin" />
          <p className="text-xs text-text-muted font-medium">Đang kiểm tra phiên làm việc...</p>
        </div>
      </div>
    );
  }

  // Cho phép cả người dùng thật (isLoggedIn) và khách dùng thử (isDemo) trải nghiệm POS
  if (!isLoggedIn && !isDemo) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const currentType = (business?.type || user?.businessType) as BusinessType | undefined;
  if (requiredBusinessType && currentType && currentType !== requiredBusinessType) {
    const target = currentType === 'cafe' ? '/app/cafe/order' : '/app/grocery/order';
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
}
