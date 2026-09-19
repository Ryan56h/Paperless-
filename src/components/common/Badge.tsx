type BadgeVariant = 'green' | 'yellow' | 'red' | 'gray' | 'blue' | 'zalo' | 'sms';

interface BadgeProps {
  children: string;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  green: 'bg-surface-2 text-text border border-border',
  yellow: 'bg-surface-2 text-text-muted border border-border',
  red: 'bg-surface-2 text-[#EF4444] border border-[#EF4444]/30',
  gray: 'bg-surface-2 text-text-muted border border-border',
  blue: 'bg-surface-2 text-text border border-border',
  zalo: 'bg-surface-2 text-text border border-border font-mono',
  sms: 'bg-surface-2 text-text border border-border font-mono',
};

export default function Badge({ children, variant = 'gray' }: BadgeProps) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}
