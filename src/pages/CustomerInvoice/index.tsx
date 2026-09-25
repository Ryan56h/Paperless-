import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchInvoiceDetailApi, lookupInvoicesApi, type BackendInvoice } from '../../services/groceryApi';

function formatCurrency(n: number) {
  return n.toLocaleString('vi-VN') + ' đ';
}

function VietQRTransferCard({ total, id }: { total: number; id: string }) {
  const qrUrl = `https://api.vietqr.io/image/970422-0901234567-compact2.jpg?amount=${total}&addInfo=${encodeURIComponent(id)}`;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center shadow-xs">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
        Quét mã VietQR thanh toán
      </p>
      <p className="text-[11px] text-slate-500 mb-3">Ngân hàng Quân Đội (MBBank) · 0901234567</p>

      <div className="bg-white p-2.5 rounded-xl border border-slate-200 mb-3">
        <img src={qrUrl} alt="VietQR" className="w-44 h-44 object-contain" />
      </div>

      <div className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
        <div className="flex justify-between">
          <span className="text-slate-500">Chủ TK:</span>
          <span className="font-bold text-slate-800">NGUYEN VAN MINH</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Số TK:</span>
          <span className="font-mono font-bold text-slate-900">0901234567</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Nội dung CK:</span>
          <span className="font-mono font-bold text-emerald-700">{id}</span>
        </div>
      </div>
    </div>
  );
}

export default function CustomerInvoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<BackendInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('paid');

  // Danh sách các hoá đơn khác của khách hàng (lấy theo SĐT)
  const [otherInvoices, setOtherInvoices] = useState<BackendInvoice[]>([]);
  const [isLoadingOthers, setIsLoadingOthers] = useState(false);

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

  // Tải các hoá đơn khác của khách hàng dựa theo SĐT
  useEffect(() => {
    const phone = invoice?.customerPhone?.trim();
    if (!phone) {
      setOtherInvoices([]);
      return;
    }

    let isMounted = true;
    async function fetchOtherInvoices(targetPhone: string) {
      setIsLoadingOthers(true);
      try {
        const data = await lookupInvoicesApi(targetPhone);
        if (isMounted) {
          setOtherInvoices(data);
        }
      } catch {
        if (isMounted) setOtherInvoices([]);
      } finally {
        if (isMounted) setIsLoadingOthers(false);
      }
    }

    fetchOtherInvoices(phone);
    return () => { isMounted = false; };
  }, [invoice?.customerPhone]);

  // Phân chia hoá đơn theo từng Cửa hàng (Shop / Branch)
  const invoicesByShop = useMemo(() => {
    const groups: Record<string, BackendInvoice[]> = {};
    otherInvoices.forEach(inv => {
      const shopName = inv.branchName?.trim() || 'Cửa hàng PaperLess';
      if (!groups[shopName]) {
        groups[shopName] = [];
      }
      groups[shopName].push(inv);
    });
    return groups;
  }, [otherInvoices]);

  const handleReturn = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/lookup');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-600/30 border-t-emerald-600 animate-spin mb-3" />
        <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Đang tải hóa đơn điện tử...
        </p>
      </div>
    );
  }

  if (errorMsg || !invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 font-black flex items-center justify-center mx-auto mb-3 text-lg">
          !
        </div>
        <h2 className="text-base font-black uppercase text-slate-900 mb-1">Không tìm thấy hoá đơn</h2>
        <p className="text-xs text-slate-500 mb-5">{errorMsg || 'Mã hóa đơn không tồn tại hoặc đã bị xóa.'}</p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={handleReturn}
            className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Quay lại
          </button>
          <Link
            to="/lookup"
            className="px-5 py-2.5 rounded-xl bg-[#09261e] text-white hover:bg-emerald-900 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Tra cứu hoá đơn khác
          </Link>
        </div>
      </div>
    );
  }

  const isUnpaid = paymentStatus === 'unpaid';

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* ─── STICKY TOP NAVIGATION BAR (CÓ NÚT QUAY LẠI) ───────── */}
      <header className="sticky top-0 z-40 bg-[#09261e] border-b border-emerald-900/60 shadow-xs px-4 sm:px-6 h-14 flex items-center justify-between">
        <button
          onClick={handleReturn}
          className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-200 hover:text-white border border-emerald-700/80 hover:border-emerald-500 transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <span>←</span>
          <span>Quay lại</span>
        </button>

        <Link to="/" className="text-sm font-black tracking-wider text-white uppercase">
          PAPERLESS<span className="text-amber-400">+</span>
        </Link>

        <Link
          to="/lookup"
          className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400 hover:bg-amber-500 text-slate-950 transition-colors shadow-sm"
        >
          Tra cứu khác
        </Link>
      </header>

      {/* ─── MAIN CONTENT ─────────────────────────────────────── */}
      <div className="max-w-md mx-auto py-6 px-4">
        {/* Brand & Store Header */}
        <div className="text-center mb-5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100/60 px-2.5 py-0.5 rounded-full border border-emerald-200">
            HÓA ĐƠN ĐIỆN TỬ
          </span>
          <h1 className="text-lg font-black uppercase tracking-tight text-slate-900 mt-2">
            {invoice.branchName || 'Cửa hàng PaperLess'}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 font-mono">
            Mã đơn: {invoice.id}
          </p>
        </div>

        {/* Payment Status Banner */}
        <div
          className={`mb-4 px-4 py-2.5 rounded-xl border text-center text-xs font-bold uppercase tracking-wider ${
            isUnpaid
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {isUnpaid ? (
            <span>Chờ thanh toán qua VietQR</span>
          ) : (
            <span>Đã thanh toán ({invoice.payMethod?.toUpperCase() || 'TIỀN MẶT'})</span>
          )}
        </div>

        {/* VietQR Transfer Card if unpaid */}
        {isUnpaid && (
          <div className="mb-4">
            <VietQRTransferCard total={invoice.total} id={invoice.id} />
          </div>
        )}

        {/* ─── CHI TIẾT HOÁ ĐƠN HIỆN TẠI ────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-5 shadow-xs">
          {/* Top strip */}
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Mã hóa đơn
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="font-mono text-slate-900 font-black text-sm">{invoice.id}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-slate-600 font-semibold">
                    Phiếu #{invoice.ticketNumber}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-medium">
                  {new Date(invoice.createdAt).toLocaleString('vi-VN', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Customer info */}
          <div className="px-5 py-3.5 border-b border-slate-100 text-xs">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
              Khách hàng
            </p>
            <p className="text-slate-900 font-bold">{invoice.customerName || 'Khách lẻ'}</p>
            {invoice.customerPhone && (
              <p className="text-slate-500 font-mono mt-0.5">{invoice.customerPhone}</p>
            )}
          </div>

          {/* Items */}
          <div className="px-5 py-3.5 border-b border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2.5">
              Chi tiết sản phẩm
            </p>
            <div className="space-y-2.5">
              {invoice.items.map(item => (
                <div key={item.id} className="flex justify-between items-center text-xs">
                  <div>
                    <p className="text-slate-800 font-semibold">{item.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <p className="text-slate-900 font-bold font-mono">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col gap-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Tạm tính</span>
              <span className="font-mono text-slate-800 font-semibold">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-red-500 font-semibold">
                <span>Giảm giá</span>
                <span className="font-mono">-{formatCurrency(invoice.discount)}</span>
              </div>
            )}
            {invoice.tax > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Thuế VAT</span>
                <span className="font-mono">{formatCurrency(invoice.tax)}</span>
              </div>
            )}
            {invoice.cashGiven > 0 && invoice.payMethod === 'cash' && (
              <>
                <div className="flex justify-between text-slate-400 pt-1.5 border-t border-slate-100">
                  <span>Tiền khách đưa:</span>
                  <span className="font-mono font-semibold text-slate-700">{formatCurrency(invoice.cashGiven)}</span>
                </div>
                {invoice.changeDue > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Tiền thối lại:</span>
                    <span className="font-mono">{formatCurrency(invoice.changeDue)}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Grand total */}
          <div className="px-5 py-4 flex justify-between items-center bg-slate-50">
            <span className="text-slate-900 font-black text-xs uppercase tracking-wider">
              Tổng thanh toán
            </span>
            <span className="text-emerald-700 font-black text-xl font-mono">
              {formatCurrency(invoice.total)}
            </span>
          </div>
        </div>

        {/* In / Lưu PDF Action */}
        <div className="mb-6">
          <button
            onClick={() => window.print()}
            className="w-full py-3 rounded-xl bg-[#09261e] hover:bg-emerald-900 text-white font-bold text-xs uppercase tracking-wider cursor-pointer text-center transition-colors shadow-sm"
          >
            In / Lưu hoá đơn (PDF)
          </button>
        </div>

        {/* ─── XEM NHIỀU HOÁ ĐƠN & PHÂN CHIA THEO SHOP ─────────── */}
        {invoice.customerPhone && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Hoá đơn của quý khách
                </h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  SĐT: {invoice.customerPhone} ({otherInvoices.length} đơn mua)
                </p>
              </div>
              {isLoadingOthers && (
                <span className="text-[10px] text-slate-400 font-medium">Đang tải...</span>
              )}
            </div>

            {Object.keys(invoicesByShop).length === 0 && !isLoadingOthers && (
              <p className="text-xs text-slate-400 text-center py-4">
                Chưa có hoá đơn nào khác cho số điện thoại này.
              </p>
            )}

            {/* Danh sách phân chia theo từng Shop */}
            {Object.entries(invoicesByShop).map(([shopName, shopInvoices]) => (
              <div
                key={shopName}
                className="mb-4 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
              >
                {/* Header từng Shop */}
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
                    Cửa hàng: {shopName}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {shopInvoices.length} hoá đơn
                  </span>
                </div>

                {/* Danh sách hoá đơn thuộc Shop này */}
                <div className="divide-y divide-slate-100">
                  {shopInvoices.map(inv => {
                    const isCurrent = inv.id === invoice.id;
                    return (
                      <div
                        key={inv.id}
                        onClick={() => {
                          if (!isCurrent) {
                            navigate(`/invoice/${inv.id}`);
                          }
                        }}
                        className={`p-3.5 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-emerald-50/70 border-l-4 border-l-emerald-600'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-slate-900">{inv.id}</span>
                            {isCurrent && (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-600 text-white">
                                Đang xem
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(inv.createdAt).toLocaleString('vi-VN', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })} · {inv.items.length} món
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-slate-900">
                            {formatCurrency(inv.total)}
                          </p>
                          {!isCurrent && (
                            <span className="text-[10px] text-emerald-700 font-semibold hover:underline">
                              Xem hoá đơn này →
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Nút quay lại tra cứu khác ở cuối */}
        <div className="mt-4">
          <button
            onClick={handleReturn}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            ← Quay lại trang trước
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-[10px] mt-6 uppercase tracking-wider font-semibold">
          Hoá đơn điện tử phát hành bởi hệ thống PAPERLESS+
        </p>
      </div>
    </div>
  );
}
