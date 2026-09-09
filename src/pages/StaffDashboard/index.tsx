import { Link } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout';
import Card, { StatCard } from '../../components/common/Card';
import InvoiceTable from '../../components/common/InvoiceTable';
import Button from '../../components/common/Button';
import { mockInvoices } from '../../data/mockData';

const todayInvoices = mockInvoices.filter(i => i.createdAt.startsWith('2026-05-29'));
const sentZalo = todayInvoices.filter(i => i.sendChannel === 'zalo' || i.sendChannel === 'both').length;
const sentSMS = todayInvoices.filter(i => i.sendChannel === 'sms' || i.sendChannel === 'both').length;
const pending = todayInvoices.filter(i => i.sendStatus === 'pending').length;

export default function StaffDashboard() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <PageLayout role="staff">
      <div className="px-8 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-text">Xin chào, Bảo Trân</h1>
            <p className="text-text-dim text-sm mt-0.5">{dateStr} · Chi nhánh Q1</p>
          </div>
          <Link to="/staff/invoice/new">
            <Button size="md">+ Tạo hóa đơn mới</Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard label="Hóa đơn hôm nay" value={todayInvoices.length} sub="+2 so với hôm qua" accent />
          <StatCard label="Đã gửi Zalo" value={sentZalo} sub="kênh ưu tiên" />
          <StatCard label="Đã gửi SMS" value={sentSMS} sub="kênh dự phòng" />
          <StatCard label="Chờ xử lý" value={pending} sub={pending > 0 ? 'Cần kiểm tra' : 'Tất cả ổn'} />
        </div>

        {/* Recent invoices */}
        <Card title="Hóa đơn gần nhất — Hôm nay">
          {todayInvoices.length === 0 ? (
            <div className="px-5 py-12 text-center text-text-dim text-sm">
              Chưa có hóa đơn nào hôm nay.
            </div>
          ) : (
            <InvoiceTable invoices={todayInvoices} />
          )}
        </Card>

        {/* All recent */}
        <Card title="Lịch sử gần nhất" className="mt-4">
          <InvoiceTable invoices={mockInvoices} />
        </Card>
      </div>
    </PageLayout>
  );
}
