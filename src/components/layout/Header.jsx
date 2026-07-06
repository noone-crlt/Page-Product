import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CATEGORIES } from '../../constants/productsData';

export default function Header() {
  const { 
    searchQuery, setSearchQuery, activeCategory, setActiveCategory, 
    cart, isCartOpen, setIsCartOpen, user, setIsAuthOpen, logout 
  } = useApp();
  const [open, setOpen] = useState(false);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const label = CATEGORIES.find((item) => item.key === activeCategory)?.label || 'Danh mục';

  return <header className="header-glass">
    <div className="header-container">
      <button className="brand-logo" onClick={() => setActiveCategory('all')} aria-label="Về trang sản phẩm My Store">
        <i className="ri-store-2-fill"></i><span>My <strong>Store</strong></span>
      </button>
      <div className="category-dropdown-wrapper">
        <button className="category-btn" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="listbox">
          {label}<i className="ri-arrow-down-s-line"></i>
        </button>
        {open && <div className="category-menu" role="listbox">{CATEGORIES.map((item) => <button key={item.key} className={item.key === activeCategory ? 'active' : ''} onClick={() => { setActiveCategory(item.key); setOpen(false); }}>{item.label}</button>)}</div>}
      </div>
      <label className="search-bar-container">
        <span className="sr-only">Tìm kiếm sản phẩm</span><i className="ri-search-line"></i>
        <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm tên, danh mục, thương hiệu..." />
        {searchQuery && <button onClick={() => setSearchQuery('')} aria-label="Xóa nội dung tìm kiếm"><i className="ri-close-line"></i></button>}
      </label>
      <div className="header-actions">
        <button className="secondary-action" aria-label="Sản phẩm yêu thích"><i className="ri-heart-3-line"></i></button>
        <button className="secondary-action" aria-label="Thông báo"><i className="ri-notification-3-line"></i></button>
        <button className={`cart-btn ${isCartOpen ? 'active' : ''}`} onClick={() => setIsCartOpen(!isCartOpen)} aria-label={`Giỏ hàng có ${count} sản phẩm`}>
          <i className="ri-shopping-cart-2-line"></i>{count > 0 && <span>{count}</span>}
        </button>
        {user ? (
          <div className="user-profile">
            <span>{user.name.charAt(0).toUpperCase()}</span>
            <b>{user.name}</b>
            <button className="logout-btn" onClick={logout} aria-label="Đăng xuất" title="Đăng xuất"><i className="ri-logout-box-r-line"></i></button>
          </div>
        ) : (
          <button className="login-btn" onClick={() => setIsAuthOpen(true)}>
            Đăng nhập
          </button>
        )}
      </div>
    </div>
  </header>;
}
