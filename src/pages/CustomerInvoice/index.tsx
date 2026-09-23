import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchInvoiceDetailApi, type BackendInvoice } from '../../services/groceryApi';

function formatCurrency(n: number) {
  return n.toLocaleString('vi-VN') + ' đ';
}

function VietQRTransferCard({ total, id }: { total: number; id: string }) {
  const qrUrl = `https://api.vietqr.io/image/970422-0901234567-compact2.jpg?amount=${total}&addInfo=${encodeURIComponent(id)}`;

  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col items-center">
      <p className="text-xs font-semibold text-text mb-1">Quét mã VietQR để thanh toán</p>
      <p className="text-[11px] text-text-dim mb-3">Ngân hàng Quân Đội (MBBank) · 0901234567</p>

      <div className="bg-white p-2.5 rounded-lg border border-border mb-3">
        <img src={qrUrl} alt="VietQR" className="w-44 h-44 object-contain" />
      </div>

      <div className="w-full bg-surface-2 p-2.5 rounded-lg border border-border text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-text-dim">Chủ TK:</span>
          <span className="font-semibold text-text">NGUYEN VAN MINH</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-dim">Số TK:</span>
          <span className="font-mono font-bold text-text">0901234567</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-dim">Nội dung CK:</span>
          <span className="font-mono font-bold text-text">{id}</span>
        </div>
      </div>
    </div>
  );
}

export default function CustomerInvoice() {
  const { id } = useParams<{ id: string }>();

  const [invoice, setInvoice] = useState<BackendInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('paid');

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function loadInvoice() {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const data = await fetchInvoiceDetailApi(id!);
        if (isMounted) {
          setInvoice(data);
          setPaymentStatus(data.payStatus || 'paid');
        }
      } catch {
        // Fallback to localStorage if exists
        const stored = localStorage.getItem(`invoice-${id}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (isMounted) {
              setInvoice(parsed);
              setPaymentStatus(parsed.paymentStatus || 'paid');
            }
            return;
          } catch {
            //
          }
        }
        if (isMounted) {
          setErrorMsg('Không tìm thấy thông tin hóa đơn này trên hệ thống.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadInvoice();
    return () => { isMounted = false; };
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 rounded-full border-2 border-text/20 border-t-text animate-spin mb-2" />
        <p className="text-xs text-text-muted">Đang tải hóa đơn điện tử...</p>
      </div>
    );
  }

  if (errorMsg || !invoice) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-base font-bold text-text mb-1">Không tìm thấy hoá đơn</h2>
        <p className="text-xs text-text-dim mb-4">{errorMsg || 'Mã hóa đơn không tồn tại hoặc đã bị xóa.'}</p>
        <Link
          to="/lookup"
          className="px-4 py-2 rounded-lg bg-text text-bg text-xs font-semibold"
        >
          Quay lại tra cứu
        </Link>
      </div>
    );
  }

  const isUnpaid = paymentStatus === 'unpaid';

  return (
    <div className="min-h-screen bg-bg py-6 px-4 font-sans">
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-text text-bg rounded flex items-center justify-center">
              <span className="text-xs font-bold">P</span>
            </div>
            <span className="font-bold text-text text-base tracking-tight">PaperLess+</span>
          </div>
          <h1 className="text-base font-bold text-text">Hóa đơn điện tử</h1>
          <p className="text-text-dim text-xs mt-0.5">{invoice.branchName || 'Cửa hàng Tạp hoá Minh Phát'}</p>
        </div>

        {/* Payment Status Banner */}
        <div className={`mb-4 px-4 py-2.5 rounded-lg border text-center text-xs font-medium flex items-center justify-center gap-2 ${
          isUnpaid
            ? 'bg-surface-2 border-border text-text-muted'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold'
        }`}>
          {isUnpaid ? (
            <span>Chờ thanh toán qua VietQR</span>
          ) : (
            <span>✓ Đã thanh toán thành công ({invoice.payMethod?.toUpperCase() || 'TIỀN MẶT'})</span>
          )}
        </div>

        {/* VietQR Transfer Card if unpaid */}
        {isUnpaid && (
          <div className="mb-4">
            <VietQRTransferCard total={invoice.total} id={invoice.id} />
          </div>
        )}

        {/* Invoice Card */}
        <div className="bg-surface-2 border border-border rounded-xl overflow-hidden mb-4">
          {/* Top strip */}
          <div className="bg-surface border-b border-border px-5 py-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] text-text-dim uppercase tracking-wider">Mã hóa đơn</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-text font-bold text-sm">{invoice.id}</p>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-2 border border-border font-mono text-text-muted">
                    Phiếu #{invoice.ticketNumber}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-text-dim">
                  {new Date(invoice.createdAt).toLocaleString('vi-VN', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Customer info */}
          <div className="px-5 py-3.5 border-b border-border text-xs">
            <p className="text-[10px] text-text-dim uppercase tracking-wider mb-1">Khách hàng</p>
            <p className="text-text font-semibold">{invoice.customerName || 'Khách lẻ'}</p>
            {invoice.customerPhone && (
              <p className="text-text-muted mt-0.5">{invoice.customerPhone}</p>
            )}
          </div>

          {/* Items */}
          <div className="px-5 py-3.5 border-b border-border">
            <p className="text-[10px] text-text-dim uppercase tracking-wider mb-2">Chi tiết sản phẩm</p>
            <div className="space-y-2">
              {invoice.items.map(item => (
                <div key={item.id} className="flex justify-between items-center text-xs">
                  <div>
                    <p className="text-text font-medium">{item.name}</p>
                    <p className="text-[11px] text-text-dim">
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <p className="text-text font-bold">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="px-5 py-3.5 border-b border-border flex flex-col gap-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-text-muted">Tạm tính</span>
              <span className="text-text">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Giảm giá</span>
                <span>-{formatCurrency(invoice.discount)}</span>
              </div>
            )}
            {invoice.tax > 0 && (
              <div className="flex justify-between">
                <span className="text-text-muted">Thuế VAT</span>
                <span className="text-text">{formatCurrency(invoice.tax)}</span>
              </div>
            )}
            {invoice.cashGiven > 0 && invoice.payMethod === 'cash' && (
              <>
                <div className="flex justify-between text-text-dim pt-1 border-t border-border/50">
                  <span>Tiền khách đưa:</span>
                  <span>{formatCurrency(invoice.cashGiven)}</span>
                </div>
                {invoice.changeDue > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Tiền thối lại:</span>
                    <span>{formatCurrency(invoice.changeDue)}</span>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="px-5 py-3.5 flex justify-between items-center bg-surface">
            <span className="text-text font-bold text-xs uppercase tracking-wider">Tổng thanh toán</span>
            <span className="text-text font-bold text-lg">{formatCurrency(invoice.total)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => window.print()}
            className="w-full py-2.5 rounded-lg bg-text text-bg hover:opacity-90 font-semibold text-xs cursor-pointer border border-text text-center transition-opacity"
          >
            In / Lưu hoá đơn (PDF)
          </button>
          <Link to="/lookup">
            <button className="w-full py-2.5 rounded-lg bg-surface border border-border text-text hover:bg-surface-2 text-xs cursor-pointer font-medium transition-colors">
              Tra cứu hóa đơn khác
            </button>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-text-dim text-[10px] mt-6">
          Hóa đơn điện tử được phát hành bởi hệ thống PaperLess+ · paperless.vn
        </p>
      </div>
    </div>
  );
}
