import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variantClasses = {
  primary: 'bg-text text-bg font-semibold hover:opacity-90 border border-text',
  secondary: 'bg-surface-2 text-text font-medium hover:bg-surface border border-border',
  ghost: 'bg-transparent text-text-muted font-medium hover:text-text border border-border hover:border-text/30',
  danger: 'bg-surface-2 text-[#EF4444] font-medium hover:bg-surface border border-[#EF4444]/30',
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
