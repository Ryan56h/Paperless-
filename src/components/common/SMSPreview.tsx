import { Link } from 'react-router-dom';

interface SMSPreviewProps {
  invoiceId: string;
  customerName: string;
  phone: string;
  total: number;
}

export default function SMSPreview({
  invoiceId,
  customerName,
  phone,
  total,
}: SMSPreviewProps) {
  // Get time formatted like "15:09"
  const formattedTime = new Date().toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="w-full max-w-sm mx-auto bg-[#F4F4F4] rounded-2xl overflow-hidden border border-border shadow-2xl font-sans text-left">
      {/* iOS SMS Top Bar Mockup */}
      <div className="bg-[#F6F6F6] border-b border-gray-200 px-4 py-3 flex items-center justify-between text-gray-800">
        <div className="flex items-center gap-3">
          {/* Back Chevron */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#007AFF] cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-[#007AFF] text-sm font-medium">SĐT</span>
        </div>

        {/* Sender Info */}
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-xs">
            PL
          </div>
          <span className="text-[10px] text-gray-800 font-semibold mt-1">PaperLess</span>
        </div>

        {/* Info Icon */}
        <div className="w-5 h-5 flex items-center justify-center rounded-full border border-[#007AFF] text-[#007AFF] font-bold text-[10px] cursor-pointer">
          i
        </div>
      </div>

      {/* SMS Chat Area */}
      <div className="p-4 flex flex-col gap-4 min-h-[250px] bg-white">
        {/* Date / Time */}
        <div className="text-center">
          <span className="text-[10px] text-gray-400 font-medium">
            Tin nhắn văn bản · Hôm nay {formattedTime}
          </span>
        </div>

        {/* Incoming SMS Bubble */}
        <div className="flex items-end gap-2 max-w-[85%] self-start">
          {/* Message Bubble */}
          <div className="bg-[#E9E9EB] text-black px-4 py-3 rounded-2xl rounded-bl-sm text-xs leading-relaxed relative">
            <p className="font-semibold text-gray-800 mb-1">[PaperLess+]</p>
            <p className="mb-2">
              Cảm ơn <span className="font-semibold">{customerName}</span> đã mua sắm! Hóa đơn <span className="font-mono font-semibold">{invoiceId}</span> trị giá <span className="font-semibold">{total.toLocaleString('vi-VN')}đ</span> đã được xuất thành công.
            </p>
            <p className="mb-1">
              Xem chi tiết và tải hóa đơn tại:
            </p>
            <Link 
              to={`/invoice/${invoiceId}`} 
              className="text-[#007AFF] underline break-all font-medium"
            >
              paperless.vn/invoice/{invoiceId}
            </Link>
          </div>
        </div>

        {/* Quick actions for demo */}
        <div className="mt-auto border-t border-gray-100 pt-3 flex flex-col gap-1 text-[10px] text-gray-400">
          <p className="text-center">
            Gửi tới: <span className="text-gray-600 font-medium">{phone}</span>
          </p>
          <div className="flex gap-2 justify-center mt-1">
            <Link to={`/invoice/${invoiceId}`} className="text-[#007AFF] hover:underline">
              [Click xem hóa đơn]
            </Link>
            <span>•</span>
            <Link to="/lookup" className="text-[#007AFF] hover:underline">
              [Click tra cứu tất cả]
            </Link>
          </div>
        </div>
      </div>

      {/* iOS Keyboard Input Field Mockup */}
      <div className="bg-[#F6F6F6] border-t border-gray-200 px-3 py-2 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        </svg>
        <div className="flex-1 bg-white border border-gray-300 rounded-full px-3 py-1 text-xs text-gray-400">
          Tin nhắn văn bản
        </div>
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );
}
