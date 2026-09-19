import { useState } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import Card, { StatCard } from '../../components/common/Card';
import InvoiceTable from '../../components/common/InvoiceTable';
import Badge from '../../components/common/Badge';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import { mockInvoices, mockDailyRevenue, mockChannelStats, mockTopProducts } from '../../data/mockData';

function formatCurrency(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return n.toLocaleString('vi-VN');
}

const CHANNEL_COLORS: Record<string, string> = {
  Zalo: '#4B5563',
  SMS: '#6B7280',
  'Cả hai': '#111827',
};

const periods = ['Hôm nay', '7 ngày', '30 ngày'];

export default function ManagerDashboard() {
  const [period, setPeriod] = useState('7 ngày');

  const totalRevenue = mockDailyRevenue.reduce((s, d) => s + d.revenue, 0);
  const totalInvoices = mockDailyRevenue.reduce((s, d) => s + d.invoiceCount, 0);
  const totalSent = mockInvoices.filter(i => i.sendStatus === 'sent').length;
  const successRate = Math.round((totalSent / mockInvoices.length) * 100);

  return (
    <PageLayout role="manager">
      <div className="px-8 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-text">Tổng quan quản lý</h1>
            <p className="text-text-dim text-sm mt-0.5">Paperless · Chi nhánh Q1</p>
          </div>
          <div className="flex gap-1 bg-surface-2 border border-border rounded-lg p-1">
            {periods.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                  period === p ? 'bg-text text-bg' : 'text-text-muted bg-transparent hover:text-text'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard label="Doanh thu 7 ngày" value={formatCurrency(totalRevenue) + 'đ'} sub="tất cả chi nhánh" accent />
          <StatCard label="Số hóa đơn" value={totalInvoices} sub={period} />
          <StatCard label="Gửi thành công" value={totalSent + '/' + mockInvoices.length} sub="hóa đơn" />
          <StatCard label="Tỉ lệ thành công" value={successRate + '%'} sub="Zalo + SMS" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Revenue chart */}
          <Card title="Doanh thu theo ngày" className="col-span-2">
            <div className="p-4 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockDailyRevenue}>
                  <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => formatCurrency(v)} />
                  <Tooltip
                    contentStyle={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(v) => [typeof v === 'number' ? v.toLocaleString('vi-VN') + 'đ' : v, 'Doanh thu']}
                    labelStyle={{ color: '#9CA3AF' }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#111827" strokeWidth={2} dot={{ r: 3, fill: '#111827', strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Channel breakdown */}
          <Card title="Kênh gửi">
            <div className="p-4 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockChannelStats} layout="vertical">
                  <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="channel" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip
                    contentStyle={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(v) => [String(v) + ' hóa đơn', 'Số lượng']}
                    labelStyle={{ color: '#9CA3AF' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {mockChannelStats.map(entry => (
                      <Cell key={entry.channel} fill={CHANNEL_COLORS[entry.channel] ?? '#111827'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Top products */}
          <Card title="Top sản phẩm bán chạy">
            <div className="p-4">
              <div className="grid grid-cols-[24px_1fr_60px_90px] gap-2 mb-2">
                <span className="text-[11px] text-text-dim">#</span>
                <span className="text-[11px] text-text-dim uppercase tracking-wider">Sản phẩm</span>
                <span className="text-[11px] text-text-dim uppercase tracking-wider text-center">SL</span>
                <span className="text-[11px] text-text-dim uppercase tracking-wider text-right">Doanh thu</span>
              </div>
              {mockTopProducts.map((p, i) => (
                <div key={p.name} className="grid grid-cols-[24px_1fr_60px_90px] gap-2 py-2.5 border-b border-border last:border-0 items-center">
                  <span className="text-text-dim text-xs font-mono">{i + 1}</span>
                  <span className="text-sm text-text">{p.name}</span>
                  <span className="text-sm text-text-muted text-center">{p.quantity}</span>
                  <span className="text-sm text-text text-right">{formatCurrency(p.revenue)}đ</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent invoices */}
          <Card title="Hóa đơn gần nhất">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-text-dim uppercase tracking-wider">Mã HĐ</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-text-dim uppercase tracking-wider">Khách</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold text-text-dim uppercase tracking-wider">Tổng</th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold text-text-dim uppercase tracking-wider">TT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mockInvoices.slice(0, 5).map(inv => (
                    <tr key={inv.id} className="hover:bg-surface-2">
                      <td className="px-4 py-2.5 font-mono text-[11px] text-text font-semibold">{inv.id.split('-').slice(-1)[0]}</td>
                      <td className="px-4 py-2.5 text-xs text-text">{inv.customerName}</td>
                      <td className="px-4 py-2.5 text-xs text-text text-right font-medium">{inv.total.toLocaleString('vi-VN')}đ</td>
                      <td className="px-4 py-2.5 text-center">
                        {inv.sendStatus === 'sent'
                          ? <Badge variant="green">Gửi</Badge>
                          : inv.sendStatus === 'pending'
                          ? <Badge variant="yellow">Đợi</Badge>
                          : <Badge variant="red">Lỗi</Badge>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* All invoices */}
        <Card title="Tất cả hóa đơn" className="mt-4">
          <InvoiceTable invoices={mockInvoices} showBranch />
        </Card>
      </div>
    </PageLayout>
  );
}
