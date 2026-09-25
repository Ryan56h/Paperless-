import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { lookupInvoicesApi, type BackendInvoice } from '../../services/groceryApi';

function formatCurrency(n: number) {
  return n.toLocaleString('vi-VN') + ' đ';
}

function sendBadge(status: string) {
  if (status === 'sent') {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
        Đã xuất hoá đơn
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
        Đang gửi
      </span>
    );
  }
  return (
    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
      Chưa gửi
    </span>
  );
}

export default function InvoiceLookup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BackendInvoice[]>([]);
  const [searched, setSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Phân chia danh sách kết quả hoá đơn theo Cửa hàng (Shop)
  const resultsByShop = useMemo(() => {
    const groups: Record<string, BackendInvoice[]> = {};
    results.forEach(inv => {
      const shopName = inv.branchName?.trim() || 'Cửa hàng PaperLess';
      if (!groups[shopName]) groups[shopName] = [];
      groups[shopName].push(inv);
    });
    return groups;
  }, [results]);

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setSearched(true);
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await lookupInvoicesApi(searchTerm.trim());
      setResults(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể tra cứu hóa đơn.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    performSearch(query);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Tự động tìm kiếm ngay khi được chuyển từ trang chủ với query param (?q=...)
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && q.trim()) {
      setQuery(q.trim());
      performSearch(q.trim());
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* ─── HEADER ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#09261e] border-b border-emerald-900/60 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-base font-black tracking-wider text-white uppercase">
              PAPERLESS<span className="text-amber-400">+</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-200 hover:text-white border border-emerald-700/80 hover:border-emerald-500 transition-colors cursor-pointer"
            >
              Quay lại
            </button>
            <Link
              to="/"
              className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400 hover:bg-amber-500 text-slate-950 transition-colors shadow-sm"
            >
              Trang chủ
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO TRA CỨU ──────────────────────────────────────── */}
      <div className="bg-[#09261e] text-white pt-10 pb-12 px-4 sm:px-6 border-b border-emerald-950">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-2">
            HỆ THỐNG TRA CỨU HOÁ ĐƠN
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mb-3">
            Tra cứu hoá đơn điện tử
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 mb-6">
            Nhập số điện thoại khách hàng hoặc mã hóa đơn (VD: PL-20260925-001) để xem lại chi tiết đơn hàng
          </p>

          {/* Ô tìm kiếm */}
          <div className="flex flex-col sm:flex-row gap-2.5 bg-white/10 p-2 rounded-2xl border border-emerald-700/60 backdrop-blur-sm">
            <input
              id="lookup-input"
              className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              placeholder="Nhập SĐT (VD: 0901234567) hoặc mã hoá đơn..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
            />
            <button
              onClick={handleSearch}
              disabled={isLoading || !query.trim()}
              className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-50 transition-colors shadow-sm whitespace-nowrap"
            >
              {isLoading ? 'Đang tra cứu...' : 'Tra cứu ngay'}
            </button>
          </div>
        </div>
      </div>

      {/* ─── KẾT QUẢ TRA CỨU ──────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {searched && !isLoading && results.length === 0 && (
          <div className="text-center py-14 p-8 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              KẾT QUẢ TRA CỨU
            </div>
            <p className="text-slate-900 font-bold mb-1.5 text-sm uppercase">
              Không tìm thấy hóa đơn phù hợp
            </p>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              Vui lòng kiểm tra lại số điện thoại hoặc mã hóa đơn bạn vừa nhập.
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Tìm thấy {results.length} hóa đơn ({Object.keys(resultsByShop).length} cửa hàng)
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Khách hàng hợp lệ
              </span>
            </div>

            {/* Danh sách phân chia theo từng Cửa hàng (Shop) */}
            <div className="space-y-6">
              {Object.entries(resultsByShop).map(([shopName, shopInvoices]) => (
                <div
                  key={shopName}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
                >
                  <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
                      Cửa hàng: {shopName}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {shopInvoices.length} hoá đơn
                    </span>
                  </div>

                  <div className="p-4 flex flex-col gap-3">
                    {shopInvoices.map(inv => (
                      <Link key={inv.id} to={`/invoice/${inv.id}`}>
                        <div className="bg-slate-50/70 border border-slate-200 hover:border-emerald-500 rounded-xl p-4 transition-all hover:bg-white hover:shadow-xs">
                          <div className="flex items-start justify-between mb-2.5 pb-2.5 border-b border-slate-200/60">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-mono text-slate-900 font-black text-sm">{inv.id}</p>
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-slate-600 font-semibold">
                                  Phiếu #{inv.ticketNumber}
                                </span>
                              </div>
                              <p className="text-slate-800 font-bold text-xs mt-1">
                                {inv.customerName || 'Khách lẻ'}
                              </p>
                              {inv.customerPhone && (
                                <p className="text-slate-500 text-xs mt-0.5 font-mono">{inv.customerPhone}</p>
                              )}
                            </div>
                            <div className="text-right flex flex-col items-end gap-1.5">
                              <p className="text-emerald-700 font-black text-base">
                                {formatCurrency(inv.total)}
                              </p>
                              {sendBadge(inv.sendStatus)}
                            </div>
                          </div>

                          <div className="text-xs text-slate-600 mb-2.5 line-clamp-1">
                            {inv.items.map(item => `${item.name} (x${item.quantity})`).join(', ')}
                          </div>

                          <div className="pt-2 flex justify-between items-center text-xs border-t border-slate-100">
                            <p className="text-slate-400 text-[11px]">
                              {new Date(inv.createdAt).toLocaleString('vi-VN', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                            <span className="text-emerald-700 font-bold uppercase text-[11px] hover:underline">
                              Xem chi tiết hoá đơn →
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!searched && (
          <div className="border border-slate-200 bg-white rounded-2xl p-6 text-center space-y-3 shadow-xs">
            <p className="text-slate-500 text-xs font-medium">
              Bạn có thể nhấn thử với các số điện thoại mẫu đã có đơn trong hệ thống:
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 text-xs font-mono font-bold text-slate-700 cursor-pointer transition-colors"
                onClick={() => {
                  setQuery('0901234567');
                  performSearch('0901234567');
                }}
              >
                0901234567
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 text-xs font-mono font-bold text-slate-700 cursor-pointer transition-colors"
                onClick={() => {
                  setQuery('0912345678');
                  performSearch('0912345678');
                }}
              >
                0912345678
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
