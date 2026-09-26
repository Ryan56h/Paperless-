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
  createCustomerApi,
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
  const [categories, setCategories] = useState<string[]>(['Tất cả']);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [mobileTab, setMobileTab] = useState<'products' | 'cart' | 'payment'>('products');
  const [payMethod, setPayMethod] = useState<'cash' | 'vietqr'>('cash');
  const [createReceipt, setCreateReceipt] = useState(false);
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPoints, setCustomerPoints] = useState<number | null>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [customerNotFound, setCustomerNotFound] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [lastCreatedInvoice, setLastCreatedInvoice] = useState<BackendInvoice | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedSendChannel, setSelectedSendChannel] = useState<'zalo' | 'sms' | 'both' | 'none'>('zalo');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

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

          // 1. Tìm trong bộ nhớ trước
          const localProduct = products.find(p => p.barcode === decodedText || p.id === decodedText);
          if (localProduct) {
            setCart(prev => {
              const existing = prev.find(item => item.id === localProduct.id);
              if (existing) {
                return prev.map(item =>
                  item.id === localProduct.id ? { ...item, quantity: item.quantity + 1 } : item
                );
              }
              return [...prev, { ...localProduct, quantity: 1 }];
            });
          } else {
            // 2. Không có trong bộ nhớ -> query Database qua proxy
            const token = localStorage.getItem('paperless_token');
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            fetch(`/api/products?search=${encodeURIComponent(decodedText)}`, { headers })
              .then(res => {
                if (!res.ok) throw new Error('API error');
                return res.json();
              })
              .then((dbProducts: any[]) => {
                const dbProduct = dbProducts.find((p: any) => p.barcode === decodedText);
                if (dbProduct) {
                  // Tìm thấy trong DB -> cập nhật bộ nhớ và thêm vào giỏ
                  const mapped = {
                    id: dbProduct.id,
                    name: dbProduct.name,
                    category: dbProduct.category,
                    price: dbProduct.price,
                    unit: dbProduct.unit,
                    barcode: dbProduct.barcode,
                    stock: dbProduct.stock,
                    popular: dbProduct.popular,
                    image: dbProduct.imageUrl,
                  };
                  setProducts(prev => {
                    if (!prev.find(p => p.id === mapped.id)) {
                      return [...prev, mapped];
                    }
                    return prev;
                  });
                  setCart(prev => {
                    const existing = prev.find(item => item.id === mapped.id);
                    if (existing) {
                      return prev.map(item =>
                        item.id === mapped.id ? { ...item, quantity: item.quantity + 1 } : item
                      );
                    }
                    return [...prev, { ...mapped, quantity: 1 }];
                  });
                } else {
                  // 3. Không có trong DB -> báo nhân viên tự thêm
                  alert(`Mã vạch "${decodedText}" chưa có trong hệ thống!\nVui lòng thêm sản phẩm này ở trang Quản lý sản phẩm trước.`);
                }
              })
              .catch(() => {
                alert(`Lỗi khi tra cứu mã vạch ${decodedText}!`);
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
    setCustomerNotFound(false);
    try {
      const cust = await lookupCustomerByPhoneApi(customerPhone.trim());
      if (cust) {
        setCustomerName(cust.name);
        setCustomerPoints(cust.points);
      } else {
        setCustomerName('');
        setCustomerPoints(null);
        setCustomerNotFound(true);
      }
    } catch {
      //
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim() || !customerPhone.trim()) return;
    setIsCreatingCustomer(true);
    try {
      const cust = await createCustomerApi({ name: newCustomerName.trim(), phone: customerPhone.trim() });
      if (cust) {
        setCustomerName(cust.name);
        setCustomerPoints(cust.points);
        setCustomerNotFound(false);
        setNewCustomerName('');
      }
    } catch (e: any) {
      alert(e.message || 'Lỗi khi tạo khách hàng');
    } finally {
      setIsCreatingCustomer(false);
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
        <div className="lg:hidden shrink-0 px-3 py-2 bg-slate-100 border-b border-slate-200 flex gap-2 z-20">
          <button
            type="button"
            onClick={() => setMobileTab('products')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider text-center transition-colors cursor-pointer ${
              mobileTab === 'products'
                ? 'bg-[#09261e] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Sản phẩm
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('cart')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              mobileTab !== 'products'
                ? 'bg-[#09261e] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>Đơn hàng</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              mobileTab !== 'products' ? 'bg-emerald-500 text-white font-bold' : 'bg-slate-200 text-slate-800'
            }`}>
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
            {total > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                mobileTab !== 'products' ? 'bg-amber-400 text-slate-950' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {total.toLocaleString('vi-VN')} đ
              </span>
            )}
          </button>
        </div>

        {/* ─── MAIN CONTENT: LEFT (Catalog Grid) + RIGHT (Cart & Payment) ─ */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">

          {/* ══════ LEFT: PRODUCT CATALOG GRID ═══════════════════════ */}
          <div className={`flex-1 flex-col p-3 sm:p-4 overflow-hidden min-h-0 min-w-0 ${
            mobileTab === 'products' ? 'flex' : 'hidden lg:flex'
          }`}>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col h-full overflow-hidden">
              
              {/* Category Pills Bar */}
              <div className="shrink-0 px-3.5 sm:px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 flex items-center gap-1.5 overflow-x-auto">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors ${
                      selectedCategory === cat
                        ? 'bg-[#09261e] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Product Cards Grid */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                {isLoadingProducts ? (
                  <div className="h-full flex flex-col items-center justify-center py-12 text-slate-400">
                    <div className="w-8 h-8 rounded-full border-2 border-emerald-600/30 border-t-emerald-600 animate-spin mb-2" />
                    <p className="text-xs font-bold uppercase tracking-wider">Đang tải sản phẩm...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-12 text-slate-400 text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Không tìm thấy sản phẩm nào</p>
                    <p className="text-[11px] text-slate-400 mt-1">Thử chọn danh mục khác hoặc xóa bộ lọc tìm kiếm.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
                    {filteredProducts.map(p => {
                      const inCart = cart.find(i => i.id === p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            addToCart(p);
                          }}
                          className={`group relative p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 ${
                            inCart
                              ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20'
                              : 'bg-white border-slate-200 hover:border-emerald-400'
                          }`}
                        >
                          {/* Badge in cart */}
                          {inCart && (
                            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#09261e] text-white text-[10px] font-black font-mono shadow-xs">
                              ×{inCart.quantity}
                            </span>
                          )}

                          <div className="pr-6">
                            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                              <span className="text-[9px] px-1.5 py-0.2 rounded-md font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                                {p.category}
                              </span>
                              {p.popular && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-md font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                                  HOT
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
                              {p.name}
                            </h4>
                            {p.barcode && (
                              <p className="text-[10px] text-slate-400 font-mono mt-1 truncate">
                                #{p.barcode}
                              </p>
                            )}
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-baseline justify-between">
                            <span className="text-xs sm:text-sm font-black font-mono text-emerald-800">
                              {p.price.toLocaleString('vi-VN')} đ
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              /{p.unit || 'Cái'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom counter footer */}
              <div className="shrink-0 px-4 py-2 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Hiển thị <strong>{filteredProducts.length}</strong> sản phẩm</span>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMobileTab('cart')}
                    className="lg:hidden font-bold text-emerald-700 uppercase tracking-wider"
                  >
                    Xem giỏ hàng ({cart.reduce((s, i) => s + i.quantity, 0)}) →
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ══════ RIGHT: FIXED POS CART & CHECKOUT REGISTER ══════════════════════ */}
          <div className={`w-full lg:w-[420px] xl:w-[460px] shrink-0 flex-col p-3 sm:p-4 lg:pl-0 h-full overflow-hidden min-h-0 ${
            mobileTab === 'cart' ? 'flex' : 'hidden lg:flex'
          }`}>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col h-full overflow-hidden min-h-0">
              {/* Register Header */}
              <div className="shrink-0 px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Đơn hàng
                  </span>
                  {cart.length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold uppercase tracking-wider">
                      {cart.reduce((s, i) => s + i.quantity, 0)} món ({cart.length} loại)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={clearCart}
                      className="text-red-600 hover:text-red-700 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                    >
                      Xóa giỏ
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Cart Items (Only this section scrolls!) */}
              <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-3.5 space-y-2">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-10 text-center text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-black flex items-center justify-center text-xs uppercase tracking-wider mb-2">
                      POS
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Đơn hàng trống</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                      Chọn món từ danh mục bên trái hoặc quét mã vạch sản phẩm.
                    </p>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 sm:gap-2.5 bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-emerald-300 rounded-xl p-2.5 transition-all shadow-2xs"
                    >
                      <span className="w-4 text-center text-[10px] font-mono font-bold text-slate-400 shrink-0">
                        {idx + 1}
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {item.price.toLocaleString('vi-VN')} đ × {item.quantity} = <strong className="text-slate-800 font-bold">{(item.price * item.quantity).toLocaleString('vi-VN')} đ</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                        >
                          −
                        </button>
                        <span className="text-slate-900 text-xs font-mono font-black w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                        >
                          +
                        </button>
                      </div>

                      <span className="w-18 sm:w-20 text-right text-xs font-black font-mono text-emerald-800 shrink-0">
                        {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Pinned Bottom Payment & Checkout Panel (Cố định ở đáy, không bao giờ bị cuộn mất!) */}
              <div className="shrink-0 border-t border-slate-200 bg-slate-50/90 p-3 sm:p-3.5 space-y-2.5">
                {/* SĐT khách */}
                <div className="space-y-1">
                  <div className="flex gap-1.5">
                    <input
                      type="tel"
                      placeholder="SĐT khách hàng (tích điểm / nhận hóa đơn)..."
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      onBlur={handleLookupCustomer}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={handleLookupCustomer}
                      disabled={isSearchingCustomer || !customerPhone.trim()}
                      className="px-3 py-1.5 rounded-xl bg-[#09261e] hover:bg-emerald-900 text-white text-[11px] font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50 transition-colors shrink-0"
                    >
                      {isSearchingCustomer ? '...' : 'Tìm'}
                    </button>
                  </div>

                  {customerName && (
                    <div className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex justify-between items-center font-medium">
                      <span className="truncate">Khách: <strong>{customerName}</strong></span>
                      {customerPoints !== null && (
                        <span className="font-bold text-emerald-700 bg-white px-1.5 py-0.2 rounded border border-emerald-200 text-[10px] shrink-0 ml-1">
                          {customerPoints} điểm
                        </span>
                      )}
                    </div>
                  )}

                  {customerNotFound && !customerName && (
                    <div className="p-2 border border-dashed border-slate-300 rounded-xl bg-white flex gap-1.5 items-center">
                      <input
                        type="text"
                        placeholder="Tên khách mới..."
                        value={newCustomerName}
                        onChange={e => setNewCustomerName(e.target.value)}
                        className="flex-1 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleCreateCustomer}
                        disabled={isCreatingCustomer || !newCustomerName.trim()}
                        className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-emerald-700 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                      >
                        {isCreatingCustomer ? '...' : 'Tạo'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Phương thức thanh toán */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPayMethod('cash')}
                    className={`py-1.5 text-center text-xs font-bold uppercase tracking-wider rounded-xl border cursor-pointer transition-colors ${
                      payMethod === 'cash'
                        ? 'bg-[#09261e] text-white border-[#09261e] shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Tiền mặt
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('vietqr')}
                    className={`py-1.5 text-center text-xs font-bold uppercase tracking-wider rounded-xl border cursor-pointer transition-colors ${
                      payMethod === 'vietqr'
                        ? 'bg-[#09261e] text-white border-[#09261e] shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    VietQR (CK)
                  </button>
                </div>

                {/* Tiền mặt: tiền khách đưa + gợi ý tiền nhanh + tiền thối */}
                {payMethod === 'cash' && cart.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 text-[11px] font-medium shrink-0">Khách đưa:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="1000"
                          placeholder="0"
                          value={cashGiven || ''}
                          onChange={e => setCashGiven(Number(e.target.value))}
                          className="w-28 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-right text-xs font-black font-mono text-slate-900 focus:outline-none focus:border-emerald-600"
                        />
                        <span className="text-[11px] text-slate-400 font-mono">đ</span>
                      </div>
                    </div>

                    {/* Gợi ý tiền nhanh */}
                    <div className="flex gap-1 justify-end flex-wrap">
                      {[total, 50000, 100000, 200000, 500000].filter(v => v >= total).slice(0, 4).map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCashGiven(amt)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border cursor-pointer transition-colors ${
                            cashGiven === amt
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          {amt === total ? 'Đủ tiền' : `${amt / 1000}k`}
                        </button>
                      ))}
                    </div>

                    {cashGiven > 0 && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                        <span className="text-slate-500 text-[11px] font-medium">Tiền thối lại:</span>
                        <span className={`font-black font-mono ${changeDue >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                          {changeDue.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* VietQR note */}
                {payMethod === 'vietqr' && cart.length > 0 && (
                  <div className="px-2.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-[11px] text-blue-900">
                    <span className="font-semibold">Mã VietQR động tự tạo</span>
                    <span className="font-mono font-bold text-blue-800">MBBank · 0901234567</span>
                  </div>
                )}

                {/* Total + Action Button (Cố định ở đáy panel) */}
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={createReceipt}
                        onChange={e => setCreateReceipt(e.target.checked)}
                        className="rounded accent-emerald-600 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>Mở xem hoá đơn sau khi xuất</span>
                    </label>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng thanh toán</span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {cart.reduce((s, i) => s + i.quantity, 0)} sản phẩm ({cart.length} món)
                      </span>
                    </div>
                    <span className="text-xl sm:text-2xl font-black font-mono text-emerald-800">
                      {total.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCheckoutClick}
                    disabled={cart.length === 0 || isSubmittingOrder}
                    className="w-full py-3 sm:py-3.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm active:scale-[0.99] text-center"
                  >
                    {isSubmittingOrder ? (
                      'Đang xử lý xuất hoá đơn...'
                    ) : payMethod === 'vietqr' ? (
                      'Tạo mã & Xác nhận VietQR'
                    ) : (
                      'Xuất hoá đơn & Thanh toán'
                    )}
                  </button>
                </div>
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
                type="button"
                onClick={() => {
                  setShowQRModal(false);
                }}
                className="flex-1 py-2 sm:py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 cursor-pointer transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isSubmittingOrder}
                onClick={() => {
                  setShowQRModal(false);
                  executeCheckout('qr', selectedSendChannel);
                }}
                className="flex-1 py-2 sm:py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-400 hover:bg-amber-500 text-slate-950 cursor-pointer shadow-sm transition-colors disabled:opacity-50"
              >
                {isSubmittingOrder ? 'Đang xử lý...' : 'Xác nhận đã nhận tiền'}
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
