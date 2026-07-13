import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  CaretDown,
  CaretLeft,
  CaretRight,
  ChatCircleDots,
  Eye,
  FunnelSimple,
  House,
  List,
  MagnifyingGlass,
  SignOut,
  Star,
  Users,
  X,
} from '@phosphor-icons/react';
import { useNotifications } from '../hooks/useNotifications';
import '../styles/admin-dashboard.css';
import { AdminSidebar } from './AdminSidebar';

/* ─── Types ─── */
interface CustomerReview {
  id: string;
  product: string;
  rating: number;
  text: string;
  date: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  totalOrders: number;
  joinDate: string;
  status: 'active' | 'vip' | 'warning' | 'inactive';
  reviews: CustomerReview[];
}

/* ─── Mock Data ─── */
const CUSTOMERS: Customer[] = [
  {
    id: 'KH-001', name: 'Đoàn Hữu Tuấn', email: 'tuan.doan@gmail.com', phone: '0912 847 193',
    totalSpent: 32_450_000, totalOrders: 7, joinDate: '2023-05-12', status: 'vip',
    reviews: [
      { id: 'r1', product: 'iPhone 15 Pro Max 256GB', rating: 5, text: 'Máy rất mượt, giao hàng siêu nhanh. Đóng gói cẩn thận 10 điểm!', date: '2024-11-20' },
      { id: 'r2', product: 'Tai nghe AirPods Pro 2', rating: 4, text: 'Âm thanh tốt nhưng hộp hơi xước nhẹ lúc mới nhận.', date: '2024-08-15' },
    ],
  },
  {
    id: 'KH-002', name: 'Lê Yến Nhi', email: 'yennhi.le@outlook.com', phone: '0387 641 028',
    totalSpent: 4_500_000, totalOrders: 2, joinDate: '2024-01-08', status: 'warning',
    reviews: [
      { id: 'r3', product: 'Sạc nhanh 20W Apple', rating: 2, text: 'Sạc khá nóng, cắm thỉnh thoảng bị lỏng. Yêu cầu shop hỗ trợ đổi trả.', date: '2024-12-05' },
    ],
  },
  {
    id: 'KH-003', name: 'Trần Minh Khang', email: 'khang.tm@yahoo.com', phone: '0906 312 847',
    totalSpent: 850_000, totalOrders: 1, joinDate: '2025-01-15', status: 'active',
    reviews: [
      { id: 'r4', product: 'Ốp lưng iPhone 15 Pro', rating: 5, text: 'Ốp cầm rất sướng tay, màu đẹp giống hình.', date: '2025-01-20' },
    ],
  },
  {
    id: 'KH-004', name: 'Nguyễn Bích Ngọc', email: 'bichngoc.nguyen@gmail.com', phone: '0935 182 746',
    totalSpent: 58_900_000, totalOrders: 14, joinDate: '2022-11-05', status: 'vip',
    reviews: [
      { id: 'r5', product: 'MacBook Air M2 8GB 256GB', rating: 5, text: 'Máy mỏng nhẹ, pin cực trâu. Làm việc nguyên ngày không cần sạc.', date: '2025-02-10' },
      { id: 'r6', product: 'Magic Mouse 2', rating: 4, text: 'Dùng quen thì rất thích, thiết kế đẹp. Chỉ sạc hơi bất tiện.', date: '2024-06-12' },
    ],
  },
  {
    id: 'KH-005', name: 'Phạm Quốc Bảo', email: 'quocbao.p@gmail.com', phone: '0978 543 210',
    totalSpent: 15_200_000, totalOrders: 4, joinDate: '2024-03-22', status: 'active',
    reviews: [
      { id: 'r7', product: 'Samsung Galaxy S24 Ultra', rating: 5, text: 'Màn hình quá đẹp, camera zoom 100x chụp tầm xa rõ nét. Rất hài lòng!', date: '2025-04-18' },
    ],
  },
  {
    id: 'KH-006', name: 'Hoàng Khánh Linh', email: 'khanhlinh.h@proton.me', phone: '0362 918 475',
    totalSpent: 1_290_000, totalOrders: 1, joinDate: '2025-05-10', status: 'inactive',
    reviews: [],
  },
  {
    id: 'KH-007', name: 'Vũ Thanh Hà', email: 'thanha.vu@gmail.com', phone: '0854 273 691',
    totalSpent: 22_100_000, totalOrders: 6, joinDate: '2023-09-14', status: 'vip',
    reviews: [
      { id: 'r8', product: 'iPad Pro M4 11 inch', rating: 5, text: 'Mỏng kinh ngạc, vẽ bằng Apple Pencil Pro mượt không tưởng.', date: '2025-06-02' },
      { id: 'r9', product: 'Apple Pencil Pro', rating: 3, text: 'Đôi lúc mất kết nối Bluetooth, phải tháo gắn lại. Mong Apple sửa.', date: '2025-06-08' },
    ],
  },
  {
    id: 'KH-008', name: 'Mai Thảo Vy', email: 'thaovy.mai@gmail.com', phone: '0916 738 204',
    totalSpent: 6_750_000, totalOrders: 3, joinDate: '2024-07-01', status: 'active',
    reviews: [
      { id: 'r10', product: 'Loa JBL Charge 5', rating: 1, text: 'Mới dùng 2 tuần đã hư loa bass. Đã gửi bảo hành nhưng chờ rất lâu.', date: '2025-03-15' },
    ],
  },
];

const statusMap: Record<string, { label: string; color: string }> = {
  vip: { label: 'VIP', color: 'green' },
  active: { label: 'Hoạt động', color: 'blue' },
  warning: { label: 'Cần chú ý', color: 'orange' },
  inactive: { label: 'Không hoạt động', color: 'gray' },
};

const statusOptions = [
  { value: 'all', label: 'Tất cả' },
  { value: 'vip', label: 'VIP' },
  { value: 'active', label: 'Hoạt động' },
  { value: 'warning', label: 'Cần chú ý' },
  { value: 'inactive', label: 'Không hoạt động' },
];

type SortMode = 'newest' | 'most-spent' | 'most-reviews';

/* ─── Helpers ─── */
const formatCurrency = (v: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
    .format(v).replace('₫', 'VNĐ');

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const PAGE_SIZE = 6;

/* ─── Stars renderer ─── */
const Stars = ({ rating }: { rating: number }) => (
  <span className="admin-review-stars">
    {Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={12} weight={i < rating ? 'fill' : 'regular'} />
    ))}
  </span>
);

/* ─── Component ─── */
export default function AdminCustomers() {
  const { user, logout } = useApp();
  const appUser = user as { name?: string; email?: string; role?: string; isAdmin?: boolean } | null;
  const userName = appUser?.name || 'Tài khoản';
  const userRole = appUser?.isAdmin ? 'Quản trị viên' : (appUser?.role === '2' ? 'Quản trị viên' : 'Nhân viên');
  const userInitials = getInitials(userName);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [page, setPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { notifications, unreadCount, markAllAsRead } = useNotifications();

  /* ─── Summary cards ─── */
  const summary = useMemo(() => {
    const total = CUSTOMERS.length;
    const vipCount = CUSTOMERS.filter(c => c.status === 'vip').length;
    const totalReviews = CUSTOMERS.reduce((sum, c) => sum + c.reviews.length, 0);
    return [
      { label: 'Tổng khách hàng', value: total.toLocaleString('vi-VN'), icon: Users, tone: 'blue' },
      { label: 'Khách VIP', value: vipCount.toLocaleString('vi-VN'), icon: Star, tone: 'green' },
      { label: 'Tổng đánh giá', value: totalReviews.toLocaleString('vi-VN'), icon: ChatCircleDots, tone: 'amber' },
    ];
  }, []);

  /* ─── Filter + Sort ─── */
  const filteredCustomers = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('vi');
    const result = CUSTOMERS.filter(c =>
      (!q || c.name.toLocaleLowerCase('vi').includes(q) || c.email.toLocaleLowerCase('vi').includes(q) || c.id.toLocaleLowerCase('vi').includes(q)) &&
      (statusFilter === 'all' || c.status === statusFilter)
    );
    return [...result].sort((a, b) => {
      if (sortMode === 'most-spent') return b.totalSpent - a.totalSpent;
      if (sortMode === 'most-reviews') return b.reviews.length - a.reviews.length;
      return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
    });
  }, [query, statusFilter, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const visibleCustomers = filteredCustomers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const showingFrom = filteredCustomers.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const showingTo = Math.min(page * PAGE_SIZE, filteredCustomers.length);

  useEffect(() => { setPage(1); }, [query, statusFilter, sortMode]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const selectedCustomer = selectedId ? CUSTOMERS.find(c => c.id === selectedId) : null;

  return (
    <div className="admin-shell">
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <button className="admin-menu-button" aria-label="Mở menu" onClick={() => setSidebarOpen(true)}><List size={22} /></button>
          <label className="admin-search"><MagnifyingGlass size={18} /><span className="sr-only">Tìm kiếm khách hàng</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm theo tên, email, mã khách..." /></label>
          <div className="admin-header__actions">
            <button className="admin-notification-button" aria-label="Thông báo" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(v => !v)}><Bell size={20} />{unreadCount > 0 && <span />}</button>
            <div className="admin-header-profile-wrapper">
              <button className={`admin-header-profile ${profileOpen ? 'is-active' : ''}`} onClick={() => setProfileOpen(prev => !prev)} aria-expanded={profileOpen}>
                <span>{userInitials}</span><div><strong>{userName}</strong><small>{userRole}</small></div><CaretDown size={14} />
              </button>
              {profileOpen && (
                <div className="admin-profile-dropdown">
                  <div className="admin-profile-dropdown__header"><strong>{userName}</strong><small>{appUser?.email || 'Quản trị viên'}</small></div>
                  <div className="admin-profile-dropdown__menu"><button onClick={() => window.location.href = '/'}><House size={16} />Trang chủ cửa hàng</button><hr /><button className="is-danger" onClick={logout}><SignOut size={16} />Đăng xuất an toàn</button></div>
                </div>
              )}
            </div>
            {notificationsOpen && <div className="admin-notification-popover"><div className="admin-notification-popover__top"><strong>Thông báo mới</strong>{unreadCount > 0 && <button onClick={markAllAsRead}>Đánh dấu đã đọc</button>}</div>{notifications.length ? notifications.slice(0, 4).map(item => <p key={item.id} className={item.unread ? 'is-unread' : ''}>{item.title}<small>{item.time}</small></p>) : <p>Chưa có thông báo mới<small>Hệ thống sẽ cập nhật khi phát sinh hoạt động.</small></p>}</div>}
          </div>
        </header>

        <div className="admin-content admin-orders-page">
          {/* Heading */}
          <section className="admin-page-heading admin-orders-heading">
            <div>
              <span className="admin-eyebrow">Quản lý người dùng</span>
              <h1>Khách hàng</h1>
              <p>Theo dõi hồ sơ khách hàng, đánh giá sản phẩm và bình luận trong hệ thống.</p>
            </div>
          </section>

          {/* Summary */}
          <section className="admin-order-summary" aria-label="Tổng quan khách hàng">
            {summary.map(({ label, value, icon: Icon, tone }, index) => (
              <article key={label} className={`admin-order-stat admin-order-stat--${tone}`} style={{ '--delay': `${index * 70}ms` } as CSSProperties}>
                <span><Icon size={19} weight="bold" /></span>
                <div><small>{label}</small><strong>{value}</strong></div>
              </article>
            ))}
          </section>

          {/* Filter bar */}
          <section className="admin-filterbar admin-orders-filterbar" aria-label="Bộ lọc khách hàng">
            <div>
              <span>Trạng thái</span>
              {statusOptions.map(opt => (
                <button key={opt.value} className={statusFilter === opt.value ? 'active' : ''} onClick={() => setStatusFilter(opt.value)}>{opt.label}</button>
              ))}
            </div>
            <label>
              <span><FunnelSimple size={14} />Sắp xếp</span>
              <select value={sortMode} onChange={e => setSortMode(e.target.value as SortMode)}>
                <option value="newest">Mới nhất</option>
                <option value="most-spent">Chi tiêu cao nhất</option>
                <option value="most-reviews">Nhiều đánh giá nhất</option>
              </select>
            </label>
          </section>

          {/* Table */}
          <section className="admin-orders-panel">
            <div className="admin-table-wrap admin-orders-table">
              <table>
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Liên hệ</th>
                    <th>Ngày tham gia</th>
                    <th>Tổng chi tiêu</th>
                    <th>Đánh giá</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCustomers.map((customer, index) => {
                    const config = statusMap[customer.status] || { label: customer.status, color: 'gray' };
                    return (
                      <tr key={customer.id} style={{ '--delay': `${index * 45}ms` } as CSSProperties}>
                        <td>
                          <span className="admin-customer-avatar">{getInitials(customer.name)}</span>
                          <div><strong>{customer.name}</strong><small>{customer.id}</small></div>
                        </td>
                        <td><div style={{ display: 'grid', gap: 3 }}><strong style={{ fontSize: 10 }}>{customer.email}</strong><small>{customer.phone}</small></div></td>
                        <td><small>{customer.joinDate}</small></td>
                        <td><strong>{formatCurrency(customer.totalSpent)}</strong></td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <ChatCircleDots size={14} color="#70798b" />
                            <strong style={{ fontSize: 11 }}>{customer.reviews.length}</strong>
                          </span>
                        </td>
                        <td><span className={`admin-badge admin-badge--${config.color}`}>{config.label}</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="admin-table-action" aria-label="Xem chi tiết" onClick={() => setSelectedId(customer.id)}><Eye size={18} /></button>
                        </td>
                      </tr>
                    );
                  })}
                  {visibleCustomers.length === 0 && (
                    <tr>
                      <td colSpan={7}>
                        <div className="admin-orders-empty">
                          <Users size={42} weight="thin" />
                          <strong>Không tìm thấy khách hàng</strong>
                          <p>Hãy thử đổi trạng thái, từ khóa hoặc cách sắp xếp để xem thêm kết quả.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="admin-pagination">
              <span>Hiển thị {showingFrom} - {showingTo} trên tổng {filteredCustomers.length}</span>
              <div>
                <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} aria-label="Trang trước"><CaretLeft size={16} /></button>
                <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} aria-label="Trang sau"><CaretRight size={16} /></button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ─── Customer Detail Drawer ─── */}
      <div className={`admin-drawer-overlay ${selectedId ? 'is-visible' : ''}`} onClick={() => setSelectedId(null)}>
        <aside className={`admin-drawer ${selectedId ? 'is-open' : ''}`} onClick={e => e.stopPropagation()}>
          <header className="admin-drawer__header">
            <h2>Hồ sơ khách hàng</h2>
            <div>
              <button className="admin-drawer__close" onClick={() => setSelectedId(null)}><X size={20} /></button>
            </div>
          </header>

          {selectedCustomer && (
            <div className="admin-drawer__body">
              {/* Profile header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <span className="admin-customer-avatar" style={{ width: 56, height: 56, fontSize: 16, borderRadius: 16 }}>{getInitials(selectedCustomer.name)}</span>
                <div style={{ display: 'grid', gap: 4 }}>
                  <strong style={{ fontSize: 18, letterSpacing: '-0.03em' }}>{selectedCustomer.name}</strong>
                  <small style={{ color: '#70798b', fontSize: 11 }}>{selectedCustomer.email}</small>
                </div>
              </div>

              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, overflow: 'hidden', marginBottom: 24, border: '1px solid var(--admin-line)', borderRadius: 13, background: 'var(--admin-line)' }}>
                <span style={{ display: 'grid', gap: 7, padding: 15, background: '#fff' }}>
                  <small style={{ color: '#70798b', fontSize: 9 }}>Tổng chi tiêu</small>
                  <strong style={{ fontSize: 17, fontFamily: 'ui-monospace, monospace' }}>{formatCurrency(selectedCustomer.totalSpent)}</strong>
                </span>
                <span style={{ display: 'grid', gap: 7, padding: 15, background: '#fff' }}>
                  <small style={{ color: '#70798b', fontSize: 9 }}>Số đơn hàng</small>
                  <strong style={{ fontSize: 17, fontFamily: 'ui-monospace, monospace' }}>{selectedCustomer.totalOrders}</strong>
                </span>
                <span style={{ display: 'grid', gap: 7, padding: 15, background: '#fff' }}>
                  <small style={{ color: '#70798b', fontSize: 9 }}>Ngày tham gia</small>
                  <strong style={{ fontSize: 13 }}>{selectedCustomer.joinDate}</strong>
                </span>
                <span style={{ display: 'grid', gap: 7, padding: 15, background: '#fff' }}>
                  <small style={{ color: '#70798b', fontSize: 9 }}>Điện thoại</small>
                  <strong style={{ fontSize: 13 }}>{selectedCustomer.phone}</strong>
                </span>
              </div>

              {/* Reviews */}
              <h3 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 800 }}>
                Đánh giá & Bình luận
                <span style={{ marginLeft: 8, padding: '3px 8px', borderRadius: 8, background: '#eaf2ff', color: '#1463df', fontSize: 10, fontWeight: 900 }}>{selectedCustomer.reviews.length}</span>
              </h3>

              {selectedCustomer.reviews.length > 0 ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  {selectedCustomer.reviews.map(review => (
                    <article key={review.id} style={{ padding: 16, border: '1px solid var(--admin-line)', borderRadius: 14, background: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <strong style={{ fontSize: 11, color: '#172033' }}>{review.product}</strong>
                        <small style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, color: '#94a3b8' }}>{review.date}</small>
                      </div>
                      <div style={{ display: 'flex', gap: 2, marginBottom: 10, color: review.rating >= 3 ? '#eab308' : '#ef4444' }}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} size={13} weight={i < review.rating ? 'fill' : 'regular'} />
                        ))}
                      </div>
                      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.65, color: '#475569' }}>{review.text}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="admin-no-variants">Khách hàng này chưa có đánh giá nào.</div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
