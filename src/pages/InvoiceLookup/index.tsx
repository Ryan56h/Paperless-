import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { findInvoiceById, findInvoicesByPhone } from '../../data/mockData';
import type { Invoice } from '../../types';
import Badge from '../../components/common/Badge';

function formatCurrency(n: number) { return n.toLocaleString('vi-VN') + 'đ'; }

function sendBadge(status: Invoice['sendStatus']) {
  if (status === 'sent') return <Badge variant="green">Đã gửi</Badge>;
  if (status === 'pending') return <Badge variant="yellow">Đang gửi</Badge>;
  return <Badge variant="red">Thất bại</Badge>;
}

export default function InvoiceLookup() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Invoice[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;
    setSearched(true);
    // Try by ID first, then by phone
    const byId = findInvoiceById(query.trim().toUpperCase());
    if (byId) {
      setResults([byId]);
    } else {
      setResults(findInvoicesByPhone(query.trim()));
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
          <span className="font-bold text-text text-sm tracking-tight">Paperless</span>
        </div>
        <div className="flex gap-4 text-xs font-medium">
          <button 
            onClick={() => navigate(-1)} 
            className="text-text-muted hover:text-text cursor-pointer px-3 py-1.5 border border-border rounded bg-surface-2"
          >
            ← Quay lại
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Search hero */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-text mb-2">Tra cứu hóa đơn</h1>
          <p className="text-text-dim text-sm">Nhập số điện thoại hoặc mã hóa đơn để tra cứu</p>
        </div>

        <div className="flex gap-3 mb-8">
          <input
            id="lookup-input"
            className="flex-1 px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-text placeholder-text-dim focus:outline-none focus:border-text"
            placeholder="VD: 0901234567 hoặc PL-20260529-001"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
          />
          <button
            onClick={handleSearch}
            className="px-6 py-2.5 bg-text text-bg font-semibold text-sm rounded-xl cursor-pointer hover:opacity-90 border border-text"
          >
            Tra cứu
          </button>
        </div>

        {/* Results */}
        {searched && results.length === 0 && (
          <div className="text-center py-16">
            <p className="text-2xl mb-2 text-text-dim">—</p>
            <p className="text-text font-semibold mb-1 text-sm">Không tìm thấy hóa đơn</p>
            <p className="text-text-dim text-xs">Kiểm tra lại SĐT hoặc mã hóa đơn</p>
          </div>
        )}

        {results.length > 0 && (
          <div>
            <p className="text-text-dim text-xs mb-3">Tìm thấy {results.length} hóa đơn</p>
            <div className="flex flex-col gap-3">
              {results.map(inv => (
                <Link key={inv.id} to={`/invoice/${inv.id}`}>
                  <div className="bg-surface-2 border border-border rounded-xl p-4 hover:border-text/40">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-mono text-text font-bold text-sm">{inv.id}</p>
                        <p className="text-text font-medium text-sm mt-0.5">{inv.customerName}</p>
                        <p className="text-text-muted text-xs">{inv.customerPhone}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1.5">
                        <p className="text-text font-bold">{formatCurrency(inv.total)}</p>
                        {sendBadge(inv.sendStatus)}
                      </div>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between items-center">
                      <p className="text-text-dim text-xs">
                        {new Date(inv.createdAt).toLocaleString('vi-VN', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })} · {inv.branch}
                      </p>
                      <span className="text-text text-xs font-medium hover:underline">Xem chi tiết →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!searched && (
          <div className="border border-dashed border-border rounded-xl p-8 text-center">
            <p className="text-text-dim text-xs">Thử: <span className="text-text font-mono underline cursor-pointer" onClick={() => { setQuery('0901234567'); }}>0901234567</span></p>
          </div>
        )}
      </div>
    </div>
  );
}
