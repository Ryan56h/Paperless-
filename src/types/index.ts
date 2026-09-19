export interface Customer {
  id: string;
  name: string;
  phone: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  totalSpent: number;
  totalOrders: number;
}

export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  branch: string;
  staffName: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  sendChannel: 'zalo' | 'sms' | 'both';
  sendStatus: 'sent' | 'pending' | 'failed';
  createdAt: string;
}

export interface Voucher {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrder: number;
  expiry: string;
  status: 'active' | 'expired' | 'used';
  usageCount: number;
  maxUsage: number;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  invoiceCount: number;
}

export interface ChannelStat {
  channel: string;
  count: number;
}

export interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

// === NEW TYPES FOR BUSINESS MODULES ===

export type BusinessType = 'grocery' | 'cafe';

export interface BusinessProfile {
  id: string;
  name: string;
  type: BusinessType;
  ownerName: string;
  phone: string;
  email: string;
  address?: string;
  taxCode?: string;
  createdAt: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  unit?: string;
  barcode?: string;
  stock?: number;
  image?: string;
  popular?: boolean;
}

// GROCERY SPECIFIC
export type GroceryOrderStatus = 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface GroceryOrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface GroceryOrder {
  id: string;
  ticketNumber: number; // e.g. 101, 102
  items: GroceryOrderItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'transfer' | 'qr';
  status: GroceryOrderStatus;
  customerNote?: string;
  createdAt: string;
  completedAt?: string;
}

// CAFE SPECIFIC
export type CafeTableStatus = 'empty' | 'occupied' | 'reserved';

export interface CafeTable {
  id: string;
  name: string;
  zone: 'Tầng 1 - Trong nhà' | 'Tầng 2 - Máy lạnh' | 'Sân vườn thoáng mát';
  seats: number;
  status: CafeTableStatus;
  currentOrderId?: string;
  activeMinutes?: number;
}

export type CafeOrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'paid';

export interface CafeOrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  notes?: string; // e.g. "70% đường, ít đá"
  total: number;
}

export interface CafeOrder {
  id: string;
  tableId: string;
  tableName: string;
  guestLabel?: string; // e.g. "Khách 1 (Ghế 1)", "Khách 2", "Anh Nam"
  items: CafeOrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod?: 'cash' | 'transfer' | 'qr';
  isPaid?: boolean; // True if customer paid upfront (Thanh toán trước)
  paidAt?: string;
  status: CafeOrderStatus;
  createdAt: string;
  createdAtTimestamp?: number;
  updatedAt: string;
}

// REVENUE STATS
export interface HourlyRevenuePoint {
  hour: string;
  revenue: number;
  orders: number;
}

export interface TodayRevenueOverview {
  totalRevenue: number;
  previousDayRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  cashRevenue: number;
  digitalRevenue: number;
  hourlyData: HourlyRevenuePoint[];
  topSelling: { name: string; quantity: number; revenue: number; category: string }[];
}

