import { createContext, useContext, useState, type ReactNode } from 'react';
import type {
  GroceryOrder,
  GroceryOrderItem,
  GroceryOrderStatus,
  CafeTable,
  CafeOrder,
  CafeOrderItem,
  CafeOrderStatus,
  CafeTableStatus,
} from '../types';
import {
  mockGroceryOrders,
  mockCafeTables,
  mockCafeOrders,
} from '../data/mockData';

interface OrderContextType {
  // Grocery State & Actions
  groceryOrders: GroceryOrder[];
  addGroceryOrder: (
    items: GroceryOrderItem[],
    paymentMethod: 'cash' | 'transfer' | 'qr',
    customerNote?: string
  ) => GroceryOrder;
  updateGroceryOrderStatus: (orderId: string, status: GroceryOrderStatus) => void;
  clearGroceryOrders: () => void;

  // Cafe State & Actions
  cafeTables: CafeTable[];
  cafeOrders: CafeOrder[];
  selectedTableId: string | null;
  setSelectedTableId: (tableId: string | null) => void;
  createCafeOrder: (
    tableId: string,
    items: CafeOrderItem[],
    discount?: number,
    options?: {
      guestLabel?: string;
      isPaid?: boolean;
      paymentMethod?: 'cash' | 'transfer' | 'qr';
      forceNewGuest?: boolean;
      targetOrderId?: string;
    }
  ) => CafeOrder;
  updateCafeOrderStatus: (orderId: string, status: CafeOrderStatus) => void;
  payCafeOrder: (
    orderId: string,
    paymentMethod?: 'cash' | 'transfer' | 'qr',
    releaseNow?: boolean
  ) => void;
  releaseTableOrder: (orderId: string) => void;
  releaseWholeTable: (tableId: string) => void;
  updateGuestLabel: (orderId: string, newLabel: string) => void;
  setTableStatus: (tableId: string, status: CafeTableStatus) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  // --- Grocery State ---
  const [groceryOrders, setGroceryOrders] = useState<GroceryOrder[]>(() => {
    try {
      const saved = localStorage.getItem('paperless_grocery_orders');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return mockGroceryOrders;
  });

  const saveGroceryOrders = (newOrders: GroceryOrder[]) => {
    setGroceryOrders(newOrders);
    try {
      localStorage.setItem('paperless_grocery_orders', JSON.stringify(newOrders));
    } catch {
      // fallback
    }
  };

  const addGroceryOrder = (
    items: GroceryOrderItem[],
    paymentMethod: 'cash' | 'transfer' | 'qr',
    customerNote?: string
  ): GroceryOrder => {
    const nextTicket = groceryOrders.length > 0
      ? Math.max(...groceryOrders.map(o => o.ticketNumber)) + 1
      : 101;

    const subtotal = items.reduce((acc, i) => acc + i.total, 0);
    const total = subtotal;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newOrder: GroceryOrder = {
      id: `GH-${Date.now().toString().slice(-4)}`,
      ticketNumber: nextTicket,
      items,
      itemCount: items.reduce((acc, i) => acc + i.quantity, 0),
      subtotal,
      discount: 0,
      total,
      paymentMethod,
      status: 'preparing',
      customerNote,
      createdAt: timeStr,
    };

    const updated = [newOrder, ...groceryOrders];
    saveGroceryOrders(updated);
    return newOrder;
  };

  const updateGroceryOrderStatus = (orderId: string, status: GroceryOrderStatus) => {
    const updated = groceryOrders.map(o =>
      o.id === orderId ? { ...o, status, completedAt: status === 'completed' ? 'Vừa xong' : o.completedAt } : o
    );
    saveGroceryOrders(updated);
  };

  const clearGroceryOrders = () => {
    saveGroceryOrders(mockGroceryOrders);
  };

  // --- Cafe State ---
  const [cafeTables, setCafeTables] = useState<CafeTable[]>(() => {
    try {
      const saved = localStorage.getItem('paperless_cafe_tables_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return mockCafeTables;
  });

  const [cafeOrders, setCafeOrders] = useState<CafeOrder[]>(() => {
    try {
      const saved = localStorage.getItem('paperless_cafe_orders_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return mockCafeOrders;
  });

  const [selectedTableId, setSelectedTableId] = useState<string | null>('T05');

  const saveCafeState = (newTables: CafeTable[], newOrders: CafeOrder[]) => {
    setCafeTables(newTables);
    setCafeOrders(newOrders);
    try {
      localStorage.setItem('paperless_cafe_tables_v2', JSON.stringify(newTables));
      localStorage.setItem('paperless_cafe_orders_v2', JSON.stringify(newOrders));
    } catch {
      // fallback
    }
  };

  const createCafeOrder = (
    tableId: string,
    items: CafeOrderItem[],
    discount = 0,
    options?: {
      guestLabel?: string;
      isPaid?: boolean;
      paymentMethod?: 'cash' | 'transfer' | 'qr';
      forceNewGuest?: boolean;
      targetOrderId?: string;
    }
  ): CafeOrder => {
    const table = cafeTables.find(t => t.id === tableId);
    const tableName = table ? table.name : `Bàn ${tableId}`;

    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    const total = Math.max(0, subtotal - discount);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const existingTableOrders = cafeOrders.filter(o => o.tableId === tableId && o.status !== 'paid');

    let updatedOrders: CafeOrder[];
    let resultingOrder: CafeOrder;

    const targetOrderIndex = options?.targetOrderId
      ? cafeOrders.findIndex(o => o.id === options.targetOrderId)
      : !options?.forceNewGuest && existingTableOrders.length > 0
      ? cafeOrders.findIndex(o => o.id === existingTableOrders[existingTableOrders.length - 1].id)
      : -1;

    if (targetOrderIndex >= 0) {
      const current = cafeOrders[targetOrderIndex];
      const mergedItems = [...current.items, ...items];
      const newSubtotal = mergedItems.reduce((acc, i) => acc + i.total, 0);
      resultingOrder = {
        ...current,
        items: mergedItems,
        subtotal: newSubtotal,
        total: Math.max(0, newSubtotal - (current.discount || 0)),
        status: current.status === 'served' ? 'pending' : current.status,
        isPaid: options?.isPaid !== undefined ? options.isPaid : current.isPaid,
        paymentMethod: options?.paymentMethod || current.paymentMethod,
        paidAt: options?.isPaid ? timeStr : current.paidAt,
        guestLabel: options?.guestLabel || current.guestLabel,
        updatedAt: timeStr,
      };
      updatedOrders = [...cafeOrders];
      updatedOrders[targetOrderIndex] = resultingOrder;
    } else {
      const newOrderId = `CF-${Date.now().toString().slice(-4)}`;
      const guestNumber = existingTableOrders.length + 1;
      resultingOrder = {
        id: newOrderId,
        tableId,
        tableName,
        guestLabel: options?.guestLabel || `Khách ${guestNumber}`,
        items,
        subtotal,
        discount,
        total,
        isPaid: options?.isPaid || false,
        paymentMethod: options?.paymentMethod,
        paidAt: options?.isPaid ? timeStr : undefined,
        status: 'pending',
        createdAt: timeStr,
        createdAtTimestamp: Date.now(),
        updatedAt: timeStr,
      };
      updatedOrders = [...cafeOrders, resultingOrder];
    }

    // Update table status to occupied
    const updatedTables = cafeTables.map(t =>
      t.id === tableId
        ? {
            ...t,
            status: 'occupied' as CafeTableStatus,
            currentOrderId: resultingOrder.id,
            activeMinutes: t.activeMinutes || 1,
          }
        : t
    );

    saveCafeState(updatedTables, updatedOrders);
    return resultingOrder;
  };

  const updateCafeOrderStatus = (orderId: string, status: CafeOrderStatus) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const updatedOrders = cafeOrders.map(o =>
      o.id === orderId ? { ...o, status, updatedAt: timeStr } : o
    );

    saveCafeState(cafeTables, updatedOrders);
  };

  const payCafeOrder = (
    orderId: string,
    paymentMethod: 'cash' | 'transfer' | 'qr' = 'cash',
    releaseNow = false
  ) => {
    const order = cafeOrders.find(o => o.id === orderId);
    if (!order) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const updatedOrders = cafeOrders.map(o =>
      o.id === orderId
        ? {
            ...o,
            isPaid: true,
            paymentMethod,
            paidAt: timeStr,
            status: releaseNow ? ('paid' as CafeOrderStatus) : o.status,
            updatedAt: timeStr,
          }
        : o
    );

    const remainingActive = updatedOrders.filter(
      o => o.tableId === order.tableId && o.status !== 'paid'
    );

    const updatedTables = cafeTables.map(t =>
      t.id === order.tableId
        ? {
            ...t,
            status: (remainingActive.length > 0 ? 'occupied' : 'empty') as CafeTableStatus,
            currentOrderId: remainingActive.length > 0 ? remainingActive[0].id : undefined,
            activeMinutes: remainingActive.length > 0 ? t.activeMinutes : undefined,
          }
        : t
    );

    saveCafeState(updatedTables, updatedOrders);
  };

  const releaseTableOrder = (orderId: string) => {
    const order = cafeOrders.find(o => o.id === orderId);
    if (!order) return;

    const updatedOrders = cafeOrders.map(o =>
      o.id === orderId ? { ...o, status: 'paid' as CafeOrderStatus } : o
    );

    const remainingActive = updatedOrders.filter(
      o => o.tableId === order.tableId && o.status !== 'paid'
    );

    const updatedTables = cafeTables.map(t =>
      t.id === order.tableId
        ? {
            ...t,
            status: (remainingActive.length > 0 ? 'occupied' : 'empty') as CafeTableStatus,
            currentOrderId: remainingActive.length > 0 ? remainingActive[0].id : undefined,
            activeMinutes: remainingActive.length > 0 ? t.activeMinutes : undefined,
          }
        : t
    );

    saveCafeState(updatedTables, updatedOrders);
  };

  const releaseWholeTable = (tableId: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const updatedOrders = cafeOrders.map(o =>
      o.tableId === tableId && o.status !== 'paid'
        ? { ...o, status: 'paid' as CafeOrderStatus, isPaid: true, updatedAt: timeStr }
        : o
    );

    const updatedTables = cafeTables.map(t =>
      t.id === tableId
        ? { ...t, status: 'empty' as CafeTableStatus, currentOrderId: undefined, activeMinutes: undefined }
        : t
    );

    saveCafeState(updatedTables, updatedOrders);
  };

  const updateGuestLabel = (orderId: string, newLabel: string) => {
    const updatedOrders = cafeOrders.map(o =>
      o.id === orderId ? { ...o, guestLabel: newLabel } : o
    );
    saveCafeState(cafeTables, updatedOrders);
  };

  const setTableStatus = (tableId: string, status: CafeTableStatus) => {
    const updatedTables = cafeTables.map(t =>
      t.id === tableId ? { ...t, status } : t
    );
    saveCafeState(updatedTables, cafeOrders);
  };

  return (
    <OrderContext.Provider
      value={{
        groceryOrders,
        addGroceryOrder,
        updateGroceryOrderStatus,
        clearGroceryOrders,
        cafeTables,
        cafeOrders,
        selectedTableId,
        setSelectedTableId,
        createCafeOrder,
        updateCafeOrderStatus,
        payCafeOrder,
        releaseTableOrder,
        releaseWholeTable,
        updateGuestLabel,
        setTableStatus,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}
