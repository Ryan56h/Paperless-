import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { lookupInvoicesApi, type BackendInvoice } from '../../services/groceryApi';

import Badge from '../../components/common/Badge';

function formatCurrency(n: number) {
  return n.toLocaleString('vi-VN') + ' đ';
}

function sendBadge(status: string) {
  if (status === 'sent') return <Badge variant="green">Đã xuất hoá đơn</Badge>;
  if (status === 'pending') return <Badge variant="yellow">Đang gửi</Badge>;
  return <Badge variant="gray">Chưa gửi</Badge>;
}

export default function InvoiceLookup() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BackendInvoice[]>([]);
  const [searched, setSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearched(true);
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await lookupInvoicesApi(query.trim());
      setResults(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể tra cứu hóa đơn.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Top bar */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-text text-bg rounded flex items-center justify-center">
            <span className="text-xs font-bold">P</span>
          </div>
          <span className="font-bold text-text text-sm tracking-tight">PaperLess+</span>
        </div>
        <div className="flex gap-4 text-xs font-medium">
          <button 
            onClick={() => navigate(-1)} 
            className="text-text-muted hover:text-text cursor-pointer px-3 py-1.5 border border-border rounded bg-surface-2"
          >
            ← Quay lại
          </button>
          <Link to="/app/grocery/order" className="text-text-muted hover:text-text py-1.5">Tạp hoá POS</Link>
          <Link to="/app/grocery/display" className="text-text-muted hover:text-text py-1.5">Màn hình gọi số</Link>
          <Link to="/app/grocery/revenue" className="text-text-muted hover:text-text py-1.5">Báo cáo doanh thu</Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Search hero */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text mb-2">Tra cứu hóa đơn điện tử</h1>
          <p className="text-text-dim text-sm">
            Nhập số điện thoại khách hàng hoặc mã hóa đơn (VD: PL-20260923-001)
          </p>
        </div>

        <div className="flex gap-3 mb-6">
          <input
            id="lookup-input"
            className="flex-1 px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-text placeholder-text-dim focus:outline-none focus:border-text"
            placeholder="VD: 0901234567 hoặc PL-20260923-001"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
          />
          <button
            onClick={handleSearch}
            disabled={isLoading || !query.trim()}
            className="px-6 py-2.5 bg-text text-bg font-semibold text-sm rounded-xl cursor-pointer hover:opacity-90 border border-text disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-bg/30 border-t-bg animate-spin" />
                <span>Đang tìm...</span>
              </>
            ) : (
              'Tra cứu'
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Results */}
        {searched && !isLoading && results.length === 0 && (
          <div className="text-center py-16">
            <p className="text-2xl mb-2 text-text-dim">—</p>
            <p className="text-text font-semibold mb-1 text-sm">Không tìm thấy hóa đơn</p>
            <p className="text-text-dim text-xs">
              Vui lòng kiểm tra lại SĐT hoặc mã hóa đơn bạn vừa nhập.
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div>
            <p className="text-text-dim text-xs mb-3">Tìm thấy {results.length} hóa đơn</p>
            <div className="flex flex-col gap-3">
              {results.map(inv => (
                <Link key={inv.id} to={`/invoice/${inv.id}`}>
                  <div className="bg-surface-2 border border-border rounded-xl p-4 hover:border-text/40 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-text font-bold text-sm">{inv.id}</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border font-mono text-text-muted">
                            Phiếu #{inv.ticketNumber}
                          </span>
                        </div>
                        <p className="text-text font-medium text-sm mt-1">{inv.customerName || 'Khách lẻ'}</p>
                        {inv.customerPhone && (
                          <p className="text-text-muted text-xs">{inv.customerPhone}</p>
                        )}
                      </div>
                      <div className="text-right flex flex-col items-end gap-1.5">
                        <p className="text-text font-bold text-base">{formatCurrency(inv.total)}</p>
                        {sendBadge(inv.sendStatus)}
                      </div>
                    </div>

                    <div className="text-xs text-text-muted mb-2 line-clamp-1">
                      {inv.items.map(item => `${item.name} (x${item.quantity})`).join(', ')}
                    </div>

                    <div className="border-t border-border pt-3 flex justify-between items-center text-xs">
                      <p className="text-text-dim">
                        {new Date(inv.createdAt).toLocaleString('vi-VN', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })} · {inv.branchName || 'Cửa hàng Minh Phát'}
                      </p>
                      <span className="text-text font-medium hover:underline">Xem chi tiết hoá đơn →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!searched && (
          <div className="border border-dashed border-border rounded-xl p-8 text-center space-y-2">
            <p className="text-text-dim text-xs">
              Thử tìm kiếm với số điện thoại mẫu có sẵn trong hệ thống:
            </p>
            <div className="flex justify-center gap-3">
              <span
                className="text-text text-xs font-mono underline cursor-pointer hover:text-text-dim"
                onClick={() => { setQuery('0901234567'); }}
              >
                0901234567
              </span>
              <span className="text-text-dim">•</span>
              <span
                className="text-text text-xs font-mono underline cursor-pointer hover:text-text-dim"
                onClick={() => { setQuery('0912345678'); }}
              >
                0912345678
              </span>
              <span className="text-text-dim">•</span>
              <span
                className="text-text text-xs font-mono underline cursor-pointer hover:text-text-dim"
                onClick={() => { setQuery('0923456789'); }}
              >
                0923456789
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
