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
