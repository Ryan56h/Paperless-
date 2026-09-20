import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { findInvoiceById } from '../../data/mockData';

function formatCurrency(n: number) {
  return n.toLocaleString('vi-VN') + 'đ';
}

function VietQRTransferCard({ total, id }: { total: number; id: string }) {
  return (
    <div className="bg-bg border border-border p-4 rounded-xl flex flex-col items-center gap-3 w-full">
      <div className="flex justify-between items-center w-full border-b border-border pb-2 mb-1">
        <span className="text-[9px] font-black text-[#00529C] bg-white px-2 py-0.5 rounded border border-gray-200">VietQR</span>
        <span className="text-[10px] text-text-muted font-bold">MB BANK (Ngân hàng Quân Đội)</span>
      </div>

      {/* Mock QR */}
      <div className="w-40 h-40 bg-white p-2.5 rounded-xl flex items-center justify-center relative">
        <div className="w-full h-full bg-black rounded-lg grid grid-cols-9 grid-rows-9 gap-0.5 p-1.5">
          {Array.from({ length: 81 }).map((_, i) => {
            const col = i % 9;
            const row = Math.floor(i / 9);
            const isCorner =
              (row < 3 && col < 3) ||
              (row < 3 && col > 5) ||
              (row > 5 && col < 3);
            const isCenter = row === 4 && col === 4;
            const isFilled = isCorner || isCenter || Math.random() > 0.45;
            return (
              <div
                key={i}
                className={`rounded-[1px] ${isFilled ? 'bg-white' : 'bg-black'}`}
              />
            );
          })}
        </div>
        {/* Mock VietQR brand tag at center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-black rounded flex items-center justify-center">
          <span className="text-[9px] font-bold text-black">P</span>
        </div>
      </div>

      <div className="w-full text-xs text-text-muted mt-1 space-y-1.5">
        <div className="flex justify-between items-center">
          <span>Chủ TK:</span>
          <span className="text-text font-bold uppercase text-[10px] text-right">CÔNG TY CỔ PHẦN PAPERLESS+</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Số TK:</span>
          <span className="text-text font-mono font-bold text-right">990928374928</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Số tiền:</span>
          <span className="text-text font-bold text-right">{total.toLocaleString('vi-VN')}đ</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Nội dung:</span>
          <span className="text-text font-mono font-bold bg-surface-2 border border-border px-1.5 py-0.5 rounded text-[10px] text-right">{`PL ${id}`}</span>
        </div>
      </div>
    </div>
  );
}

export default function CustomerInvoice() {
  const { id } = useParams<{ id: string }>();

  // Look up in localStorage first, then fallback to mock data
  const localInvoiceRaw = id ? localStorage.getItem(`invoice-${id}`) : null;
  const localInvoice = localInvoiceRaw ? JSON.parse(localInvoiceRaw) : null;
  const initialInvoice = localInvoice || (id ? findInvoiceById(id) : null);

  // Fallback demo invoice
  const data = initialInvoice ?? {
    id: id ?? 'PL-DEMO-001',
    customerName: 'Khách hàng',
    customerPhone: '09xxxxxxxx',
    branch: 'Chi nhánh Q1',
    staffName: 'Nhân viên',
    items: [
      { id: '1', name: 'Cà phê sữa đá', quantity: 2, unitPrice: 45000 },
      { id: '2', name: 'Bánh croissant', quantity: 1, unitPrice: 35000 },
    ],
    subtotal: 125000,
    discount: 0,
    tax: 12500,
    total: 137500,
    createdAt: new Date().toISOString(),
    sendChannel: 'zalo',
    sendStatus: 'sent',
    customerId: 'KH000',
    requirePayment: true,
    paymentStatus: 'unpaid',
  };

  const [paymentStatus, setPaymentStatus] = useState<string>(() => {
    return data.paymentStatus ?? 'unpaid';
  });

  // PayOS Webhook Simulator
  useEffect(() => {
    if (data.requirePayment && paymentStatus === 'unpaid') {
      const timer = setTimeout(() => {
        setPaymentStatus('paid');

        // Also update local copy in localStorage
        if (id) {
          const stored = localStorage.getItem(`invoice-${id}`);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              parsed.paymentStatus = 'paid';
              localStorage.setItem(`invoice-${id}`, JSON.stringify(parsed));
            } catch (e) {
              console.error(e);
            }
          }
        }
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [paymentStatus, id, data.requirePayment]);

  return (
    <div className="min-h-screen bg-bg py-6 px-4">
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-text text-bg rounded flex items-center justify-center">
              <span className="text-xs font-bold">P</span>
            </div>
            <span className="font-bold text-text text-base tracking-tight">Paperless</span>
          </div>
          <h1 className="text-base font-bold text-text">Hóa đơn điện tử</h1>
          <p className="text-text-dim text-xs mt-0.5">{data.branch}</p>
        </div>

        {/* Payment Status Banner */}
        {data.requirePayment && (
          <div className={`mb-4 px-4 py-2.5 rounded-lg border text-center text-xs font-medium flex items-center justify-center gap-2 ${paymentStatus === 'unpaid'
              ? 'bg-surface-2 border-border text-text-muted'
              : 'bg-surface border-border text-text font-semibold'
            }`}>
            {paymentStatus === 'unpaid' ? (
              <span>Chờ thanh toán qua PayOS (Tự động cập nhật...)</span>
            ) : (
              <span>✓ Đã thanh toán thành công qua PayOS</span>
            )}
          </div>
        )}

        {/* VietQR Transfer Card if unpaid */}
        {data.requirePayment && paymentStatus === 'unpaid' && (
          <div className="mb-4">
            <VietQRTransferCard total={data.total} id={data.id} />
          </div>
        )}

        {/* Invoice card */}
        <div className="bg-surface-2 border border-border rounded-xl overflow-hidden mb-4">
          {/* Top strip */}
          <div className="bg-surface border-b border-border px-5 py-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] text-text-dim uppercase tracking-wider">Mã hóa đơn</p>
                <p className="font-mono text-text font-bold text-sm">{data.id}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-text-dim">
                  {new Date(data.createdAt).toLocaleString('vi-VN', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Customer info */}
          <div className="px-5 py-4 border-b border-border">
            <p className="text-xs text-text-dim mb-1">Khách hàng</p>
            <p className="text-text font-semibold">{data.customerName}</p>
            <p className="text-text-muted text-xs">{data.customerPhone}</p>
          </div>

          {/* Items */}
          <div className="px-5 py-4 border-b border-border">
            <p className="text-xs text-text-dim uppercase tracking-wider mb-3">Sản phẩm</p>
            {data.items.map((item: any) => (
              <div key={item.id} className="flex justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm text-text">{item.name}</p>
                  <p className="text-xs text-text-dim">×{item.quantity} × {formatCurrency(item.unitPrice)}</p>
                </div>
                <p className="text-sm text-text font-medium">{formatCurrency(item.quantity * item.unitPrice)}</p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="px-5 py-4 border-b border-border flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Tạm tính</span>
              <span className="text-text">{formatCurrency(data.subtotal)}</span>
            </div>
            {data.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-text-muted">Giảm giá</span>
                <span className="text-[#EF4444]">-{formatCurrency(data.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-text-muted">Thuế VAT (10%)</span>
              <span className="text-text">{formatCurrency(data.tax)}</span>
            </div>
          </div>

          <div className="px-5 py-4 flex justify-between items-center">
            <span className="text-text font-bold">Tổng cộng</span>
            <span className="text-text font-bold text-xl">{formatCurrency(data.total)}</span>
          </div>
        </div>


        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            disabled={data.requirePayment && paymentStatus === 'unpaid'}
            className={`w-full py-2.5 rounded-lg font-medium text-xs cursor-pointer ${data.requirePayment && paymentStatus === 'unpaid'
                ? 'bg-surface-2 text-text-dim cursor-not-allowed border border-border'
                : 'bg-text text-bg hover:opacity-90 border border-text'
              }`}
          >
            {data.requirePayment && paymentStatus === 'unpaid'
              ? 'Vui lòng thanh toán VietQR để tải PDF'
              : 'Tải PDF'}
          </button>
          <Link to="/lookup">
            <button className="w-full py-2.5 rounded-lg bg-surface border border-border text-text-muted hover:text-text text-xs cursor-pointer font-medium">
              Tra cứu hóa đơn khác
            </button>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-[#4B5563] text-[10px] mt-6">
          Hóa đơn điện tử được phát hành bởi PaperLess+ · paperless.vn
        </p>
      </div>
    </div>
  );
}
