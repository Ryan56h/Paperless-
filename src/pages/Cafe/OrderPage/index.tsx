import { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../../components/layout/AppLayout';
import Modal from '../../../components/common/Modal';
import { mockCafeProducts } from '../../../data/mockData';
import { useOrder } from '../../../context/OrderContext';
import type { CatalogProduct, CafeOrderItem, CafeTable } from '../../../types';

export default function CafeOrderPage() {
  const {
    cafeTables,
    cafeOrders,
    selectedTableId,
    setSelectedTableId,
    createCafeOrder,
    payCafeOrder,
    releaseTableOrder,
    releaseWholeTable,
    updateGuestLabel,
    setTableStatus,
  } = useOrder();

  const [selectedZone, setSelectedZone] = useState('Tất cả');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [cart, setCart] = useState<CafeOrderItem[]>([]);
  const [itemNote, setItemNote] = useState('');
  const [pendingProduct, setPendingProduct] = useState<CatalogProduct | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'qr'>('qr');
  const [checkoutTarget, setCheckoutTarget] = useState<'cart_pay_now' | 'existing_order'>('cart_pay_now');
  const [releaseAfterPay, setReleaseAfterPay] = useState(true);

  // Multi-guest / shared table state
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isNewGuestMode, setIsNewGuestMode] = useState(false);
  const [newGuestName, setNewGuestName] = useState('');
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [editingGuestName, setEditingGuestName] = useState('');

  // Resizable table map width
  const [tableWidth, setTableWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('paperless_cafe_table_width');
      return saved ? Math.min(Math.max(parseInt(saved, 10), 340), 850) : 520;
    } catch {
      return 520;
    }
  });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1280);

  // Table status filter: all | empty | occupied | reserved
  const [statusFilter, setStatusFilter] = useState<'all' | 'empty' | 'occupied' | 'reserved'>('all');

  // Stats
  const emptyCount = useMemo(() => cafeTables.filter(t => t.status === 'empty').length, [cafeTables]);
  const occupiedCount = useMemo(() => cafeTables.filter(t => t.status === 'occupied').length, [cafeTables]);
  const reservedCount = useMemo(() => cafeTables.filter(t => t.status === 'reserved').length, [cafeTables]);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1280);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = Math.min(Math.max(e.clientX - rect.left, 340), 850);
      setTableWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      try {
        localStorage.setItem('paperless_cafe_table_width', tableWidth.toString());
      } catch {
        // ignore
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, tableWidth]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const zones = ['Tất cả', 'Tầng 1 - Trong nhà', 'Tầng 2 - Máy lạnh', 'Sân vườn thoáng mát'];

  const categories = useMemo(() => {
    return ['Tất cả', ...Array.from(new Set(mockCafeProducts.map(p => p.category)))];
  }, []);

  const filteredTables = useMemo(() => {
    return cafeTables.filter(t => {
      const matchZone = selectedZone === 'Tất cả' || t.zone === selectedZone;
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchZone && matchStatus;
    });
  }, [cafeTables, selectedZone, statusFilter]);

  const activeTable = cafeTables.find(t => t.id === selectedTableId) || cafeTables[0];

  const activeTableOrders = useMemo(() => {
    return cafeOrders.filter(
      o => o.tableId === activeTable?.id && o.status !== 'paid'
    );
  }, [cafeOrders, activeTable?.id]);

  useEffect(() => {
    if (activeTableOrders.length > 0) {
      if (!selectedOrderId || !activeTableOrders.some(o => o.id === selectedOrderId)) {
        setSelectedOrderId(activeTableOrders[0].id);
      }
    } else {
      setSelectedOrderId(null);
    }
    setIsNewGuestMode(false);
  }, [activeTable?.id, activeTableOrders]);

  const currentOrder = activeTableOrders.find(o => o.id === selectedOrderId) || activeTableOrders[0] || null;

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'Tất cả') return mockCafeProducts;
    return mockCafeProducts.filter(p => p.category === selectedCategory);
  }, [selectedCategory]);

  const handleSelectProduct = (product: CatalogProduct) => {
    setPendingProduct(product);
    setItemNote('');
    setShowNoteModal(true);
  };

  const handleConfirmItemWithNote = () => {
    if (!pendingProduct) return;

    setCart(prev => {
      const existingIndex = prev.findIndex(
        i => i.productId === pendingProduct.id && i.notes === itemNote
      );
      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex].quantity += 1;
        copy[existingIndex].total = copy[existingIndex].quantity * copy[existingIndex].unitPrice;
        return copy;
      }
      return [
        ...prev,
        {
          id: `CI-${Date.now().toString().slice(-4)}-${pendingProduct.id}`,
          productId: pendingProduct.id,
          name: pendingProduct.name,
          quantity: 1,
          unitPrice: pendingProduct.price,
          notes: itemNote || undefined,
          total: pendingProduct.price,
        },
      ];
    });

    setShowNoteModal(false);
    setPendingProduct(null);
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(prev =>
      prev
        .map(i => {
          if (i.id === id) {
            const nextQty = i.quantity + delta;
            return nextQty > 0 ? { ...i, quantity: nextQty, total: nextQty * i.unitPrice } : null;
          }
          return i;
        })
        .filter(Boolean) as CafeOrderItem[]
    );
  };

  // Action: Pay Later & Send to Kitchen
  const handleSendToKitchenPayLater = () => {
    if (!activeTable || cart.length === 0) return;
    createCafeOrder(activeTable.id, cart, 0, {
      isPaid: false,
      forceNewGuest: isNewGuestMode,
      guestLabel: isNewGuestMode && newGuestName.trim() ? newGuestName.trim() : undefined,
      targetOrderId: !isNewGuestMode && currentOrder ? currentOrder.id : undefined,
    });
    setCart([]);
    setIsNewGuestMode(false);
    setNewGuestName('');
  };

  // Action: Open Modal to Pay First & Send to Kitchen
  const handleOpenPayNowForCart = () => {
    if (!activeTable || cart.length === 0) return;
    setCheckoutTarget('cart_pay_now');
    setShowCheckoutModal(true);
  };

  // Action: Open Modal to Pay existing order
  const handleOpenPayForOrder = () => {
    if (!currentOrder) return;
    setCheckoutTarget('existing_order');
    setReleaseAfterPay(true);
    setShowCheckoutModal(true);
  };

  // Confirm payment in modal
  const handleConfirmCheckout = () => {
    if (checkoutTarget === 'cart_pay_now') {
      if (!activeTable || cart.length === 0) return;
      createCafeOrder(activeTable.id, cart, 0, {
        isPaid: true,
        paymentMethod,
        forceNewGuest: isNewGuestMode,
        guestLabel: isNewGuestMode && newGuestName.trim() ? newGuestName.trim() : undefined,
        targetOrderId: !isNewGuestMode && currentOrder ? currentOrder.id : undefined,
      });
      setCart([]);
      setIsNewGuestMode(false);
      setNewGuestName('');
      setShowCheckoutModal(false);
    } else if (checkoutTarget === 'existing_order') {
      if (!currentOrder) return;
      payCafeOrder(currentOrder.id, paymentMethod, releaseAfterPay);
      setShowCheckoutModal(false);
    }
  };

  return (
    <AppLayout>
      <div
        ref={containerRef}
        className={`flex-1 flex flex-col xl:flex-row h-full overflow-hidden bg-bg relative ${
          isDragging ? 'select-none cursor-col-resize' : ''
        }`}
      >
        {/* LEFT: TABLE SELECTION (RESIZABLE & SCROLLABLE) */}
        <div
          style={{ width: isDesktop ? `${tableWidth}px` : '100%' }}
          className="w-full xl:shrink-0 border-r border-border flex flex-col bg-surface overflow-hidden min-h-0"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-border bg-surface flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-text">Sơ đồ bàn</h2>
                  <span className="text-[11px] font-medium text-text-dim">
                    ({filteredTables.length}/{cafeTables.length} bàn)
                  </span>
                </div>
                <p className="text-[10px] text-text-dim mt-0.5">
                  Kéo vạch phân cách hoặc chọn tỉ lệ bên dưới
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <Link
                  to="/app/cafe/display"
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-surface-2 text-text border border-border hover:bg-surface transition-colors"
                >
                  Màn hình bếp
                </Link>
              </div>
            </div>

            {/* Quick ratio presets */}
            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <span className="text-[10px] text-text-dim font-medium">Tỉ lệ sơ đồ:</span>
              <div className="flex items-center gap-1">
                {[
                  { label: 'Gọn (380px)', w: 380 },
                  { label: 'Vừa (500px)', w: 500 },
                  { label: 'Rộng (640px)', w: 640 },
                  { label: 'Cực rộng (780px)', w: 780 },
                ].map(p => (
                  <button
                    key={p.label}
                    onClick={() => {
                      setTableWidth(p.w);
                      try {
                        localStorage.setItem('paperless_cafe_table_width', p.w.toString());
                      } catch {
                        // ignore
                      }
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer transition-colors ${
                      Math.abs(tableWidth - p.w) < 40
                        ? 'bg-text text-bg border-text'
                        : 'bg-surface-2 text-text-muted hover:text-text border-border'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Status summary filter chips */}
          <div className="p-2 border-b border-border bg-surface-2 flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap border ${
                statusFilter === 'all'
                  ? 'bg-text text-bg border-text'
                  : 'bg-surface text-text-muted hover:text-text border-border'
              }`}
            >
              Tất cả ({cafeTables.length})
            </button>

            <button
              onClick={() => setStatusFilter('empty')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap border flex items-center gap-1.5 ${
                statusFilter === 'empty'
                  ? 'bg-green-600 text-white border-green-700'
                  : 'bg-surface text-text-muted border-border hover:border-text-dim hover:text-text'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'empty' ? 'bg-white' : 'bg-green-500'}`} />
              <span>Trống ({emptyCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('occupied')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap border flex items-center gap-1.5 ${
                statusFilter === 'occupied'
                  ? 'bg-orange-500 text-white border-orange-600'
                  : 'bg-surface text-text-muted border-border hover:border-text-dim hover:text-text'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'occupied' ? 'bg-white' : 'bg-orange-500'}`} />
              <span>Có khách ({occupiedCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('reserved')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap border flex items-center gap-1.5 ${
                statusFilter === 'reserved'
                  ? 'bg-violet-600 text-white border-violet-700'
                  : 'bg-surface text-text-muted border-border hover:border-text-dim hover:text-text'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'reserved' ? 'bg-white' : 'bg-violet-500'}`} />
              <span>Đặt trước ({reservedCount})</span>
            </button>
          </div>

          {/* Zones */}
          <div className="px-2 py-1.5 border-b border-border flex gap-1 overflow-x-auto bg-surface">
            {zones.map(z => (
              <button
                key={z}
                onClick={() => setSelectedZone(z)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedZone === z
                    ? 'bg-text text-bg font-semibold'
                    : 'text-text-muted hover:text-text hover:bg-surface-2'
                }`}
              >
                {z === 'Tất cả' ? 'Tất cả khu vực' : z.split(' - ')[0]}
              </button>
            ))}
          </div>

          {/* Tables scrollable container */}
          <div className="flex-1 overflow-y-auto p-3 min-h-0">
            {filteredTables.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center text-text-dim text-xs">
                <p className="font-semibold text-text mb-1">Không có bàn nào phù hợp</p>
                <p>Thử đổi bộ lọc khu vực hoặc trạng thái</p>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5">
                {filteredTables.map((table: CafeTable) => {
                  const isSelected = selectedTableId === table.id;
                  const isOccupied = table.status === 'occupied';
                  const isReserved = table.status === 'reserved';
                  const isEmpty = table.status === 'empty';
                  const tableOrders = cafeOrders.filter(
                    o => o.tableId === table.id && o.status !== 'paid'
                  );
                  const hasMultipleGuests = tableOrders.length > 1;
                  const allPaid = tableOrders.length > 0 && tableOrders.every(o => o.isPaid);
                  const totalSum = tableOrders.reduce((acc, o) => acc + o.total, 0);
                  const totalItems = tableOrders.reduce((acc, o) => acc + o.items.reduce((sum, i) => sum + i.quantity, 0), 0);

                  return (
                    <div
                      key={table.id}
                      onClick={() => setSelectedTableId(table.id)}
                      className={`relative p-3 rounded-xl border-l-4 border border-border transition-all cursor-pointer flex flex-col justify-between select-none bg-surface hover:bg-surface-2 ${
                        isSelected
                          ? 'ring-2 ring-text border-text bg-surface-2 shadow-sm'
                          : isEmpty
                          ? '!border-l-green-500'
                          : isOccupied
                          ? '!border-l-orange-500'
                          : '!border-l-violet-500'
                      }`}
                    >
                      {/* Top row: Table name, badge, and seats */}
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-text">{table.name}</span>
                            {isSelected && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-text text-bg uppercase">
                                Đang chọn
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-text-dim block mt-0.5">
                            {table.zone.split(' - ')[0]}
                          </span>
                        </div>

                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface border border-border text-text-muted shrink-0">
                            {table.seats} chỗ
                          </span>
                          {hasMultipleGuests && (
                            <span className="text-[9px] text-orange-600 dark:text-orange-400 font-semibold">
                              Đang ngồi {tableOrders.length}/{table.seats}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle row: High visibility status badge */}
                      <div className="my-1.5 flex items-center gap-1.5 flex-wrap">
                        {isEmpty && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-600 text-white text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" />
                            <span>Trống · Sẵn sàng</span>
                          </div>
                        )}

                        {isOccupied && hasMultipleGuests && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500 text-white text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" />
                            <span>Ghép {tableOrders.length} khách</span>
                          </div>
                        )}

                        {isOccupied && !hasMultipleGuests && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500 text-white text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" />
                            <span>Có khách · Đang phục vụ</span>
                          </div>
                        )}

                        {isOccupied && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${
                            allPaid
                              ? 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30 font-semibold'
                              : 'bg-surface-2 text-text-muted border-border'
                          }`}>
                            {allPaid ? '✓ Đã trả trước' : hasMultipleGuests ? `${tableOrders.filter(o => o.isPaid).length}/${tableOrders.length} đã trả` : 'Trả sau'}
                          </span>
                        )}

                        {isReserved && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-600 text-white text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" />
                            <span>Đã đặt trước</span>
                          </div>
                        )}
                      </div>

                      {/* Bottom row: Operational info (Order total, seating duration, or call-to-action) */}
                      <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px] mt-1">
                        {isOccupied && tableOrders.length > 0 ? (
                          <>
                            <span className="text-text-muted font-medium">
                              {totalItems} món {hasMultipleGuests ? `(${tableOrders.length} đơn)` : table.activeMinutes ? `· ${table.activeMinutes}p` : ''}
                            </span>
                            <span className="font-bold text-text">
                              {totalSum.toLocaleString('vi-VN')}đ
                            </span>
                          </>
                        ) : isOccupied ? (
                          <span className="text-text-muted italic">Chưa gọi món</span>
                        ) : isReserved ? (
                          <span className="text-violet-600 dark:text-violet-400 font-medium">Đang giữ bàn</span>
                        ) : (
                          <span className="text-text-dim">Bấm chọn gọi món</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* DRAGGABLE RESIZER HANDLE */}
        <div
          onMouseDown={handleMouseDown}
          className={`hidden xl:flex w-2.5 hover:w-3 cursor-col-resize items-center justify-center transition-all group relative select-none z-20 ${
            isDragging ? 'bg-text text-bg w-3' : 'bg-surface-2 hover:bg-border border-r border-border'
          }`}
          title="Kéo sang trái hoặc phải để điều chỉnh tỉ lệ sơ đồ bàn và thực đơn"
        >
          <div className={`w-1 h-8 rounded-full transition-colors ${isDragging ? 'bg-bg' : 'bg-text-dim group-hover:bg-text'}`} />
        </div>

        {/* CENTER: MENU */}
        <div className="flex-1 flex flex-col border-r border-border overflow-hidden bg-bg min-w-[320px]">
          <div className="p-4 border-b border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-text">Thực đơn đồ uống</h3>
              <p className="text-xs text-text-dim">
                Đang gọi món cho: <strong className="text-text">{activeTable?.name}</strong>
              </p>
            </div>

            {/* Categories */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                    selectedCategory === cat
                      ? 'bg-text text-bg border-text font-semibold'
                      : 'bg-surface-2 text-text-muted hover:text-text border-border'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Menu items */}
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {filteredProducts.map(p => (
              <div
                key={p.id}
                onClick={() => handleSelectProduct(p)}
                className="p-3 rounded bg-surface border border-border hover:border-text-dim transition-colors cursor-pointer flex flex-col justify-between select-none"
              >
                <div>
                  <span className="text-[10px] text-text-dim uppercase tracking-wider block mb-1">
                    {p.category}
                  </span>
                  <h4 className="text-xs font-medium text-text line-clamp-2 leading-snug">
                    {p.name}
                  </h4>
                </div>

                <div className="mt-3 pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-xs font-bold text-text">
                    {p.price.toLocaleString('vi-VN')} đ
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-surface-2 border border-border text-text font-medium">
                    Chọn
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: ORDER & ACTIONS */}
        <div className="w-full xl:w-80 shrink-0 bg-surface flex flex-col h-auto xl:h-full border-t xl:border-t-0">
          {/* Header */}
          <div className="p-3.5 border-b border-border bg-surface-2 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-text">{activeTable?.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface border border-border text-text-muted">
                  {activeTable?.seats} chỗ
                </span>
              </div>
              <p className="text-[11px] text-text-dim">{activeTable?.zone}</p>
            </div>

            <div className="flex items-center gap-1">
              {activeTableOrders.length > 1 && (
                <button
                  onClick={() => {
                    if (window.confirm(`Xác nhận dọn dẹp và giải phóng toàn bộ ${activeTable?.name}?`)) {
                      releaseWholeTable(activeTable.id);
                    }
                  }}
                  className="text-[11px] px-2 py-1 rounded bg-surface border border-red-200 dark:border-red-900/60 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer transition-colors"
                  title="Tất cả khách trên bàn đã về: Dọn dẹp và trả toàn bộ bàn"
                >
                  Dọn cả bàn
                </button>
              )}

              {activeTable?.status === 'empty' ? (
                <button
                  onClick={() => setTableStatus(activeTable.id, 'reserved')}
                  className="text-[11px] px-2 py-1 rounded bg-surface border border-border text-text-muted hover:text-text cursor-pointer"
                >
                  Đặt trước
                </button>
              ) : activeTable?.status === 'reserved' ? (
                <button
                  onClick={() => setTableStatus(activeTable.id, 'empty')}
                  className="text-[11px] px-2 py-1 rounded bg-surface border border-border text-text-muted hover:text-text cursor-pointer"
                >
                  Hủy đặt
                </button>
              ) : null}
            </div>
          </div>

          {/* MULTI-GUEST TABS ON COMMUNAL / SHARED TABLE */}
          {(activeTableOrders.length > 0 || isNewGuestMode) && (
            <div className="p-2 border-b border-border bg-surface flex items-center gap-1 overflow-x-auto">
              {activeTableOrders.map((order, idx) => {
                const isSelected = !isNewGuestMode && currentOrder?.id === order.id;
                return (
                  <button
                    key={order.id}
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setIsNewGuestMode(false);
                    }}
                    className={`px-2.5 py-1 rounded text-xs whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      isSelected
                        ? 'bg-text text-bg font-bold border-text'
                        : 'bg-surface-2 text-text-muted hover:text-text border-border'
                    }`}
                  >
                    <span className="max-w-[110px] truncate">{order.guestLabel || `Khách ${idx + 1}`}</span>
                    {order.isPaid ? (
                      <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${isSelected ? 'bg-bg text-text' : 'bg-green-100 text-green-700'}`}>
                        ✓ Đã trả
                      </span>
                    ) : (
                      <span className={`text-[9px] px-1 py-0.2 rounded ${isSelected ? 'bg-bg/20 text-bg' : 'text-text-dim font-mono'}`}>
                        {order.total.toLocaleString('vi-VN')}đ
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Button to add a separate sub-order for another guest at this table */}
              <button
                onClick={() => {
                  setIsNewGuestMode(true);
                  setNewGuestName(`Khách ${activeTableOrders.length + 1}`);
                }}
                className={`px-2.5 py-1 rounded text-xs whitespace-nowrap flex items-center gap-1 transition-colors cursor-pointer border ${
                  isNewGuestMode
                    ? 'bg-text text-bg font-bold border-text'
                    : 'bg-surface text-text-muted hover:text-text border-dashed border-border hover:border-text'
                }`}
                title="Bàn to có người mới ngồi ghép: Tạo hóa đơn riêng cho khách này"
              >
                <span>+ Ghép khách</span>
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* If in NEW GUEST MODE */}
            {isNewGuestMode && (
              <div className="p-2.5 rounded-lg bg-surface-2 border border-border space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 font-bold text-text">
                    <span>Thêm khách ngồi ghép tại {activeTable?.name}</span>
                  </div>
                  <button
                    onClick={() => setIsNewGuestMode(false)}
                    className="text-[11px] text-text-dim hover:text-text underline cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-text-muted shrink-0">Tên/Ghế:</span>
                  <input
                    type="text"
                    value={newGuestName}
                    onChange={e => setNewGuestName(e.target.value)}
                    placeholder="Ví dụ: Ghế 3, Bạn áo trắng..."
                    className="flex-1 px-2 py-1 text-xs rounded bg-surface border border-border text-text focus:outline-none focus:border-text"
                  />
                </div>
                <p className="text-[10px] text-text-dim leading-snug">
                  Chọn món bên thực đơn cho khách này. Khách có thể trả tiền trước ngay lúc gọi hoặc thanh toán sau khi rời đi.
                </p>
              </div>
            )}

            {/* Active order card on table */}
            {!isNewGuestMode && currentOrder && (
              <div className="p-3 rounded-lg bg-surface-2 border border-border space-y-2">
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <div className="flex items-center gap-1.5">
                      {editingGuestId === currentOrder.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editingGuestName}
                            onChange={e => setEditingGuestName(e.target.value)}
                            className="px-1.5 py-0.5 text-xs rounded bg-surface border border-border text-text"
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              if (editingGuestName.trim()) {
                                updateGuestLabel(currentOrder.id, editingGuestName.trim());
                              }
                              setEditingGuestId(null);
                            }}
                            className="px-1.5 py-0.5 text-[10px] bg-text text-bg rounded font-semibold"
                          >
                            Lưu
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-text">
                            {currentOrder.guestLabel || 'Khách 1'}
                          </span>
                          <button
                            onClick={() => {
                              setEditingGuestId(currentOrder.id);
                              setEditingGuestName(currentOrder.guestLabel || '');
                            }}
                            className="text-[10px] text-text-dim hover:text-text cursor-pointer underline ml-1"
                            title="Đổi tên / ghi chú khách này"
                          >
                            Sửa
                          </button>
                          <span className="text-[10px] text-text-dim font-mono">(#{currentOrder.id})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border text-text-muted">
                    {currentOrder.status === 'ready'
                      ? 'Sẵn sàng'
                      : currentOrder.status === 'served'
                      ? 'Đã ra món'
                      : 'Đang pha'}
                  </span>
                </div>

                {/* PAYMENT STATUS BANNER */}
                {currentOrder.isPaid ? (
                  <div className="p-2 rounded bg-green-500/10 border border-green-500/30 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-green-700 dark:text-green-300 font-semibold text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                      <span>Đã thanh toán ({currentOrder.paymentMethod === 'qr' ? 'VietQR' : currentOrder.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'})</span>
                    </div>
                    {currentOrder.paidAt && (
                      <span className="text-[10px] text-green-700/70 font-mono">{currentOrder.paidAt}</span>
                    )}
                  </div>
                ) : (
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-medium text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span>Chưa thanh toán (Khách trả sau)</span>
                    </div>
                  </div>
                )}

                {/* Items list */}
                <div className="divide-y divide-border/60 text-xs">
                  {currentOrder.items.map((item, idx) => (
                    <div key={idx} className="py-1.5 flex justify-between items-start">
                      <div>
                        <p className="text-text font-medium">
                          {item.name} <span className="text-text-dim">x{item.quantity}</span>
                        </p>
                        {item.notes && (
                          <p className="text-[10px] text-text-dim">Ghi chú: {item.notes}</p>
                        )}
                      </div>
                      <span className="text-text font-semibold font-mono">
                        {item.total.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  ))}
                </div>

                {/* Order total */}
                <div className="pt-2 border-t border-border flex justify-between font-bold text-xs">
                  <span>Tổng tiền khách này:</span>
                  <span className="text-sm text-text font-mono">
                    {currentOrder.total.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                {/* Primary Action Button */}
                {currentOrder.isPaid ? (
                  <button
                    onClick={() => releaseTableOrder(currentOrder.id)}
                    className="w-full mt-1 py-2 rounded text-xs font-bold bg-surface border border-border text-text hover:bg-border cursor-pointer transition-colors"
                  >
                    Khách này rời đi (Giải phóng chỗ)
                  </button>
                ) : (
                  <button
                    onClick={handleOpenPayForOrder}
                    className="w-full mt-1 py-2 rounded text-xs font-bold bg-text text-bg hover:opacity-90 cursor-pointer shadow-sm"
                  >
                    Thanh toán đơn này ({currentOrder.total.toLocaleString('vi-VN')} đ)
                  </button>
                )}
              </div>
            )}

            {/* If no orders at table and not adding new guest */}
            {!isNewGuestMode && activeTableOrders.length === 0 && (
              <div className="p-4 border border-dashed border-border rounded-lg text-center text-xs text-text-dim">
                Bàn đang trống. Chọn món bên thực đơn để mở bàn!
              </div>
            )}

            {/* New cart items */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-dim">
                  Món mới chuẩn bị gọi {cart.length > 0 ? `(${cart.length})` : ''}
                </h4>
                {cart.length > 0 && (
                  <span className="text-[10px] text-text-dim font-medium">
                    Cho: <strong className="text-text">{isNewGuestMode ? (newGuestName || 'Khách ghép mới') : (currentOrder?.guestLabel || 'Khách 1')}</strong>
                  </span>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="p-3.5 border border-dashed border-border rounded text-center text-xs text-text-dim">
                  Chưa chọn món mới từ thực đơn
                </div>
              ) : (
                <div className="space-y-1.5">
                  {cart.map(item => (
                    <div
                      key={item.id}
                      className="p-2 rounded bg-surface-2 border border-border flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-text truncate">{item.name}</p>
                        {item.notes && (
                          <p className="text-[10px] text-text-dim">Ghi chú: {item.notes}</p>
                        )}
                        <p className="text-[10px] text-text-dim font-mono">
                          {item.unitPrice.toLocaleString('vi-VN')} đ
                        </p>
                      </div>

                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => updateCartQty(item.id, -1)}
                          className="w-5 h-5 rounded bg-surface border border-border text-xs flex items-center justify-center hover:bg-border cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-4 text-center font-bold text-text text-xs">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQty(item.id, 1)}
                          className="w-5 h-5 rounded bg-surface border border-border text-xs flex items-center justify-center hover:bg-border cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <div className="w-16 text-right font-bold text-text font-mono">
                        {item.total.toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons when cart has items */}
          {cart.length > 0 && (
            <div className="p-3 border-t border-border bg-surface-2 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span>Tạm tính món mới:</span>
                <span className="text-sm text-text font-mono">
                  {cart.reduce((a, b) => a + b.total, 0).toLocaleString('vi-VN')} đ
                </span>
              </div>

              {/* Two operational workflows: Pay Later vs Pay First */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleSendToKitchenPayLater}
                  className="py-2 px-1.5 rounded font-semibold bg-surface border border-border text-text hover:bg-border cursor-pointer text-xs flex flex-col items-center justify-center text-center leading-tight transition-colors"
                >
                  <span className="font-bold">Gửi bếp</span>
                  <span className="text-[10px] text-text-dim font-normal">Trả sau tại bàn</span>
                </button>

                <button
                  onClick={handleOpenPayNowForCart}
                  className="py-2 px-1.5 rounded font-bold bg-text text-bg hover:opacity-90 cursor-pointer text-xs flex flex-col items-center justify-center text-center leading-tight shadow-sm"
                >
                  <span className="font-bold">Thanh toán ngay</span>
                  <span className="text-[10px] text-bg/80 font-normal">Trả trước & Báo bếp</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Note modal */}
      <Modal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        title={`Thêm: ${pendingProduct?.name}`}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-text mb-1">
              Ghi chú pha chế (tùy chọn)
            </label>
            <input
              type="text"
              placeholder="Ví dụ: ít đá, 50% đường, mang về..."
              value={itemNote}
              onChange={e => setItemNote(e.target.value)}
              className="w-full px-3 py-2 rounded bg-surface-2 border border-border text-text text-xs focus:outline-none focus:border-text"
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {['Ít đá', 'Không đá', '50% đường', 'Không đường', 'Mang về'].map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => setItemNote(prev => (prev ? `${prev}, ${tag}` : tag))}
                className="px-2 py-1 rounded text-xs bg-surface-2 border border-border text-text-muted hover:text-text cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-border">
            <span className="text-xs font-bold text-text">
              {pendingProduct?.price.toLocaleString('vi-VN')} đ
            </span>

            <div className="flex gap-2">
              <button
                onClick={() => setShowNoteModal(false)}
                className="px-3 py-1.5 rounded text-xs bg-surface-2 border border-border text-text cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmItemWithNote}
                className="px-4 py-1.5 rounded text-xs font-bold bg-text text-bg hover:opacity-90 cursor-pointer"
              >
                Thêm vào đơn
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Dynamic Checkout modal: supports both Pay-First (Cart) and Pay-Later (Order) */}
      <Modal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        title={
          checkoutTarget === 'cart_pay_now'
            ? `Thanh toán trả trước: ${isNewGuestMode ? (newGuestName || 'Khách ghép') : (currentOrder?.guestLabel || 'Khách')} (${activeTable?.name})`
            : `Thanh toán: ${currentOrder?.guestLabel || 'Khách'} (${activeTable?.name})`
        }
      >
        <div className="space-y-3">
          {checkoutTarget === 'cart_pay_now' ? (
            <div className="p-3 rounded bg-surface-2 border border-border space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">Mô hình:</span>
                <span className="text-text font-semibold">Trả trước tại quầy / bàn</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Số món gọi:</span>
                <span className="text-text">{cart.reduce((a, b) => a + b.quantity, 0)} món</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-border">
                <span>Tổng tiền thanh toán:</span>
                <span className="text-text text-base font-mono">
                  {cart.reduce((a, b) => a + b.total, 0).toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>
          ) : currentOrder ? (
            <div className="p-3 rounded bg-surface-2 border border-border space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">Mã đơn / Khách:</span>
                <span className="text-text font-medium">{currentOrder.guestLabel || 'Khách 1'} (#{currentOrder.id})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Số món:</span>
                <span className="text-text">{currentOrder.items.length} món</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-border">
                <span>Tổng tiền thanh toán:</span>
                <span className="text-text text-base font-mono">
                  {currentOrder.total.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>
          ) : null}

          {/* If existing order checkout: option to release seat or keep sitting */}
          {checkoutTarget === 'existing_order' && (
            <label className="flex items-center gap-2 text-xs text-text cursor-pointer p-2 rounded bg-surface border border-border">
              <input
                type="checkbox"
                checked={releaseAfterPay}
                onChange={e => setReleaseAfterPay(e.target.checked)}
                className="rounded border-border"
              />
              <span>Khách này rời đi ngay (giải phóng chỗ cho người khác)</span>
            </label>
          )}

          <div>
            <span className="text-xs text-text-dim block mb-1">Phương thức thanh toán</span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('qr')}
                className={`py-1.5 rounded text-xs font-medium border text-center cursor-pointer transition-colors ${
                  paymentMethod === 'qr'
                    ? 'bg-text text-bg font-bold border-text'
                    : 'bg-surface-2 border-border text-text-muted hover:text-text'
                }`}
              >
                VietQR
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-1.5 rounded text-xs font-medium border text-center cursor-pointer transition-colors ${
                  paymentMethod === 'cash'
                    ? 'bg-text text-bg font-bold border-text'
                    : 'bg-surface-2 border-border text-text-muted hover:text-text'
                }`}
              >
                Tiền mặt
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`py-1.5 rounded text-xs font-medium border text-center cursor-pointer transition-colors ${
                  paymentMethod === 'transfer'
                    ? 'bg-text text-bg font-bold border-text'
                    : 'bg-surface-2 border-border text-text-muted hover:text-text'
                }`}
              >
                Chuyển khoản
              </button>
            </div>
          </div>

          <button
            onClick={handleConfirmCheckout}
            className="w-full py-2.5 rounded font-bold bg-text text-bg hover:opacity-90 cursor-pointer text-xs"
          >
            {checkoutTarget === 'cart_pay_now'
              ? 'Xác nhận thanh toán & Gửi bếp'
              : releaseAfterPay
              ? 'Xác nhận thanh toán & Trả chỗ'
              : 'Xác nhận thanh toán (tiếp tục ngồi)'}
          </button>
        </div>
      </Modal>
    </AppLayout>
  );
}
