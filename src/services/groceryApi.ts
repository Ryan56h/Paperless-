import type { CatalogProduct } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5195/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('paperless_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export interface BackendProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  barcode?: string;
  stock: number;
  popular: boolean;
  imageUrl?: string;
  isAvailable: boolean;
}

export interface BackendInvoiceItem {
  id: string;
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface BackendInvoice {
  id: string;
  ticketNumber: number;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  branchName: string;
  staffName: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  cashGiven: number;
  changeDue: number;
  orderStatus: 'preparing' | 'ready' | 'completed' | 'cancelled';
  payMethod: 'cash' | 'transfer' | 'qr' | 'vietqr';
  payStatus: string;
  sendChannel: 'zalo' | 'sms' | 'both';
  sendStatus: 'sent' | 'pending' | 'failed';
  note?: string;
  publicToken: string;
  createdAt: string;
  items: BackendInvoiceItem[];
}

export interface CreateInvoicePayload {
  customerName?: string;
  customerPhone?: string;
  payMethod: 'cash' | 'qr' | 'transfer';
  cashGiven?: number;
  note?: string;
  sendChannel?: 'zalo' | 'sms' | 'both';
  items: {
    productId?: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface TodayRevenueData {
  totalRevenue: number;
  previousDayRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  cashRevenue: number;
  digitalRevenue: number;
  hourlyData: { hour: string; revenue: number; orders: number }[];
  topSelling: { name: string; quantity: number; revenue: number; category: string }[];
}

// 1. Fetch products list from BE
export async function fetchProductsApi(category?: string, search?: string): Promise<CatalogProduct[]> {
  const params = new URLSearchParams();
  if (category && category !== 'Tất cả') params.append('category', category);
  if (search && search.trim()) params.append('search', search.trim());

  const url = `${API_URL}/products${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('Không thể tải danh sách sản phẩm từ máy chủ.');
  }

  const data: BackendProduct[] = await res.json();
  return data.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    unit: p.unit,
    barcode: p.barcode,
    stock: p.stock,
    popular: p.popular,
    image: p.imageUrl,
  }));
}

// 2. Fetch distinct categories
export async function fetchProductCategoriesApi(): Promise<string[]> {
  const res = await fetch(`${API_URL}/products/categories`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    return [];
  }

  const list: string[] = await res.json();
  return ['Tất cả', ...list];
}

// 3. Create invoice (Checkout at POS)
export async function createInvoiceApi(payload: CreateInvoicePayload): Promise<BackendInvoice> {
  const res = await fetch(`${API_URL}/invoices`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Tạo hóa đơn thất bại.');
  }

  return res.json();
}

// 4. Fetch invoices list for display / KDS
export async function fetchInvoicesApi(status?: string, limit = 50): Promise<BackendInvoice[]> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  params.append('limit', limit.toString());

  const res = await fetch(`${API_URL}/invoices?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('Không thể tải danh sách hóa đơn.');
  }

  return res.json();
}

// 5. Get invoice by ID (Public view for customer)
export async function fetchInvoiceDetailApi(id: string): Promise<BackendInvoice> {
  const res = await fetch(`${API_URL}/invoices/${encodeURIComponent(id)}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('Không tìm thấy hóa đơn.');
  }

  return res.json();
}

// 6. Public lookup by ID or Phone
export async function lookupInvoicesApi(query: string): Promise<BackendInvoice[]> {
  const res = await fetch(`${API_URL}/invoices/lookup?query=${encodeURIComponent(query)}`, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Không thể tra cứu hóa đơn.');
  }

  return res.json();
}

// 7. Update order status
export async function updateInvoiceStatusApi(id: string, status: string): Promise<void> {
  const res = await fetch(`${API_URL}/invoices/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    throw new Error('Không thể cập nhật trạng thái đơn hàng.');
  }
}

// 8. Fetch today's grocery revenue
export async function fetchTodayRevenueApi(): Promise<TodayRevenueData> {
  const res = await fetch(`${API_URL}/revenue/grocery/today`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('Không thể tải dữ liệu doanh thu.');
  }

  return res.json();
}

// 9. Lookup customer by phone
export async function lookupCustomerByPhoneApi(phone: string): Promise<{
  id: string;
  name: string;
  phone: string;
  points: number;
  tier: string;
} | null> {
  const res = await fetch(`${API_URL}/customers/lookup?phone=${encodeURIComponent(phone)}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) return null;
  return res.json();
}
