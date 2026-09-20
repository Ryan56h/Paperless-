import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useOrder } from '../../../context/OrderContext';
import { useAuth } from '../../../context/AuthContext';

export default function GroceryDisplayPage() {
  const { groceryOrders, updateGroceryOrderStatus } = useOrder();
  const { business } = useAuth();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Clock timer
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const preparingOrders = groceryOrders.filter(o => o.status === 'preparing');
  const readyOrders = groceryOrders.filter(o => o.status === 'ready');

  const handleMarkReady = (orderId: string, ticketNum: number) => {
    updateGroceryOrderStatus(orderId, 'ready');
    showToast(`Đơn số #${ticketNum} đã sẵn sàng lấy hàng!`);
  };

  const handleMarkCompleted = (orderId: string, ticketNum: number) => {
    updateGroceryOrderStatus(orderId, 'completed');
    showToast(`Đơn số #${ticketNum} đã giao cho khách!`);
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
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
                {business?.name || 'Tạp hoá & Siêu thị'}
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
              {preparingOrders.map(order => (
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
                    <span>{order.itemCount} món</span>
                    <span className="text-text-muted">{order.createdAt}</span>
                  </div>

                  <div className="mt-2 text-[10px] text-text font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    Chạm: Đã Xong ✓
                  </div>
                </div>
              ))}
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
              {readyOrders.map(order => (
                <div
                  key={order.id}
                  onClick={() => handleMarkCompleted(order.id, order.ticketNumber)}
                  className="group relative p-4 rounded-xl bg-surface border border-border hover:border-text/40 transition-all cursor-pointer flex flex-col justify-between text-center"
                  title="Click để xóa phiếu (Khách đã nhận)"
                >
                  <span className="text-xs text-text-dim block font-medium">Phiếu số</span>
                  <div className="text-3xl font-bold text-text my-1 font-mono tracking-tight">
                    #{order.ticketNumber}
                  </div>
                  <div className="text-[11px] text-text-dim pt-2 border-t border-border flex justify-between">
                    <span>{order.itemCount} món</span>
                    <span className="text-text-muted">{order.total.toLocaleString('vi-VN')}đ</span>
                  </div>

                  <div className="mt-2 text-[10px] text-text font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    Chạm: Đã Nhận Xong ✓
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Staff Bottom Controller Toolbar */}
      <footer className="px-6 py-3 bg-surface border-t border-border flex flex-wrap items-center justify-between text-xs text-text-muted gap-3">
        <div className="flex items-center gap-3">
          <span>Click trực tiếp vào từng ô số phiếu để cập nhật trạng thái nhanh.</span>
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
