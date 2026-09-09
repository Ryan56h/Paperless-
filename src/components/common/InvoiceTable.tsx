import type { Invoice } from '../../types';
import Badge from './Badge';
import { Link } from 'react-router-dom';

function formatCurrency(n: number) {
  return n.toLocaleString('vi-VN') + 'đ';
}

function formatTime(dt: string) {
  const d = new Date(dt);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
    ' · ' + d.toLocaleDateString('vi-VN');
}

function sendStatusBadge(status: Invoice['sendStatus']) {
  if (status === 'sent') return <Badge variant="green">Đã gửi</Badge>;
  if (status === 'pending') return <Badge variant="yellow">Đang gửi</Badge>;
  return <Badge variant="red">Thất bại</Badge>;
}

function channelBadge(channel: Invoice['sendChannel']) {
  if (channel === 'zalo') return <Badge variant="zalo">Zalo</Badge>;
  if (channel === 'sms') return <Badge variant="sms">SMS</Badge>;
  return (
    <span className="flex gap-1">
      <Badge variant="zalo">Zalo</Badge>
      <Badge variant="sms">SMS</Badge>
    </span>
  );
}

interface InvoiceTableProps {
  invoices: Invoice[];
  showBranch?: boolean;
}

export default function InvoiceTable({ invoices, showBranch = false }: InvoiceTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left text-[11px] font-semibold text-text-dim uppercase tracking-wider">Mã HĐ</th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold text-text-dim uppercase tracking-wider">Khách hàng</th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold text-text-dim uppercase tracking-wider">SĐT</th>
            {showBranch && <th className="px-4 py-3 text-left text-[11px] font-semibold text-text-dim uppercase tracking-wider">Chi nhánh</th>}
            <th className="px-4 py-3 text-right text-[11px] font-semibold text-text-dim uppercase tracking-wider">Tổng tiền</th>
            <th className="px-4 py-3 text-center text-[11px] font-semibold text-text-dim uppercase tracking-wider">Kênh</th>
            <th className="px-4 py-3 text-center text-[11px] font-semibold text-text-dim uppercase tracking-wider">Trạng thái</th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold text-text-dim uppercase tracking-wider">Thời gian</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1E1E1E]">
          {invoices.map(inv => (
            <tr key={inv.id} className="hover:bg-surface-2">
              <td className="px-4 py-3 font-mono text-xs text-[#55C244]">{inv.id}</td>
              <td className="px-4 py-3 text-text font-medium">{inv.customerName}</td>
              <td className="px-4 py-3 text-text-muted">{inv.customerPhone}</td>
              {showBranch && <td className="px-4 py-3 text-text-muted text-xs">{inv.branch}</td>}
              <td className="px-4 py-3 text-right text-text font-semibold">{formatCurrency(inv.total)}</td>
              <td className="px-4 py-3 text-center">{channelBadge(inv.sendChannel)}</td>
              <td className="px-4 py-3 text-center">{sendStatusBadge(inv.sendStatus)}</td>
              <td className="px-4 py-3 text-text-dim text-xs">{formatTime(inv.createdAt)}</td>
              <td className="px-4 py-3">
                <Link to={`/invoice/${inv.id}`} className="text-xs text-[#55C244] hover:text-[#3DA832]">Xem</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
