import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  CaretDown,
  CaretLeft,
  CaretRight,
  ChartLineUp,
  CheckCircle,
  Clock,
  Eye,
  FilePdf,
  FunnelSimple,
  House,
  List,
  MagnifyingGlass,
  Megaphone,
  Money,
  Package,
  Printer,
  Receipt,
  SignOut,
  Storefront,
  Truck,
  Users,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import { useNotifications } from '../hooks/useNotifications';
import { apiClient } from '../../services/apiClient';
import '../styles/admin-dashboard.css';

interface MockOrder {
  order_id: number;
  order_code: string;
  customer_name: string;
  total_amount: number;
  order_date: string;
  status: string;
  payment_method: string;
}

type SortMode = 'newest' | 'oldest' | 'highest';

const mockOrdersData: MockOrder[] = [
  { order_id: 1, order_code: 'ORD-20231015-01', customer_name: 'Nguyễn Văn An', total_amount: 19990000, order_date: '2026-07-09T10:30:00Z', status: 'Pending', payment_method: 'COD' },
  { order_id: 2, order_code: 'ORD-20231015-02', customer_name: 'Trần Thị Bảo Ngọc', total_amount: 32500000, order_date: '2026-07-09T09:15:00Z', status: 'Processing', payment_method: 'BankTransfer' },
  { order_id: 3, order_code: 'ORD-20231014-03', customer_name: 'Lê Minh Cường', total_amount: 450000, order_date: '2026-07-08T14:20:00Z', status: 'Shipped', payment_method: 'BankTransfer' },
  { order_id: 4, order_code: 'ORD-20231014-04', customer_name: 'Phạm Gia Duy', total_amount: 5490000, order_date: '2026-07-08T11:05:00Z', status: 'Delivered', payment_method: 'COD' },
  { order_id: 5, order_code: 'ORD-20231013-05', customer_name: 'Hoàng Khánh Linh', total_amount: 1290000, order_date: '2026-07-07T16:45:00Z', status: 'Cancelled', payment_method: 'BankTransfer' },
  { order_id: 6, order_code: 'ORD-20231013-06', customer_name: 'Ngô Hải Phong', total_amount: 21990000, order_date: '2026-07-07T08:10:00Z', status: 'Pending', payment_method: 'COD' },
  { order_id: 7, order_code: 'ORD-20231012-07', customer_name: 'Vũ Thanh Hà', total_amount: 8900000, order_date: '2026-07-06T19:30:00Z', status: 'Processing', payment_method: 'COD' },
  { order_id: 8, order_code: 'ORD-20231012-08', customer_name: 'Bùi Nhật Nam', total_amount: 4350000, order_date: '2026-07-06T13:20:00Z', status: 'Delivered', payment_method: 'BankTransfer' },
];

const PAGE_SIZE = 6;

const navigation = [
  { label: 'Tổng quan', icon: House, href: '/admin' },
  { label: 'Đơn hàng', icon: Receipt, href: '/admin/orders', active: true },
  { label: 'Sản phẩm', icon: Package, href: '/admin/products' },
  { label: 'Khách hàng', icon: Users, href: '/admin/customers' },
  { label: 'Marketing', icon: Megaphone, href: '/admin/marketing' },
];

const statusOptions = [
  { value: 'all', label: 'Tất cả' },
  { value: 'Pending', label: 'Chờ xác nhận' },
  { value: 'Processing', label: 'Đang xử lý' },
  { value: 'Shipped', label: 'Đang giao' },
  { value: 'Delivered', label: 'Hoàn thành' },
  { value: 'Cancelled', label: 'Đã hủy' },
];

const statusMap: Record<string, { label: string; color: string }> = {
  Pending: { label: 'Chờ xác nhận', color: 'orange' },
  Processing: { label: 'Đang xử lý', color: 'blue' },
  Shipped: { label: 'Đang giao', color: 'purple' },
  Delivered: { label: 'Hoàn thành', color: 'green' },
  Cancelled: { label: 'Đã hủy', color: 'red' },
  Success: { label: 'Hoàn thành', color: 'green' },
  Canceled: { label: 'Đã hủy', color: 'red' },
};

const formatCurrency = (value?: number | string) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
    .format(Number(value || 0))
    .replace('₫', 'VNĐ');

const formatDate = (isoString: string) => {
  const d = new Date(isoString.endsWith('Z') ? isoString : isoString + 'Z');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const DD = String(d.getDate()).padStart(2, '0');
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const YYYY = d.getFullYear();
  return `${hh}:${mm} ${DD}/${MM}/${YYYY}`;
};

const getInitials = (name?: string) => {
  if (!name) return 'KH';
  if (/^\d+$/.test(name)) return 'KH';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const StatusBadge = ({ status }: { status: string }) => {
  const config = statusMap[status] || { label: status, color: 'gray' };
  return <span className={`admin-badge admin-badge--${config.color}`}>{config.label}</span>;
};

const PaymentTag = ({ method }: { method: string }) => (
  method === 'COD'
    ? <span className="payment-tag payment-tag--cod"><Truck size={13} />Thanh toán khi nhận</span>
    : <span className="payment-tag payment-tag--bank"><Money size={13} />Chuyển khoản QR</span>
);

const OrdersSkeleton = () => (
  <div className="admin-order-skeleton" aria-label="Đang tải dữ liệu">
    {Array.from({ length: 6 }, (_, index) => <span key={index} />)}
  </div>
);

export default function AdminOrders() {
  const { user, logout } = useApp();
  const appUser = user as { name?: string; email?: string; role?: string; isAdmin?: boolean } | null;
  const userName = appUser?.name || 'Tài khoản';
  const userRole = appUser?.isAdmin ? 'Quản trị viên' : (appUser?.role === '2' ? 'Quản trị viên' : 'Nhân viên');
  const userInitials = getInitials(userName);

  const [orders, setOrders] = useState<MockOrder[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  
  // Invoice State
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [variantMap, setVariantMap] = useState<Record<number, string>>({});
  
  const { notifications, unreadCount, markAllAsRead } = useNotifications();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');
    if (orderId) {
      setSelectedOrderId(orderId);
      window.history.replaceState({}, '', '/admin/orders');
    }
  }, []);

  useEffect(() => {
    if (!selectedOrderId) return;
    setInvoiceLoading(true);
    
    const fetchInvoice = async () => {
      try {
        const res = await apiClient(`/api/orders/${selectedOrderId}`);
        if (res?.data) {
          setInvoiceData(res.data);
          const productsRes = await apiClient('/api/products');
          if (productsRes?.data) {
            const map: Record<number, string> = {};
            productsRes.data.forEach((p: any) => {
              p.variants?.forEach((v: any) => {
                map[v.product_variant_id] = p.name;
              });
            });
            setVariantMap(map);
          }
        }
      } catch (e) {
        console.error('Failed to load invoice', e);
      } finally {
        setInvoiceLoading(false);
      }
    };
    fetchInvoice();
  }, [selectedOrderId]);

  useEffect(() => {
    const fetchRealOrders = async () => {
      try {
        setLoading(true);
        // Step 1: Get all notifications to find order IDs
        const notifRes = await apiClient('/api/notifications');
        let orderNotifs = [];
        if (notifRes?.data && Array.isArray(notifRes.data)) {
          orderNotifs = notifRes.data.filter((n: any) => n.target_type === 'Order' && n.target_id);
        }

        if (orderNotifs.length === 0) {
          setOrders(mockOrdersData); // Fallback to mock if no real orders found
          setLoading(false);
          return;
        }

        // Step 2: Fetch details for each order ID
        const orderPromises = orderNotifs.map((n: any) => apiClient(`/api/orders/${n.target_id}`));
        const orderResponses = await Promise.allSettled(orderPromises);

        const realOrders: MockOrder[] = [];
        orderResponses.forEach((res, index) => {
          if (res.status === 'fulfilled' && res.value?.data) {
            const data = res.value.data;
            const notif = orderNotifs[index];
            realOrders.push({
              order_id: data.order_id,
              order_code: `ORD${String(data.order_id).padStart(4, '0')}`,
              customer_name: data.shipping_address ? data.shipping_phone : 'Khách mua lẻ',
              total_amount: data.final_amount,
              order_date: notif.created_at,
              status: data.order_status,
              payment_method: data.payment_method
            });
          }
        });

        // Combine real orders with mock data (mock data for visual padding if needed, but here we just use real + mock if few)
        if (realOrders.length > 0) {
          // Sort by latest first
          realOrders.sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());
          setOrders(realOrders);
        } else {
          setOrders(mockOrdersData);
        }
      } catch (error) {
        console.error('Failed to fetch real orders', error);
        setOrders(mockOrdersData);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRealOrders();
  }, []);

  const summary = useMemo(() => {
    const waiting = orders.filter((order) => order.status === 'Pending' || order.status === 'Processing').length;
    const delivering = orders.filter((order) => order.status === 'Shipped').length;
    const revenue = orders
      .filter((order) => order.status === 'Delivered' || order.status === 'Success')
      .reduce((sum, order) => sum + order.total_amount, 0);
    return [
      { label: 'Đơn cần xử lý', value: waiting.toLocaleString('vi-VN'), icon: Clock, tone: 'amber' },
      { label: 'Đang giao', value: delivering.toLocaleString('vi-VN'), icon: Truck, tone: 'blue' },
      { label: 'Doanh thu hoàn tất', value: formatCurrency(revenue), icon: CheckCircle, tone: 'green' },
    ];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const value = query.trim().toLocaleLowerCase('vi');
    const result = orders.filter((order) =>
      (!value ||
        order.customer_name.toLocaleLowerCase('vi').includes(value) ||
        order.order_code.toLocaleLowerCase('vi').includes(value)
      ) &&
      (statusFilter === 'all' || order.status === statusFilter)
    );

    return [...result].sort((a, b) => {
      if (sortMode === 'highest') return b.total_amount - a.total_amount;
      const direction = sortMode === 'newest' ? -1 : 1;
      const timeA = new Date(a.order_date.endsWith('Z') ? a.order_date : a.order_date + 'Z').getTime();
      const timeB = new Date(b.order_date.endsWith('Z') ? b.order_date : b.order_date + 'Z').getTime();
      return (timeA - timeB) * direction;
    });
  }, [orders, query, statusFilter, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const visibleOrders = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const showingFrom = filteredOrders.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const showingTo = Math.min(page * PAGE_SIZE, filteredOrders.length);

  useEffect(() => { setPage(1); }, [query, statusFilter, sortMode]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  return <div className="admin-shell">
    <button className={`admin-sidebar-backdrop ${sidebarOpen ? 'is-visible' : ''}`} aria-label="Đóng menu" onClick={() => setSidebarOpen(false)} />
    <aside className={`admin-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
      <div className="admin-brand"><span><ChartLineUp size={23} weight="bold" /></span><strong>My Store</strong><button aria-label="Đóng menu" onClick={() => setSidebarOpen(false)}><X size={18} /></button></div>
      <nav aria-label="Điều hướng quản trị"><small>Không gian làm việc</small>{navigation.map(({ label, icon: Icon, href, active }, index) => <button key={label} className={active ? 'active' : ''} onClick={() => href && (window.location.href = href)}><Icon size={19} weight={active ? 'fill' : 'regular'} /><span>{label}</span>{index === 1 && <b>12</b>}</button>)}</nav>
      <div className="admin-sidebar__bottom"><a href="/"><Storefront size={19} />Xem cửa hàng</a><div className="admin-profile-mini"><span>{userInitials}</span><div><strong>{userName}</strong><small>{userRole}</small></div><SignOut size={18} onClick={logout} style={{ cursor: 'pointer' }} /></div></div>
    </aside>

    <main className="admin-main">
      <header className="admin-header"><button className="admin-menu-button" aria-label="Mở menu" onClick={() => setSidebarOpen(true)}><List size={22} /></button>
        <label className="admin-search"><MagnifyingGlass size={18} /><span className="sr-only">Tìm kiếm đơn hàng</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo mã đơn hàng, tên khách..." /></label>
        <div className="admin-header__actions"><button className="admin-notification-button" aria-label="Thông báo" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((value) => !value)}><Bell size={20} />{unreadCount > 0 && <span />}</button>
          <div className="admin-header-profile-wrapper">
            <button className={`admin-header-profile ${profileOpen ? 'is-active' : ''}`} onClick={() => setProfileOpen((prev) => !prev)} aria-expanded={profileOpen}>
              <span>{userInitials}</span><div><strong>{userName}</strong><small>{userRole}</small></div><CaretDown size={14} />
            </button>
            {profileOpen && (
              <div className="admin-profile-dropdown">
                <div className="admin-profile-dropdown__header"><strong>{userName}</strong><small>{appUser?.email || 'Quản trị viên'}</small></div>
                <div className="admin-profile-dropdown__menu"><button><House size={16} />Trang chủ cửa hàng</button><hr /><button className="is-danger" onClick={logout}><SignOut size={16} />Đăng xuất an toàn</button></div>
              </div>
            )}
          </div>
          {notificationsOpen && <div className="admin-notification-popover"><div className="admin-notification-popover__top"><strong>Thông báo mới</strong>{unreadCount > 0 && <button onClick={markAllAsRead}>Đánh dấu đã đọc</button>}</div>{notifications.length ? notifications.slice(0, 4).map((item) => <p key={item.id} className={item.unread ? 'is-unread' : ''}>{item.title}<small>{item.time}</small></p>) : <p>Chưa có thông báo mới<small>Hệ thống sẽ cập nhật khi phát sinh hoạt động.</small></p>}</div>}
        </div>
      </header>

      <div className="admin-content admin-orders-page">
        <section className="admin-page-heading admin-orders-heading">
          <div>
            <span className="admin-eyebrow">Quản lý bán hàng</span>
            <h1>Đơn hàng</h1>
            <p>Kiểm tra, theo dõi và cập nhật trạng thái đơn hàng trong cùng một màn hình.</p>
          </div>
          <button className="admin-button-primary"><FilePdf size={18} />Xuất báo cáo</button>
        </section>

        <section className="admin-order-summary" aria-label="Tổng quan đơn hàng">
          {summary.map(({ label, value, icon: Icon, tone }, index) => (
            <article key={label} className={`admin-order-stat admin-order-stat--${tone}`} style={{ '--delay': `${index * 70}ms` } as CSSProperties}>
              <span><Icon size={19} weight="bold" /></span>
              <div><small>{label}</small><strong>{value}</strong></div>
            </article>
          ))}
        </section>

        <section className="admin-filterbar admin-orders-filterbar" aria-label="Bộ lọc đơn hàng">
          <div>
            <span>Trạng thái</span>
            {statusOptions.map((status) => (
              <button key={status.value} className={statusFilter === status.value ? 'active' : ''} onClick={() => setStatusFilter(status.value)}>
                {status.label}
              </button>
            ))}
          </div>
          <label>
            <span><FunnelSimple size={14} />Sắp xếp</span>
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="highest">Giá trị cao nhất</option>
            </select>
          </label>
        </section>

        <section className="admin-orders-panel">
          {loading ? <OrdersSkeleton /> : (
            <>
              <div className="admin-table-wrap admin-orders-table">
                <table>
                  <thead>
                    <tr>
                      <th>Mã đơn hàng</th>
                      <th>Khách hàng</th>
                      <th>Ngày đặt</th>
                      <th>Tổng tiền</th>
                      <th>Thanh toán</th>
                      <th>Trạng thái</th>
                      <th style={{ textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleOrders.map((order, index) => (
                      <tr key={order.order_id} style={{ '--delay': `${index * 45}ms` } as CSSProperties}>
                        <td><strong>{order.order_code}</strong><small>#{order.order_id.toString().padStart(4, '0')}</small></td>
                        <td><span className="admin-customer-avatar">{getInitials(order.customer_name)}</span><div><strong>{order.customer_name}</strong><small>Khách mua lẻ</small></div></td>
                        <td><small>{formatDate(order.order_date)}</small></td>
                        <td><strong>{formatCurrency(order.total_amount)}</strong></td>
                        <td><PaymentTag method={order.payment_method} /></td>
                        <td><StatusBadge status={order.status} /></td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="admin-table-action" aria-label="Xem chi tiết" onClick={() => setSelectedOrderId(String(order.order_id))}><Eye size={18} /></button>
                        </td>
                      </tr>
                    ))}
                    {visibleOrders.length === 0 && (
                      <tr>
                        <td colSpan={7}>
                          <div className="admin-orders-empty">
                            <Receipt size={42} weight="thin" />
                            <strong>Không tìm thấy đơn hàng</strong>
                            <p>Hãy thử đổi trạng thái, từ khóa hoặc cách sắp xếp để xem thêm kết quả.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="admin-pagination">
                <span>Hiển thị {showingFrom} - {showingTo} trên tổng {filteredOrders.length}</span>
                <div>
                  <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Trang trước"><CaretLeft size={16} /></button>
                  <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} aria-label="Trang sau"><CaretRight size={16} /></button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>

    {/* Invoice Drawer */}
    <div className={`admin-drawer-overlay ${selectedOrderId ? 'is-visible' : ''}`} onClick={() => setSelectedOrderId(null)}>
      <aside className={`admin-drawer ${selectedOrderId ? 'is-open' : ''}`} onClick={(e) => e.stopPropagation()}>
        <header className="admin-drawer__header">
          <h2>Chi tiết đơn hàng #{selectedOrderId}</h2>
          <div>
            <button className="admin-button-secondary" onClick={() => window.print()}><Printer size={16} /> In đơn hàng</button>
            <button className="admin-drawer__close" onClick={() => setSelectedOrderId(null)}><X size={20} /></button>
          </div>
        </header>

        <div className="admin-drawer__body">
          {invoiceLoading ? (
            <div className="admin-skeleton"><span className="admin-skeleton__table" /></div>
          ) : invoiceData ? (
            <div className="invoice-layout">
              <div className="invoice-section">
                <h3>Thông tin khách hàng</h3>
                <p><strong>Khách hàng:</strong> {orders.find(o => String(o.order_id) === selectedOrderId)?.customer_name || 'Khách hàng'}</p>
                <p><strong>Điện thoại:</strong> {invoiceData.shipping_phone}</p>
                <p><strong>Địa chỉ:</strong> {invoiceData.shipping_address}</p>
              </div>
              <div className="invoice-section">
                <h3>Thông tin đơn hàng</h3>
                <p><strong>Trạng thái thanh toán:</strong> {invoiceData.payment_status === 'Success' ? 'Thành công' : 'Chưa thanh toán'}</p>
                <p><strong>Phương thức thanh toán:</strong> {invoiceData.payment_method === 'COD' ? 'Thanh toán khi nhận (COD)' : 'Chuyển khoản QR'}</p>
                <p><strong>Trạng thái giao hàng:</strong> {invoiceData.order_status === 'Success' ? 'Đã xác nhận' : invoiceData.order_status}</p>
              </div>

              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th style={{ textAlign: 'center' }}>SL</th>
                    <th style={{ textAlign: 'right' }}>Đơn giá</th>
                    <th style={{ textAlign: 'right' }}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.details?.map((detail: any, index: number) => (
                    <tr key={index}>
                      <td>
                        <strong>{variantMap[detail.product_variant_id] || `Sản phẩm #${detail.product_variant_id}`}</strong>
                      </td>
                      <td style={{ textAlign: 'center' }}>{detail.quantity}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(detail.price_at_purchase)}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(detail.quantity * detail.price_at_purchase)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="invoice-summary">
                <div><span>Tạm tính</span><span>{formatCurrency(invoiceData.provisional_amount)}</span></div>
                <div><span>Phí vận chuyển</span><span>{formatCurrency(invoiceData.shipping_fee)}</span></div>
                <div className="invoice-summary__total"><span>Tổng cộng</span><span>{formatCurrency(invoiceData.final_amount)}</span></div>
              </div>
            </div>
          ) : (
            <div className="admin-empty"><Receipt size={34} /><h3>Không tải được chi tiết đơn hàng</h3><p>Đã xảy ra lỗi khi kết nối tới máy chủ.</p></div>
          )}
        </div>
      </aside>
    </div>
  </div>;
}
