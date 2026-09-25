import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isLoggedIn, enterDemoMode, business, logout } = useAuth();
  const [lookupQuery, setLookupQuery] = useState('');

  const goToGroceryDemo = () => {
    if (isLoggedIn) {
      navigate('/app/grocery/order');
    } else {
      enterDemoMode('grocery');
      navigate('/app/grocery/order');
    }
  };

  const goToCafeDemo = () => {
    if (isLoggedIn) {
      navigate('/app/cafe/order');
    } else {
      enterDemoMode('cafe');
      navigate('/app/cafe/order');
    }
  };

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lookupQuery.trim()) {
      navigate(`/lookup?q=${encodeURIComponent(lookupQuery.trim())}`);
    } else {
      navigate('/lookup');
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* ─── NAVIGATION BAR ────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#09261e]/95 backdrop-blur border-b border-emerald-900/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-base font-black tracking-wider text-white uppercase">
                PAPERLESS<span className="text-amber-400">+</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-emerald-200/70">
              <a href="#khach-hang" className="hover:text-amber-400 transition-colors">
                Dành cho khách hàng
              </a>
              <a href="#doanh-nghiep" className="hover:text-amber-400 transition-colors">
                Dành cho cửa hàng
              </a>
              <a href="#tinh-nang" className="hover:text-amber-400 transition-colors">
                Tính năng
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#khach-hang"
              className="hidden sm:inline-block px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-200 hover:text-white border border-emerald-700/80 hover:border-emerald-500 transition-colors"
            >
              Tra cứu đơn
            </a>
            {isLoggedIn ? (
              <>
                <Link
                  to={business?.type === 'cafe' ? '/app/cafe/order' : '/app/grocery/order'}
                  className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400 hover:bg-amber-500 text-slate-950 transition-colors shadow-sm"
                >
                  Vào POS
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-200 hover:text-white border border-emerald-700/80 hover:border-emerald-500 transition-colors cursor-pointer"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-100 hover:text-white transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400 hover:bg-amber-500 text-slate-950 transition-colors shadow-sm"
                >
                  Đăng ký dùng
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION (Phỏng theo phong cách thương hiệu) ────── */}
      <section className="bg-gradient-to-b from-[#09261e] via-[#0d3429] to-[#0a271f] text-white pt-14 pb-16 px-4 sm:px-6 border-b border-emerald-950">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Bold Typography & Main Call to Action */}
          <div className="lg:col-span-7 text-left">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-3">
              NỀN TẢNG BÁN HÀNG & HOÁ ĐƠN SỐ
            </span>

            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight leading-tight text-white mb-4">
              XUẤT HOÁ ĐƠN SỐ. <br />
              KHÔNG DÙNG GIẤY. <br />
              BÁN HÀNG TỐC ĐỘ.
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl mb-8 leading-relaxed">
              Giải pháp tinh gọn thay thế hoàn toàn máy in bill nhiệt truyền thống. Khách hàng nhận hoá đơn điện tử tức thời qua Zalo hoặc tự tra cứu trực tuyến. Cửa hàng vận hành nhanh gọn, tiết kiệm chi phí vật tư và bảo vệ môi trường.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#doanh-nghiep"
                className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider bg-amber-400 hover:bg-amber-500 text-slate-950 transition-colors shadow-md"
              >
                Dành cho cửa hàng
              </a>
              <a
                href="#khach-hang"
                className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-emerald-100 border border-emerald-600 hover:bg-emerald-800/40 transition-colors"
              >
                Tra cứu hoá đơn
              </a>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl p-6 bg-gradient-to-b from-[#124235] to-[#0c2f25] border border-emerald-700/60 shadow-2xl text-left">
              <div className="flex justify-between items-center pb-3 border-b border-emerald-800/80 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  HOÁ ĐƠN ĐIỆN TỬ
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-200 border border-emerald-700">
                  PL-20260925-001
                </span>
              </div>

              <div className="space-y-2 mb-5 text-xs">
                <div className="flex justify-between text-emerald-200/90 py-1 border-b border-emerald-900/50">
                  <span>Cà phê sữa đá (ít ngọt)</span>
                  <span className="font-bold text-white">35.000 đ</span>
                </div>
                <div className="flex justify-between text-emerald-200/90 py-1 border-b border-emerald-900/50">
                  <span>Trà đào cam sả size L</span>
                  <span className="font-bold text-white">45.000 đ</span>
                </div>
                <div className="flex justify-between text-emerald-200/90 py-1">
                  <span>Bánh mì que giòn tan</span>
                  <span className="font-bold text-white">20.000 đ</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#09221b] border border-emerald-800 mb-4 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-emerald-300">Tổng thanh toán:</span>
                  <span className="font-black text-amber-400 text-sm">100.000 đ</span>
                </div>
                <div className="flex justify-between text-[11px] text-emerald-400">
                  <span>Kênh gửi:</span>
                  <span>Zalo ZNS & Mã QR trực tuyến</span>
                </div>
                <div className="flex justify-between text-[11px] text-emerald-400">
                  <span>Tích điểm:</span>
                  <span>+10 điểm thành viên</span>
                </div>
              </div>

              <div className="text-[11px] text-center text-emerald-300/80">
                Khách hàng quét mã hoặc xem lại hoá đơn vĩnh viễn trên mọi thiết bị
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BANNER (Dải băng chỉ số nổi bật) ──────────────── */}
      <section className="bg-amber-400 text-slate-950 py-5 border-y border-amber-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-black">0 ĐỒNG</div>
              <div className="text-[11px] font-bold uppercase tracking-wider mt-0.5 text-slate-800">
                Chi phí giấy in & mực
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black">100%</div>
              <div className="text-[11px] font-bold uppercase tracking-wider mt-0.5 text-slate-800">
                Hoá đơn điện tử trực tuyến
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black">2 MÔ HÌNH</div>
              <div className="text-[11px] font-bold uppercase tracking-wider mt-0.5 text-slate-800">
                Tạp hoá & Quán Cafe
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black">3 GIÂY</div>
              <div className="text-[11px] font-bold uppercase tracking-wider mt-0.5 text-slate-800">
                Thao tác xuất đơn nhanh
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* PHẦN 1: DÀNH CHO KHÁCH HÀNG (Tra cứu hoá đơn & đơn hàng)    */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section id="khach-hang" className="py-16 bg-white border-b border-emerald-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-block px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider mb-3">
            PHẦN DÀNH CHO KHÁCH HÀNG
          </div>

          <h2 className="text-2xl sm:text-4xl font-black uppercase text-slate-900 tracking-tight mb-3">
            Tra cứu hoá đơn mua sắm
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto mb-8 leading-relaxed">
            Bạn vừa mua hàng hoặc sử dụng dịch vụ tại quán? Nhập số điện thoại người mua hoặc mã số hoá đơn để kiểm tra chi tiết đơn hàng và số điểm tích luỹ.
          </p>

          {/* Form Tra Cứu Trực Tiếp */}
          <div className="max-w-xl mx-auto p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-sm mb-10">
            <form onSubmit={handleLookupSubmit} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                placeholder="Nhập mã hoá đơn (VD: PL-...) hoặc Số điện thoại..."
                value={lookupQuery}
                onChange={e => setLookupQuery(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl bg-white border border-emerald-300 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer shadow-xs"
              >
                Tra cứu ngay
              </button>
            </form>
          </div>

          {/* 3 Lợi ích cho khách hàng (Dạng cột chữ gọn gàng, không icon) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="text-sm font-black text-emerald-700 uppercase tracking-wider mb-1">
                01. LƯU TRỮ VĨNH VIỄN
              </div>
              <h3 className="text-xs font-bold text-slate-900 mb-1.5 uppercase">
                Không lo mất hay mờ chữ
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hoá đơn điện tử được lưu trên hệ thống đám mây, dễ dàng mở lại để đối soát bảo hành hoặc đổi trả sản phẩm bất kỳ lúc nào.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="text-sm font-black text-emerald-700 uppercase tracking-wider mb-1">
                02. THEO DÕI TÍCH ĐIỂM
              </div>
              <h3 className="text-xs font-bold text-slate-900 mb-1.5 uppercase">
                Nhận ưu đãi tự động
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mỗi đơn mua đều được liên kết tự động với số điện thoại của bạn để tích luỹ điểm thưởng và thăng hạng thành viên.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="text-sm font-black text-emerald-700 uppercase tracking-wider mb-1">
                03. TIỆN LỢI & NHANH CHÓNG
              </div>
              <h3 className="text-xs font-bold text-slate-900 mb-1.5 uppercase">
                Không cần cài ứng dụng
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Xem trực tiếp trên trình duyệt hoặc qua tin nhắn Zalo ZNS. Không yêu cầu đăng ký tài khoản hay tải thêm ứng dụng phụ.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* PHẦN 2: DÀNH CHO CỬA HÀNG & DOANH NGHIỆP                    */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section id="doanh-nghiep" className="py-16 bg-emerald-50/40 border-b border-emerald-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-block px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold uppercase tracking-wider mb-3">
              PHẦN DÀNH CHO CỬA HÀNG & CHỦ QUÁN
            </div>

            <h2 className="text-2xl sm:text-4xl font-black uppercase text-slate-900 tracking-tight mb-3">
              Hệ thống bán hàng PaperLess POS
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Giải pháp quản lý tinh gọn được thiết kế theo đúng quy trình thực tế của từng mô hình kinh doanh. Giúp giảm thiểu thao tác, tránh nhầm lẫn và hoàn toàn không tốn tiền mua máy in bill.
            </p>
          </div>

          {/* 2 Thẻ Mô hình Kinh doanh */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Thẻ Tạp Hoá */}
            <div className="p-6 sm:p-7 rounded-2xl bg-white border border-emerald-200 shadow-sm hover:border-emerald-400 transition-all flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
                  MÔ HÌNH BÁN LẺ
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-3">
                  Cửa hàng Tạp hoá & Siêu thị mini
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-5">
                  Bố cục chuyên dụng: Danh sách giỏ hàng bên trái và thông tin thanh toán bên phải. Thao tác siêu tốc qua ô tìm kiếm thông minh hoặc quét mã vạch trực tiếp bằng camera.
                </p>

                <div className="space-y-2 mb-6 text-xs text-slate-700">
                  <div className="flex items-center gap-2 py-1 border-b border-slate-100">
                    <span className="font-bold text-emerald-600">+</span> Quét mã vạch tự động thêm hàng vào giỏ
                  </div>
                  <div className="flex items-center gap-2 py-1 border-b border-slate-100">
                    <span className="font-bold text-emerald-600">+</span> Bảng tính tiền mặt và tiền thối tức thời
                  </div>
                  <div className="flex items-center gap-2 py-1 border-b border-slate-100">
                    <span className="font-bold text-emerald-600">+</span> Tạo mã VietQR động theo đúng số tiền đơn
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <span className="font-bold text-emerald-600">+</span> Báo cáo doanh thu theo từng ca làm và theo ngày
                  </div>
                </div>
              </div>

              <button
                onClick={goToGroceryDemo}
                className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer transition-colors shadow-xs"
              >
                Trải nghiệm POS Tạp hoá
              </button>
            </div>

            {/* Thẻ Quán Cafe */}
            <div className="p-6 sm:p-7 rounded-2xl bg-white border border-emerald-200 shadow-sm hover:border-emerald-400 transition-all flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
                  MÔ HÌNH DỊCH VỤ ĂN UỐNG
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-3">
                  Quán Cafe & Trà sữa
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-5">
                  Quản lý thứ tự phục vụ và sơ đồ bàn trực quan. Đơn gọi món chuyển tự động xuống màn hình bếp KDS để nhân viên pha chế theo đúng thứ tự gọi trước - làm trước.
                </p>

                <div className="space-y-2 mb-6 text-xs text-slate-700">
                  <div className="flex items-center gap-2 py-1 border-b border-slate-100">
                    <span className="font-bold text-emerald-600">+</span> Sơ đồ bàn hiển thị tình trạng khách ngồi
                  </div>
                  <div className="flex items-center gap-2 py-1 border-b border-slate-100">
                    <span className="font-bold text-emerald-600">+</span> Ghi chú chi tiết cho từng món (đường, đá, mang đi)
                  </div>
                  <div className="flex items-center gap-2 py-1 border-b border-slate-100">
                    <span className="font-bold text-emerald-600">+</span> Màn hình bếp KDS nhận đơn không trễ
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <span className="font-bold text-emerald-600">+</span> Thống kê hiệu suất món bán chạy nhất trong ngày
                  </div>
                </div>
              </div>

              <button
                onClick={goToCafeDemo}
                className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white cursor-pointer transition-colors shadow-xs"
              >
                Trải nghiệm POS Quán Cafe
              </button>
            </div>
          </div>

          {/* Banner Kêu gọi Đăng ký sử dụng */}
          <div className="p-8 rounded-2xl bg-[#09261e] text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="text-lg sm:text-xl font-black uppercase tracking-tight mb-1 text-white">
                Sẵn sàng chuyển đổi số cho cửa hàng của bạn?
              </h4>
              <p className="text-xs text-emerald-200/80 max-w-xl">
                Đăng ký tài khoản miễn phí trong 1 phút. Hoạt động trên mọi thiết bị máy tính, iPad, điện thoại thông minh.
              </p>
            </div>
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider bg-amber-400 hover:bg-amber-500 text-slate-950 whitespace-nowrap transition-colors shadow-md"
            >
              Đăng ký tài khoản ngay
            </Link>
          </div>
        </div>
      </section>

      {/* ─── TÍNH NĂNG TỔNG QUAN ────────────────────────────────── */}
      <section id="tinh-nang" className="py-14 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 block mb-1">
            TIÊU CHUẨN THIẾT KẾ
          </span>
          <h3 className="text-xl font-black uppercase text-slate-900 tracking-tight">
            Tối giản để vận hành nhanh hơn
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left">
          <div className="p-5 rounded-2xl bg-white border border-slate-200">
            <div className="text-xs font-black uppercase text-emerald-700 tracking-wider mb-1.5">
              KHÔNG CẦN CÀI ĐẶT
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mở trình duyệt web là có thể bán hàng ngay lập tức. Dữ liệu đồng bộ đám mây liên tục giữa các ca làm việc.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200">
            <div className="text-xs font-black uppercase text-emerald-700 tracking-wider mb-1.5">
              TIẾT KIỆM TỐI ĐA
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Loại bỏ hoàn toàn chi phí thay giấy, sửa kẹt đầu in và cuộn giấy in nhiệt gây ô nhiễm môi trường.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200">
            <div className="text-xs font-black uppercase text-emerald-700 tracking-wider mb-1.5">
              CHÍNH XÁC & BẢO MẬT
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hoá đơn có mã định danh duy nhất, chống sửa đổi sau khi hoàn tất thanh toán.
            </p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────────── */}
      <footer className="py-8 bg-slate-900 text-white text-xs border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <div className="font-black text-sm tracking-wider uppercase text-white">
              PAPERLESS<span className="text-amber-400">+</span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Hệ thống bán hàng và quản lý hoá đơn điện tử không giấy tờ
            </p>
          </div>

          <div className="flex items-center gap-5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
            <a href="#khach-hang" className="hover:text-amber-400 transition-colors">
              Khách hàng
            </a>
            <a href="#doanh-nghiep" className="hover:text-amber-400 transition-colors">
              Cửa hàng
            </a>
            <Link to="/login" className="hover:text-amber-400 transition-colors">
              Đăng nhập
            </Link>
            <Link to="/register" className="hover:text-amber-400 transition-colors">
              Đăng ký
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
