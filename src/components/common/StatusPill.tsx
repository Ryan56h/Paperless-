interface StatusPillProps {
  status:
    | 'preparing'
    | 'ready'
    | 'completed'
    | 'cancelled'
    | 'pending'
    | 'served'
    | 'paid'
    | 'empty'
    | 'occupied'
    | 'reserved';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const defaultLabels: Record<string, string> = {
  preparing: 'Đang chuẩn bị',
  ready: 'Sẵn sàng',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  pending: 'Chờ pha chế',
  served: 'Đã ra món',
  paid: 'Đã thanh toán',
  empty: 'Bàn trống',
  occupied: 'Có khách',
  reserved: 'Đặt trước',
};

export default function StatusPill({
  status,
  label,
  size = 'md',
}: StatusPillProps) {
  const textLabel = label || defaultLabels[status] || status;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-xs px-2.5 py-1 font-medium',
  };

  return (
    <span
      className={`inline-block font-medium rounded bg-surface-2 text-text-muted border border-border ${sizeClasses[size]}`}
    >
      {textLabel}
    </span>
  );
}
