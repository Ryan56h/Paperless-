import { type ReactNode } from 'react';

interface PublicOnlyRouteProps {
  children: ReactNode;
}

export default function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  // Cho phép truy cập trang Đăng nhập / Đăng ký mà không bị tự động chuyển hướng ép buộc
  return <>{children}</>;
}
