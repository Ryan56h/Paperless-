type BadgeVariant = 'green' | 'yellow' | 'red' | 'gray' | 'blue' | 'zalo' | 'sms';

interface BadgeProps {
  children: string;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  green: 'bg-[#55C244]/15 text-[#55C244] border border-[#55C244]/30',
  yellow: 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30',
  red: 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30',
  gray: 'bg-[#6B7280]/15 text-text-muted border border-[#6B7280]/20',
  blue: 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30',
  zalo: 'bg-[#0068FF]/15 text-[#4D9FFF] border border-[#0068FF]/30',
  sms: 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30',
};

export default function Badge({ children, variant = 'gray' }: BadgeProps) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}
