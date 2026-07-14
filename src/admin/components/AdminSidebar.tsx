import { useNotifications } from '../hooks/useNotifications';
import { ChartLineUp, House, Receipt, Package, Users, Megaphone, Storefront, X, FolderOpen } from '@phosphor-icons/react';

const sidebarItems = [
  { label: 'Tổng quan', icon: House, href: '/admin' },
  { label: 'Đơn hàng', icon: Receipt, href: '/admin/orders' },
  { label: 'Sản phẩm', icon: Package, href: '/admin/products' },
  { label: 'Danh mục', icon: FolderOpen, href: '/admin/categories' },
  { label: 'Thương hiệu', icon: Storefront, href: '/admin/brands' },
  { label: 'Khách hàng', icon: Users, href: '/admin/customers' },
  { label: 'Marketing', icon: Megaphone, href: '/admin/marketing' },
];

export function AdminSidebar({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean; setSidebarOpen: (val: boolean) => void }) {
  const { unreadCount } = useNotifications();

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  return (
    <>
      <button className={`admin-sidebar-backdrop ${sidebarOpen ? 'is-visible' : ''}`} aria-label="Đóng menu" onClick={() => setSidebarOpen(false)} />
      <aside className={`admin-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="admin-brand">
          <span><ChartLineUp size={23} weight="bold" /></span>
          <strong>My Store</strong>
          <button aria-label="Đóng menu" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
        </div>
        
        <nav aria-label="Điều hướng quản trị">
          <small>Không gian làm việc</small>
          {sidebarItems.map(({ label, icon: Icon, href }, index) => {
            const active = pathname === href;
            return (
              <button 
                key={label} 
                className={active ? 'active' : ''} 
                onClick={() => { if (href) window.location.href = href; }}
              >
                <Icon size={19} weight={active ? 'fill' : 'regular'} />
                <span>{label}</span>
                {index === 1 && unreadCount > 0 && <b>{unreadCount}</b>}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
