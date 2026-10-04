import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import { useCartSync } from '../../../hooks/useCartSync';

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
  unit?: string;
  barcode?: string;
}

interface ScannedProductInfo {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit?: string;
  barcode?: string;
  category?: string;
  time: number;
  source: 'barcode_gun' | 'camera' | 'search' | 'sync';
}

// POS Audio feedback synthesizer using Web Audio API
function playPosBeep(type: 'success' | 'error' = 'success') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, ctx.currentTime); // 1760Hz (A6) high POS beep
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    }
  } catch {
    // Ignore audio autoplay restrictions
  }
}

export default function GroceryOrderPage() {
  const navigate = useNavigate();
  const { business, user } = useAuth();

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [_categories, setCategories] = useState<string[]>(['Tất cả']);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSelectedIndex, setSearchSelectedIndex] = useState(0);
  const [_isLoadingProducts, setIsLoadingProducts] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [mobileTab, setMobileTab] = useState<'scan_cart' | 'payment'>('scan_cart');
  const [payMethod, setPayMethod] = useState<'cash' | 'vietqr'>('cash');
  const [createReceipt, setCreateReceipt] = useState(false);
  const [cashGiven, setCashGiven] = useState<number>(0);

  // Customer state
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPoints, setCustomerPoints] = useState<number | null>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [customerNotFound, setCustomerNotFound] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');

  // Scanning & Display Screen state
  const [lastScanned, setLastScanned] = useState<ScannedProductInfo | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [scanNotice, setScanNotice] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Checkout modals
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [lastCreatedInvoice, setLastCreatedInvoice] = useState<BackendInvoice | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedSendChannel, setSelectedSendChannel] = useState<'zalo' | 'sms' | 'both' | 'none'>('zalo');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const lastCameraScanRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  // Real-time cart sync between phone (barcode scanner) and desktop (POS)
  const tenantId = business?.id || user?.tenantId;
  const { connectionStatus } = useCartSync({
    tenantId,
    cart,
    setCart,
  });

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

  // Filter products for live search dropdown
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.trim().toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(query) ||
      (p.barcode && p.barcode.toLowerCase().includes(query)) ||
      (p.id && p.id.toLowerCase().includes(query))
    );
  }, [products, searchQuery]);

  // Keep search selected index in range
  useEffect(() => {
    setSearchSelectedIndex(0);
  }, [filteredProducts]);

  // Add product to cart with source attribution & live display update
  const addToCart = useCallback((
    product: CatalogProduct | CartItem,
    source: 'barcode_gun' | 'camera' | 'search' | 'sync' = 'search'
  ) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      let newQty = 1;
      let nextCart: CartItem[];

      if (existing) {
        newQty = existing.quantity + 1;
        nextCart = prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        nextCart = [
          {
            id: product.id,
            name: product.name,
            quantity: 1,
            price: product.price,
            category: product.category,
            unit: product.unit || 'Cái',
            barcode: product.barcode,
          },
          ...prev, // put newly added item at top
        ];
      }

      setLastScanned({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: newQty,
        unit: product.unit || 'Cái',
        barcode: product.barcode,
        category: product.category,
        time: Date.now(),
        source,
      });

      return nextCart;
    });

    playPosBeep('success');
  }, []);

  // Barcode Handler (used by Barcode Gun, Camera, and Search Bar)
  const handleBarcodeScanned = useCallback(async (
    rawCode: string,
    source: 'barcode_gun' | 'camera' | 'search' = 'barcode_gun'
  ) => {
    const code = rawCode.trim();
    if (!code) return;

    // 1. Look in local memory
    const localProduct = products.find(
      p => p.barcode === code || p.id === code || (p.barcode && p.barcode.toLowerCase() === code.toLowerCase())
    );

    if (localProduct) {
      addToCart(localProduct, source);
      setScanNotice({
        type: 'success',
        message: `Đã quét: ${localProduct.name} (+1)`,
      });
      setTimeout(() => setScanNotice(null), 3000);
      return;
    }

    // 2. Query Backend DB via API
    try {
      const token = localStorage.getItem('paperless_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/products?search=${encodeURIComponent(code)}`, { headers });
      if (!res.ok) throw new Error('API error');
      const dbProducts = await res.json();
      const dbProduct = Array.isArray(dbProducts)
        ? dbProducts.find((p: any) => p.barcode === code || p.id === code)
        : null;

      if (dbProduct) {
        const mapped: CatalogProduct = {
          id: dbProduct.id,
          name: dbProduct.name,
          category: dbProduct.category || 'Mới',
          price: dbProduct.price,
          unit: dbProduct.unit || 'Cái',
          barcode: dbProduct.barcode,
          stock: dbProduct.stock,
          popular: dbProduct.popular,
          image: dbProduct.imageUrl,
        };

        setProducts(prev => (prev.find(p => p.id === mapped.id) ? prev : [mapped, ...prev]));
        addToCart(mapped, source);
        setScanNotice({
          type: 'success',
          message: `Đã quét: ${mapped.name} (+1)`,
        });
        setTimeout(() => setScanNotice(null), 3000);
      } else {
        playPosBeep('error');
        setScanNotice({
          type: 'error',
          message: `Mã vạch "${code}" chưa có trong hệ thống!`,
        });
        setTimeout(() => setScanNotice(null), 4000);
      }
    } catch {
      playPosBeep('error');
      setScanNotice({
        type: 'error',
        message: `Lỗi kết nối khi tra cứu mã "${code}"!`,
      });
      setTimeout(() => setScanNotice(null), 3500);
    }
  }, [products, addToCart]);

  // Global Hardware Barcode Scanner Gun Listener (HID keyboard emulation)
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Hotkeys: F2, F4, F8, F9
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }
      if (e.key === 'F4') {
        e.preventDefault();
        setIsScanning(prev => !prev);
        return;
      }
      if (e.key === 'F8') {
        if (cart.length > 0 && confirm('Bạn có chắc muốn xóa sạch giỏ hàng hiện tại (F8)?')) {
          e.preventDefault();
          clearCart();
        }
        return;
      }
      if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) {
          setShowCheckoutModal(true);
        }
        return;
      }

      // If user is focused on customer phone or other standard input (except main search bar), do not intercept
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
      const isSearchInput = target?.id === 'pos-search-input';

      if (isInput && !isSearchInput) {
        return;
      }

      const now = Date.now();
      const diff = now - lastKeyTime;
      lastKeyTime = now;

      // Barcode scanner guns send keystrokes extremely rapidly (< 55ms per char)
      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          e.preventDefault();
          handleBarcodeScanned(buffer, 'barcode_gun');
          buffer = '';
          if (isSearchInput) {
            setSearchQuery('');
          }
        } else {
          buffer = '';
        }
        return;
      }

      if (e.key.length === 1) {
        // Fast succession means scanner gun
        if (diff < 55) {
          buffer += e.key;
        } else {
          buffer = e.key;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleBarcodeScanned, cart.length]);

  // Camera Barcode Scanner Modal (Html5QrcodeScanner)
  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner(
        'pos-reader',
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
        false
      );

      scanner.render(
        (decodedText) => {
          const now = Date.now();
          if (lastCameraScanRef.current.code === decodedText && now - lastCameraScanRef.current.time < 2000) return;
          lastCameraScanRef.current = { code: decodedText, time: now };

          scanner.clear().catch(e => console.log(e));
          setIsScanning(false);
          setScanStatus(null);

          handleBarcodeScanned(decodedText, 'camera');
        },
        () => {}
      );

      return () => {
        scanner.clear().catch(e => console.log(e));
      };
    }
  }, [isScanning, handleBarcodeScanned]);

  // Cart actions
  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      const target = prev.find(item => item.id === id);
      if (!target) return prev;
      const updatedQty = target.quantity + delta;

      if (updatedQty <= 0) {
        return prev.filter(item => item.id !== id);
      }

      // Update live display
      setLastScanned({
        id: target.id,
        name: target.name,
        price: target.price,
        quantity: updatedQty,
        unit: target.unit || 'Cái',
        barcode: target.barcode,
        category: target.category,
        time: Date.now(),
        source: 'search',
      });

      return prev.map(item =>
        item.id === id ? { ...item, quantity: updatedQty } : item
      );
    });
  };

  const setItemDirectQuantity = (id: string, qty: number) => {
    const validQty = Math.max(1, Math.floor(qty || 1));
    setCart(prev =>
      prev.map(item => (item.id === id ? { ...item, quantity: validQty } : item))
    );
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setCashGiven(0);
    setCustomerPhone('');
    setCustomerName('');
    setCustomerPoints(null);
    setLastScanned(null);
    setScanNotice(null);
  };

  // Calculations
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.quantity * item.price, 0), [cart]);
  const total = subtotal;
  const totalQuantity = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const changeDue = Math.max(0, cashGiven - total);

  // Lookup Customer
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

  // Create new Customer
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

  // Checkout execution
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
        clearCart();
      } else {
        setShowSuccessModal(true);
        clearCart();
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
      <div className="flex flex-col h-full overflow-hidden bg-slate-900/5 font-sans select-none">

        {/* ─── TOP HEADER BAR ─────────────────────────────────────── */}
        <header className="shrink-0 px-3.5 sm:px-6 py-2.5 sm:py-3 border-b border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-4 relative z-30 shadow-2xs">
          {/* Shop info & SignalR Status */}
          <div className="flex items-center justify-between md:justify-start gap-2.5 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#09261e] text-white flex items-center justify-center font-black text-xs shadow-sm">
                POS
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight whitespace-nowrap">
                    Bán hàng & Quét mã
                  </h1>
                  <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider truncate max-w-[140px] sm:max-w-none">
                    {business?.name || 'Tạp Hoá Minh Phát'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 hidden sm:block">
                  Quét mã vạch tự động hiển thị · Tìm kiếm nhanh · Xuất hoá đơn điện tử
                </p>
              </div>
            </div>

            {/* SignalR Cart Sync Status */}
            <div
              title={
                connectionStatus === 'connected'
                  ? 'Đồng bộ thời gian thực đang hoạt động (SignalR). Nhân viên dùng điện thoại quét mã sẽ hiển thị trực tiếp lên màn hình này.'
                  : connectionStatus === 'connecting'
                  ? 'Đang kết nối tới máy chủ SignalR...'
                  : 'Chưa kết nối SignalR'
              }
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-tight border transition-all ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : connectionStatus === 'connecting'
                  ? 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              <span className="relative flex h-2 w-2">
                {connectionStatus === 'connected' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    connectionStatus === 'connected'
                      ? 'bg-emerald-500'
                      : connectionStatus === 'connecting'
                      ? 'bg-amber-500'
                      : 'bg-slate-400'
                  }`}
                ></span>
              </span>
              <span>
                {connectionStatus === 'connected'
                  ? 'Sync ON (Realtime)'
                  : connectionStatus === 'connecting'
                  ? 'Sync...'
                  : 'Sync OFF'}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons & Hotkey Badges */}
          <div className="flex items-center gap-2 justify-end">
            <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-100/70 border border-slate-200 px-2.5 py-1 rounded-xl font-mono">
              <span className="font-bold text-slate-600">Phím tắt:</span>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-black text-slate-700 shadow-2xs">F2</kbd> Tìm kiếm
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-black text-slate-700 shadow-2xs ml-1">F4</kbd> Quét Camera
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-black text-slate-700 shadow-2xs ml-1">F8</kbd> Xóa
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-black text-slate-700 shadow-2xs ml-1">F9</kbd> Thanh toán
            </div>

            <button
              type="button"
              onClick={() => setIsScanning(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-xs transition-all active:scale-95 shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span>Quét Camera (F4)</span>
            </button>
          </div>
        </header>

        {/* ─── MOBILE TAB SWITCHER (HIỆN TRÊN ĐIỆN THOẠI) ──────────── */}
        <div className="lg:hidden shrink-0 px-3 py-2 bg-slate-100 border-b border-slate-200 flex gap-2 z-20">
          <button
            type="button"
            onClick={() => setMobileTab('scan_cart')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              mobileTab === 'scan_cart'
                ? 'bg-[#09261e] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>Quét & Đơn hàng</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              mobileTab === 'scan_cart' ? 'bg-emerald-500 text-white font-bold' : 'bg-slate-200 text-slate-800'
            }`}>
              {totalQuantity}
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

        {/* ─── TOAST / BANNER NOTIFICATION (SCAN FEEDBACK) ─────────── */}
        {scanNotice && (
          <div className="shrink-0 px-4 py-2 bg-slate-900 text-white flex items-center justify-between text-xs font-bold transition-all animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mx-auto">
              <span className={`w-2 h-2 rounded-full ${scanNotice.type === 'success' ? 'bg-emerald-400 animate-ping' : 'bg-red-400'}`} />
              <span>{scanNotice.message}</span>
            </div>
          </div>
        )}

        {/* ─── MAIN CONTENT: LEFT (Fast Search + Cart) + RIGHT (Payment) ─ */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">

          {/* ══════ LEFT: FAST SEARCH + ORDER TABLE ══════ */}
          <div className={`flex-1 flex-col p-3 sm:p-4 overflow-hidden min-h-0 min-w-0 ${
            mobileTab === 'scan_cart' ? 'flex' : 'hidden lg:flex'
          }`}>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col h-full overflow-hidden min-h-0">

              {/* Ô TÌM KIẾM NHANH & QUÉT MÃ VẠCH (SEARCH & SCAN INPUT) */}
              <div className="shrink-0 p-3 sm:px-4 sm:py-3 border-b border-slate-200 bg-slate-50/70 relative z-40">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  <input
                    ref={searchInputRef}
                    id="pos-search-input"
                    type="text"
                    placeholder="Quét mã vạch hoặc nhập tên sản phẩm... (Phím tắt F2)"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Escape') {
                        setSearchQuery('');
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setSearchSelectedIndex(prev => Math.min(filteredProducts.length - 1, prev + 1));
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setSearchSelectedIndex(prev => Math.max(0, prev - 1));
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        if (filteredProducts.length > 0) {
                          const target = filteredProducts[searchSelectedIndex] || filteredProducts[0];
                          addToCart(target, 'search');
                          setSearchQuery('');
                        } else if (searchQuery.trim()) {
                          // Try looking up raw text as barcode
                          handleBarcodeScanned(searchQuery.trim(), 'search');
                          setSearchQuery('');
                        }
                      }
                    }}
                    className="w-full pl-11 pr-24 py-2.5 sm:py-3 rounded-xl bg-white border-2 border-emerald-600/30 focus:border-emerald-600 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-sm transition-all"
                    autoFocus
                  />

                  {/* Right side inside input: clear & enter hint */}
                  <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1.5">
                    {searchQuery ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          searchInputRef.current?.focus();
                        }}
                        className="w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center text-xs font-bold cursor-pointer"
                      >
                        ×
                      </button>
                    ) : (
                      <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200 rounded">
                        Enter để chọn
                      </span>
                    )}
                  </div>

                  {/* Live Search Autocomplete Dropdown */}
                  {searchQuery.trim() && (
                    <>
                      <div
                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
                        onClick={() => setSearchQuery('')}
                      />
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-[50vh] overflow-hidden flex flex-col animate-in fade-in duration-100">
                        <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
                          <span>Kết quả tìm kiếm ({filteredProducts.length})</span>
                          <span className="text-[10px] font-mono lowercase hidden sm:inline">Dùng phím mũi tên & Enter</span>
                        </div>

                        <div className="divide-y divide-slate-100 overflow-y-auto">
                          {filteredProducts.length === 0 ? (
                            <div className="px-4 py-6 text-center">
                              <p className="text-xs text-slate-500">
                                Không tìm thấy sản phẩm có tên "{searchQuery}"
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  handleBarcodeScanned(searchQuery.trim(), 'search');
                                  setSearchQuery('');
                                }}
                                className="mt-2 text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                              >
                                Tra cứu mã vạch "{searchQuery}" trên cơ sở dữ liệu →
                              </button>
                            </div>
                          ) : (
                            filteredProducts.slice(0, 12).map((p, idx) => {
                              const inCart = cart.find(i => i.id === p.id);
                              const isSelected = idx === searchSelectedIndex;
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => {
                                    addToCart(p, 'search');
                                    setSearchQuery('');
                                    searchInputRef.current?.focus();
                                  }}
                                  onMouseEnter={() => setSearchSelectedIndex(idx)}
                                  className={`w-full text-left px-4 py-2.5 transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                                    isSelected ? 'bg-emerald-50 text-emerald-950' : 'hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-900 truncate">
                                      {p.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                                      <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold uppercase">
                                        {p.category}
                                      </span>
                                      {p.barcode && <span className="font-mono">#{p.barcode}</span>}
                                      <span>ĐVT: {p.unit || 'Cái'}</span>
                                    </div>
                                  </div>

                                  <div className="shrink-0 flex items-center gap-2">
                                    {inCart && (
                                      <span className="text-[10px] font-bold bg-[#09261e] text-white px-2 py-0.5 rounded-full font-mono">
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
                    </>
                  )}
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  3. BẢNG CHI TIẾT ĐƠN HÀNG (ORDER CART TABLE)
                  ───────────────────────────────────────────────────────────── */}
              <div className="shrink-0 px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Danh sách sản phẩm trong đơn
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold uppercase tracking-wider font-mono">
                    {totalQuantity} món ({cart.length} loại hàng)
                  </span>
                </div>

                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Bạn có chắc muốn xóa sạch giỏ hàng này?')) {
                        clearCart();
                      }
                    }}
                    className="text-red-600 hover:text-red-700 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    Xóa tất cả (F8)
                  </button>
                )}
              </div>

              {/* Order Items List */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0 divide-y divide-slate-100">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-16 text-center text-slate-400">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-black flex items-center justify-center text-sm uppercase tracking-wider mb-3 shadow-xs">
                      POS
                    </div>
                    <p className="text-sm font-bold uppercase tracking-wider text-slate-700">Đơn hàng đang trống</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Hướng máy quét vào mã vạch sản phẩm, hoặc gõ tên vào ô tìm kiếm ở trên để lên đơn hàng.
                    </p>
                  </div>
                ) : (
                  cart.map((item, idx) => {
                    const isLatest = lastScanned?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-2.5 sm:gap-4 py-2.5 px-2 rounded-xl transition-all ${
                          isLatest ? 'bg-emerald-50/70 border border-emerald-200' : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Index */}
                        <span className="w-5 text-center text-[11px] font-mono font-bold text-slate-400 shrink-0">
                          {idx + 1}
                        </span>

                        {/* Product details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {item.name}
                            </p>
                            {isLatest && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950 text-[9px] font-black uppercase tracking-wider">
                                Vừa quét
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            {item.barcode && <span className="font-mono">#{item.barcode}</span>}
                            <span>ĐVT: {item.unit || 'Cái'}</span>
                            <span className="font-mono font-semibold text-slate-600">
                              {item.price.toLocaleString('vi-VN')} đ/sp
                            </span>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => setItemDirectQuantity(item.id, Number(e.target.value))}
                            className="w-10 sm:w-12 h-7 rounded-lg bg-slate-50 border border-slate-200 text-center text-xs font-black font-mono text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600"
                          />
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                          >
                            +
                          </button>
                        </div>

                        {/* Line total */}
                        <span className="w-20 sm:w-24 text-right text-xs sm:text-sm font-black font-mono text-emerald-800 shrink-0">
                          {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                        </span>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="w-6 h-6 text-slate-300 hover:text-red-600 text-sm font-bold flex items-center justify-center cursor-pointer transition-colors shrink-0"
                          title="Xóa món này"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Cart Footer summary bar */}
              {cart.length > 0 && (
                <div className="shrink-0 p-3 sm:px-5 sm:py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-semibold">
                      Tổng số lượng: <strong className="text-slate-800 font-mono">{totalQuantity}</strong>
                    </span>
                    <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
                      Số món: <strong className="text-slate-800 font-mono">{cart.length}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 uppercase font-bold">Tạm tính:</span>
                    <span className="text-base sm:text-lg font-black font-mono text-slate-900">
                      {total.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ══════ RIGHT: CHECKOUT & CASHIER PAYMENT STATION ══════════════ */}
          <div className={`w-full lg:w-[380px] xl:w-[420px] shrink-0 flex-col p-3 sm:p-4 lg:pl-0 h-full overflow-hidden min-h-0 ${
            mobileTab === 'payment' ? 'flex' : 'hidden lg:flex'
          }`}>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col h-full overflow-hidden min-h-0">
              {/* Header */}
              <div className="shrink-0 px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Thanh toán đơn hàng
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Bán lẻ (POS)
                </span>
              </div>

              {/* Scrollable checkout form body */}
              <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-4 space-y-3.5">
                {/* 1. SĐT Khách hàng & Tích điểm */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    Khách hàng thành viên (SĐT)
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="tel"
                      placeholder="Nhập SĐT khách hàng..."
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      onBlur={handleLookupCustomer}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleLookupCustomer();
                        }
                      }}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={handleLookupCustomer}
                      disabled={isSearchingCustomer || !customerPhone.trim()}
                      className="px-3.5 py-2 rounded-xl bg-[#09261e] hover:bg-emerald-900 text-white text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50 transition-colors shrink-0"
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

                  {customerNotFound && !customerName && (
                    <div className="p-2.5 border border-dashed border-slate-300 rounded-xl bg-slate-50 flex gap-1.5 items-center">
                      <input
                        type="text"
                        placeholder="Tên khách hàng mới..."
                        value={newCustomerName}
                        onChange={e => setNewCustomerName(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleCreateCustomer}
                        disabled={isCreatingCustomer || !newCustomerName.trim()}
                        className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold uppercase rounded-lg hover:bg-emerald-700 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                      >
                        {isCreatingCustomer ? '...' : 'Tạo mới'}
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Hình thức thanh toán */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    Hình thức thanh toán
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPayMethod('cash')}
                      className={`py-2 text-center text-xs font-bold uppercase tracking-wider rounded-xl border cursor-pointer transition-all ${
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
                      className={`py-2 text-center text-xs font-bold uppercase tracking-wider rounded-xl border cursor-pointer transition-all ${
                        payMethod === 'vietqr'
                          ? 'bg-[#09261e] text-white border-[#09261e] shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      VietQR (CK)
                    </button>
                  </div>
                </div>

                {/* 3. Tiền mặt: nhập tiền khách đưa & tính tiền thối */}
                {payMethod === 'cash' && cart.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-medium">Tiền khách đưa:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="1000"
                          placeholder="0"
                          value={cashGiven || ''}
                          onChange={e => setCashGiven(Number(e.target.value))}
                          className="w-32 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-right text-xs font-black font-mono text-slate-900 focus:outline-none focus:border-emerald-600"
                        />
                        <span className="text-slate-400 font-mono">đ</span>
                      </div>
                    </div>

                    {/* Quick Cash Buttons */}
                    <div className="flex gap-1 justify-end flex-wrap pt-0.5">
                      {[total, 50000, 100000, 200000, 500000].filter(v => v >= total).slice(0, 4).map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCashGiven(amt)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border cursor-pointer transition-colors ${
                            cashGiven === amt
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          {amt === total ? 'Đủ tiền' : `${amt / 1000}k`}
                        </button>
                      ))}
                    </div>

                    {cashGiven > 0 && (
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 text-xs">
                        <span className="text-slate-500 font-medium">Tiền thối lại:</span>
                        <span className={`font-black font-mono text-sm ${changeDue >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                          {changeDue.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* VietQR Quick Preview */}
                {payMethod === 'vietqr' && cart.length > 0 && (
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-center space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
                      Mã VietQR động tự động sinh
                    </p>
                    <div className="bg-white p-2 rounded-xl border border-blue-200 inline-block mx-auto shadow-2xs">
                      <img
                        src={`https://api.vietqr.io/image/970422-0901234567-compact2.jpg?amount=${total}&addInfo=PAPERLESS+POS`}
                        alt="VietQR"
                        className="w-32 h-32 object-contain"
                      />
                    </div>
                    <p className="text-xs font-black font-mono text-blue-900">
                      {total.toLocaleString('vi-VN')} đ
                    </p>
                    <p className="text-[10px] text-slate-500">MBBank · 0901234567 · NGUYEN VAN MINH</p>
                  </div>
                )}

                {/* 4. Tuỳ chọn xuất hoá đơn */}
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-700 font-medium">Mở xem hoá đơn sau khi xuất</span>
                  <input
                    type="checkbox"
                    checked={createReceipt}
                    onChange={e => setCreateReceipt(e.target.checked)}
                    className="cursor-pointer accent-emerald-600 w-4 h-4"
                  />
                </div>
              </div>

              {/* Pinned Bottom Payment CTA */}
              <div className="shrink-0 p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50/90 space-y-2.5">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Tổng tiền thanh toán
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {totalQuantity} sản phẩm ({cart.length} món)
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
                  className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm active:scale-[0.99] text-center"
                >
                  {isSubmittingOrder ? (
                    'Đang xử lý xuất hoá đơn...'
                  ) : payMethod === 'vietqr' ? (
                    'Tạo mã & Xác nhận VietQR (F9)'
                  ) : (
                    'Xuất hoá đơn & Thanh toán (F9)'
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
                <span className="font-bold text-slate-800">{totalQuantity} món ({cart.length} loại)</span>
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
                onClick={() => setShowQRModal(false)}
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

      {/* Camera Barcode Scanner Modal */}
      {isScanning && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex flex-col items-center justify-center z-[70] p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md shadow-2xl my-auto">
            <div className="flex justify-between items-center mb-3 sm:mb-4 border-b border-slate-200 pb-2.5 sm:pb-3">
              <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-900">
                Quét mã vạch sản phẩm (Camera)
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
              Hướng camera vào mã vạch trên sản phẩm. Hệ thống sẽ tự động thêm vào giỏ hàng và phát tiếng bíp.
            </p>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
