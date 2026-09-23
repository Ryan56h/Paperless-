import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const staffLinks = [
  { to: '/staff', label: 'Tổng quan', end: true },
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
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
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
          <div className="w-6 h-6 bg-text text-bg rounded flex items-center justify-center">
            <span className="text-xs font-bold">P</span>
          </div>
          <span className="font-bold text-text text-sm tracking-tight">
            Paperless
          </span>
        </div>

      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-lg text-xs font-medium ${
                isActive
                  ? 'bg-text text-bg font-semibold'
                  : 'text-text-muted hover:bg-surface-2 hover:text-text border border-transparent'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}


      </nav>

      {/* Theme switch */}
      <div className="px-3 py-4 border-t border-border flex flex-col gap-2">
        <button
          onClick={toggleTheme}
          className="w-full px-3 py-2 rounded-lg text-xs font-medium text-text-muted border border-border hover:border-text hover:text-text cursor-pointer bg-transparent"
        >
          {theme === 'light' ? 'Giao diện: Tối' : 'Giao diện: Sáng'}
        </button>
      </div>
    </aside>
  );
}
