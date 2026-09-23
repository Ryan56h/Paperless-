import { useState, useEffect, useMemo, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../../components/layout/AppLayout';
import Button from '../../../components/common/Button';
import { useAuth } from '../../../context/AuthContext';
import type { CatalogProduct } from '../../../types';

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
}

export default function GroceryOrderPage() {
  const navigate = useNavigate();
  const { business } = useAuth();

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch products from backend
  useEffect(() => {
    if (business?.id) {
      fetch(`/api/product?tenantId=${business.id}`)
        .then(res => res.json())
        .then(data => setProducts(data))
        .catch(err => console.error(err));
    }
  }, [business?.id]);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [payMethod, setPayMethod] = useState<'cash' | 'vietqr'>('cash');
  const [createReceipt, setCreateReceipt] = useState(false);
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<{message: string, type: 'success'|'error'|'info'} | null>(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrModalStatus, setQrModalStatus] = useState<'pending' | 'success'>('pending');

  const lastScanRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner(
        "pos-reader",
        { 
          fps: 15, 
          qrbox: { width: 250, height: 150 },
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
          ],
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        },
        /* verbose= */ false
      );
      
      scanner.render(
        (decodedText) => {
          const now = Date.now();
          if (lastScanRef.current.code === decodedText && now - lastScanRef.current.time < 2000) return;
          lastScanRef.current = { code: decodedText, time: now };
          
          // Tắt camera ngay lập tức sau khi lấy được mã
          scanner.clear().catch(e => console.log(e));
          setIsScanning(false);
          setScanStatus(null); // Reset status

          const product = products.find(p => p.barcode === decodedText || p.id === decodedText);
          if (product) {
            setCart(prev => {
              const existing = prev.find(item => item.id === product.id);
              if (existing) {
                return prev.map(item =>
                  item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
              }
              return [...prev, { ...product, quantity: 1 }];
            });
            setShowMobileCart(true);
          } else {
            // Tự động tìm trên mạng nếu không có trong DB
            fetch(`/api/product/lookup-barcode/${decodedText}`)
              .then(res => {
                if (!res.ok) throw new Error('Not found');
                return res.json();
              })
              .then(data => {
                if (data.name) {
                  const newProduct = {
                    tenantId: business?.id,
                    name: data.name,
                    category: 'Mới thêm',
                    price: 15000,
                    unit: 'Cái',
                    barcode: decodedText,
                    popular: false
                  };
                  
                  // Thêm thẳng vào Database
                  return fetch('/api/product', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newProduct)
                  });
                }
                throw new Error('No name');
              })
              .then(res => res.json())
              .then(createdProduct => {
                setProducts(prev => [createdProduct, ...prev]);
                setCart(prev => [...prev, { ...createdProduct, quantity: 1 }]);
                setShowMobileCart(true);
              })
              .catch(() => {
                alert(`Không tìm thấy mã vạch ${decodedText} trên hệ thống!`);
              });
          }
        },
        () => {}
      );
      
      return () => {
        scanner.clear().catch(e => console.log(e));
      };
    }
  }, [isScanning]);
  useEffect(() => {
    if (showQRModal && qrModalStatus === 'pending') {
      const timer = setTimeout(() => {
        setQrModalStatus('success');
        const autoClose = setTimeout(() => {
          setShowQRModal(false);
          setQrModalStatus('pending');
          if (createReceipt) {
            navigate('/staff/invoice/new');
          } else {
            setShowSuccessModal(true);
          }
        }, 1200);
        return () => clearTimeout(autoClose);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [showQRModal, qrModalStatus, createReceipt, navigate]);

  const categories = useMemo(() => {
    return ['Tất cả', ...Array.from(new Set(products.map(p => p.category)))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'Tất cả' || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const addToCart = (product: CatalogProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          quantity: 1,
          price: product.price,
          category: product.category,
        },
      ];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter(item => item.quantity > 0)
    );
  };

  const clearCart = () => {
    setCart([]);
    setShowMobileCart(false);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const total = subtotal;
  const changeDue = Math.max(0, cashGiven - total);

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const orderDraft = {
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
      subtotal,
      tax: 0,
      total,
      payMethod,
      paymentStatus: 'paid',
    };
    sessionStorage.setItem('posOrderDraft', JSON.stringify(orderDraft));

    if (payMethod === 'vietqr') {
      setShowQRModal(true);
    } else {
      if (createReceipt) {
        navigate('/staff/invoice/new');
      } else {
        setShowSuccessModal(true);
      }
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-bg">
        {/* LEFT: PRODUCTS LIST */}
        <div className="flex-1 flex flex-col p-5 overflow-y-auto border-r border-border">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-base font-bold text-text">Bán hàng (POS) — Tạp hoá</h1>
              <p className="text-text-dim text-xs mt-0.5">
                Chọn sản phẩm để thêm vào đơn hàng
              </p>
            </div>
            <span className="text-xs text-text-muted px-2.5 py-1 bg-surface-2 border border-border rounded">
              {business?.name || 'Tạp Hoá Minh Phát'}
            </span>
          </div>

          {/* Search */}
          <div className="mb-3 flex gap-2">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 rounded bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-text"
            />
            <button 
              onClick={() => setIsScanning(true)}
              className="px-3 py-2 bg-text text-bg rounded font-medium text-xs whitespace-nowrap cursor-pointer shadow-sm"
            >
              📷 Quét mã
            </button>
          </div>

          {/* Categories */}
          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer border whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-text text-bg border-text font-semibold'
                    : 'bg-surface-2 border-border text-text-muted hover:text-text'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {filteredProducts.map(p => {
              const inCartItem = cart.find(i => i.id === p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className={`p-3 rounded border transition-colors cursor-pointer flex flex-col justify-between select-none ${
                    inCartItem
                      ? 'bg-surface-2 border-text'
                      : 'bg-surface border-border hover:border-text-dim'
                  }`}
                >
                  <div>
                    <span className="text-[10px] text-text-dim uppercase tracking-wider block mb-1">
                      {p.category}
                    </span>
                    <h3 className="text-text font-medium text-xs leading-snug line-clamp-2">
                      {p.name}
                    </h3>
                  </div>

                  <div className="flex justify-between items-center mt-3 border-t border-border pt-2">
                    <span className="text-text font-bold text-xs">
                      {p.price.toLocaleString('vi-VN')} đ
                    </span>
                    {inCartItem ? (
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-surface-2 border border-border text-text">
                        x{inCartItem.quantity}
                      </span>
                    ) : (
                      <span className="text-[11px] text-text-dim">{p.unit || 'Cái'}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Floating Cart Button (Mobile) */}
        {!showMobileCart && cart.length > 0 && (
          <div className="lg:hidden fixed bottom-16 left-0 right-0 p-3 bg-surface border-t border-border z-30 flex gap-3 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] pb-safe">
            <div className="flex-1 px-3 flex flex-col justify-center">
              <span className="text-xs text-text-muted">{cart.reduce((s, i) => s + i.quantity, 0)} sản phẩm</span>
              <span className="font-bold text-text text-base">{total.toLocaleString('vi-VN')} đ</span>
            </div>
            <button 
              onClick={() => setShowMobileCart(true)}
              className="px-6 py-2 bg-text text-bg rounded-lg font-bold text-sm shadow cursor-pointer"
            >
              Xem giỏ
            </button>
          </div>
        )}

        {/* RIGHT: CART */}
        <div className={`
          fixed inset-0 z-50 bg-surface lg:relative lg:w-80 shrink-0 flex flex-col p-5 border-l border-border transition-transform duration-300
          ${showMobileCart ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
        `}>
          {/* Mobile Close Button */}
          <div className="lg:hidden flex justify-between items-center mb-3 border-b border-border pb-2.5 mt-2">
            <div>
              <h2 className="text-text font-bold text-lg">Giỏ hàng</h2>
              <p className="text-xs text-text-dim">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  setShowMobileCart(false);
                  setIsScanning(true);
                }}
                className="px-2 py-1 bg-surface-2 border border-border rounded text-xs font-medium text-text cursor-pointer"
              >
                📷 Quét tiếp
              </button>
              <button onClick={() => setShowMobileCart(false)} className="text-2xl text-text-muted hover:text-text cursor-pointer px-1">&times;</button>
            </div>
          </div>

          <div className="hidden lg:flex justify-between items-center mb-3 border-b border-border pb-2.5">
            <div>
              <h2 className="text-text font-bold text-sm">Đơn hàng</h2>
              <p className="text-[11px] text-text-dim">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm
              </p>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-text-dim hover:text-text text-xs cursor-pointer bg-transparent border-none"
              >
                Xóa giỏ
              </button>
            )}
          </div>

          {/* Cart List */}
          <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1 min-h-[160px] max-h-[260px] lg:max-h-none">
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-text-dim text-xs">
                <p>Chưa có sản phẩm trong đơn</p>
              </div>
            ) : (
              cart.map(item => (
                <div
                  key={item.id}
                  className="flex justify-between items-center bg-surface-2 p-2 rounded border border-border"
                >
                  <div className="flex-1 pr-2 min-w-0">
                    <p className="text-text text-xs font-medium truncate leading-tight">
                      {item.name}
                    </p>
                    <p className="text-text-dim text-[11px] mt-0.5">
                      {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-5 h-5 rounded bg-surface border border-border text-text flex items-center justify-center text-xs hover:bg-surface-2 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-text text-xs font-mono font-bold w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-5 h-5 rounded bg-surface border border-border text-text flex items-center justify-center text-xs hover:bg-surface-2 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout section */}
          <div className="border-t border-border pt-3 mt-3 space-y-3">
            {/* E-Receipt Toggle */}
            <div className="flex items-center justify-between bg-surface-2 p-2 rounded border border-border text-xs">
              <span className="text-text-muted">Hoá đơn điện tử</span>
              <input
                type="checkbox"
                checked={createReceipt}
                onChange={e => setCreateReceipt(e.target.checked)}
                className="cursor-pointer"
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-1">
              <span className="text-[11px] text-text-dim block">Hình thức thanh toán</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPayMethod('cash')}
                  className={`py-1.5 text-center text-xs font-medium rounded border cursor-pointer transition-colors ${
                    payMethod === 'cash'
                      ? 'bg-text text-bg font-bold border-text'
                      : 'bg-surface-2 border-border text-text-muted hover:text-text'
                  }`}
                >
                  Tiền mặt
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod('vietqr')}
                  className={`py-1.5 text-center text-xs font-medium rounded border cursor-pointer transition-colors ${
                    payMethod === 'vietqr'
                      ? 'bg-text text-bg font-bold border-text'
                      : 'bg-surface-2 border-border text-text-muted hover:text-text'
                  }`}
                >
                  VietQR
                </button>
              </div>
            </div>

            {/* Cash calculator */}
            {payMethod === 'cash' && cart.length > 0 && (
              <div className="p-2 rounded bg-surface-2 border border-border text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Tiền khách đưa:</span>
                  <input
                    type="number"
                    step="1000"
                    placeholder="0"
                    value={cashGiven || ''}
                    onChange={e => setCashGiven(Number(e.target.value))}
                    className="w-24 px-2 py-1 rounded bg-surface border border-border text-right text-xs font-bold text-text focus:outline-none"
                  />
                </div>
                {cashGiven > 0 && (
                  <div className="flex items-center justify-between pt-1 border-t border-border">
                    <span className="text-text-muted">Tiền thối lại:</span>
                    <span className="font-bold text-text">
                      {changeDue.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Total */}
            <div className="border-t border-border pt-2 flex justify-between items-center text-xs">
              <span className="font-semibold text-text uppercase">Tổng cộng:</span>
              <span className="text-base font-bold text-text">
                {total.toLocaleString('vi-VN')} đ
              </span>
            </div>

            {/* Action */}
            <Button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full justify-center text-center font-bold py-2.5 text-xs"
            >
              {payMethod === 'vietqr' ? 'Quét mã VietQR' : 'Thanh toán'}
            </Button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-surface border border-border rounded-xl p-5 w-full max-w-sm text-center">
            <h3 className="text-text font-bold text-sm mb-1">Thanh toán hoàn tất</h3>
            <p className="text-text-muted text-xs mb-4">
              Số tiền: {total.toLocaleString('vi-VN')} đ
            </p>
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                clearCart();
                setCashGiven(0);
              }}
              className="w-full py-2 text-xs"
            >
              Đơn hàng mới
            </Button>
          </div>
        </div>
      )}

      {/* VietQR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-surface border border-border rounded-xl p-5 w-full max-w-sm text-center flex flex-col items-center">
            <h3 className="text-text font-bold text-sm mb-1">Mã thanh toán VietQR</h3>
            <p className="text-text-dim text-xs mb-3">Quét mã bằng ứng dụng ngân hàng</p>

            <div className="bg-white p-3 rounded border border-border mb-3">
              <img
                src={`https://api.vietqr.io/image/970422-0901234567-compact2.jpg?amount=${total}&addInfo=PAPERLESS+POS`}
                alt="VietQR"
                className="w-48 h-48 object-contain"
              />
            </div>

            <div className="w-full bg-surface-2 p-2 rounded border border-border text-xs flex justify-between items-center mb-3">
              <span className="text-text-muted">Tổng tiền:</span>
              <span className="font-bold text-text">{total.toLocaleString('vi-VN')} đ</span>
            </div>

            <div className="flex gap-2 w-full">
              <button
                onClick={() => {
                  setShowQRModal(false);
                  setQrModalStatus('pending');
                }}
                className="flex-1 py-1.5 rounded text-xs bg-surface-2 text-text border border-border cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setQrModalStatus('success');
                  setTimeout(() => {
                    setShowQRModal(false);
                    setQrModalStatus('pending');
                    if (createReceipt) {
                      navigate('/staff/invoice/new');
                    } else {
                      setShowSuccessModal(true);
                    }
                  }, 500);
                }}
                className="flex-1 py-1.5 rounded text-xs font-semibold bg-text text-bg cursor-pointer"
              >
                Xác nhận đã nhận
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Scanner Modal */}
      {isScanning && (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-[70] p-4">
          <div className="bg-surface p-4 rounded-xl w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-text">Quét mã vạch</h3>
              <button onClick={() => {
                setIsScanning(false);
                setScanStatus(null);
              }} className="text-xl text-text-muted hover:text-text cursor-pointer px-2">&times;</button>
            </div>
            <div id="pos-reader" className="w-full rounded overflow-hidden"></div>
            
            {scanStatus && (
              <div className={`mt-3 p-2 rounded text-xs text-center font-medium ${
                scanStatus.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' :
                scanStatus.type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' :
                'bg-blue-100 text-blue-700 border border-blue-200'
              }`}>
                {scanStatus.message}
              </div>
            )}
            
            <p className="text-[11px] text-text-dim mt-4 text-center">Hướng camera vào mã vạch trên sản phẩm. Hệ thống sẽ tự động thêm vào giỏ hàng (bạn có thể quét liên tục nhiều món).</p>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
