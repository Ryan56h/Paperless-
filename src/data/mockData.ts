import type { Customer, Invoice, Voucher, DailyRevenue, ChannelStat, TopProduct } from '../types';

export const mockCustomers: Customer[] = [
  { id: 'KH001', name: 'Nguyễn Văn An', phone: '0901234567', points: 1250, tier: 'gold', totalSpent: 12500000, totalOrders: 18 },
  { id: 'KH002', name: 'Trần Thị Bích', phone: '0912345678', points: 320, tier: 'silver', totalSpent: 3200000, totalOrders: 7 },
  { id: 'KH003', name: 'Lê Minh Cường', phone: '0923456789', points: 80, tier: 'bronze', totalSpent: 800000, totalOrders: 2 },
  { id: 'KH004', name: 'Phạm Thị Dung', phone: '0934567890', points: 4800, tier: 'diamond', totalSpent: 48000000, totalOrders: 64 },
  { id: 'KH005', name: 'Hoàng Văn Em', phone: '0945678901', points: 590, tier: 'silver', totalSpent: 5900000, totalOrders: 11 },
  { id: 'KH006', name: 'Vũ Thị Phương', phone: '0956789012', points: 2100, tier: 'gold', totalSpent: 21000000, totalOrders: 29 },
  { id: 'KH007', name: 'Đặng Minh Quân', phone: '0967890123', points: 140, tier: 'bronze', totalSpent: 1400000, totalOrders: 4 },
  { id: 'KH008', name: 'Bùi Thị Hoa', phone: '0978901234', points: 3600, tier: 'diamond', totalSpent: 36000000, totalOrders: 47 },
];

export const mockInvoices: Invoice[] = [
  {
    id: 'PL-20260529-001',
    customerId: 'KH001',
    customerName: 'Nguyễn Văn An',
    customerPhone: '0901234567',
    branch: 'Chi nhánh Q1',
    staffName: 'Nguyễn Bảo Trân',
    items: [
      { id: 'SP001', name: 'Cà phê sữa đá', quantity: 2, unitPrice: 45000 },
      { id: 'SP002', name: 'Bánh croissant', quantity: 1, unitPrice: 35000 },
    ],
    subtotal: 125000,
    discount: 0,
    tax: 10000,
    total: 135000,
    sendChannel: 'zalo',
    sendStatus: 'sent',
    createdAt: '2026-05-29T08:15:00',
  },
  {
    id: 'PL-20260529-002',
    customerId: 'KH002',
    customerName: 'Trần Thị Bích',
    customerPhone: '0912345678',
    branch: 'Chi nhánh Q3',
    staffName: 'Lê Thanh Tùng',
    items: [
      { id: 'SP003', name: 'Trà sữa trân châu', quantity: 3, unitPrice: 55000 },
    ],
    subtotal: 165000,
    discount: 20000,
    tax: 14500,
    total: 159500,
    sendChannel: 'sms',
    sendStatus: 'sent',
    createdAt: '2026-05-29T09:30:00',
  },
  {
    id: 'PL-20260529-003',
    customerId: 'KH003',
    customerName: 'Lê Minh Cường',
    customerPhone: '0923456789',
    branch: 'Chi nhánh Q1',
    staffName: 'Nguyễn Bảo Trân',
    items: [
      { id: 'SP001', name: 'Cà phê sữa đá', quantity: 1, unitPrice: 45000 },
      { id: 'SP004', name: 'Sandwich gà', quantity: 1, unitPrice: 65000 },
      { id: 'SP005', name: 'Nước cam tươi', quantity: 2, unitPrice: 40000 },
    ],
    subtotal: 190000,
    discount: 0,
    tax: 19000,
    total: 209000,
    sendChannel: 'both',
    sendStatus: 'pending',
    createdAt: '2026-05-29T10:45:00',
  },
  {
    id: 'PL-20260529-004',
    customerId: 'KH004',
    customerName: 'Phạm Thị Dung',
    customerPhone: '0934567890',
    branch: 'Chi nhánh Q7',
    staffName: 'Trần Quốc Bảo',
    items: [
      { id: 'SP006', name: 'Cà phê Americano', quantity: 2, unitPrice: 50000 },
      { id: 'SP007', name: 'Bánh tiramisu', quantity: 2, unitPrice: 75000 },
    ],
    subtotal: 250000,
    discount: 25000,
    tax: 22500,
    total: 247500,
    sendChannel: 'zalo',
    sendStatus: 'sent',
    createdAt: '2026-05-29T11:20:00',
  },
  {
    id: 'PL-20260528-018',
    customerId: 'KH005',
    customerName: 'Hoàng Văn Em',
    customerPhone: '0945678901',
    branch: 'Chi nhánh Q3',
    staffName: 'Lê Thanh Tùng',
    items: [
      { id: 'SP002', name: 'Bánh croissant', quantity: 2, unitPrice: 35000 },
    ],
    subtotal: 70000,
    discount: 0,
    tax: 7000,
    total: 77000,
    sendChannel: 'sms',
    sendStatus: 'failed',
    createdAt: '2026-05-28T14:00:00',
  },
  {
    id: 'PL-20260528-017',
    customerId: 'KH006',
    customerName: 'Vũ Thị Phương',
    customerPhone: '0956789012',
    branch: 'Chi nhánh Q1',
    staffName: 'Nguyễn Bảo Trân',
    items: [
      { id: 'SP003', name: 'Trà sữa trân châu', quantity: 2, unitPrice: 55000 },
      { id: 'SP005', name: 'Nước cam tươi', quantity: 1, unitPrice: 40000 },
    ],
    subtotal: 150000,
    discount: 15000,
    tax: 13500,
    total: 148500,
    sendChannel: 'zalo',
    sendStatus: 'sent',
    createdAt: '2026-05-28T16:30:00',
  },
];

export const mockDailyRevenue: DailyRevenue[] = [
  { date: '23/05', revenue: 4200000, invoiceCount: 31 },
  { date: '24/05', revenue: 3800000, invoiceCount: 28 },
  { date: '25/05', revenue: 5100000, invoiceCount: 38 },
  { date: '26/05', revenue: 4750000, invoiceCount: 35 },
  { date: '27/05', revenue: 6200000, invoiceCount: 46 },
  { date: '28/05', revenue: 5800000, invoiceCount: 43 },
  { date: '29/05', revenue: 2900000, invoiceCount: 21 },
];

export const mockChannelStats: ChannelStat[] = [
  { channel: 'Zalo', count: 148 },
  { channel: 'SMS', count: 67 },
  { channel: 'Cả hai', count: 27 },
];

export const mockTopProducts: TopProduct[] = [
  { name: 'Cà phê sữa đá', quantity: 312, revenue: 14040000 },
  { name: 'Trà sữa trân châu', quantity: 245, revenue: 13475000 },
  { name: 'Bánh croissant', quantity: 189, revenue: 6615000 },
  { name: 'Sandwich gà', quantity: 134, revenue: 8710000 },
  { name: 'Nước cam tươi', quantity: 128, revenue: 5120000 },
];

export const mockVouchers: Voucher[] = [
  { id: 'V001', code: 'WELCOME10', discountType: 'percent', discountValue: 10, minOrder: 100000, expiry: '2026-06-30', status: 'active', usageCount: 45, maxUsage: 200 },
  { id: 'V002', code: 'SUMMER50K', discountType: 'fixed', discountValue: 50000, minOrder: 300000, expiry: '2026-07-15', status: 'active', usageCount: 12, maxUsage: 100 },
  { id: 'V003', code: 'GOLD20', discountType: 'percent', discountValue: 20, minOrder: 200000, expiry: '2026-05-01', status: 'expired', usageCount: 88, maxUsage: 100 },
  { id: 'V004', code: 'LOYAL5K', discountType: 'fixed', discountValue: 5000, minOrder: 50000, expiry: '2026-12-31', status: 'active', usageCount: 230, maxUsage: 500 },
  { id: 'V005', code: 'FLASH30', discountType: 'percent', discountValue: 30, minOrder: 150000, expiry: '2026-05-20', status: 'expired', usageCount: 100, maxUsage: 100 },
];

export const mockProducts = [
  { id: 'SP001', name: 'Cà phê sữa đá', category: 'Cà phê', price: 45000 },
  { id: 'SP002', name: 'Bánh croissant', category: 'Bánh ngọt', price: 35000 },
  { id: 'SP003', name: 'Trà sữa trân châu', category: 'Trà sữa', price: 55000 },
  { id: 'SP004', name: 'Sandwich gà', category: 'Bánh mỳ', price: 65000 },
  { id: 'SP005', name: 'Nước cam tươi', category: 'Nước ép', price: 40000 },
  { id: 'SP006', name: 'Cà phê Americano', category: 'Cà phê', price: 50000 },
  { id: 'SP007', name: 'Bánh tiramisu', category: 'Bánh ngọt', price: 75000 },
  { id: 'SP008', name: 'Trà đào cam sả', category: 'Nước ép', price: 48000 },
];

export const findCustomerByPhone = (phone: string): Customer | undefined =>
  mockCustomers.find(c => c.phone === phone);

export const findInvoiceById = (id: string): Invoice | undefined =>
  mockInvoices.find(inv => inv.id === id);

export const findInvoicesByPhone = (phone: string): Invoice[] =>
  mockInvoices.filter(inv => inv.customerPhone === phone);

