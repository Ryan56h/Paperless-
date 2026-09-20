import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { switchBusinessType } = useAuth();
  const [activeTab, setActiveTab] = useState<'grocery' | 'cafe'>('grocery');

  const goToGroceryDemo = () => {
    switchBusinessType('grocery');
    navigate('/app/grocery/order');
  };

  const goToCafeDemo = () => {
    switchBusinessType('cafe');
    navigate('/app/cafe/order');
  };

  return (
    <div className="min-h-screen bg-bg text-text font-sans">
      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-text text-bg text-xs font-bold flex items-center justify-center">
                P
              </span>
              <span className="font-bold text-base tracking-tight text-text">Paperless</span>
            </Link>

            <nav className="hidden md:flex items-center gap-5 text-xs text-text-muted">
              <a href="#solutions" className="hover:text-text">
                Mô hình
              </a>
              <a href="#features" className="hover:text-text">
                Tính năng
              </a>
              <a href="#how-it-works" className="hover:text-text">
                Cách dùng
              </a>
              <Link to="/lookup" className="hover:text-text">
                Tra cứu
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-3 py-1.5 rounded text-xs font-medium text-text hover:bg-surface-2"
            >
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="px-3 py-1.5 rounded text-xs font-bold bg-text text-bg hover:opacity-90"
            >
              Đăng ký
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-16 pb-16 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        <span className="text-[11px] font-medium text-text-dim uppercase tracking-wider block mb-3">
          Nền tảng quản lý bán hàng tối giản
        </span>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-text tracking-tight mb-4">
          Quản lý bán hàng & order không giấy tờ
        </h1>

        <p className="text-sm sm:text-base text-text-muted max-w-2xl mx-auto mb-8">
          Giải pháp tinh gọn dành riêng cho cửa hàng tạp hoá và quán cafe. Thao tác bán hàng trực tiếp,
          quản lý món và theo dõi doanh thu trong ngày.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <button
            onClick={goToGroceryDemo}
            className="px-5 py-2.5 rounded font-semibold text-xs bg-text text-bg hover:opacity-90 cursor-pointer"
          >
            Mô hình Tạp Hoá
          </button>
          <button
            onClick={goToCafeDemo}
            className="px-5 py-2.5 rounded font-semibold text-xs bg-surface-2 text-text border border-border hover:bg-surface cursor-pointer"
          >
            Mô hình Quán Cafe
          </button>
          <Link
            to="/register"
            className="px-5 py-2.5 rounded font-medium text-xs text-text-dim hover:text-text"
          >
            Đăng ký tài khoản
          </Link>
        </div>

        {/* Tab Preview */}
        <div className="bg-surface border border-border rounded-xl p-4 text-left shadow-sm">
          <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
            <button
              onClick={() => setActiveTab('grocery')}
              className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer ${
                activeTab === 'grocery'
                  ? 'bg-text text-bg font-semibold'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Tạp hoá (POS)
            </button>
            <button
              onClick={() => setActiveTab('cafe')}
              className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer ${
                activeTab === 'cafe'
                  ? 'bg-text text-bg font-semibold'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Quán Cafe (Bàn & Bếp)
            </button>
          </div>

          {activeTab === 'grocery' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded bg-surface-2 border border-border">
                <span className="font-semibold text-text block mb-1">Thao tác tại quầy</span>
                <p className="text-text-muted text-[11px] mb-2">
                  Bấm chọn mặt hàng từ danh sách, tự động cộng tiền và tính tiền thừa.
                </p>
                <div className="space-y-1 text-[11px] text-text-dim">
                  <div className="flex justify-between">
                    <span>Coca-Cola 320ml</span>
                    <span className="text-text">10.000 đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mì Hảo Hảo Tôm</span>
                    <span className="text-text">4.500 đ</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded bg-surface-2 border border-border">
                <span className="font-semibold text-text block mb-1">Thanh toán</span>
                <p className="text-text-muted text-[11px] mb-2">
                  Hỗ trợ thu tiền mặt nhanh hoặc quét VietQR chuyển khoản.
                </p>
                <div className="space-y-1 text-[11px] text-text-dim">
                  <div className="flex justify-between">
                    <span>Tổng tiền:</span>
                    <span className="font-bold text-text">14.500 đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hình thức:</span>
                    <span className="text-text">Tiền mặt / VietQR</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded bg-surface-2 border border-border">
                <span className="font-semibold text-text block mb-1">Sơ đồ bàn</span>
                <p className="text-text-muted text-[11px] mb-2">
                  Theo dõi trạng thái từng bàn: trống, có khách hoặc đã đặt trước.
                </p>
                <div className="grid grid-cols-3 gap-1.5 text-center text-[11px]">
                  <div className="p-1 rounded bg-surface border border-border">Bàn 01 (Khách)</div>
                  <div className="p-1 rounded bg-surface border border-border">Bàn 02 (Trống)</div>
                  <div className="p-1 rounded bg-surface border border-border">Bàn 03 (Khách)</div>
                </div>
              </div>

              <div className="p-3 rounded bg-surface-2 border border-border">
                <span className="font-semibold text-text block mb-1">Màn hình bếp (KDS)</span>
                <p className="text-text-muted text-[11px] mb-2">
                  Đơn vào trước ở trên, vào sau ở dưới theo thứ tự thời gian gọi món.
                </p>
                <div className="p-1.5 rounded bg-surface border border-border text-[11px]">
                  <div className="flex justify-between font-medium">
                    <span>Bàn 01</span>
                    <span className="text-text-dim">10:22</span>
                  </div>
                  <p className="text-text-dim">2x Cà phê sữa đá (ít đường)</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Solutions */}
      <section id="solutions" className="py-12 bg-surface border-y border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-bold text-text">Hai mô hình kinh doanh</h2>
            <p className="text-xs text-text-dim mt-1">Được thiết kế tinh gọn theo nhu cầu thực tế</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded bg-surface-2 border border-border flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-text mb-2">Cửa hàng tạp hoá</h3>
                <p className="text-xs text-text-muted leading-relaxed mb-4">
                  Bán hàng tốc độ cao: chọn sản phẩm, tính tiền, in hoá đơn hoặc gửi link qua Zalo/SMS. Không có màn hình phụ rườm rà.
                </p>
                <ul className="text-xs text-text-muted space-y-1.5 mb-6">
                  <li>— Chọn món theo danh mục hoặc tìm nhanh</li>
                  <li>— Thanh toán tiền mặt có tính tiền thối</li>
                  <li>— Quét mã VietQR chuyển khoản</li>
                  <li>— Báo cáo doanh thu trong ngày</li>
                </ul>
              </div>

              <button
                onClick={goToGroceryDemo}
                className="w-full py-2 rounded text-xs font-semibold bg-text text-bg hover:opacity-90 cursor-pointer"
              >
                Mở POS Tạp hoá
              </button>
            </div>

            <div className="p-5 rounded bg-surface-2 border border-border flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-text mb-2">Quán cafe & đồ uống</h3>
                <p className="text-xs text-text-muted leading-relaxed mb-4">
                  Quản lý sơ đồ bàn, gọi món kèm ghi chú pha chế và chuyển đơn xuống màn hình bếp theo thứ tự trước sau.
                </p>
                <ul className="text-xs text-text-muted space-y-1.5 mb-6">
                  <li>— Sơ đồ bàn theo khu vực</li>
                  <li>— Ghi chú món (đường, đá, mang về)</li>
                  <li>— Màn hình bếp KDS xếp đơn từ trên xuống</li>
                  <li>— Báo cáo doanh thu theo bàn và ca làm</li>
                </ul>
              </div>

              <button
                onClick={goToCafeDemo}
                className="w-full py-2 rounded text-xs font-semibold bg-text text-bg hover:opacity-90 cursor-pointer"
              >
                Mở POS Quán Cafe
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-12 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="p-4 rounded bg-surface border border-border">
            <h4 className="text-xs font-bold text-text uppercase tracking-wider mb-1">
              Không dùng giấy in
            </h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Tiết kiệm chi phí cuộn giấy in nhiệt và mực in. Khách có thể nhận hoá đơn điện tử.
            </p>
          </div>

          <div className="p-4 rounded bg-surface border border-border">
            <h4 className="text-xs font-bold text-text uppercase tracking-wider mb-1">
              Trực quan, dễ dùng
            </h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Giao diện tối giản, chữ rõ ràng, không có icon thừa, phù hợp cho mọi lứa tuổi thao tác.
            </p>
          </div>

          <div className="p-4 rounded bg-surface border border-border">
            <h4 className="text-xs font-bold text-text uppercase tracking-wider mb-1">
              Doanh thu cập nhật ngay
            </h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Báo cáo số đơn, tiền thu theo giờ và danh sách mặt hàng bán chạy trong ngày.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-border bg-surface text-center text-xs text-text-dim">
        Paperless — Hệ thống quản lý bán hàng cho doanh nghiệp vừa và nhỏ
      </footer>
    </div>
  );
}
