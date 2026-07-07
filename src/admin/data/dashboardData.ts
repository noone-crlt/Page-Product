import type {
  DashboardData,
  DashboardFilters,
  DashboardMetric,
  RevenuePoint,
  TopProduct,
} from '../types/dashboard';

const baseRevenue: RevenuePoint[] = [
  { label: '01/06', revenue: 42800000, orders: 48 },
  { label: '05/06', revenue: 56600000, orders: 61 },
  { label: '09/06', revenue: 49300000, orders: 55 },
  { label: '13/06', revenue: 71800000, orders: 78 },
  { label: '17/06', revenue: 65400000, orders: 69 },
  { label: '21/06', revenue: 89300000, orders: 91 },
  { label: '25/06', revenue: 77600000, orders: 84 },
  { label: '30/06', revenue: 104200000, orders: 108 },
];

const topProducts: TopProduct[] = [
  { id: 'SP-1842', name: 'iPhone 15 Pro Max 256GB', category: 'Điện thoại', sold: 184, revenue: 5372800000, growth: 18.4, stock: 32 },
  { id: 'SP-0941', name: 'MacBook Air M3 13 inch', category: 'Laptop', sold: 96, revenue: 2630400000, growth: 12.7, stock: 18 },
  { id: 'SP-2376', name: 'Samsung Galaxy S24 Ultra', category: 'Điện thoại', sold: 87, revenue: 2435130000, growth: 9.2, stock: 41 },
  { id: 'SP-1185', name: 'Tai nghe Sony WH-1000XM5', category: 'Âm thanh', sold: 146, revenue: 1166540000, growth: -2.8, stock: 9 },
  { id: 'SP-3418', name: 'Bàn phím Logitech MX Keys S', category: 'Phụ kiện', sold: 129, revenue: 373971000, growth: 7.6, stock: 54 },
];

export const dashboardData: DashboardData = {
  metrics: [
    { id: 'revenue', label: 'Tổng doanh thu', value: 1256800000, format: 'currency', change: 12.5, comparison: 'so với kỳ trước', tone: 'blue' },
    { id: 'orders', label: 'Đơn hàng', value: 3458, format: 'number', change: 8.7, comparison: 'so với kỳ trước', tone: 'green' },
    { id: 'customers', label: 'Khách hàng mới', value: 842, format: 'number', change: 15.2, comparison: 'so với kỳ trước', tone: 'amber' },
    { id: 'conversion', label: 'Tỷ lệ chuyển đổi', value: 3.45, format: 'percent', change: -2.1, comparison: 'so với kỳ trước', tone: 'rose' },
  ],
  revenue: baseRevenue,
  channels: [
    { id: 'website', label: 'Website', value: 46, color: '#1463df' },
    { id: 'marketplace', label: 'Sàn thương mại', value: 31, color: '#21a875' },
    { id: 'store', label: 'Cửa hàng', value: 17, color: '#e4a72d' },
    { id: 'other', label: 'Kênh khác', value: 6, color: '#c9d1dc' },
  ],
  activities: [
    { id: 'HD-23425', title: 'Nguyễn Văn An đặt đơn hàng', detail: 'Đơn hàng HD-23425 · 24.890.000 ₫', time: '2 phút trước', kind: 'order' },
    { id: 'SP-1842-A', title: 'Lê Thị Mai cập nhật tồn kho', detail: 'iPhone 15 Pro Max · tăng 12 sản phẩm', time: '15 phút trước', kind: 'stock' },
    { id: 'KH-0941', title: 'Trần Minh tạo tài khoản', detail: 'Khách hàng mới từ chiến dịch tháng 6', time: '28 phút trước', kind: 'customer' },
    { id: 'TT-1837', title: 'Thanh toán đã được đối soát', detail: 'Giao dịch TT-1837 · 8.490.000 ₫', time: '42 phút trước', kind: 'payment' },
  ],
  notifications: [
    { id: 'TB-01', title: 'Đơn hàng đã thanh toán', detail: 'HD-23425 đã được xác nhận tự động.', time: '2 phút', kind: 'success', unread: true },
    { id: 'TB-02', title: 'Sản phẩm sắp hết hàng', detail: 'Sony WH-1000XM5 chỉ còn 9 sản phẩm.', time: '18 phút', kind: 'warning', unread: true },
    { id: 'TB-03', title: 'Khách hàng mới', detail: 'Có 12 tài khoản mới trong hôm nay.', time: '1 giờ', kind: 'info', unread: false },
  ],
  topProducts,
};

const periodScale: Record<DashboardFilters['period'], number> = {
  '7d': 0.28,
  '30d': 1,
  '90d': 2.74,
};

const channelScale: Record<DashboardFilters['channel'], number> = {
  all: 1,
  website: 0.46,
  marketplace: 0.31,
  store: 0.17,
};

export const getFilteredDashboardData = (filters: DashboardFilters): DashboardData => {
  const scale = periodScale[filters.period] * channelScale[filters.channel];
  const query = filters.query.trim().toLocaleLowerCase('vi');
  const scaleMetric = (metric: DashboardMetric): DashboardMetric => ({
    ...metric,
    value: metric.id === 'conversion' ? metric.value : Math.round(metric.value * scale),
  });

  return {
    ...dashboardData,
    metrics: dashboardData.metrics.map(scaleMetric),
    revenue: dashboardData.revenue.map((point) => ({
      ...point,
      revenue: Math.round(point.revenue * scale),
      orders: Math.round(point.orders * scale),
    })),
    topProducts: dashboardData.topProducts.filter((product) =>
      !query || [product.name, product.category, product.id].some((value) =>
        value.toLocaleLowerCase('vi').includes(query),
      ),
    ),
  };
};

export const formatCurrency = (value: number, compact = false): string =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: 0,
  }).format(value).replace('₫', 'VNĐ');

export const formatMetric = (metric: DashboardMetric): string => {
  if (metric.format === 'currency') return formatCurrency(metric.value, true);
  if (metric.format === 'percent') return `${metric.value.toLocaleString('vi-VN')}%`;
  return metric.value.toLocaleString('vi-VN');
};
