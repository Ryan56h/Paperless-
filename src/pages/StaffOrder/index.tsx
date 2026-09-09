import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout';
import Button from '../../components/common/Button';
import { mockProducts } from '../../data/mockData';

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export default function StaffOrder() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [createReceipt, setCreateReceipt] = useState(true);
  const [payMethod, setPayMethod] = useState<'cash' | 'vietqr'>('cash');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrModalStatus, setQrModalStatus] = useState<'pending' | 'success'>('pending');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');

  // PayOS Webhook Simulator for cashier counter screen
  useEffect(() => {
    if (showQRModal && qrModalStatus === 'pending') {
      const timer = setTimeout(() => {
        setQrModalStatus('success');
        
        // Auto-close and open success OR navigate to e-receipt new screen
        const autoClose = setTimeout(() => {
          setShowQRModal(false);
          setQrModalStatus('pending');
          if (createReceipt) {
            navigate('/staff/invoice/new');
          } else {
            setShowSuccessModal(true);
          }
        }, 1800);

        return () => clearTimeout(autoClose);
      }, 3500); // 3.5s webhook delay
      return () => clearTimeout(timer);
    }
  }, [showQRModal, qrModalStatus, createReceipt, navigate]);

  const categories = ['Tất cả', ...Array.from(new Set(mockProducts.map(p => p.category)))];

  const addToCart = (product: typeof mockProducts[0]) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id: product.id, name: product.name, quantity: 1, price: product.price }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter(item => item.quantity > 0)
    );
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  const handleCheckout = () => {
    if (cart.length === 0) return;

    // Save order items to sessionStorage to pre-populate CreateInvoice screen
    const orderDraft = {
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
      subtotal,
      tax,
      total,
      payMethod, // Pass selected payment method to billing
      requirePayment: payMethod === 'vietqr', // Payment is already settled at POS counter!
      paymentStatus: 'paid', // Mark as settled immediately since they paid at quầy!
    };
    sessionStorage.setItem('posOrderDraft', JSON.stringify(orderDraft));

    if (payMethod === 'vietqr') {
      // Must complete VietQR payment on cashier screen before anything else!
      setShowQRModal(true);
    } else {
      // Paid in cash at counter: directly advance
      if (createReceipt) {
        navigate('/staff/invoice/new');
      } else {
        setShowSuccessModal(true);
      }
    }
  };

  const filteredProducts = selectedCategory === 'Tất cả'
    ? mockProducts
    : mockProducts.filter(p => p.category === selectedCategory);

  return (
    <PageLayout role="staff">
      <div className="flex h-[calc(100vh-1px)] bg-bg">
        {/* Left Side: Product Menu */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto border-r border-border">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-text">Màn hình bán hàng (POS)</h1>
              <p className="text-text-dim text-sm mt-0.5">Chọn món nước hoặc bánh ngọt để bắt đầu order</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-surface-2 border border-border rounded-full text-xs font-semibold text-[#55C244]">
                FreshMart Chi nhánh Q1
              </span>
            </div>
          </div>

          {/* Categories Tab */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer border ${
                  selectedCategory === cat
                    ? 'bg-[#55C244]/15 border-[#55C244]/40 text-[#55C244]'
                    : 'bg-surface-2 border-border text-text-muted hover:text-text'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-3 gap-4">
            {filteredProducts.map(p => (
              <div
                key={p.id}
                onClick={() => addToCart(p)}
                className="bg-surface-2 border border-border hover:border-[#55C244]/40 rounded-xl p-4 cursor-pointer flex flex-col justify-between h-32"
              >
                <div>
                  <span className="text-[10px] text-text-dim uppercase tracking-wider block font-semibold mb-1">
                    {p.category}
                  </span>
                  <h3 className="text-text font-medium text-sm leading-tight">{p.name}</h3>
                </div>
                <div className="flex justify-between items-center mt-2 border-t border-border pt-2">
                  <span className="text-[#55C244] font-bold text-sm">
                    {p.price.toLocaleString('vi-VN')}đ
                  </span>
                  <span className="text-[10px] text-text-dim font-mono">{p.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Order details */}
        <div className="w-96 shrink-0 flex flex-col bg-surface p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
            <h2 className="text-text font-bold text-base">Đơn hàng hiện tại</h2>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[#EF4444] text-xs font-semibold hover:text-[#F87171] cursor-pointer bg-transparent border-none"
              >
                Xóa tất cả
              </button>
            )}
          </div>

          {/* Order Item List */}
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20 text-text-dim">
                <p className="text-3xl mb-2">—</p>
                <p className="text-sm">Giỏ hàng trống</p>
                <p className="text-[11px] mt-1">Vui lòng click chọn sản phẩm bên trái</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-surface-2 p-3 rounded-lg border border-border">
                  <div className="flex-1 pr-2">
                    <p className="text-text text-xs font-semibold leading-tight">{item.name}</p>
                    <p className="text-[#55C244] text-[11px] mt-1">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-6 h-6 rounded bg-border text-text flex items-center justify-center text-xs hover:bg-[#3A3A3A] cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-text text-xs font-mono font-bold w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-6 h-6 rounded bg-border text-text flex items-center justify-center text-xs hover:bg-[#3A3A3A] cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Receipt toggle option */}
          <div className="border-t border-border pt-4 mt-4">
            <div className="flex items-center justify-between bg-surface-2 p-3 rounded-xl border border-border mb-3">
              <div>
                <p className="text-text text-xs font-semibold">Tạo hóa đơn điện tử</p>
                <p className="text-text-dim text-[10px] mt-0.5">Gửi link hóa đơn qua Zalo/SMS</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={createReceipt}
                  onChange={e => setCreateReceipt(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#9CA3AF] peer-checked:after:bg-bg after:rounded-full after:h-4 after:w-4 peer-checked:bg-[#55C244]" />
              </label>
            </div>

            {/* Payment Method Option */}
            <div className="bg-surface-2 border border-border rounded-xl p-3 mb-4">
              <p className="text-xs text-text font-semibold mb-2">Hình thức thanh toán tại quầy</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPayMethod('cash')}
                  className={`flex-1 py-2 text-center text-xs font-medium rounded-lg border cursor-pointer ${
                    payMethod === 'cash'
                      ? 'bg-[#55C244]/15 border-[#55C244]/40 text-[#55C244]'
                      : 'border-border text-text-muted hover:text-text'
                  }`}
                >
                  Tiền mặt
                </button>
                <button
                  onClick={() => setPayMethod('vietqr')}
                  className={`flex-1 py-2 text-center text-xs font-medium rounded-lg border cursor-pointer ${
                    payMethod === 'vietqr'
                      ? 'bg-[#55C244]/15 border-[#55C244]/40 text-[#55C244]'
                      : 'border-border text-text-muted hover:text-text'
                  }`}
                >
                  VietQR
                </button>
              </div>
            </div>
          </div>

          {/* Pricing calculations */}
          <div className="border-t border-border pt-4 flex flex-col gap-2 mb-6">
            <div className="flex justify-between text-xs text-text-muted">
              <span>Tạm tính</span>
              <span>{subtotal.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between text-xs text-text-muted">
              <span>Thuế VAT (10%)</span>
              <span>{tax.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-border mt-1">
              <span className="text-text font-bold">Tổng thanh toán</span>
              <span className="text-[#55C244] font-bold text-base">{total.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full justify-center text-center font-bold"
          >
            {payMethod === 'vietqr'
              ? (createReceipt ? 'Quét QR & Tạo hóa đơn' : 'Quét QR & In bill giấy')
              : (createReceipt ? 'Nhận tiền & Tạo hóa đơn' : 'Thanh toán & In bill giấy')}
          </Button>
        </div>
      </div>

      {/* Success Modal for normal transaction */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-2 border border-border rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-[#55C244]/20 border border-[#55C244] flex items-center justify-center mx-auto mb-4">
              <span className="text-[#55C244] text-lg font-bold">✓</span>
            </div>
            <h3 className="text-text font-bold text-base mb-2">Thanh toán thành công</h3>
            <p className="text-text-muted text-xs mb-6">Đã ghi nhận giao dịch & hoàn tất in hóa đơn giấy truyền thống.</p>
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                clearCart();
              }}
              className="w-full"
            >
              Tiếp tục bán hàng
            </Button>
          </div>
        </div>
      )}

      {/* VietQR Bank Transfer Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-2 border border-border rounded-2xl p-6 w-full max-w-md text-center flex flex-col items-center">
            {qrModalStatus === 'pending' ? (
              <>
                <h3 className="text-text font-bold text-base mb-1">Quét mã chuyển khoản VietQR</h3>
                <p className="text-text-dim text-xs mb-4">Khách hàng quét mã bên dưới để thanh toán đơn hàng</p>

                <div className="bg-bg border border-border p-4 rounded-xl flex flex-col items-center gap-3 w-full mb-4">
                  <div className="flex justify-between items-center w-full border-b border-border pb-2 mb-1">
                    <span className="text-[9px] font-black text-[#00529C] bg-white px-2 py-0.5 rounded border border-gray-200">VietQR</span>
                    <span className="text-[10px] text-text-muted font-bold">MB BANK (Ngân hàng Quân Đội)</span>
                  </div>
                  
                  {/* Mock QR */}
                  <div className="w-36 h-36 bg-white p-2 rounded-xl flex items-center justify-center relative">
                    <div className="w-full h-full bg-black rounded-lg grid grid-cols-9 grid-rows-9 gap-0.5 p-1.5">
                      {Array.from({ length: 81 }).map((_, i) => {
                        const col = i % 9;
                        const row = Math.floor(i / 9);
                        const isCorner =
                          (row < 3 && col < 3) ||
                          (row < 3 && col > 5) ||
                          (row > 5 && col < 3);
                        const isCenter = row === 4 && col === 4;
                        const isFilled = isCorner || isCenter || Math.random() > 0.45;
                        return (
                          <div
                            key={i}
                            className={`rounded-[1px] ${isFilled ? 'bg-white' : 'bg-black'}`}
                          />
                        );
                      })}
                    </div>
                    {/* Mock VietQR brand tag at center */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-[#55C244] rounded flex items-center justify-center">
                      <span className="text-[8px] font-black text-[#55C244]">P+</span>
                    </div>
                  </div>

                  <div className="w-full text-xs text-text-muted mt-1 space-y-1 text-left">
                    <div className="flex justify-between">
                      <span>Chủ TK:</span>
                      <span className="text-text font-bold uppercase text-[10px]">CÔNG TY CỔ PHẦN PAPERLESS+</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Số TK:</span>
                      <span className="text-text font-mono font-bold">990928374928</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Số tiền:</span>
                      <span className="text-brand font-bold">{total.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nội dung:</span>
                      <span className="text-text font-mono font-bold bg-surface-2 border border-border px-1.5 py-0.5 rounded text-[10px]">{`PL POS ${Date.now().toString().slice(-6)}`}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 mb-5 text-xs text-[#F59E0B] font-semibold">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#F59E0B] animate-ping" />
                  <span>🔄 Đang chờ thanh toán qua PayOS...</span>
                </div>

                <div className="flex gap-2 w-full">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowQRModal(false);
                      setQrModalStatus('pending');
                    }}
                    className="w-full justify-center"
                  >
                    Hủy giao dịch
                  </Button>
                </div>
              </>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center w-full">
                <div className="w-16 h-16 rounded-full bg-[#55C244]/20 border-2 border-[#55C244] flex items-center justify-center mb-4">
                  <span className="text-[#55C244] text-2xl font-bold">✓</span>
                </div>
                <h3 className="text-text font-bold text-base mb-2">Thanh toán thành công!</h3>
                <p className="text-text-muted text-xs">PayOS đã ghi nhận giao dịch thành công qua Webhook.</p>
                <p className="text-[#55C244] text-[11px] font-mono mt-2 animate-pulse">Đang tự động in hóa đơn giấy...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </PageLayout>
  );
}
