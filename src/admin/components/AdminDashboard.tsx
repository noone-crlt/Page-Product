import { useEffect, useMemo, useState } from 'react';
import { DatePicker } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useApp } from '../../context/AppContext';
import { useNotifications } from '../hooks/useNotifications';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CalendarBlank,
  CaretDown,
  ChartLineUp,
  CheckCircle,
  Cube,
  House,
  List,
  MagnifyingGlass,
  Megaphone,
  Package,
  Receipt,
  ShoppingCart,
  SignOut,
  Storefront,
  TrendUp,
  Users,
  Warning,
  X,
  Wallet,
  Target,
} from '@phosphor-icons/react';
import { formatCurrency, formatMetric, getFilteredDashboardData } from '../data/dashboardData';
import { getDashboardStats, getTopSelling, getRevenueLast7Days, getRevenueByCategory, exportTopSelling } from '../../services/dashboardApi';
import { apiClient } from '../../services/apiClient';
import type {
  ActivityKind,
  DashboardFilters,
  DashboardMetric,
  DashboardStatus,
  NotificationKind,
} from '../types/dashboard';
import '../styles/admin-dashboard.css';
import { AdminSidebar } from './AdminSidebar';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);



const activityIcons: Record<ActivityKind, typeof ShoppingCart> = {
  order: ShoppingCart,
  customer: Users,
  stock: Cube,
  payment: CheckCircle,
};

const notificationIcons: Record<NotificationKind, typeof CheckCircle> = {
  success: CheckCircle,
  warning: Warning,
  info: Bell,
};

const metricIcons: Record<string, React.ElementType> = {
  revenue: Wallet,
  orders: ShoppingCart,
  customers: Users,
  conversion: Target,
};

const MetricCard = ({ metric, index }: { metric: DashboardMetric; index: number }) => {
  const positive = metric.change >= 0;
  const ChangeIcon = positive ? ArrowUpRight : ArrowDownRight;
  const MetricIcon = metricIcons[metric.id] || TrendUp;
  return (
    <article className={`admin-metric admin-metric--${metric.tone}`} style={{ '--delay': `${index * 70}ms` } as React.CSSProperties}>
      <div className="admin-metric__top">
        <span>{metric.label}</span>
        <span className="admin-metric__icon"><MetricIcon size={20} weight={metric.id === 'conversion' ? 'bold' : 'fill'} /></span>
      </div>
      <strong>{formatMetric(metric)}</strong>
      <div className={`admin-change ${positive ? 'is-positive' : 'is-negative'}`}>
        <ChangeIcon size={14} weight="bold" />
        <b>{Math.abs(metric.change)}%</b>
        <span>{metric.comparison}</span>
      </div>
    </article>
  );
};

const DashboardSkeleton = () => (
  <div className="admin-skeleton" aria-label="Đang tải dữ liệu">
    <div className="admin-skeleton__metrics">{Array.from({ length: 4 }, (_, index) => <span key={index} />)}</div>
    <div className="admin-skeleton__grid"><span /><span /><span /></div>
    <span className="admin-skeleton__table" />
  </div>
);

export default function AdminDashboard() {
  const { user, logout } = useApp();
  const appUser = user as { name?: string; email?: string; role?: string; isAdmin?: boolean } | null;
  const userName = appUser?.name || 'Tài khoản';
  const userRole = appUser?.isAdmin ? 'Quản trị viên' : (appUser?.role === '2' ? 'Quản trị viên' : 'Nhân viên');
  const userInitials = userName 
    ? (userName.split(' ').length >= 2 
        ? (userName.split(' ')[0][0] + userName.split(' ')[userName.split(' ').length - 1][0]).toUpperCase() 
        : userName.substring(0, 2).toUpperCase())
    : 'AD';

  const [filters, setFilters] = useState<DashboardFilters>({ period: '30d', channel: 'all', query: '' });
  const [status, setStatus] = useState<DashboardStatus>('success');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showAllNotifs, setShowAllNotifs] = useState(false);
  const { notifications, unreadCount, markAllAsRead } = useNotifications();

  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([dayjs().subtract(7, 'day'), dayjs()]);
  const [data, setData] = useState(() => getFilteredDashboardData(filters));
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const handleExportTopSelling = async () => {
    try {
      setExporting(true);
      const fromDateStr = dateRange[0] ? dateRange[0].toISOString() : undefined;
      const toDateStr = dateRange[1] ? dateRange[1].toISOString() : undefined;
      const blob = await exportTopSelling(fromDateStr, toDateStr);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `top-selling-report-${dayjs().format('YYYYMMDDHHmmss')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Có lỗi xảy ra khi xuất báo cáo!');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchApiData = async () => {
      setLoading(true);
      try {
        const fromDateStr = dateRange[0] ? dateRange[0].toISOString() : undefined;
        const toDateStr = dateRange[1] ? dateRange[1].toISOString() : undefined;

        const [statsRes, topSellingRes, revenueRes, categoryRes, productsRes] = await Promise.all([
          getDashboardStats(fromDateStr, toDateStr).catch(() => null),
          getTopSelling(fromDateStr, toDateStr).catch(() => null),
          getRevenueLast7Days(fromDateStr, toDateStr).catch(() => null),
          getRevenueByCategory(fromDateStr, toDateStr).catch(() => null),
          apiClient('/api/products').catch(() => null),
        ]);

        if (!isMounted) return;

        const mockData = getFilteredDashboardData(filters);
        const newMetrics = [...mockData.metrics];

        if (statsRes?.data) {
          const revenueMetric = newMetrics.find((m) => m.id === 'revenue');
          if (revenueMetric) revenueMetric.value = statsRes.data.total_revenue;

          const ordersMetric = newMetrics.find((m) => m.id === 'orders');
          if (ordersMetric) ordersMetric.value = statsRes.data.total_successful_orders;

          const customersMetric = newMetrics.find((m) => m.id === 'customers');
          if (customersMetric) customersMetric.value = statsRes.data.total_new_customers;
        }

        let newRevenue = mockData.revenue;
        if (revenueRes?.data?.length) {
          newRevenue = revenueRes.data.map((r: any) => {
            const parts = r.date.split('-');
            const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : r.date;
            return { label, revenue: r.revenue, orders: 0 };
          });
        }

        let newTopProducts = mockData.topProducts;
        if (topSellingRes?.data?.length) {
          const imageMap: Record<number, string> = {};
          if (productsRes?.data) {
            productsRes.data.forEach((p: any) => {
              if (p.thumbnail_url) imageMap[p.product_id] = p.thumbnail_url;
              else if (p.image_url) imageMap[p.product_id] = p.image_url;
              else if (p.images && p.images[0]) {
                imageMap[p.product_id] = p.images[0].image_url || p.images[0];
              }
            });
          }

          newTopProducts = topSellingRes.data.map((p: any) => {
            const totalStock =
              p.variants?.reduce((sum: number, v: any) => sum + v.stock_quantity, 0) || 0;
            return {
              id: `SP-${p.product_id}`,
              name: p.product_name,
              category: p.category_name,
              sold: p.total_sold,
              revenue: p.total_revenue,
              growth: 0,
              stock: totalStock,
              image: imageMap[p.product_id]
            };
          });
        }

        let newChannels = mockData.channels;
        if (categoryRes?.data?.length) {
          const totalRev = categoryRes.data.reduce((sum: number, item: any) => sum + Number(item.total_revenue || item.revenue || 0), 0);
          const colors = ['#1463df', '#21a875', '#e4a72d', '#8b5cf6', '#ec4899', '#f43f5e', '#c9d1dc'];
          newChannels = categoryRes.data.map((item: any, index: number) => ({
            id: `cat-${index}`,
            label: item.category_name,
            value: totalRev > 0 ? Math.round((Number(item.total_revenue || item.revenue || 0) / totalRev) * 100) : 0,
            color: colors[index % colors.length],
          }));
        }

        setData({
          ...mockData,
          metrics: newMetrics,
          revenue: newRevenue,
          topProducts: newTopProducts,
          channels: newChannels,
        });
        setStatus('success');
      } catch (err) {
        if (!isMounted) return;
        setStatus('error');
        setData(getFilteredDashboardData(filters));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchApiData();
    return () => {
      isMounted = false;
    };
  }, [dateRange]);
  const revenueChartData = useMemo<ChartData<'line'>>(() => ({
    labels: data.revenue.map((point) => point.label),
    datasets: [{
      label: 'Doanh thu',
      data: data.revenue.map((point) => point.revenue),
      borderColor: '#1463df',
      backgroundColor: 'rgba(20, 99, 223, 0.12)',
      pointBackgroundColor: '#ffffff',
      pointBorderColor: '#1463df',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2.5,
      tension: 0.38,
      fill: true,
    }],
  }), [data.revenue]);
  const revenueChartOptions = useMemo<ChartOptions<'line'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    animation: { duration: 550 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#172033',
        titleFont: { family: 'Manrope', size: 11, weight: 700 },
        bodyFont: { family: 'Manrope', size: 11 },
        padding: 11,
        cornerRadius: 9,
        displayColors: false,
        callbacks: { label: (context) => `Doanh thu: ${formatCurrency(context.parsed.y ?? 0)}` },
      },
    },
    scales: {
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: { color: '#8d96a6', font: { family: 'Manrope', size: 9 } },
      },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: '#e9edf3' },
        ticks: {
          color: '#8d96a6',
          font: { family: 'Manrope', size: 9 },
          callback: (value) => formatCurrency(Number(value), true),
        },
      },
    },
  }), []);

  const updateFilter = (key: keyof DashboardFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key === 'period') {
      const end = dayjs();
      let start = end;
      if (value === '7d') start = end.subtract(7, 'day');
      else if (value === '30d') start = end.subtract(30, 'day');
      else if (value === '90d') start = end.subtract(90, 'day');
      setDateRange([start, end]);
    }
    setStatus('loading');
    window.setTimeout(() => setStatus('success'), 380);
  };

  return (
    <div className="admin-shell">
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="admin-main">
        <header className="admin-header">
          <button className="admin-menu-button" aria-label="Mở menu" onClick={() => setSidebarOpen(true)}><List size={22} /></button>
          <label className="admin-search"><MagnifyingGlass size={18} /><span className="sr-only">Tìm kiếm sản phẩm</span><input value={filters.query} onChange={(event) => updateFilter('query', event.target.value)} placeholder="Tìm sản phẩm, mã sản phẩm..." /></label>
          <div className="admin-header__actions">
            <button className="admin-notification-button" aria-label="Thông báo" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((value) => !value)}><Bell size={20} />{unreadCount > 0 && <span />}</button>
            <div className="admin-header-profile-wrapper">
              <button 
                className={`admin-header-profile ${profileOpen ? 'is-active' : ''}`}
                onClick={() => setProfileOpen((prev) => !prev)}
                aria-expanded={profileOpen}
              >
                <span>{userInitials}</span>
                <div><strong>{userName}</strong><small>{userRole}</small></div>
                <CaretDown size={14} />
              </button>
              {profileOpen && (
                <div className="admin-profile-dropdown">
                  <div className="admin-profile-dropdown__header">
                    <strong>{userName}</strong>
                    <small>{appUser?.email || 'Quản trị viên'}</small>
                  </div>
                  <div className="admin-profile-dropdown__menu">
                    <button><House size={16} />Trang chủ cửa hàng</button>
                    <hr />
                    <button className="is-danger" onClick={logout}><SignOut size={16} />Đăng xuất an toàn</button>
                  </div>
                </div>
              )}
            </div>
            {notificationsOpen && <div className="admin-notification-popover"><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><strong>Thông báo mới</strong>{unreadCount > 0 && <button onClick={markAllAsRead} style={{ fontSize: 11, color: '#1463df', border: 0, background: 'none', cursor: 'pointer' }}>Đánh dấu đã đọc</button>}</div>{notifications.map((item) => <p key={item.id} className={item.unread ? 'is-unread' : ''} style={{ cursor: item.targetType === 'Order' ? 'pointer' : 'default' }} onClick={() => { if(item.targetType === 'Order' && item.targetId) window.location.href = `/admin/orders?id=${item.targetId}` }}>{item.title}<small>{item.time}</small></p>)}</div>}
          </div>
        </header>

        <div className="admin-content">
          <section className="admin-page-heading">
            <div><span className="admin-eyebrow">Trung tâm vận hành</span><h1>Tổng quan kinh doanh</h1><p>Theo dõi hiệu suất cửa hàng và những việc cần chú ý hôm nay.</p></div>
            <div className="admin-date" style={{ padding: '0 8px', border: '1px solid var(--admin-line)' }}>
              <DatePicker.RangePicker 
                value={[dateRange[0], dateRange[1]]} 
                onChange={(dates: any) => setDateRange(dates || [null, null])} 
                format="DD/MM/YYYY"
                variant="borderless"
                style={{ width: '100%', cursor: 'pointer', fontWeight: 600, color: 'var(--admin-ink)' }}
                suffixIcon={<CalendarBlank size={19} color="var(--admin-blue)" />}
                placeholder={['Từ ngày', 'Đến ngày']}
                allowClear={false}
              />
            </div>
          </section>

          <section className="admin-filterbar" aria-label="Bộ lọc dashboard">
            <div><span>Khoảng thời gian</span>{(['7d', '30d', '90d'] as const).map((period) => <button key={period} className={filters.period === period ? 'active' : ''} onClick={() => updateFilter('period', period)}>{period === '7d' ? '7 ngày' : period === '30d' ? '30 ngày' : '90 ngày'}</button>)}</div>
            <label><span>Kênh bán hàng</span><select value={filters.channel} onChange={(event) => updateFilter('channel', event.target.value as DashboardFilters['channel'])}><option value="all">Tất cả kênh</option><option value="website">Website</option><option value="marketplace">Sàn thương mại</option><option value="store">Cửa hàng</option></select></label>
          </section>

          {status === 'loading' ? <DashboardSkeleton /> : status === 'error' ? <section className="admin-state"><Warning size={36} /><h2>Không thể tải dữ liệu</h2><p>Đã xảy ra lỗi khi tổng hợp báo cáo.</p><button onClick={() => setStatus('success')}>Thử lại</button></section> : (
            <>
              <section className="admin-metrics" aria-label="Chỉ số kinh doanh">{data.metrics.map((metric, index) => <MetricCard key={metric.id} metric={metric} index={index} />)}</section>
              <section className="admin-overview-grid">
                <article className="admin-panel admin-panel--revenue"><div className="admin-panel__heading"><div><span>Doanh thu</span><h2>Xu hướng theo ngày</h2></div><span className="admin-live"><i />Dữ liệu trực tiếp</span></div><div className="admin-chart" role="img" aria-label="Biểu đồ đường thể hiện doanh thu theo ngày"><Line data={revenueChartData} options={revenueChartOptions} /></div></article>
                <article className="admin-panel admin-panel--channel"><div className="admin-panel__heading"><div><span>Phân bổ</span><h2>Theo danh mục</h2></div></div><div className="admin-donut" style={{ background: `conic-gradient(${data.channels.map((channel, index) => `${channel.color} ${data.channels.slice(0, index).reduce((sum, item) => sum + item.value, 0)}% ${data.channels.slice(0, index + 1).reduce((sum, item) => sum + item.value, 0)}%`).join(',')})` }}><div><strong>100%</strong><span>doanh thu</span></div></div><div className="admin-legend">{data.channels.map((channel) => <div key={channel.id}><i style={{ background: channel.color }} /><span>{channel.label}</span><strong>{channel.value}%</strong></div>)}</div></article>
                <article className="admin-panel admin-panel--activity"><div className="admin-panel__heading"><div><span>Cập nhật</span><h2>Hoạt động gần đây</h2></div><button>Xem tất cả</button></div><div className="admin-activity-list">{notifications.slice(0, 5).map((n, index) => { let kind: ActivityKind = 'payment'; if (n.originalType === 'order') kind = 'order'; else if (n.originalType === 'customer' || n.originalType === 'user') kind = 'customer'; else if (n.originalType === 'stock') kind = 'stock'; const Icon = activityIcons[kind]; return <div key={n.id} style={{ '--delay': `${index * 70}ms` } as React.CSSProperties}><span className={`activity-icon activity-icon--${kind}`}><Icon size={17} /></span><p><strong>{n.title}</strong><span>{n.detail}</span><small>{n.time}</small></p></div>; })}</div></article>
                <article className="admin-panel admin-panel--notice">
                  <div className="admin-panel__heading">
                    <div><span>Ưu tiên</span><h2>Thông báo</h2></div>
                    <b>{unreadCount}</b>
                  </div>
                  <div className="admin-notice-list">
                    {(showAllNotifs ? notifications : notifications.slice(0, 4)).map((item) => { 
                      const Icon = notificationIcons[item.kind]; 
                      return (
                        <div key={item.id} className={item.unread ? 'is-unread' : ''} style={{ cursor: item.targetType === 'Order' ? 'pointer' : 'default' }} onClick={() => { if(item.targetType === 'Order' && item.targetId) window.location.href = `/admin/orders?id=${item.targetId}` }}>
                          <span className={`notice-icon notice-icon--${item.kind}`}><Icon size={17} /></span>
                          <p><strong>{item.title}</strong><span>{item.detail}</span><small>{item.time}</small></p>
                        </div>
                      ); 
                    })}
                  </div>
                  {notifications.length > 4 && (
                    <button 
                      onClick={() => setShowAllNotifs(!showAllNotifs)} 
                      style={{ marginTop: '16px', width: '100%', padding: '8px', border: '1px solid var(--admin-line)', background: 'transparent', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', color: 'var(--admin-muted)', fontWeight: 600, transition: '0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = 'var(--admin-ink)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--admin-muted)'; }}
                    >
                      {showAllNotifs ? 'Thu gọn' : `Xem thêm ${notifications.length - 4} thông báo`}
                    </button>
                  )}
                </article>
              </section>

              <section className="admin-panel admin-products-panel"><div className="admin-panel__heading"><div><span>Hiệu suất</span><h2>Sản phẩm bán chạy</h2></div><button onClick={handleExportTopSelling} disabled={exporting}>{exporting ? 'Đang xuất...' : 'Xuất báo cáo'}</button></div>{data.topProducts.length ? <div className="admin-table-wrap"><table><thead><tr><th>Sản phẩm</th><th>Danh mục</th><th>Đã bán</th><th>Doanh thu</th><th>Tăng trưởng</th><th>Tồn kho</th></tr></thead><tbody>{data.topProducts.map((product) => <tr key={product.id}><td>{product.image ? <img src={product.image} alt={product.name} className="admin-product-thumb" style={{ objectFit: 'cover' }} /> : <span className="admin-product-thumb">{product.name.charAt(0)}</span>}<div><strong>{product.name}</strong><small>{product.id}</small></div></td><td>{product.category}</td><td>{product.sold.toLocaleString('vi-VN')}</td><td>{formatCurrency(product.revenue)}</td><td><span className={product.growth >= 0 ? 'growth-positive' : 'growth-negative'}>{product.growth >= 0 ? '+' : ''}{product.growth}%</span></td><td><span className={product.stock < 10 ? 'stock-low' : ''}>{product.stock}</span></td></tr>)}</tbody></table></div> : <div className="admin-empty"><MagnifyingGlass size={34} /><h3>Không tìm thấy sản phẩm</h3><p>Hãy thử từ khóa khác hoặc xóa nội dung tìm kiếm.</p><button onClick={() => updateFilter('query', '')}>Xóa tìm kiếm</button></div>}</section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
