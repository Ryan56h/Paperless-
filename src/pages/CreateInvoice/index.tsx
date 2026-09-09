import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { findCustomerByPhone } from '../../data/mockData';
import type { Customer, InvoiceItem } from '../../types';

let itemIdCounter = 1;

function newItem(): InvoiceItem {
  return { id: `item-${itemIdCounter++}`, name: '', quantity: 1, unitPrice: 0 };
}

export default function CreateInvoice() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [channel, setChannel] = useState<'zalo' | 'sms' | 'both'>('zalo');
  const [items, setItems] = useState<InvoiceItem[]>(() => {
    const rawPosDraft = sessionStorage.getItem('posOrderDraft');
    if (rawPosDraft) {
      try {
        const parsed = JSON.parse(rawPosDraft);
        if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
          return parsed.items;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return [newItem()];
  });
  const [discount, setDiscount] = useState(0);
  const [requirePayment, setRequirePayment] = useState(true);

  const lookupPhone = () => {
    const c = findCustomerByPhone(phone);
    if (c) {
      setFoundCustomer(c);
      setCustomerName(c.name);
    } else {
      setFoundCustomer(null);
      setCustomerName('');
    }
  };

  const addItem = () => setItems(prev => [...prev, newItem()]);

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax - discount;

  const handlePreview = () => {
    const draft = { phone, customerName, channel, items, subtotal, tax, discount, total, requirePayment };
    sessionStorage.setItem('invoiceDraft', JSON.stringify(draft));
    navigate('/staff/invoice/confirm');
  };

  const canSubmit = phone.length >= 9 && customerName && items.some(i => i.name && i.unitPrice > 0);

  return (
    <PageLayout role="staff">
      <div className="px-8 py-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-text">Tạo hóa đơn mới</h1>
          <p className="text-text-dim text-sm mt-0.5">Nhập thông tin khách hàng và sản phẩm</p>
        </div>

        {/* Section 1: Customer */}
        <Card title="1. Thông tin khách hàng" className="mb-4">
          <div className="p-5 flex flex-col gap-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Input
                  id="phone-input"
                  label="Số điện thoại khách hàng"
                  placeholder="0901234567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  hint="Nhập SĐT để tra cứu khách hàng có sẵn"
                />
              </div>
              <Button variant="secondary" onClick={lookupPhone}>Tra cứu</Button>
            </div>

            {foundCustomer && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#55C244]/10 border border-[#55C244]/30">
                <div className="w-8 h-8 rounded-full bg-[#55C244]/20 border border-[#55C244]/40 flex items-center justify-center text-[#55C244] text-xs font-bold">
                  {foundCustomer.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text">{foundCustomer.name}</p>
                  <p className="text-text-muted text-xs">{foundCustomer.points.toLocaleString()} điểm · {foundCustomer.tier.toUpperCase()} · {foundCustomer.totalOrders} đơn hàng</p>
                </div>
                <span className="ml-auto text-[10px] font-bold text-[#55C244] border border-[#55C244]/40 px-2 py-0.5 rounded">Khách cũ</span>
              </div>
            )}

            {!foundCustomer && phone.length >= 9 && (
              <div className="px-4 py-3 rounded-lg bg-border border border-border">
                <p className="text-text-muted text-xs">Khách hàng mới — sẽ được tạo tài khoản tự động</p>
              </div>
            )}

            <Input
              id="customer-name"
              label="Tên khách hàng"
              placeholder="Nguyễn Văn A"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
            />

            <div>
              <p className="text-sm font-medium text-[#D1D5DB] mb-2">Kênh gửi hóa đơn</p>
              <div className="flex gap-2">
                {(['zalo', 'sms', 'both'] as const).map(ch => (
                  <button
                    key={ch}
                    onClick={() => setChannel(ch)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border cursor-pointer ${
                      channel === ch
                        ? ch === 'zalo' ? 'bg-[#0068FF]/15 border-[#0068FF]/50 text-[#4D9FFF]'
                          : ch === 'sms' ? 'bg-[#F59E0B]/15 border-[#F59E0B]/50 text-[#F59E0B]'
                          : 'bg-[#55C244]/15 border-[#55C244]/50 text-[#55C244]'
                        : 'border-border text-text-dim bg-transparent'
                    }`}
                  >
                    {ch === 'zalo' ? 'Zalo' : ch === 'sms' ? 'SMS' : 'Cả hai'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Section 2: Products */}
        <Card title="2. Danh sách sản phẩm" action={<Button size="sm" variant="ghost" onClick={addItem}>+ Thêm dòng</Button>} className="mb-4">
          <div className="p-5">
            <div className="grid grid-cols-[1fr_80px_110px_28px] gap-2 mb-2">
              <span className="text-[11px] text-text-dim uppercase tracking-wider">Tên sản phẩm</span>
              <span className="text-[11px] text-text-dim uppercase tracking-wider text-center">SL</span>
              <span className="text-[11px] text-text-dim uppercase tracking-wider text-right">Đơn giá</span>
              <span></span>
            </div>
            <div className="flex flex-col gap-2">
              {items.map(item => (
                <div key={item.id} className="grid grid-cols-[1fr_80px_110px_28px] gap-2 items-center">
                  <input
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text placeholder-text-dim focus:outline-none focus:border-[#55C244]"
                    placeholder="Tên sản phẩm..."
                    value={item.name}
                    onChange={e => updateItem(item.id, 'name', e.target.value)}
                  />
                  <input
                    type="number"
                    min={1}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text text-center focus:outline-none focus:border-[#55C244]"
                    value={item.quantity}
                    onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                  />
                  <input
                    type="number"
                    min={0}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text text-right focus:outline-none focus:border-[#55C244]"
                    placeholder="0"
                    value={item.unitPrice || ''}
                    onChange={e => updateItem(item.id, 'unitPrice', parseInt(e.target.value) || 0)}
                  />
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-[#EF4444] text-sm font-bold cursor-pointer hover:text-[#F87171] bg-transparent border-none"
                    disabled={items.length === 1}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Section 3: Summary */}
        <Card title="3. Tóm tắt" className="mb-6">
          <div className="p-5 flex flex-col gap-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Tạm tính</span>
              <span className="text-text">{subtotal.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-text-muted">Chiết khấu</span>
              <input
                type="number"
                min={0}
                className="w-32 px-3 py-1.5 bg-surface border border-border rounded-lg text-sm text-text text-right focus:outline-none focus:border-[#55C244]"
                value={discount || ''}
                placeholder="0"
                onChange={e => setDiscount(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Thuế VAT (10%)</span>
              <span className="text-text">{tax.toLocaleString('vi-VN')}đ</span>
            </div>
            
            <div className="flex items-center justify-between border-t border-border pt-3">
              <div>
                <p className="text-text text-sm font-semibold">Bắt buộc thanh toán qua PayOS</p>
                <p className="text-text-dim text-[11px] mt-0.5">Khách phải quét mã VietQR và thanh toán thành công trước khi xem hóa đơn</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={requirePayment}
                  onChange={e => setRequirePayment(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#9CA3AF] peer-checked:after:bg-bg after:rounded-full after:h-4 after:w-4 peer-checked:bg-[#55C244]" />
              </label>
            </div>

            <div className="border-t border-border pt-3 flex justify-between">
              <span className="text-text font-semibold">Thành tiền</span>
              <span className="text-[#55C244] font-bold text-lg">{total.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => navigate('/staff')}>Hủy</Button>
          <Button disabled={!canSubmit} onClick={handlePreview}>Xem trước & Gửi</Button>
        </div>
      </div>
    </PageLayout>
  );
}
