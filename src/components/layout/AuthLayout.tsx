import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-bg text-text flex flex-col justify-center items-center px-4 py-12 font-sans">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-7 h-7 rounded bg-text text-bg text-sm font-bold flex items-center justify-center">
            P
          </span>
          <span className="font-bold text-lg tracking-tight text-text">Paperless</span>
        </Link>
        <h1 className="text-xl font-bold text-text mt-3 text-center">{title}</h1>
        <p className="text-xs text-text-dim mt-0.5 text-center max-w-sm">{subtitle}</p>
      </div>

      {/* Main Form Container */}
      <div className="w-full max-w-sm bg-surface border border-border rounded-xl p-5 sm:p-6 shadow-sm">
        {children}
      </div>

      {/* Footer navigation */}
      <div className="mt-5 text-center text-xs text-text-dim">
        <Link to="/" className="hover:text-text">
          Quay lại trang chủ
        </Link>
      </div>
    </div>
  );
}
