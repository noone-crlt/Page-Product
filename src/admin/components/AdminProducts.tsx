import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, CaretDown, CaretLeft, CaretRight, ChartLineUp, Cube, Eye, House, List, MagnifyingGlass, Megaphone, Package, Receipt, SignOut, Star, Storefront, Users, Warning, X } from '@phosphor-icons/react';
import { getProductById, getProducts } from '../../services/productApi';
import { useNotifications } from '../hooks/useNotifications';
import '../styles/admin-dashboard.css';
import { AdminSidebar } from './AdminSidebar';

interface ApiProduct { product_id: number; name: string; thumbnail_url?: string; min_price?: number | string; max_price?: number | string; average_rating?: number | string; total_reviews?: number; is_featured?: boolean; status?: string }
interface ProductVariant { product_variant_id: number; color?: string; storage?: string; original_price?: number | string; sale_price?: number | string; stock_quantity?: number }
interface ProductDetail { product_id: number; name: string; variants?: ProductVariant[] }

const PAGE_SIZE = 6;
const formatCurrency = (value?: number | string) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value || 0)).replace('₫', 'VNĐ');

export default function AdminProducts() {
  const { user, logout } = useApp();
  const appUser = user as { name?: string; email?: string } | null;
  const userName = appUser?.name || '';
  const userRole = appUser?.email || 'Quản trị viên';
  const userInitials = userName 
    ? (userName.split(' ').length >= 2 
        ? (userName.split(' ')[0][0] + userName.split(' ')[userName.split(' ').length - 1][0]).toUpperCase() 
        : userName.substring(0, 2).toUpperCase())
    : 'AD';

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);

  const loadProducts = async () => {
    setLoading(true); setError('');
    try {
      const result = await getProducts({ page: 1, limit: 100 });
      setProducts(Array.isArray(result?.data) ? result.data : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách sản phẩm.');
    } finally { setLoading(false); }
  };
  useEffect(() => { loadProducts(); }, []);

  const filteredProducts = useMemo(() => {
    const value = query.trim().toLocaleLowerCase('vi');
    return products.filter((product) => (!value || product.name.toLocaleLowerCase('vi').includes(value) || String(product.product_id).includes(value)) && (statusFilter === 'all' || product.status === statusFilter));
  }, [products, query, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const visibleProducts = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [query, statusFilter]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const openDetail = async (product: ApiProduct) => {
    setSelectedProduct({ product_id: product.product_id, name: product.name }); setDetailLoading(true); setDetailError('');
    try { const result = await getProductById(product.product_id); setSelectedProduct(result?.data || null); }
    catch (loadError) { setDetailError(loadError instanceof Error ? loadError.message : 'Không thể tải chi tiết sản phẩm.'); }
    finally { setDetailLoading(false); }
  };

  return <div className="admin-shell">
    <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

    <main className="admin-main">
      <header className="admin-header"><button className="admin-menu-button" aria-label="Mở menu" onClick={() => setSidebarOpen(true)}><List size={22} /></button><label className="admin-search"><MagnifyingGlass size={18} /><span className="sr-only">Tìm kiếm sản phẩm</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm sản phẩm, mã sản phẩm..." /></label><div className="admin-header__actions"><button className="admin-notification-button" aria-label="Thông báo" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((value) => !value)}><Bell size={20} />{unreadCount > 0 && <span />}</button>
        <div className="admin-header-profile-wrapper">
          <button className={`admin-header-profile ${profileOpen ? 'is-active' : ''}`} onClick={() => setProfileOpen((prev) => !prev)} aria-expanded={profileOpen}>
            <span>{userInitials}</span><div><strong>{userName}</strong><small>{userRole}</small></div><CaretDown size={14} />
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
        {notificationsOpen && <div className="admin-notification-popover"><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><strong>Thông báo mới</strong>{unreadCount > 0 && <button onClick={markAllAsRead} style={{ fontSize: 11, color: '#1463df', border: 0, background: 'none', cursor: 'pointer' }}>Đánh dấu đã đọc</button>}</div>{notifications.map((item) => <p key={item.id} className={item.unread ? 'is-unread' : ''}>{item.title}<small>{item.time}</small></p>)}</div>}</div></header>
      <div className="admin-content admin-products-page">
        <section className="admin-page-heading"><div><span className="admin-eyebrow">Danh mục cửa hàng</span><h1>Quản lý sản phẩm</h1><p>Theo dõi thông tin, giá bán và trạng thái sản phẩm từ hệ thống.</p></div><div className="admin-products-count"><Cube size={19} /><span><small>Tổng sản phẩm</small><strong>{products.length.toLocaleString('vi-VN')}</strong></span></div></section>
        <section className="admin-product-toolbar" aria-label="Bộ lọc sản phẩm"><div><strong>Danh sách sản phẩm</strong><span>{filteredProducts.length} kết quả</span></div><label><span>Trạng thái</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Tất cả</option><option value="active">Đang bán</option><option value="inactive">Ngừng bán</option></select></label></section>
        <section className="admin-panel admin-product-list-panel">
          {loading ? <div className="admin-product-list-skeleton" aria-label="Đang tải sản phẩm">{Array.from({ length: PAGE_SIZE }, (_, index) => <span key={index} />)}</div>
            : error ? <div className="admin-state" role="alert"><Warning size={36} /><h2>Không thể tải sản phẩm</h2><p>{error}</p><button onClick={loadProducts}>Thử lại</button></div>
            : !visibleProducts.length ? <div className="admin-empty"><MagnifyingGlass size={34} /><h3>Không tìm thấy sản phẩm</h3><p>Hãy thử từ khóa khác hoặc thay đổi bộ lọc trạng thái.</p><button onClick={() => { setQuery(''); setStatusFilter('all'); }}>Xóa bộ lọc</button></div>
            : <div className="admin-table-wrap admin-products-table"><table><thead><tr><th>Sản phẩm</th><th>Khoảng giá</th><th>Đánh giá</th><th>Nổi bật</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{visibleProducts.map((product) => <tr key={product.product_id}><td><span className="admin-product-image">{product.thumbnail_url ? <img src={product.thumbnail_url} alt="" /> : <Package size={20} />}</span><div><strong>{product.name}</strong><small>SP-{String(product.product_id).padStart(4, '0')}</small></div></td><td><strong>{formatCurrency(product.min_price)}</strong>{Number(product.max_price) > Number(product.min_price) && <small> đến {formatCurrency(product.max_price)}</small>}</td><td><span className="admin-rating"><Star size={13} weight="fill" />{Number(product.average_rating || 0).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}</span><small>{product.total_reviews || 0} đánh giá</small></td><td>{product.is_featured ? <span className="admin-featured">Nổi bật</span> : <span className="admin-muted-value">Thông thường</span>}</td><td><span className={`admin-status admin-status--${product.status === 'active' ? 'active' : 'inactive'}`}><i />{product.status === 'active' ? 'Đang bán' : 'Ngừng bán'}</span></td><td><button className="admin-view-button" onClick={() => openDetail(product)}><Eye size={16} />Xem chi tiết</button></td></tr>)}</tbody></table></div>}
        </section>
        {!loading && !error && filteredProducts.length > 0 && <nav className="admin-products-pagination" aria-label="Phân trang sản phẩm"><span>Trang {page} / {totalPages}</span><div><button aria-label="Trang trước" disabled={page === 1} onClick={() => setPage((value) => value - 1)}><CaretLeft size={16} /></button>{Array.from({ length: totalPages }, (_, index) => <button key={index + 1} className={page === index + 1 ? 'active' : ''} onClick={() => setPage(index + 1)}>{index + 1}</button>)}<button aria-label="Trang sau" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}><CaretRight size={16} /></button></div></nav>}
      </div>
    </main>
    {selectedProduct && <div className="admin-detail-backdrop" onMouseDown={(event) => event.currentTarget === event.target && setSelectedProduct(null)}><section className="admin-product-detail" role="dialog" aria-modal="true" aria-labelledby="product-detail-title"><header><div><span>Chi tiết sản phẩm</span><h2 id="product-detail-title">{selectedProduct.name}</h2></div><button aria-label="Đóng chi tiết" onClick={() => setSelectedProduct(null)}><X size={19} /></button></header>{detailLoading ? <div className="admin-detail-loading"><span /><span /><span /></div> : detailError ? <div className="admin-state"><Warning size={32} /><h2>Không thể tải chi tiết</h2><p>{detailError}</p></div> : <div className="admin-variant-list"><div className="admin-variant-summary"><span><small>Số phiên bản</small><strong>{selectedProduct.variants?.length || 0}</strong></span><span><small>Tổng tồn kho</small><strong>{(selectedProduct.variants || []).reduce((total, variant) => total + Number(variant.stock_quantity || 0), 0)}</strong></span></div><h3>Phiên bản sản phẩm</h3>{selectedProduct.variants?.length ? selectedProduct.variants.map((variant) => <article key={variant.product_variant_id}><div><strong>{variant.color || 'Chưa xác định màu'}</strong><span>{variant.storage || 'Không có dung lượng'}</span></div><div><strong>{formatCurrency(variant.sale_price)}</strong><span>Giá gốc {formatCurrency(variant.original_price)}</span></div><span className={Number(variant.stock_quantity) < 10 ? 'is-low' : ''}>Còn {variant.stock_quantity || 0}</span></article>) : <p className="admin-no-variants">Sản phẩm chưa có phiên bản.</p>}</div>}</section></div>}
  </div>;
}
