import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#09261e] via-[#0d3429] to-[#0a271f] text-white flex flex-col justify-center items-center px-4 py-12 font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-black tracking-wider text-white uppercase">
            PAPERLESS<span className="text-amber-400">+</span>
          </span>
        </Link>
        <h1 className="text-lg sm:text-xl font-black uppercase text-white mt-3 text-center tracking-tight">
          {title}
        </h1>
        <p className="text-xs text-emerald-200/80 mt-1 text-center max-w-sm leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Main Form Container */}
      <div className="w-full max-w-md bg-white text-slate-800 border border-emerald-800/50 rounded-2xl p-6 sm:p-7 shadow-2xl">
        {children}
      </div>

      {/* Footer navigation */}
      <div className="mt-6 text-center text-xs text-emerald-200/70">
        <Link to="/" className="hover:text-amber-400 uppercase tracking-wider font-bold transition-colors">
          Quay lại trang chủ
        </Link>
      </div>
    </div>
  );
}
