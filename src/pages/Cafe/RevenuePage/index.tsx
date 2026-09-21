import AppLayout from '../../../components/layout/AppLayout';
import { mockCafeRevenueOverview, mockCafeOrders } from '../../../data/mockData';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export default function CafeRevenuePage() {
  const data = mockCafeRevenueOverview;

  const percentGrowth = (
    ((data.totalRevenue - data.previousDayRevenue) / data.previousDayRevenue) *
    100
  ).toFixed(1);

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-bg font-sans">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h1 className="text-base font-bold text-text">Doanh thu hôm nay — Quán Cafe</h1>
            <p className="text-xs text-text-dim mt-0.5">
              Thống kê bán hàng theo bàn và ca làm việc
            </p>
          </div>

          <span className="text-xs text-text-dim px-2.5 py-1 rounded bg-surface-2 border border-border">
            Hôm nay: {new Date().toLocaleDateString('vi-VN')}
          </span>
        </div>

        {/* 4 Stat KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="p-4 rounded bg-surface border border-border">
            <span className="text-[11px] font-medium text-text-dim uppercase tracking-wider block mb-1">
              Tổng doanh thu
            </span>
            <div className="text-xl font-bold text-text">
              {data.totalRevenue.toLocaleString('vi-VN')} đ
            </div>
            <p className="text-[11px] text-text-dim mt-1">
              +{percentGrowth}% so với hôm qua
            </p>
          </div>

          <div className="p-4 rounded bg-surface border border-border">
            <span className="text-[11px] font-medium text-text-dim uppercase tracking-wider block mb-1">
              Số lượt bàn phục vụ
            </span>
            <div className="text-xl font-bold text-text">{data.orderCount} lượt</div>
            <p className="text-[11px] text-text-dim mt-1">Hoàn tất trong ngày</p>
          </div>

          <div className="p-4 rounded bg-surface border border-border">
            <span className="text-[11px] font-medium text-text-dim uppercase tracking-wider block mb-1">
              Giá trị trung bình / bàn
            </span>
            <div className="text-xl font-bold text-text">
              {data.averageOrderValue.toLocaleString('vi-VN')} đ
            </div>
            <p className="text-[11px] text-text-dim mt-1">Trung bình 2-3 món/bàn</p>
          </div>

          <div className="p-4 rounded bg-surface border border-border">
            <span className="text-[11px] font-medium text-text-dim uppercase tracking-wider block mb-1">
              Hình thức thanh toán
            </span>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-text-dim">VietQR:</span>
              <span className="font-semibold text-text">
                {data.digitalRevenue.toLocaleString('vi-VN')} đ
              </span>
            </div>
            <div className="flex items-center justify-between text-xs mt-0.5">
              <span className="text-text-dim">Tiền mặt:</span>
              <span className="font-semibold text-text">
                {data.cashRevenue.toLocaleString('vi-VN')} đ
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
                <p className="text-[11px] text-text-dim">Khung giờ hoạt động trong ngày</p>
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.hourlyData}
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

          {/* Top Drinks */}
          <div className="p-4 rounded bg-surface border border-border">
            <h3 className="text-xs font-bold text-text uppercase tracking-wider mb-1">
              Top món gọi nhiều
            </h3>
            <p className="text-[11px] text-text-dim mb-3">Đồ uống bán chạy nhất hôm nay</p>

            <div className="space-y-2">
              {data.topSelling.map((item, idx) => (
                <div
                  key={item.name}
                  className="p-2 rounded bg-surface-2 border border-border flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-4 text-center text-xs font-mono text-text-dim">
                      {idx + 1}.
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text truncate">{item.name}</p>
                      <p className="text-[10px] text-text-dim">
                        Số lượng: {item.quantity} ly
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-text whitespace-nowrap">
                    {item.revenue.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table breakdown */}
        <div className="p-4 rounded bg-surface border border-border">
          <h3 className="text-xs font-bold text-text uppercase tracking-wider mb-1">
            Bàn vừa phục vụ
          </h3>
          <p className="text-[11px] text-text-dim mb-3">Danh sách các bàn gần nhất</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border text-text-dim uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3">Bàn</th>
                  <th className="py-2 px-3">Mã đơn</th>
                  <th className="py-2 px-3">Thời gian</th>
                  <th className="py-2 px-3">Món gọi</th>
                  <th className="py-2 px-3 text-right">Tổng tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockCafeOrders.map(order => (
                  <tr key={order.id} className="hover:bg-surface-2">
                    <td className="py-2 px-3 font-medium text-text">{order.tableName}</td>
                    <td className="py-2 px-3 font-mono text-text-dim">{order.id}</td>
                    <td className="py-2 px-3 text-text-dim">{order.createdAt}</td>
                    <td className="py-2 px-3 text-text">
                      {order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                    </td>
                    <td className="py-2 px-3 text-right font-semibold text-text">
                      {order.total.toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
