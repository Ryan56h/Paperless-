import { useState, useEffect } from 'react';
import AppLayout from '../../../components/layout/AppLayout';
import {
  fetchTodayRevenueApi,
  fetchShiftRevenueApi,
  fetchDailyRevenueApi,
  fetchWeeklyRevenueApi,
  fetchInvoicesApi,
  type TodayRevenueData,
  type ShiftRevenueData,
  type DailyRevenueData,
  type WeeklyRevenueData,
  type BackendInvoice,
} from '../../../services/groceryApi';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export default function GroceryRevenuePage() {
  const [activeTab, setActiveTab] = useState<'today' | 'shift' | 'daily' | 'weekly'>('today');

  // Today
  const [revenueData, setRevenueData] = useState<TodayRevenueData | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<BackendInvoice[]>([]);

  // Shift
  const [shiftData, setShiftData] = useState<ShiftRevenueData | null>(null);
  const [selectedShiftDate, setSelectedShiftDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Daily
  const [dailyData, setDailyData] = useState<DailyRevenueData | null>(null);

  // Weekly
  const [weeklyData, setWeeklyData] = useState<WeeklyRevenueData | null>(null);
  const [weekOffset, setWeekOffset] = useState<number>(0);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        if (activeTab === 'today') {
          const [rev, invs] = await Promise.all([
            fetchTodayRevenueApi(),
            fetchInvoicesApi('', 15),
          ]);
          if (isMounted) {
            setRevenueData(rev);
            setRecentInvoices(invs);
          }
        } else if (activeTab === 'shift') {
          const data = await fetchShiftRevenueApi(selectedShiftDate);
          if (isMounted) setShiftData(data);
        } else if (activeTab === 'daily') {
          const data = await fetchDailyRevenueApi();
          if (isMounted) setDailyData(data);
        } else if (activeTab === 'weekly') {
          const data = await fetchWeeklyRevenueApi(weekOffset);
          if (isMounted) setWeeklyData(data);
        }
      } catch (err) {
        console.error('Lỗi tải báo cáo doanh thu:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [activeTab, selectedShiftDate, weekOffset]);

  const totalRev = revenueData?.totalRevenue ?? 0;
  const prevRev = revenueData?.previousDayRevenue ?? 0;
  const percentGrowth =
    prevRev > 0 ? (((totalRev - prevRev) / prevRev) * 100).toFixed(1) : '0.0';

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-bg font-sans">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h1 className="text-base font-bold text-text">Báo cáo & Thống kê doanh thu — Tạp hoá</h1>
            <p className="text-xs text-text-dim mt-0.5">
              Theo dõi doanh thu bán hàng thực tế qua máy POS và hóa đơn điện tử
            </p>
          </div>

          <span className="text-xs text-text-dim px-2.5 py-1 rounded bg-surface-2 border border-border">
            Hôm nay: {new Date().toLocaleDateString('vi-VN')}
          </span>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto">
          {[
            { id: 'today', label: '📊 Hôm nay (Theo giờ)' },
            { id: 'shift', label: '⏱️ Theo ca làm việc' },
            { id: 'daily', label: '📅 Theo ngày (7 ngày)' },
            { id: 'weekly', label: '📈 Theo tuần' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                activeTab === t.id
                  ? 'bg-text text-bg shadow'
                  : 'bg-surface-2 border border-border text-text-muted hover:text-text'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-text/20 border-t-text animate-spin mb-2" />
            <p className="text-xs text-text-muted">Đang tải số liệu doanh thu...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: TODAY */}
            {activeTab === 'today' && (
              <>
                {/* 4 Stat KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  <div className="p-4 rounded bg-surface border border-border">
                    <span className="text-[11px] font-medium text-text-dim uppercase tracking-wider block mb-1">
                      Tổng doanh thu
                    </span>
                    <div className="text-xl font-bold text-text">
                      {(revenueData?.totalRevenue ?? 0).toLocaleString('vi-VN')} đ
                    </div>
                    <p className="text-[11px] text-text-dim mt-1">
                      +{percentGrowth}% so với hôm qua
                    </p>
                  </div>

                  <div className="p-4 rounded bg-surface border border-border">
                    <span className="text-[11px] font-medium text-text-dim uppercase tracking-wider block mb-1">
                      Số đơn hoàn thành
                    </span>
                    <div className="text-xl font-bold text-text">
                      {revenueData?.orderCount ?? 0} đơn
                    </div>
                    <p className="text-[11px] text-text-dim mt-1">Đơn bán trực tiếp tại quầy</p>
                  </div>

                  <div className="p-4 rounded bg-surface border border-border">
                    <span className="text-[11px] font-medium text-text-dim uppercase tracking-wider block mb-1">
                      Giá trị trung bình / đơn
                    </span>
                    <div className="text-xl font-bold text-text">
                      {(revenueData?.averageOrderValue ?? 0).toLocaleString('vi-VN')} đ
                    </div>
                    <p className="text-[11px] text-text-dim mt-1">Tính trên mỗi giỏ hàng</p>
                  </div>

                  <div className="p-4 rounded bg-surface border border-border">
                    <span className="text-[11px] font-medium text-text-dim uppercase tracking-wider block mb-1">
                      Hình thức thanh toán
                    </span>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-text-dim">Tiền mặt:</span>
                      <span className="font-semibold text-text">
                        {(revenueData?.cashRevenue ?? 0).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-0.5">
                      <span className="text-text-dim">Chuyển khoản / VietQR:</span>
                      <span className="font-semibold text-text">
                        {(revenueData?.digitalRevenue ?? 0).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Charts & Top Selling Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Hourly Revenue Chart (2 cols) */}
                  <div className="lg:col-span-2 p-4 rounded bg-surface border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                          Doanh thu theo giờ
                        </h3>
                        <p className="text-[11px] text-text-dim">Từ 06:00 đến 21:00 hôm nay</p>
                      </div>
                    </div>

                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={revenueData?.hourlyData ?? []}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="2 2" stroke="#2A2A2A" vertical={false} />
                          <XAxis dataKey="hour" stroke="#666666" fontSize={11} tickLine={false} />
                          <YAxis
                            stroke="#666666"
                            fontSize={11}
                            tickLine={false}
                            tickFormatter={val => `${val / 1000}k`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#111111',
                              borderColor: '#333333',
                              borderRadius: '6px',
                              fontSize: '11px',
                            }}
                            formatter={(val: unknown) => [
                              `${Number(val).toLocaleString('vi-VN')} đ`,
                              'Doanh thu',
                            ]}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#FFFFFF"
                            strokeWidth={1.5}
                            fillOpacity={0.1}
                            fill="#FFFFFF"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top Selling Products */}
                  <div className="p-4 rounded bg-surface border border-border">
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider mb-1">
                      Top mặt hàng bán chạy
                    </h3>
                    <p className="text-[11px] text-text-dim mb-3">
                      Sản phẩm có số lượng bán nhiều nhất
                    </p>

                    <div className="space-y-2">
                      {(revenueData?.topSelling ?? []).length === 0 ? (
                        <p className="text-xs text-text-dim text-center py-6">
                          Chưa có dữ liệu bán hàng hôm nay
                        </p>
                      ) : (
                        revenueData?.topSelling.map((item, idx) => (
                          <div
                            key={item.name}
                            className="p-2 rounded bg-surface-2 border border-border flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-4 text-center text-xs font-mono text-text-dim">
                                {idx + 1}.
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-text truncate">
                                  {item.name}
                                </p>
                                <p className="text-[10px] text-text-dim">
                                  Số lượng: {item.quantity} • {item.category}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-text whitespace-nowrap">
                              {item.revenue.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Orders Table */}
                <div className="p-4 rounded bg-surface border border-border">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider mb-1">
                    Đơn hàng phát sinh hôm nay
                  </h3>
                  <p className="text-[11px] text-text-dim mb-3">
                    Danh sách các đơn bán hàng gần nhất
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-border text-text-dim uppercase text-[10px]">
                        <tr>
                          <th className="py-2 px-3">Mã hoá đơn</th>
                          <th className="py-2 px-3">Phiếu số</th>
                          <th className="py-2 px-3">Khách hàng</th>
                          <th className="py-2 px-3">Kênh gửi</th>
                          <th className="py-2 px-3">Hình thức</th>
                          <th className="py-2 px-3 text-right">Tổng tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {recentInvoices.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-text-dim text-xs">
                              Chưa có đơn hàng nào
                            </td>
                          </tr>
                        ) : (
                          recentInvoices.map(order => (
                            <tr key={order.id} className="hover:bg-surface-2 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-medium text-text">
                                {order.id}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-text">
                                #{order.ticketNumber}
                              </td>
                              <td className="py-2.5 px-3 text-text">
                                {order.customerName || 'Khách lẻ'}
                                {order.customerPhone && (
                                  <span className="block text-[11px] text-text-dim">
                                    {order.customerPhone}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-xs">
                                <span className="px-2 py-0.5 rounded text-[10px] bg-surface-2 border border-border font-medium">
                                  {order.sendChannel === 'zalo' && '📱 Zalo'}
                                  {order.sendChannel === 'sms' && '💬 SMS'}
                                  {order.sendChannel === 'both' && '📲 Zalo+SMS'}
                                  {(order.sendChannel === 'none' || !order.sendChannel) && '💾 Lưu máy'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-text-dim uppercase text-[11px]">
                                {order.payMethod}
                              </td>
                              <td className="py-2.5 px-3 text-right font-semibold text-text">
                                {order.total.toLocaleString('vi-VN')} đ
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: SHIFT */}
            {activeTab === 'shift' && shiftData && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 bg-surface rounded border border-border">
                  <div>
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                      Chọn ngày xem ca
                    </h3>
                    <p className="text-[11px] text-text-dim">
                      Phân chia theo ca: Sáng (6h-12h), Chiều (12h-18h), Tối (18h-22h), Đêm (22h-6h)
                    </p>
                  </div>
                  <input
                    type="date"
                    value={selectedShiftDate}
                    onChange={e => setSelectedShiftDate(e.target.value)}
                    className="px-3 py-1.5 rounded bg-surface-2 border border-border text-xs text-text focus:outline-none"
                  />
                </div>

                {/* Shift KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {shiftData.shifts.map(shift => (
                    <div key={shift.shiftName} className="p-4 rounded bg-surface border border-border space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-text">{shift.shiftName}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-surface-2 border border-border rounded text-text-dim">
                          {shift.timeRange}
                        </span>
                      </div>
                      <div className="text-xl font-bold text-text">
                        {shift.totalRevenue.toLocaleString('vi-VN')} đ
                      </div>
                      <p className="text-xs text-text-dim font-medium">
                        {shift.orderCount} đơn hàng
                      </p>
                      <div className="pt-2 border-t border-border/50 text-[11px] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-text-dim">Tiền mặt:</span>
                          <span className="font-semibold text-text">{shift.cashRevenue.toLocaleString('vi-VN')} đ</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-dim">Chuyển khoản/QR:</span>
                          <span className="font-semibold text-text">{shift.digitalRevenue.toLocaleString('vi-VN')} đ</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shift Comparison Chart */}
                <div className="p-4 rounded bg-surface border border-border">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider mb-2">
                    So sánh doanh thu giữa các ca trong ngày ({shiftData.date})
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={shiftData.shifts} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="2 2" stroke="#2A2A2A" vertical={false} />
                        <XAxis dataKey="shiftName" stroke="#888888" fontSize={11} tickLine={false} />
                        <YAxis
                          stroke="#888888"
                          fontSize={11}
                          tickLine={false}
                          tickFormatter={val => `${val / 1000}k`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#111111',
                            borderColor: '#333333',
                            borderRadius: '6px',
                            fontSize: '11px',
                          }}
                          formatter={(val: unknown) => [
                            `${Number(val).toLocaleString('vi-VN')} đ`,
                            'Doanh thu',
                          ]}
                        />
                        <Bar dataKey="totalRevenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: DAILY */}
            {activeTab === 'daily' && dailyData && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded bg-surface border border-border">
                    <span className="text-[11px] font-medium text-text-dim uppercase tracking-wider block mb-1">
                      Tổng doanh thu ({dailyData.from} → {dailyData.to})
                    </span>
                    <div className="text-xl font-bold text-text">
                      {dailyData.totalRevenue.toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                  <div className="p-4 rounded bg-surface border border-border">
                    <span className="text-[11px] font-medium text-text-dim uppercase tracking-wider block mb-1">
                      Tổng số đơn hàng
                    </span>
                    <div className="text-xl font-bold text-text">
                      {dailyData.totalOrders} đơn
                    </div>
                  </div>
                  <div className="p-4 rounded bg-surface border border-border">
                    <span className="text-[11px] font-medium text-text-dim uppercase tracking-wider block mb-1">
                      Trung bình / ngày
                    </span>
                    <div className="text-xl font-bold text-text">
                      {dailyData.averageDailyRevenue.toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                </div>

                {/* Daily Chart */}
                <div className="p-4 rounded bg-surface border border-border">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider mb-2">
                    Biểu đồ doanh thu từng ngày
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyData.days} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="2 2" stroke="#2A2A2A" vertical={false} />
                        <XAxis
                          dataKey="dayOfWeek"
                          stroke="#888888"
                          fontSize={11}
                          tickLine={false}
                          tickFormatter={(val, idx) => `${val} (${dailyData.days[idx]?.date.slice(5)})`}
                        />
                        <YAxis
                          stroke="#888888"
                          fontSize={11}
                          tickLine={false}
                          tickFormatter={val => `${val / 1000}k`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#111111',
                            borderColor: '#333333',
                            borderRadius: '6px',
                            fontSize: '11px',
                          }}
                          formatter={(val: unknown) => [
                            `${Number(val).toLocaleString('vi-VN')} đ`,
                            'Doanh thu',
                          ]}
                        />
                        <Bar dataKey="totalRevenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Daily Table */}
                <div className="p-4 rounded bg-surface border border-border">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider mb-2">
                    Chi tiết theo ngày
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-border text-text-dim uppercase text-[10px]">
                        <tr>
                          <th className="py-2 px-3">Ngày</th>
                          <th className="py-2 px-3">Thứ</th>
                          <th className="py-2 px-3 text-center">Số đơn</th>
                          <th className="py-2 px-3">Tiền mặt</th>
                          <th className="py-2 px-3">Chuyển khoản/QR</th>
                          <th className="py-2 px-3 text-right">Tổng doanh thu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {dailyData.days.map(d => (
                          <tr key={d.date} className="hover:bg-surface-2 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-medium text-text">{d.date}</td>
                            <td className="py-2.5 px-3 text-text-dim">{d.dayOfWeek}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-text">{d.orderCount}</td>
                            <td className="py-2.5 px-3 text-text-dim">{d.cashRevenue.toLocaleString('vi-VN')} đ</td>
                            <td className="py-2.5 px-3 text-text-dim">{d.digitalRevenue.toLocaleString('vi-VN')} đ</td>
                            <td className="py-2.5 px-3 text-right font-bold text-text">
                              {d.totalRevenue.toLocaleString('vi-VN')} đ
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: WEEKLY */}
            {activeTab === 'weekly' && weeklyData && (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-surface rounded border border-border">
                  <button
                    onClick={() => setWeekOffset(prev => prev - 1)}
                    className="px-3 py-1.5 rounded bg-surface-2 border border-border text-xs text-text hover:bg-border cursor-pointer font-medium"
                  >
                    ◀ Tuần trước
                  </button>
                  <div className="text-center">
                    <span className="font-bold text-text text-sm block">{weeklyData.weekLabel}</span>
                    <span className="text-[11px] text-text-dim font-mono">
                      {weeklyData.from} đến {weeklyData.to}
                    </span>
                  </div>
                  <button
                    onClick={() => setWeekOffset(prev => Math.min(0, prev + 1))}
                    disabled={weekOffset === 0}
                    className="px-3 py-1.5 rounded bg-surface-2 border border-border text-xs text-text hover:bg-border cursor-pointer font-medium disabled:opacity-40"
                  >
                    Tuần sau ▶
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded bg-surface border border-border">
                    <span className="text-[11px] font-medium text-text-dim uppercase tracking-wider block mb-1">
                      Tổng doanh thu tuần
                    </span>
                    <div className="text-2xl font-bold text-text">
                      {weeklyData.totalRevenue.toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                  <div className="p-4 rounded bg-surface border border-border">
                    <span className="text-[11px] font-medium text-text-dim uppercase tracking-wider block mb-1">
                      Tổng số đơn trong tuần
                    </span>
                    <div className="text-2xl font-bold text-text">
                      {weeklyData.totalOrders} đơn
                    </div>
                  </div>
                </div>

                {/* Weekly Chart */}
                <div className="p-4 rounded bg-surface border border-border">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider mb-2">
                    Diễn biến doanh thu từ Thứ 2 đến Chủ nhật
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData.days} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="2 2" stroke="#2A2A2A" vertical={false} />
                        <XAxis dataKey="dayOfWeek" stroke="#888888" fontSize={11} tickLine={false} />
                        <YAxis
                          stroke="#888888"
                          fontSize={11}
                          tickLine={false}
                          tickFormatter={val => `${val / 1000}k`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#111111',
                            borderColor: '#333333',
                            borderRadius: '6px',
                            fontSize: '11px',
                          }}
                          formatter={(val: unknown) => [
                            `${Number(val).toLocaleString('vi-VN')} đ`,
                            'Doanh thu',
                          ]}
                        />
                        <Bar dataKey="totalRevenue" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
