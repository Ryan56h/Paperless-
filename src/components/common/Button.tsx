import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variantClasses = {
  primary: 'bg-[#55C244] text-black font-semibold hover:bg-[#3DA832] border border-[#55C244]',
  secondary: 'bg-surface-2 text-text font-medium hover:bg-surface-2 border border-border',
  ghost: 'bg-transparent text-text-muted font-medium hover:text-text border border-border hover:border-border',
  danger: 'bg-[#EF4444]/10 text-[#EF4444] font-medium hover:bg-[#EF4444]/20 border border-[#EF4444]/40',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs rounded-md',
  md: 'px-4 py-2.5 text-sm rounded-lg',
  lg: 'px-6 py-3 text-sm rounded-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`cursor-pointer ${variantClasses[variant]} ${sizeClasses[size]} ${className} disabled:opacity-40 disabled:cursor-not-allowed`}
      {...props}
    >
      {children}
    </button>
  );
}
