import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className={`rounded-xl p-5 border ${accent ? 'border-text/40 bg-surface' : 'border-border bg-surface-2'}`}>
      <p className="text-text-dim text-xs font-medium uppercase tracking-wider mb-2">{label}</p>
      <p className="text-2xl font-bold text-text">{value}</p>
      {sub && <p className="text-text-muted text-xs mt-1">{sub}</p>}
    </div>
  );
}

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}

export default function Card({ children, className = '', title, action }: CardProps) {
  return (
    <div className={`rounded-xl border border-border bg-surface-2 ${className}`}>
      {(title || action) && (
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          {title && <h3 className="text-sm font-semibold text-text">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
