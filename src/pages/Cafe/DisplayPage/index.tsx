import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useOrder } from '../../../context/OrderContext';
import { useAuth } from '../../../context/AuthContext';
import type { CafeOrder, CafeOrderStatus } from '../../../types';

export default function CafeDisplayPage() {
  const { cafeOrders, updateCafeOrderStatus } = useOrder();
  const { business } = useAuth();

  const [currentTime, setCurrentTime] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const parseOrderTime = (order: CafeOrder): number => {
    if (order.createdAtTimestamp) return order.createdAtTimestamp;
    const parts = order.createdAt.split(':');
    if (parts.length >= 2) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    return 0;
  };

  const sortEarliestFirst = (a: CafeOrder, b: CafeOrder) => {
    return parseOrderTime(a) - parseOrderTime(b);
  };

  const pendingOrders = cafeOrders.filter(o => o.status === 'pending').sort(sortEarliestFirst);
  const preparingOrders = cafeOrders.filter(o => o.status === 'preparing').sort(sortEarliestFirst);
  const readyOrders = cafeOrders.filter(o => o.status === 'ready').sort(sortEarliestFirst);

  const advanceOrderStatus = (orderId: string, current: CafeOrderStatus, tableName: string) => {
    if (current === 'pending') {
      updateCafeOrderStatus(orderId, 'preparing');
      showToast(`Bắt đầu pha chế: ${tableName}`);
    } else if (current === 'preparing') {
      updateCafeOrderStatus(orderId, 'ready');
      showToast(`Đã làm xong: ${tableName}`);
    } else if (current === 'ready') {
      updateCafeOrderStatus(orderId, 'served');
      showToast(`Đã phục vụ: ${tableName}`);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col font-sans select-none overflow-hidden">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-16 right-6 z-50 px-4 py-2 rounded bg-surface-2 text-text font-medium text-xs border border-border shadow-lg">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <header className="px-6 py-3 bg-surface border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/app/cafe/order"
            className="px-3 py-1.5 rounded text-xs font-medium bg-surface-2 hover:bg-border text-text border border-border transition-colors"
          >
            Quay lại sơ đồ bàn
          </Link>

          <div>
            <h1 className="text-sm font-bold text-text tracking-wide">
              {business?.name || 'Mộc Lan Cafe'} — Màn hình bếp (KDS)
            </h1>
            <p className="text-[11px] text-text-dim">
              Đơn vào trước hiển thị ở trên • Đơn vào sau hiển thị ở dưới
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded bg-surface-2 border border-border text-xs font-mono text-text">
            {currentTime}
          </div>

          <button
            onClick={toggleFullscreen}
            className="px-3 py-1 rounded bg-surface-2 hover:bg-border text-xs text-text border border-border cursor-pointer"
          >
            {isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          </button>
        </div>
      </header>

      {/* Kanban Board 3 Columns */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border p-5 gap-5 md:gap-0 overflow-y-auto">
        {/* COL 1: CHỜ PHA CHẾ */}
        <div className="md:pr-4 flex flex-col">
          <div className="p-3 rounded bg-surface-2 border border-border mb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold text-text uppercase tracking-wider">
              Chờ pha chế ({pendingOrders.length})
            </h2>
            <span className="text-[10px] text-text-dim">Vào trước ở trên</span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {pendingOrders.length === 0 ? (
              <div className="p-6 border border-dashed border-border rounded text-center text-xs text-text-dim">
                Không có đơn chờ
              </div>
            ) : (
              pendingOrders.map((order, index) => {
                const isFirst = index === 0;
                return (
                  <div
                    key={order.id}
                    className={`p-3.5 rounded border space-y-2.5 transition-colors ${
                      isFirst
                        ? 'bg-surface border-text'
                        : 'bg-surface-2 border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface border border-border text-text">
                          {isFirst ? 'Ưu tiên 1' : `#${index + 1}`}
                        </span>
                        <span className="text-sm font-bold text-text">{order.tableName}</span>
                        {order.guestLabel && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-2 border border-border text-text-muted">
                            {order.guestLabel}
                          </span>
                        )}
                        {order.isPaid ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/30 font-semibold">
                            ✓ Đã trả
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-medium">
                            Trả sau
                          </span>
                        )}
                      </div>
                      <div className="text-right text-[11px] text-text-dim font-mono">
                        {order.createdAt}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {order.items.map(item => (
                        <div key={item.id} className="p-2 rounded bg-surface border border-border/60">
                          <div className="flex justify-between font-medium text-text">
                            <span>{item.name}</span>
                            <span className="font-bold">x{item.quantity}</span>
                          </div>
                          {item.notes && (
                            <p className="text-[11px] text-text-dim mt-0.5">
                              Ghi chú: {item.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => advanceOrderStatus(order.id, 'pending', order.tableName)}
                      className="w-full py-2 rounded font-medium bg-text text-bg hover:opacity-90 cursor-pointer text-xs"
                    >
                      Bắt đầu pha chế
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COL 2: ĐANG PHA CHẾ */}
        <div className="md:px-4 flex flex-col">
          <div className="p-3 rounded bg-surface-2 border border-border mb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold text-text uppercase tracking-wider">
              Đang pha chế ({preparingOrders.length})
            </h2>
            <span className="text-[10px] text-text-dim">Pha trước ở trên</span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {preparingOrders.length === 0 ? (
              <div className="p-6 border border-dashed border-border rounded text-center text-xs text-text-dim">
                Chưa có đơn đang pha
              </div>
            ) : (
              preparingOrders.map((order, index) => {
                const isFirst = index === 0;
                return (
                  <div
                    key={order.id}
                    className={`p-3.5 rounded border space-y-2.5 transition-colors ${
                      isFirst
                        ? 'bg-surface border-text'
                        : 'bg-surface-2 border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface border border-border text-text">
                          {isFirst ? 'Ra trước' : `#${index + 1}`}
                        </span>
                        <span className="text-sm font-bold text-text">{order.tableName}</span>
                        {order.guestLabel && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-2 border border-border text-text-muted">
                            {order.guestLabel}
                          </span>
                        )}
                        {order.isPaid ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/30 font-semibold">
                            ✓ Đã trả
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-medium">
                            Trả sau
                          </span>
                        )}
                      </div>
                      <div className="text-right text-[11px] text-text-dim font-mono">
                        {order.createdAt}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {order.items.map(item => (
                        <div key={item.id} className="p-2 rounded bg-surface border border-border/60">
                          <div className="flex justify-between font-medium text-text">
                            <span>{item.name}</span>
                            <span className="font-bold">x{item.quantity}</span>
                          </div>
                          {item.notes && (
                            <p className="text-[11px] text-text-dim mt-0.5">
                              Ghi chú: {item.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => advanceOrderStatus(order.id, 'preparing', order.tableName)}
                      className="w-full py-2 rounded font-medium bg-text text-bg hover:opacity-90 cursor-pointer text-xs"
                    >
                      Hoàn thành món
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COL 3: SẴN SÀNG PHỤC VỤ */}
        <div className="md:pl-4 flex flex-col">
          <div className="p-3 rounded bg-surface-2 border border-border mb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold text-text uppercase tracking-wider">
              Sẵn sàng phục vụ ({readyOrders.length})
            </h2>
            <span className="text-[10px] text-text-dim">Xong trước ở trên</span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {readyOrders.length === 0 ? (
              <div className="p-6 border border-dashed border-border rounded text-center text-xs text-text-dim">
                Đã phục vụ hết các món
              </div>
            ) : (
              readyOrders.map((order, index) => {
                const isFirst = index === 0;
                return (
                  <div
                    key={order.id}
                    className={`p-3.5 rounded border space-y-2.5 transition-colors ${
                      isFirst
                        ? 'bg-surface border-text'
                        : 'bg-surface-2 border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface border border-border text-text">
                          {isFirst ? 'Bưng trước' : `#${index + 1}`}
                        </span>
                        <span className="text-sm font-bold text-text">{order.tableName}</span>
                        {order.guestLabel && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-2 border border-border text-text-muted">
                            {order.guestLabel}
                          </span>
                        )}
                        {order.isPaid ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/30 font-semibold">
                            ✓ Đã trả
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-medium">
                            Trả sau
                          </span>
                        )}
                      </div>
                      <div className="text-right text-[11px] text-text-dim font-mono">
                        {order.createdAt}
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      {order.items.map(item => (
                        <div key={item.id} className="flex justify-between py-1 border-b border-border/40 text-text">
                          <span>{item.name}</span>
                          <span className="font-bold">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => advanceOrderStatus(order.id, 'ready', order.tableName)}
                      className="w-full py-2 rounded font-medium bg-text text-bg hover:opacity-90 cursor-pointer text-xs"
                    >
                      Đã bưng ra bàn
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
