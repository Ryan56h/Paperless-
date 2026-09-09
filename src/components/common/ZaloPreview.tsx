import { Link } from 'react-router-dom';

interface ZaloPreviewProps {
  invoiceId: string;
  customerName: string;
  phone: string;
  items: { id: string; name: string; quantity: number; unitPrice: number }[];
  total: number;
  requirePayment?: boolean;
}

export default function ZaloPreview({
  invoiceId,
  customerName,
  phone,
  items,
  total,
  requirePayment = true,
}: ZaloPreviewProps) {
  // Format current date and time
  const formattedDate = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const formattedTime = new Date().toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const validItems = items.filter(item => item.name);

  return (
    <div className="w-full max-w-sm mx-auto bg-[#E4E9ED] rounded-2xl overflow-hidden border border-border shadow-2xl font-sans text-left">
      {/* Zalo Top Bar Mockup (Header blue) */}
      <div className="bg-[#0068FF] text-white px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Back button */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-wide uppercase">PAPERLESS+</span>
              <div className="w-4 h-4 rounded-full bg-[#F59E0B] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-black">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              </div>
            </div>
            <p className="text-[10px] text-white/80">Tài khoản OA</p>
          </div>
        </div>

        {/* Zalo header options menu icon */}
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 opacity-90 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </div>
      </div>

      {/* Chat Area Mockup */}
      <div className="p-4 flex flex-col items-center gap-4 min-h-[420px]">
        {/* Date separator pill */}
        <span className="text-[10px] text-gray-500 bg-[#D4DBE1] px-3 py-1 rounded-full">
          {formattedTime} {formattedDate}
        </span>

        {/* Zalo White Message Card Template */}
        <div className="w-full bg-white border border-[#D9D9D9] rounded-2xl shadow-sm overflow-hidden flex flex-col p-5 relative">
          
          {/* Card Top Right Options Icon (...) */}
          <div className="absolute top-4 right-4 flex gap-1 cursor-pointer">
            <span className="w-1 h-1 bg-[#0068FF] rounded-full"></span>
            <span className="w-1 h-1 bg-[#0068FF] rounded-full"></span>
            <span className="w-1 h-1 bg-[#0068FF] rounded-full"></span>
          </div>

          {/* Greeting */}
          <h3 className="text-base font-bold text-gray-800 mb-1.5 leading-snug">
            Xin chào {customerName},
          </h3>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            Cảm ơn quý khách đã tin tưởng chọn mua sản phẩm tại hệ thống của chúng tôi.
          </p>

          {/* Key-Value Details Grid */}
          <div className="flex flex-col gap-2.5 text-xs text-gray-700 mb-3">
            <div className="grid grid-cols-[100px_1fr] gap-2">
              <span className="text-gray-400">Điểm tích lũy:</span>
              <span className="font-bold text-gray-800">150</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-2">
              <span className="text-gray-400">Mã đơn hàng:</span>
              <span className="font-mono font-bold text-gray-800">{invoiceId}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-2">
              <span className="text-gray-400">SĐT khách hàng:</span>
              <span className="font-bold text-gray-800">{phone}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-2">
              <span className="text-gray-400">Hoá đơn VAT:</span>
              <span className="font-bold text-gray-800">
                {requirePayment ? 'Chờ thanh toán. Xem chi tiết' : 'Đã xuất. Xem tại chi tiết đơn hàng'}
              </span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-2">
              <span className="text-gray-400">Ngày mua:</span>
              <span className="font-bold text-gray-800">{formattedDate}</span>
            </div>
          </div>

          {/* Itemized Product List inside Card */}
          {validItems.length > 0 && (
            <div className="border-t border-gray-150 py-3 flex flex-col gap-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Chi tiết đơn hàng:</span>
              <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto pr-1">
                {validItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-xs">
                    <span className="text-gray-700 font-medium truncate max-w-[180px]">
                      {item.name} <span className="text-gray-400 text-[10px]">x{item.quantity}</span>
                    </span>
                    <span className="text-gray-800 font-bold">
                      {(item.unitPrice * item.quantity).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total Price Section */}
          <div className="border-t border-gray-150 pt-3 pb-3 flex justify-between items-center mb-3">
            <span className="text-xs text-gray-500 font-bold">Tổng thanh toán:</span>
            <span className="text-base text-[#55C244] font-black">{total.toLocaleString('vi-VN')} VNĐ</span>
          </div>

          {/* Survey/Promotion Text Note */}
          <p className="text-[11px] text-gray-400 leading-normal mb-5">
            Với nỗ lực không ngừng nâng cao trải nghiệm mua sắm của khách hàng, mời Quý khách dành ít phút tham gia khảo sát chất lượng dịch vụ. Trân trọng!
          </p>

          {/* Stacked Action Buttons */}
          <div className="flex flex-col gap-2.5">
            {/* Button 1: View Details (Primary Solid Brand Green) */}
            <Link
              to={`/invoice/${invoiceId}`}
              className="w-full text-center py-3 text-xs font-bold text-black bg-[#55C244] hover:bg-[#45a837] rounded-xl tracking-wider uppercase transition-colors shadow-sm"
            >
              XEM CHI TIẾT HÓA ĐƠN
            </Link>

            {/* Button 2: View All (Secondary Light Brand Green) */}
            <Link
              to="/lookup"
              className="w-full text-center py-3 text-xs font-bold text-[#55C244] bg-[#55C244]/10 hover:bg-[#55C244]/20 border border-[#55C244]/20 rounded-xl tracking-wider uppercase transition-colors"
            >
              XEM TẤT CẢ HÓA ĐƠN
            </Link>
          </div>
        </div>

        {/* Footer bubble text */}
        <p className="text-[9px] text-gray-400 text-center px-4 leading-relaxed">
          Tin nhắn này được gửi tự động từ hệ thống hóa đơn không giấy PaperLess+.
        </p>
      </div>
    </div>
  );
}
