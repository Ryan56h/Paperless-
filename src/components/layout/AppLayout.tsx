import { useState, useEffect, type ReactNode } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { BusinessType } from '../../types';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { business, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  };

  const userBusinessType: BusinessType =
    (business?.type as BusinessType) ||
    (user?.businessType as BusinessType) ||
    (location.pathname.includes('/cafe') ? 'cafe' : 'grocery');

  const currentType = userBusinessType;

  useEffect(() => {
    if (userBusinessType === 'cafe' && location.pathname.includes('/grocery')) {
      const target = location.pathname.replace('/grocery', '/cafe');
      navigate(target, { replace: true });
    } else if (userBusinessType === 'grocery' && location.pathname.includes('/cafe')) {
      const target = location.pathname.replace('/cafe', '/grocery');
      navigate(target, { replace: true });
    }
  }, [userBusinessType, location.pathname, navigate]);

  const groceryLinks = [
    { to: '/app/grocery/order', label: 'Bán hàng (POS)' },
    { to: '/app/grocery/revenue', label: 'Doanh thu hôm nay' },
  ];

  const cafeLinks = [
    { to: '/app/cafe/order', label: 'Sơ đồ bàn & Gọi món' },
    { to: '/app/cafe/display', label: 'Màn hình bếp (KDS)' },
    { to: '/app/cafe/revenue', label: 'Doanh thu hôm nay' },
  ];

  const activeLinks = currentType === 'cafe' ? cafeLinks : groceryLinks;

  return (
    <div className="flex h-screen w-full bg-bg text-text overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 flex flex-col bg-surface border-r border-border h-screen">
        {/* Header / Brand */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <NavLink to="/" className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-text text-bg text-xs font-bold flex items-center justify-center">
                P
              </span>
              <span className="font-bold text-sm tracking-tight text-text">
                Paperless
              </span>
            </NavLink>

            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-surface-2 border border-border text-text-muted">
              {currentType === 'cafe' ? 'Quán Cafe' : 'Tạp hoá'}
            </span>
          </div>

          <div className="mt-3 p-2 rounded bg-surface-2 border border-border">
            <p className="text-xs font-medium text-text truncate">
              {business?.name || (currentType === 'cafe' ? 'Mộc Lan Cafe' : 'Tạp Hoá Minh Phát')}
            </p>
            <p className="text-[10px] text-text-dim truncate">
              {business?.ownerName || 'Chủ cửa hàng'}
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 flex flex-col gap-1">
          <p className="px-2 text-[10px] font-semibold text-text-dim uppercase tracking-wider mb-1">
            Menu
          </p>

          {activeLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-text text-bg font-semibold'
                    : 'text-text-muted hover:bg-surface-2 hover:text-text'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}

          {/* Utilities */}
          <div className="mt-4 pt-3 border-t border-border">
            <p className="px-2 text-[10px] font-semibold text-text-dim uppercase tracking-wider mb-1">
              Tiện ích
            </p>
            <NavLink
              to="/staff"
              className="block px-3 py-1.5 rounded text-xs text-text-dim hover:text-text hover:bg-surface-2"
            >
              Hoá đơn Zalo/SMS
            </NavLink>
            <NavLink
              to="/lookup"
              className="block px-3 py-1.5 rounded text-xs text-text-dim hover:text-text hover:bg-surface-2"
            >
              Tra cứu hoá đơn
            </NavLink>
            <NavLink
              to="/"
              className="block px-3 py-1.5 rounded text-xs text-text-dim hover:text-text hover:bg-surface-2"
            >
              Trang chủ
            </NavLink>
          </div>
        </div>

        {/* Footer controls */}
        <div className="p-3 border-t border-border flex items-center gap-2 bg-surface">
          <button
            onClick={toggleTheme}
            className="flex-1 py-1.5 rounded text-xs text-text-muted bg-surface-2 hover:text-text border border-border cursor-pointer transition-colors"
          >
            {theme === 'light' ? 'Giao diện tối' : 'Giao diện sáng'}
          </button>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="px-3 py-1.5 rounded text-xs text-text-muted bg-surface-2 hover:text-text border border-border cursor-pointer transition-colors"
          >
            Thoát
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-bg">
        {children}
      </main>
    </div>
  );
}
