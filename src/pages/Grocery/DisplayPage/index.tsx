import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
  fetchInvoicesApi,
  updateInvoiceStatusApi,
  type BackendInvoice,
} from '../../../services/groceryApi';

export default function GroceryDisplayPage() {
  const { business } = useAuth();

  const [invoices, setInvoices] = useState<BackendInvoice[]>([]);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Digital Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch active orders from Backend
  const loadOrders = useCallback(async () => {
    try {
      const data = await fetchInvoicesApi('preparing,ready', 40);
      setInvoices(data);
    } catch (err) {
      console.error('Lỗi tải danh sách đơn hiển thị:', err);
    }
  }, []);

  // Initial load and polling every 4 seconds
  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 4000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const preparingOrders = invoices.filter(o => o.orderStatus === 'preparing');
  const readyOrders = invoices.filter(o => o.orderStatus === 'ready');

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleMarkReady = async (orderId: string, ticketNum: number) => {
    try {
      await updateInvoiceStatusApi(orderId, 'ready');
      setInvoices(prev =>
        prev.map(inv => (inv.id === orderId ? { ...inv, orderStatus: 'ready' } : inv))
      );
      showToast(`Phiếu số #${ticketNum} đã sẵn sàng nhận hàng!`);
    } catch {
      showToast('Không thể cập nhật trạng thái phiếu.');
    }
  };

  const handleMarkCompleted = async (orderId: string, ticketNum: number) => {
    try {
      await updateInvoiceStatusApi(orderId, 'completed');
      setInvoices(prev => prev.filter(inv => inv.id !== orderId));
      showToast(`Phiếu số #${ticketNum} đã giao hoàn tất!`);
    } catch {
      showToast('Không thể cập nhật trạng thái phiếu.');
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0D0F] text-white flex flex-col select-none font-sans overflow-hidden">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 px-5 py-3 rounded-xl bg-surface border border-border text-text font-bold text-sm shadow-xl">
          {notification}
        </div>
      )}

      {/* TV Header */}
      <header className="px-6 py-4 bg-surface border-b border-border flex items-center justify-between text-text">
        <div className="flex items-center gap-4">
          <Link
            to="/app/grocery/order"
            className="px-3 py-2 rounded-lg bg-surface-2 hover:bg-surface text-xs font-semibold text-text border border-border flex items-center gap-1.5 transition-colors"
            title="Quay lại quầy thu ngân POS"
          >
            <span>← Quay lại POS</span>
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-text tracking-tight">
                {business?.name || 'Tạp hoá & Siêu thị Minh Phát'}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded bg-surface-2 text-text-muted font-medium border border-border">
                Màn hình nhận hàng
              </span>
            </div>
            <p className="text-xs text-text-dim mt-0.5">
              Bảng gọi số thứ tự nhận hàng tự động • Kính mời quý khách theo dõi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Digital Clock */}
          <div className="px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-right">
            <span className="text-[10px] text-text-dim block font-mono">Giờ hệ thống</span>
            <span className="text-sm font-bold text-text font-mono">
              {currentTime}
            </span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="px-3 py-2 rounded-lg bg-surface-2 hover:bg-surface text-xs font-semibold text-text border border-border cursor-pointer transition-colors"
          >
            {isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          </button>
        </div>
      </header>

      {/* TV Big Board: 2 Columns */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border p-6 gap-6 md:gap-0 overflow-y-auto bg-bg">
        {/* LEFT COLUMN: ĐANG CHUẨN BỊ */}
        <div className="md:pr-6 flex flex-col">
          <div className="p-3 rounded-xl bg-surface-2 border border-border flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-text tracking-wider uppercase">
              Đang Chuẩn Bị Hàng
            </h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-surface text-text-muted border border-border">
              {preparingOrders.length} đơn
            </span>
          </div>

          {preparingOrders.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-text-dim text-center">
              <p className="text-sm font-semibold text-text">Tất cả đơn đã được chuẩn bị xong</p>
              <p className="text-xs text-text-dim mt-1">Đơn mới phát sinh tại POS sẽ hiển thị ở đây</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {preparingOrders.map(order => {
                const itemCount = order.items.reduce((sum, it) => sum + it.quantity, 0);
                return (
                  <div
                    key={order.id}
                    onClick={() => handleMarkReady(order.id, order.ticketNumber)}
                    className="group relative p-4 rounded-xl bg-surface border border-border hover:border-text/40 transition-all cursor-pointer flex flex-col justify-between text-center"
                    title="Click để chuyển sang ĐÃ SẴN SÀNG"
                  >
                    <span className="text-xs text-text-dim block font-medium">Phiếu số</span>
                    <div className="text-3xl font-bold text-text my-1 font-mono tracking-tight">
                      #{order.ticketNumber}
                    </div>
                    <div className="text-[11px] text-text-dim pt-2 border-t border-border flex justify-between">
                      <span>{itemCount} món</span>
                      <span className="text-text-muted">{formatTime(order.createdAt)}</span>
                    </div>

                    <div className="mt-2 text-[10px] text-text font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      Chạm: Đã Xong ✓
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ĐÃ SẴN SÀNG LẤY HÀNG */}
        <div className="md:pl-6 flex flex-col">
          <div className="p-3 rounded-xl bg-surface-2 border border-border flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-text tracking-wider uppercase">
              Mời Quý Khách Nhận Hàng
            </h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-surface text-text-muted border border-border">
              {readyOrders.length} sẵn sàng
            </span>
          </div>

          {readyOrders.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-text-dim text-center">
              <p className="text-sm font-semibold text-text">Hiện chưa có số phiếu nào chờ nhận</p>
              <p className="text-xs text-text-dim mt-1">Khi quầy gom hàng xong, số phiếu sẽ hiển thị tại đây</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {readyOrders.map(order => {
                const itemCount = order.items.reduce((sum, it) => sum + it.quantity, 0);
                return (
                  <div
                    key={order.id}
                    onClick={() => handleMarkCompleted(order.id, order.ticketNumber)}
                    className="group relative p-4 rounded-xl bg-surface border border-emerald-500/30 hover:border-emerald-500 transition-all cursor-pointer flex flex-col justify-between text-center"
                    title="Click để xóa phiếu (Khách đã nhận)"
                  >
                    <span className="text-xs text-text-dim block font-medium">Phiếu số</span>
                    <div className="text-3xl font-bold text-emerald-500 my-1 font-mono tracking-tight">
                      #{order.ticketNumber}
                    </div>
                    <div className="text-[11px] text-text-dim pt-2 border-t border-border flex justify-between">
                      <span>{itemCount} món</span>
                      <span className="text-text-muted">{order.total.toLocaleString('vi-VN')} đ</span>
                    </div>

                    <div className="mt-2 text-[10px] text-emerald-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      Chạm: Đã Nhận Xong ✓
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Staff Bottom Controller Toolbar */}
      <footer className="px-6 py-3 bg-surface border-t border-border flex flex-wrap items-center justify-between text-xs text-text-muted gap-3">
        <div className="flex items-center gap-3">
          <span>Click trực tiếp vào từng ô số phiếu để cập nhật trạng thái nhanh. Dữ liệu tự động cập nhật từ quầy POS.</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/app/grocery/revenue"
            className="text-text hover:underline font-semibold"
          >
            Xem Doanh Thu Hôm Nay →
          </Link>
        </div>
      </footer>
    </div>
  );
}
