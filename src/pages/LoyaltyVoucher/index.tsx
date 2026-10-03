import { useState, useEffect } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { mockVouchers } from '../../data/mockData';
import { fetchCustomersApi, type CustomerListItem } from '../../services/groceryApi';
import type { Voucher } from '../../types';

function tierBadge(tier: string) {
  const t = (tier || '').toLowerCase();
  if (t === 'diamond') return <Badge variant="blue">Kim Cương</Badge>;
  if (t === 'gold') return <Badge variant="yellow">Vàng</Badge>;
  if (t === 'silver') return <Badge variant="gray">Bạc</Badge>;
  return <Badge variant="gray">Đồng</Badge>;
}

function voucherStatusBadge(status: Voucher['status']) {
  if (status === 'active') return <Badge variant="green">Đang dùng</Badge>;
  if (status === 'expired') return <Badge variant="red">Hết hạn</Badge>;
  return <Badge variant="gray">Đã dùng hết</Badge>;
}

interface VoucherModalProps {
  onClose: () => void;
}

function VoucherModal({ onClose }: VoucherModalProps) {
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percent' | 'fixed'>('percent');
  const [value, setValue] = useState('');
  const [expiry, setExpiry] = useState('');

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-2 border border-border rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-text">Tạo Voucher mới</h2>
          <button onClick={onClose} className="text-text-dim hover:text-text text-lg cursor-pointer bg-transparent border-none">×</button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text">Mã voucher</label>
            <input
              className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-text uppercase placeholder-text-dim focus:outline-none focus:border-text tracking-widest"
              placeholder="VD: SUMMER2026"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text">Loại giảm giá</label>
            <div className="flex gap-2">
              <button
                onClick={() => setType('percent')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border cursor-pointer ${type === 'percent' ? 'bg-text text-bg border-text' : 'border-border text-text-muted hover:text-text bg-surface'}`}
              >
                Phần trăm (%)
              </button>
              <button
                onClick={() => setType('fixed')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border cursor-pointer ${type === 'fixed' ? 'bg-text text-bg border-text' : 'border-border text-text-muted hover:text-text bg-surface'}`}
              >
                Số tiền cố định
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text">Giá trị giảm {type === 'percent' ? '(%)' : '(đ)'}</label>
            <input
              type="number"
              className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-text placeholder-text-dim focus:outline-none focus:border-text"
              placeholder={type === 'percent' ? '10' : '50000'}
              value={value}
              onChange={e => setValue(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text">Ngày hết hạn</label>
            <input
              type="date"
              className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:border-text"
              value={expiry}
              onChange={e => setExpiry(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={onClose} className="flex-1">Hủy</Button>
            <Button onClick={onClose} className="flex-1">Tạo Voucher</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoyaltyVoucher() {
  const [tab, setTab] = useState<'loyalty' | 'voucher'>('loyalty');
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCustomers() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchCustomersApi(100);
        setCustomers(data);
      } catch (err: any) {
        setError(err.message || 'Không thể tải danh sách khách hàng');
      } finally {
        setIsLoading(false);
      }
    }
    loadCustomers();
  }, []);

  const totalPoints = customers.reduce((s, c) => s + c.points, 0);
  const diamondCount = customers.filter(c => (c.tier || '').toLowerCase() === 'diamond').length;

  return (
    <PageLayout role="manager">
      <div className="px-8 py-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-text">Loyalty & Voucher</h1>
            <p className="text-text-dim text-sm mt-0.5">Quản lý khách hàng thân thiết và mã giảm giá</p>
          </div>
          {tab === 'voucher' && (
            <Button onClick={() => setShowModal(true)}>+ Tạo Voucher</Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-6 border-b border-border">
          <button
            onClick={() => setTab('loyalty')}
            className={`px-5 py-3 text-xs font-semibold border-b-2 cursor-pointer bg-transparent ${tab === 'loyalty' ? 'border-text text-text' : 'border-transparent text-text-dim hover:text-text'}`}
          >
            Loyalty ({customers.length})
          </button>
          <button
            onClick={() => setTab('voucher')}
            className={`px-5 py-3 text-xs font-semibold border-b-2 cursor-pointer bg-transparent ${tab === 'voucher' ? 'border-text text-text' : 'border-transparent text-text-dim hover:text-text'}`}
          >
            Voucher
          </button>
        </div>

        {/* Loyalty tab */}
        {tab === 'loyalty' && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-surface-2 border border-border rounded-xl p-4">
                <p className="text-text-dim text-xs uppercase tracking-wider mb-1">Tổng khách hàng</p>
                <p className="text-2xl font-bold text-text">{customers.length}</p>
              </div>
              <div className="bg-surface-2 border border-border rounded-xl p-4">
                <p className="text-text-dim text-xs uppercase tracking-wider mb-1">Kim Cương</p>
                <p className="text-2xl font-bold text-text">{diamondCount}</p>
              </div>
              <div className="bg-surface-2 border border-border rounded-xl p-4">
                <p className="text-text-dim text-xs uppercase tracking-wider mb-1">Tổng điểm tích luỹ</p>
                <p className="text-2xl font-bold text-text">
                  {totalPoints.toLocaleString('vi-VN')}
                </p>
              </div>
              <div className="bg-surface-2 border border-border rounded-xl p-4">
                <p className="text-text-dim text-xs uppercase tracking-wider mb-1">Voucher đang chạy</p>
                <p className="text-2xl font-bold text-text">{mockVouchers.filter(v => v.status === 'active').length}</p>
              </div>
            </div>

            <Card title="Danh sách khách hàng thân thiết">
              {isLoading ? (
                <div className="p-8 text-center text-text-muted">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-2"></div>
                  Đang tải dữ liệu khách hàng...
                </div>
              ) : error ? (
                <div className="p-6 text-center text-error text-sm">{error}</div>
              ) : customers.length === 0 ? (
                <div className="p-8 text-center text-text-muted text-sm">
                  Chưa có khách hàng nào được ghi nhận. Khách hàng sẽ tự động được thêm vào khi bán hàng qua POS.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-text-dim uppercase tracking-wider">Khách hàng</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-text-dim uppercase tracking-wider">SĐT</th>
                        <th className="px-4 py-3 text-center text-[11px] font-semibold text-text-dim uppercase tracking-wider">Hạng</th>
                        <th className="px-4 py-3 text-right text-[11px] font-semibold text-text-dim uppercase tracking-wider">Điểm</th>
                        <th className="px-4 py-3 text-right text-[11px] font-semibold text-text-dim uppercase tracking-wider">Tổng chi tiêu</th>
                        <th className="px-4 py-3 text-right text-[11px] font-semibold text-text-dim uppercase tracking-wider">Số đơn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {customers.slice().sort((a, b) => b.points - a.points).map(c => (
                        <tr key={c.id} className="hover:bg-surface-2">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center text-text text-[11px] font-bold shrink-0">
                                {(c.name || 'K').charAt(0).toUpperCase()}
                              </div>
                              <span className="text-text font-medium text-sm">{c.name || 'Khách vãng lai'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-text-muted text-sm">{c.phone}</td>
                          <td className="px-4 py-3 text-center">{tierBadge(c.tier)}</td>
                          <td className="px-4 py-3 text-right text-text font-semibold">{c.points.toLocaleString('vi-VN')}</td>
                          <td className="px-4 py-3 text-right text-text">{(c.totalSpent || 0).toLocaleString('vi-VN')}đ</td>
                          <td className="px-4 py-3 text-right text-text-muted">{c.totalOrders || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}

        {/* Voucher tab */}
        {tab === 'voucher' && (
          <div className="grid grid-cols-2 gap-4">
            {mockVouchers.map(v => (
              <div key={v.id} className={`bg-surface-2 border rounded-xl p-5 ${v.status === 'active' ? 'border-border' : 'border-border'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-mono text-text font-bold text-base tracking-widest">{v.code}</p>
                    <p className="text-text-muted text-xs mt-0.5">
                      Giảm {v.discountType === 'percent' ? v.discountValue + '%' : v.discountValue.toLocaleString('vi-VN') + 'đ'}
                      {' · '}Đơn tối thiểu {v.minOrder.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                  {voucherStatusBadge(v.status)}
                </div>

                {/* Usage bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-text-dim mb-1">
                    <span>Đã dùng</span>
                    <span>{v.usageCount}/{v.maxUsage}</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${v.status === 'active' ? 'bg-text' : 'bg-border'}`}
                      style={{ width: `${(v.usageCount / v.maxUsage) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-text-dim">
                  <span>HSD: {new Date(v.expiry).toLocaleDateString('vi-VN')}</span>
                  {v.status === 'active' && (
                    <span className="text-text font-medium cursor-pointer hover:underline">Gửi cho KH</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && <VoucherModal onClose={() => setShowModal(false)} />}
      </div>
    </PageLayout>
  );
}
