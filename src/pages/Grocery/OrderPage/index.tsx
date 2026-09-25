import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import AppLayout from '../../../components/layout/AppLayout';
import { useAuth } from '../../../context/AuthContext';
import type { CatalogProduct } from '../../../types';
import {
  fetchProductsApi,
  fetchProductCategoriesApi,
  createInvoiceApi,
  lookupCustomerByPhoneApi,
  type BackendInvoice,
} from '../../../services/groceryApi';

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
  unit?: string;
}

export default function GroceryOrderPage() {
  const navigate = useNavigate();
  const { business } = useAuth();

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [_categories, setCategories] = useState<string[]>(['Tất cả']);
  const [selectedCategory] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [_isLoadingProducts, setIsLoadingProducts] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [mobileTab, setMobileTab] = useState<'cart' | 'payment'>('cart');
  const [payMethod, setPayMethod] = useState<'cash' | 'vietqr'>('cash');
  const [createReceipt, setCreateReceipt] = useState(false);
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPoints, setCustomerPoints] = useState<number | null>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [lastCreatedInvoice, setLastCreatedInvoice] = useState<BackendInvoice | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedSendChannel, setSelectedSendChannel] = useState<'zalo' | 'sms' | 'both' | 'none'>('zalo');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrModalStatus, setQrModalStatus] = useState<'pending' | 'success'>('pending');

  const lastScanRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  // Camera Barcode Scanner
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
            useBarCodeDetectorIfSupported: true,
          },
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
          setScanStatus(null);

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
            setMobileTab('cart');
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
                    tenantId: business?.id || 'BIZ-GROCERY-01',
                    name: data.name,
                    category: 'Mới thêm',
                    price: 15000,
                    unit: 'Cái',
                    barcode: decodedText,
                    popular: false,
                  };

                  return fetch('/api/product', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newProduct),
                  });
                }
                throw new Error('No name');
              })
              .then(res => res.json())
              .then(createdProduct => {
                setProducts(prev => [createdProduct, ...prev]);
                setCart(prev => [...prev, { ...createdProduct, quantity: 1 }]);
                setMobileTab('cart');
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
  }, [isScanning, products, business?.id]);

  // Load products and categories from Backend
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoadingProducts(true);
      try {
        const [prods, cats] = await Promise.all([
          fetchProductsApi(),
          fetchProductCategoriesApi(),
        ]);
        if (isMounted) {
          setProducts(prods);
          if (cats.length > 0) setCategories(cats);
        }
      } catch (err) {
        console.error('Lỗi tải sản phẩm:', err);
      } finally {
        if (isMounted) setIsLoadingProducts(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'Tất cả' || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery.trim()));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Lookup customer
  const handleLookupCustomer = async () => {
    if (!customerPhone.trim()) return;
    setIsSearchingCustomer(true);
    try {
      const cust = await lookupCustomerByPhoneApi(customerPhone.trim());
      if (cust) {
        setCustomerName(cust.name);
        setCustomerPoints(cust.points);
      } else {
        setCustomerPoints(null);
      }
    } catch {
      //
    } finally {
      setIsSearchingCustomer(false);
    }
  };

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
          unit: product.unit,
        },
      ];
    });
    setMobileTab('cart');
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
    setCashGiven(0);
    setCustomerPhone('');
    setCustomerName('');
    setCustomerPoints(null);
    setMobileTab('cart');
  };

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const total = subtotal;
  const changeDue = Math.max(0, cashGiven - total);

  // Submit order to Backend
  const executeCheckout = async (
    chosenMethod: 'cash' | 'qr',
    channel: 'zalo' | 'sms' | 'both' | 'none' = selectedSendChannel
  ) => {
    if (cart.length === 0 || isSubmittingOrder) return;
    setIsSubmittingOrder(true);
    try {
      const invoice = await createInvoiceApi({
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        payMethod: chosenMethod,
        cashGiven: chosenMethod === 'cash' ? (cashGiven > 0 ? cashGiven : total) : total,
        sendChannel: channel === 'none' ? 'none' : channel,
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
      });

      setLastCreatedInvoice(invoice);

      if (createReceipt) {
        navigate(`/invoice/${invoice.id}`);
      } else {
        setShowSuccessModal(true);
      }
    } catch (err: any) {
      alert(err.message || 'Không thể thanh toán đơn hàng.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleCheckoutClick = () => {
    if (cart.length === 0) return;
    setShowCheckoutModal(true);
  };

  // VietQR simulation timer
  useEffect(() => {
    if (showQRModal && qrModalStatus === 'pending') {
      const timer = setTimeout(() => {
        setQrModalStatus('success');
        const autoClose = setTimeout(() => {
          setShowQRModal(false);
          setQrModalStatus('pending');
          executeCheckout('qr', selectedSendChannel);
        }, 1200);
        return () => clearTimeout(autoClose);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [showQRModal, qrModalStatus, selectedSendChannel]);

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden bg-slate-50 font-sans">

        {/* ─── TOP HEADER BAR ─────────────────────────────────────── */}
        <div className="shrink-0 px-3.5 sm:px-5 py-2.5 sm:py-3.5 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 relative z-30">
          {/* Backdrop overlay when search dropdown is open */}
          {searchQuery.trim() && (
            <div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
              onClick={() => setSearchQuery('')}
            />
          )}

          {/* Left / Top Row on Mobile: title & badge & scan button */}
          <div className="flex items-center justify-between sm:justify-start gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight whitespace-nowrap">
                Bán hàng (POS)
              </h1>
              <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider truncate max-w-[150px] sm:max-w-none">
                {business?.name || 'Tạp Hoá Minh Phát'}
              </span>
            </div>

            {/* Quét mã button on mobile right next to title */}
            <button
              onClick={() => setIsScanning(true)}
              className="sm:hidden px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-xl cursor-pointer shadow-xs whitespace-nowrap transition-colors"
            >
              Quét mã
            </button>
          </div>

          {/* Right / Bottom Row on Mobile: search + desktop scan */}
          <div className="flex gap-2 w-full sm:w-auto sm:min-w-[400px] lg:min-w-[460px] relative z-50">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Tìm sản phẩm theo tên hoặc mã vạch..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Escape') {
                    setSearchQuery('');
                  } else if (e.key === 'Enter' && filteredProducts.length === 1) {
                    addToCart(filteredProducts[0]);
                    setSearchQuery('');
                  }
                }}
                className="w-full px-3.5 py-2 sm:py-2.5 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-sm sm:text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-base cursor-pointer"
                >
                  ×
                </button>
              )}

              {/* ─── MODAL/POPOVER SEARCH RESULTS DROPDOWN ──────────────── */}
              {searchQuery.trim() && (
                <div className="absolute left-0 right-0 sm:left-auto sm:right-0 top-full mt-1.5 w-full sm:w-[500px] max-w-[calc(100vw-24px)] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-[55vh] sm:max-h-[380px] overflow-hidden flex flex-col">
                  <div className="px-3.5 py-2 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
                    <span>Kết quả tìm kiếm ({filteredProducts.length})</span>
                    <span className="text-[10px] font-mono lowercase hidden sm:inline">Nhấn Enter để chọn</span>
                  </div>

                  <div className="divide-y divide-slate-100 overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                      <div className="px-4 py-8 text-xs text-slate-400 text-center">
                        Không tìm thấy sản phẩm nào khớp với "{searchQuery}"
                      </div>
                    ) : (
                      filteredProducts.slice(0, 10).map(p => {
                        const inCart = cart.find(i => i.id === p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              addToCart(p);
                              setSearchQuery('');
                              setMobileTab('cart');
                            }}
                            className="w-full text-left px-3.5 py-2.5 sm:px-4 sm:py-3 hover:bg-emerald-50/50 transition-colors flex items-center justify-between gap-2.5 cursor-pointer"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {p.name}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] sm:text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full font-semibold uppercase">
                                  {p.category}
                                </span>
                                {p.barcode && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    #{p.barcode}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-2">
                              {inCart && (
                                <span className="text-[9px] sm:text-[10px] font-bold bg-[#09261e] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Đã chọn: {inCart.quantity}
                                </span>
                              )}
                              <span className="text-xs font-black font-mono text-emerald-800">
                                {p.price.toLocaleString('vi-VN')} đ
                              </span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quét mã button on desktop */}
            <button
              onClick={() => setIsScanning(true)}
              className="hidden sm:inline-block px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl whitespace-nowrap cursor-pointer shadow-sm shrink-0 transition-colors"
            >
              Quét mã vạch
            </button>
          </div>
        </div>

        {/* ─── MOBILE TAB SWITCHER (CHỈ HIỆN TRÊN ĐIỆN THOẠI) ───────── */}
        <div className="md:hidden shrink-0 px-3 py-2 bg-slate-100 border-b border-slate-200 flex gap-2 z-20">
          <button
            type="button"
            onClick={() => setMobileTab('cart')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              mobileTab === 'cart'
                ? 'bg-[#09261e] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>Giỏ hàng</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              mobileTab === 'cart' ? 'bg-emerald-500 text-white font-bold' : 'bg-slate-200 text-slate-800'
            }`}>
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('payment')}
            disabled={cart.length === 0}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 ${
              mobileTab === 'payment'
                ? 'bg-[#09261e] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>Thanh toán</span>
            {total > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                mobileTab === 'payment' ? 'bg-amber-400 text-slate-950' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {total.toLocaleString('vi-VN')} đ
              </span>
            )}
          </button>
        </div>

        {/* ─── MAIN CONTENT: LEFT (Cart) + RIGHT (Payment) ─────────── */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

          {/* ══════ LEFT: CART LIST ══════════════════════════════════ */}
          <div className={`flex-1 flex-col p-3 sm:p-4 overflow-hidden ${
            mobileTab === 'cart' ? 'flex' : 'hidden md:flex'
          }`}>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col h-full overflow-hidden">
              {/* Cart header */}
              <div className="shrink-0 px-4 sm:px-5 py-2.5 sm:py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Giỏ hàng đơn hàng
                  </span>
                  {cart.length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold uppercase tracking-wider">
                      {cart.reduce((s, i) => s + i.quantity, 0)} món
                    </span>
                  )}
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              {/* Cart items */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-2.5">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-black flex items-center justify-center text-xs uppercase tracking-wider mb-3">
                      POS
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Giỏ hàng đang trống</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                      Dùng ô tìm kiếm phía trên hoặc nhấn "Quét mã" để thêm sản phẩm vào đơn thanh toán.
                    </p>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 sm:gap-3 bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-emerald-300 rounded-xl p-2.5 sm:p-3.5 transition-all shadow-2xs"
                    >
                      {/* Index */}
                      <span className="w-4 sm:w-5 text-center text-[10px] font-mono font-bold text-slate-400 shrink-0">
                        {idx + 1}
                      </span>

                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                          {item.price.toLocaleString('vi-VN')} đ × {item.quantity} = <strong className="text-slate-800 font-bold">{(item.price * item.quantity).toLocaleString('vi-VN')} đ</strong>
                        </p>
                      </div>

                      {/* Qty controls */}
                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                        >
                          −
                        </button>
                        <span className="text-slate-900 text-xs font-mono font-black w-6 sm:w-7 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                        >
                          +
                        </button>
                      </div>

                      {/* Line total */}
                      <span className="w-20 sm:w-24 text-right text-xs font-black font-mono text-emerald-800 shrink-0">
                        {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Cart footer: subtotal & proceed button */}
              {cart.length > 0 && (
                <div className="shrink-0 p-3 sm:px-5 sm:py-3 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <div className="flex items-center justify-between sm:justify-start gap-3">
                    <span className="text-xs text-slate-500 font-semibold">
                      {cart.reduce((s, i) => s + i.quantity, 0)} sản phẩm
                    </span>
                    <span className="text-sm font-black text-slate-900 font-mono">
                      Tạm tính: {total.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  {/* Nút thanh toán trên điện thoại */}
                  <button
                    type="button"
                    onClick={() => setMobileTab('payment')}
                    className="md:hidden py-2.5 px-4 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-xs transition-colors text-center"
                  >
                    Tiến hành thanh toán ({total.toLocaleString('vi-VN')} đ) →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ══════ RIGHT: PAYMENT PANEL ════════════════════════════ */}
          <div className={`w-full md:w-80 xl:w-96 shrink-0 flex-col p-3 sm:p-4 md:pl-0 overflow-y-auto pb-24 md:pb-4 ${
            mobileTab === 'payment' ? 'flex flex-1' : 'hidden md:flex'
          }`}>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-3.5 sm:p-4 flex flex-col gap-3.5 sm:gap-4">
              {/* Nút quay lại giỏ hàng trên điện thoại */}
              <div className="md:hidden">
                <button
                  type="button"
                  onClick={() => setMobileTab('cart')}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>← Quay lại sửa giỏ hàng ({cart.reduce((s, i) => s + i.quantity, 0)} món)</span>
                </button>
              </div>

              <div className="pb-2.5 sm:pb-3 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Thanh toán đơn hàng
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Bán lẻ
                </span>
              </div>

              {/* SĐT khách */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Thông tin khách hàng (SĐT)
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="tel"
                    placeholder="Nhập SĐT khách hàng..."
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    onBlur={handleLookupCustomer}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm sm:text-xs font-mono font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={handleLookupCustomer}
                    disabled={isSearchingCustomer || !customerPhone.trim()}
                    className="px-3.5 py-2 rounded-xl bg-[#09261e] hover:bg-emerald-900 text-white text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    {isSearchingCustomer ? '...' : 'Tìm'}
                  </button>
                </div>
                {customerName && (
                  <div className="text-xs px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex justify-between items-center font-medium">
                    <span>Khách: <strong>{customerName}</strong></span>
                    {customerPoints !== null && (
                      <span className="font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                        Điểm: {customerPoints}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Hình thức thanh toán
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod('cash')}
                    className={`py-2.5 text-center text-xs font-bold uppercase tracking-wider rounded-xl border cursor-pointer transition-colors ${
                      payMethod === 'cash'
                        ? 'bg-[#09261e] text-white border-[#09261e] shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Tiền mặt
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('vietqr')}
                    className={`py-2.5 text-center text-xs font-bold uppercase tracking-wider rounded-xl border cursor-pointer transition-colors ${
                      payMethod === 'vietqr'
                        ? 'bg-[#09261e] text-white border-[#09261e] shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    VietQR
                  </button>
                </div>
              </div>

              {/* VietQR preview */}
              {payMethod === 'vietqr' && cart.length > 0 && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Mã VietQR chuyển khoản
                  </p>
                  <div className="bg-white p-2 rounded-xl border border-slate-200 inline-block mx-auto shadow-2xs">
                    <img
                      src={`https://api.vietqr.io/image/970422-0901234567-compact2.jpg?amount=${total}&addInfo=PAPERLESS+POS`}
                      alt="VietQR"
                      className="w-32 h-32 sm:w-36 sm:h-36 object-contain"
                    />
                  </div>
                  <p className="text-xs font-black font-mono text-emerald-800">
                    {total.toLocaleString('vi-VN')} đ
                  </p>
                  <p className="text-[10px] text-slate-400">MBBank · 0901234567 · NGUYEN VAN MINH</p>
                </div>
              )}

              {/* Cash given + change */}
              {payMethod === 'cash' && cart.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Tiền khách đưa:</span>
                    <input
                      type="number"
                      step="1000"
                      placeholder="0"
                      value={cashGiven || ''}
                      onChange={e => setCashGiven(Number(e.target.value))}
                      className="w-32 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-right text-sm sm:text-xs font-black font-mono text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  {/* Quick cash suggestions */}
                  <div className="flex gap-1 justify-end flex-wrap pt-1">
                    {[total, 50000, 100000, 200000, 500000].filter(v => v >= total).slice(0, 3).map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashGiven(amt)}
                        className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold text-slate-700 cursor-pointer"
                      >
                        {amt === total ? 'Đủ' : `${amt / 1000}k`}
                      </button>
                    ))}
                  </div>

                  {cashGiven > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <span className="text-slate-500 font-medium">Tiền thối lại:</span>
                      <span className={`font-black font-mono text-sm ${changeDue >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {changeDue.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* E-receipt toggle */}
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-700 font-medium">Mở xem hoá đơn điện tử ngay</span>
                <input
                  type="checkbox"
                  checked={createReceipt}
                  onChange={e => setCreateReceipt(e.target.checked)}
                  className="cursor-pointer accent-emerald-600 w-4 h-4"
                />
              </div>

              {/* Spacer on desktop */}
              <div className="hidden md:block flex-1" />

              {/* Total + Action */}
              <div className="space-y-3 mt-auto pt-2 border-t border-slate-200">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng cộng</span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-emerald-800">
                    {total.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <button
                  onClick={handleCheckoutClick}
                  disabled={cart.length === 0 || isSubmittingOrder}
                  className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider cursor-pointer disabled:opacity-50 transition-colors shadow-sm text-center"
                >
                  {isSubmittingOrder ? (
                    'Đang xử lý xuất hoá đơn...'
                  ) : payMethod === 'vietqr' ? (
                    'Xác nhận đã nhận tiền (VietQR)'
                  ) : (
                    'Xuất hoá đơn & Thanh toán'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal (SĐT & Kênh gửi hoá đơn) */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[70] p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl space-y-3.5 sm:space-y-4 my-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2.5 sm:pb-3">
              <div>
                <h3 className="text-slate-900 font-black text-xs sm:text-sm uppercase tracking-wider">
                  Xác nhận xuất hoá đơn
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500">Gửi hoá đơn điện tử không giấy đến khách hàng</p>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer px-1"
              >
                ×
              </button>
            </div>

            {/* SĐT khách hàng */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Số điện thoại nhận hoá đơn
              </label>
              <input
                type="tel"
                placeholder="Nhập SĐT khách hàng (VD: 0901234567)..."
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm sm:text-xs font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600"
                autoFocus
              />
            </div>

            {/* Chọn kênh gửi hoá đơn */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Kênh gửi hoá đơn điện tử (E-Invoice)
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedSendChannel('zalo')}
                  className={`p-2.5 sm:p-3 rounded-xl border text-left flex flex-col gap-1 cursor-pointer transition-colors ${
                    selectedSendChannel === 'zalo'
                      ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="font-bold flex items-center justify-between">
                    <span className="text-xs">Zalo ZNS</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold uppercase">Khuyên dùng</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Gửi Zalo kèm link tra cứu</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSendChannel('sms')}
                  className={`p-2.5 sm:p-3 rounded-xl border text-left flex flex-col gap-1 cursor-pointer transition-colors ${
                    selectedSendChannel === 'sms'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="font-bold text-slate-900 text-xs">Tin nhắn SMS</span>
                  <span className="text-[10px] text-slate-500">Gửi SMS Brandname trực tiếp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSendChannel('both')}
                  className={`p-2.5 sm:p-3 rounded-xl border text-left flex flex-col gap-1 cursor-pointer transition-colors ${
                    selectedSendChannel === 'both'
                      ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="font-bold text-slate-900 text-xs">Cả Zalo & SMS</span>
                  <span className="text-[10px] text-slate-500">Đảm bảo 100% nhận được</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSendChannel('none')}
                  className={`p-2.5 sm:p-3 rounded-xl border text-left flex flex-col gap-1 cursor-pointer transition-colors ${
                    selectedSendChannel === 'none'
                      ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="font-bold text-slate-900 text-xs">Không gửi tin</span>
                  <span className="text-[10px] text-slate-500">Chỉ lưu cơ sở dữ liệu</span>
                </button>
              </div>
            </div>

            {/* Chi tiết đơn */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Số lượng món:</span>
                <span className="font-bold text-slate-800">{cart.reduce((s, i) => s + i.quantity, 0)} món</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hình thức:</span>
                <span className="font-bold text-slate-800 uppercase">{payMethod === 'vietqr' ? 'VietQR Chuyển khoản' : 'Tiền mặt'}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-slate-200">
                <span className="text-slate-700">Tổng thanh toán:</span>
                <span className="text-emerald-800 font-black font-mono">{total.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            {/* Nút hành động */}
            <div className="flex gap-2 sm:gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 hover:bg-slate-100 cursor-pointer font-bold uppercase tracking-wider transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedSendChannel !== 'none' && !customerPhone.trim()) {
                    if (!confirm('Khách chưa nhập SĐT nhận hoá đơn. Bạn có chắc muốn tiếp tục lưu vào hệ thống mà không gửi không?')) {
                      return;
                    }
                  }
                  setShowCheckoutModal(false);
                  if (payMethod === 'vietqr') {
                    setShowQRModal(true);
                  } else {
                    executeCheckout('cash', selectedSendChannel);
                  }
                }}
                disabled={isSubmittingOrder}
                className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer transition-colors shadow-sm text-center"
              >
                {isSubmittingOrder ? 'Đang xử lý...' : 'Xác nhận & Xuất hoá đơn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && lastCreatedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[70] p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 w-full max-w-sm max-h-[92vh] overflow-y-auto text-center shadow-2xl my-auto">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider mb-2">
              Giao dịch hoàn tất
            </span>
            <h3 className="text-slate-900 font-black text-base uppercase tracking-tight mb-1">
              Thanh toán thành công!
            </h3>
            <p className="text-xs text-slate-500 mb-3 font-mono">
              Số phiếu gọi: <strong className="text-lg text-slate-900 font-black">#{lastCreatedInvoice.ticketNumber}</strong>
            </p>

            <div className="p-3 sm:p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-3.5 text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã hoá đơn:</span>
                <span className="font-mono font-bold text-slate-900">{lastCreatedInvoice.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tổng thanh toán:</span>
                <span className="font-bold font-mono text-emerald-800">{lastCreatedInvoice.total.toLocaleString('vi-VN')} đ</span>
              </div>
              {lastCreatedInvoice.changeDue > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Tiền thối lại:</span>
                  <span className="font-bold font-mono text-emerald-700">
                    {lastCreatedInvoice.changeDue.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1.5 border-t border-slate-200">
                <span className="text-slate-500">Kênh gửi:</span>
                <span className="font-bold text-slate-800">
                  {lastCreatedInvoice.sendChannel === 'zalo' && 'Zalo ZNS'}
                  {lastCreatedInvoice.sendChannel === 'sms' && 'Tin nhắn SMS'}
                  {lastCreatedInvoice.sendChannel === 'both' && 'Zalo + SMS'}
                  {(lastCreatedInvoice.sendChannel === 'none' || !lastCreatedInvoice.sendChannel) && 'Lưu hệ thống'}
                </span>
              </div>
              {lastCreatedInvoice.customerPhone && (
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>SĐT nhận:</span>
                  <span className="font-mono font-bold text-slate-800">{lastCreatedInvoice.customerPhone}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Link
                to={`/invoice/${lastCreatedInvoice.id}`}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-center transition-colors"
              >
                Xem hoá đơn
              </Link>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  clearCart();
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-400 hover:bg-amber-500 text-slate-950 text-center transition-colors shadow-sm cursor-pointer"
              >
                Đơn hàng mới
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VietQR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[70] p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 w-full max-w-sm max-h-[92vh] overflow-y-auto text-center flex flex-col items-center shadow-2xl my-auto">
            <h3 className="text-slate-900 font-black text-xs sm:text-sm uppercase tracking-wider mb-1">
              Mã thanh toán VietQR
            </h3>
            <p className="text-slate-500 text-[11px] sm:text-xs mb-3">Quét mã bằng ứng dụng ngân hàng hoặc ví điện tử</p>

            <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 mb-3 shadow-2xs">
              <img
                src={`https://api.vietqr.io/image/970422-0901234567-compact2.jpg?amount=${total}&addInfo=PAPERLESS+POS`}
                alt="VietQR"
                className="w-40 h-40 sm:w-48 sm:h-48 object-contain"
              />
            </div>

            <div className="w-full bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-200 text-xs flex justify-between items-center mb-3.5">
              <span className="text-slate-500 font-medium">Tổng tiền:</span>
              <span className="font-black font-mono text-emerald-800 text-sm">{total.toLocaleString('vi-VN')} đ</span>
            </div>

            <div className="flex gap-2 w-full">
              <button
                onClick={() => {
                  setShowQRModal(false);
                  setQrModalStatus('pending');
                }}
                className="flex-1 py-2 sm:py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 cursor-pointer transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setQrModalStatus('success');
                  setTimeout(() => {
                    setShowQRModal(false);
                    setQrModalStatus('pending');
                    executeCheckout('qr');
                  }, 500);
                }}
                className="flex-1 py-2 sm:py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-400 hover:bg-amber-500 text-slate-950 cursor-pointer shadow-sm transition-colors"
              >
                Xác nhận đã nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scanner Modal */}
      {isScanning && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex flex-col items-center justify-center z-[70] p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md shadow-2xl my-auto">
            <div className="flex justify-between items-center mb-3 sm:mb-4 border-b border-slate-200 pb-2.5 sm:pb-3">
              <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-900">
                Quét mã vạch sản phẩm
              </h3>
              <button
                onClick={() => {
                  setIsScanning(false);
                  setScanStatus(null);
                }}
                className="text-xl font-bold text-slate-400 hover:text-slate-700 cursor-pointer px-1"
              >
                ×
              </button>
            </div>
            <div id="pos-reader" className="w-full rounded-xl overflow-hidden border border-slate-200"></div>

            {scanStatus && (
              <div
                className={`mt-3 p-2.5 rounded-xl text-xs text-center font-bold uppercase tracking-wider ${
                  scanStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : scanStatus.type === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                {scanStatus.message}
              </div>
            )}

            <p className="text-[11px] text-slate-400 mt-3 sm:mt-4 text-center">
              Hướng camera vào mã vạch trên sản phẩm. Hệ thống sẽ tự động thêm vào giỏ hàng.
            </p>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
