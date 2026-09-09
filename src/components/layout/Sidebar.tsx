import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const staffLinks = [
  { to: '/staff', label: 'Bán hàng (POS)', end: true },
  { to: '/staff/invoice/new', label: 'Tạo hóa đơn' },
  { to: '/lookup', label: 'Tra cứu hóa đơn' },
];

const managerLinks = [
  { to: '/manager', label: 'Tổng quan', end: true },
  { to: '/manager/loyalty', label: 'Loyalty & Voucher' },
  { to: '/lookup', label: 'Tra cứu hóa đơn' },
];

interface SidebarProps {
  role: 'staff' | 'manager';
}

export default function Sidebar({ role }: SidebarProps) {
  const navigate = useNavigate();
  const links = role === 'staff' ? staffLinks : managerLinks;
  
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return document.documentElement.classList.contains('light') ? 'light' : 'dark';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  const switchRole = () => {
    navigate(role === 'staff' ? '/manager' : '/staff');
  };

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-surface border-r border-border h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#55C244] rounded-md flex items-center justify-center">
            <span className="text-black text-xs font-black">P+</span>
          </div>
          <span className="font-bold text-text text-sm tracking-wide">
            Paper<span className="text-[#55C244]">Less+</span>
          </span>
        </div>
        <p className="text-text-dim text-[10px] mt-1 pl-9">
          {role === 'staff' ? 'Nhân viên bán hàng' : 'Quản lý cửa hàng'}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `block px-3 py-2.5 rounded-lg text-sm font-medium ${
                isActive
                  ? 'bg-[#55C244]/15 text-[#55C244] border border-[#55C244]/30'
                  : 'text-text-muted hover:bg-surface-2 hover:text-text border border-transparent'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Role switch + theme switch + user info */}
      <div className="px-3 py-4 border-t border-border flex flex-col gap-2">
        <button
          onClick={switchRole}
          className="w-full px-3 py-2 rounded-lg text-xs font-medium text-text-muted border border-border hover:border-[#55C244] hover:text-[#55C244] cursor-pointer bg-transparent"
        >
          {role === 'staff' ? 'Chuyển: Quản lý' : 'Chuyển: Nhân viên'}
        </button>
        <button
          onClick={toggleTheme}
          className="w-full px-3 py-2 rounded-lg text-xs font-medium text-text-muted border border-border hover:border-[#55C244] hover:text-[#55C244] cursor-pointer bg-transparent"
        >
          {theme === 'dark' ? 'Giao diện: Sáng' : 'Giao diện: Tối'}
        </button>
        <div className="px-3 py-2 rounded-lg bg-surface-2">
          <p className="text-text text-xs font-semibold">
            {role === 'staff' ? 'Nguyễn Bảo Trân' : 'Trần Quản Lý'}
          </p>
          <p className="text-text-dim text-[10px]">Chi nhánh Q1</p>
        </div>
      </div>
    </aside>
  );
}
