import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NfcReceiver() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestInvoice = async () => {
      try {
        const response = await fetch('/api/bill/latest');
        if (!response.ok) {
          throw new Error('Không tìm thấy hóa đơn nào hoặc lỗi máy chủ.');
        }
        
        const data = await response.json();
        if (data && data.id) {
          // Redirect to the actual invoice page
          navigate(`/invoice/${data.id}`, { replace: true });
        } else {
          setError('Dữ liệu hóa đơn không hợp lệ.');
        }
      } catch (err: any) {
        setError(err.message || 'Có lỗi xảy ra khi lấy hóa đơn mới nhất.');
      }
    };

    fetchLatestInvoice();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
      {error ? (
        <div className="bg-surface p-6 rounded-2xl shadow-sm text-center">
          <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text mb-2">Lỗi kết nối NFC</h2>
          <p className="text-text-muted">{error}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mb-4"></div>
          <p className="text-text-muted animate-pulse">Đang tìm hóa đơn mới nhất...</p>
        </div>
      )}
    </div>
  );
}
