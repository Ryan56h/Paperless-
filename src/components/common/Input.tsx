import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export default function Input({ label, error, hint, className = '', id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[#D1D5DB]">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full px-3 py-2.5 bg-surface border ${error ? 'border-[#EF4444]' : 'border-border'} rounded-lg text-sm text-text placeholder-text-dim focus:outline-none focus:border-[#55C244] ${className}`}
        {...props}
      />
      {hint && !error && <p className="text-[11px] text-text-dim">{hint}</p>}
      {error && <p className="text-[11px] text-[#EF4444]">{error}</p>}
    </div>
  );
}
