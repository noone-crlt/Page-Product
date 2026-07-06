import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CATEGORIES } from '../../constants/productsData';

const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value || 0);

export default function Header() {
  const {
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    products,
    cart,
    isCartOpen,
    setIsCartOpen,
    user,
    setIsAuthOpen,
    logout,
    wishlistIds,
    wishlistError,
    isWishlistLoading,
    reloadWishlist,
    toggleWishlist,
    setSelectedProduct,
  } = useApp();
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountRef = useRef(null);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const categoryLabel =
    CATEGORIES.find((item) => item.key === activeCategory)?.label ||
    'Danh mục';
  const wishlistProducts = useMemo(
    () => products.filter((product) => wishlistIds.includes(product.id)),
    [products, wishlistIds],
  );

  useEffect(() => {
    if (!isAccountOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (!accountRef.current?.contains(event.target)) {
        setIsAccountOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsAccountOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isAccountOpen]);

  const handleWishlistProductClick = (product) => {
    setSelectedProduct(product);
    setIsAccountOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsAccountOpen(false);
  };

  return (
    <header className="header-glass">
      <div className="header-container">
        <button
          className="brand-logo"
          onClick={() => setActiveCategory('all')}
          aria-label="Về trang sản phẩm My Store"
        >
          <i className="ri-store-2-fill"></i>
          <span>
            My <strong>Store</strong>
          </span>
        </button>

        <div className="category-dropdown-wrapper">
          <button
            className="category-btn"
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            aria-expanded={isCategoryOpen}
            aria-haspopup="listbox"
          >
            {categoryLabel}
            <i className="ri-arrow-down-s-line"></i>
          </button>

          {isCategoryOpen && (
            <div className="category-menu" role="listbox">
              {CATEGORIES.map((item) => (
                <button
                  key={item.key}
                  className={item.key === activeCategory ? 'active' : ''}
                  onClick={() => {
                    setActiveCategory(item.key);
                    setIsCategoryOpen(false);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <label className="search-bar-container">
          <span className="sr-only">Tìm kiếm sản phẩm</span>
          <i className="ri-search-line"></i>
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tìm tên, danh mục, thương hiệu..."
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Xóa nội dung tìm kiếm"
            >
              <i className="ri-close-line"></i>
            </button>
          )}
        </label>

        <div className="header-actions">
          <button className="secondary-action" aria-label="Thông báo">
            <i className="ri-notification-3-line"></i>
          </button>
          <button
            className={`cart-btn ${isCartOpen ? 'active' : ''}`}
            onClick={() => setIsCartOpen(!isCartOpen)}
            aria-label={`Giỏ hàng có ${cartCount} sản phẩm`}
          >
            <i className="ri-shopping-cart-2-line"></i>
            {cartCount > 0 && <span>{cartCount}</span>}
          </button>

          {user ? (
            <div className="account-dropdown" ref={accountRef}>
              <button
                className={`account-trigger ${isAccountOpen ? 'active' : ''}`}
                onClick={() => setIsAccountOpen(!isAccountOpen)}
                aria-expanded={isAccountOpen}
                aria-haspopup="menu"
              >
                <span className="account-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="account-copy">
                  <small>Tài khoản</small>
                  <strong>{user.name}</strong>
                </span>
                <i className="ri-arrow-down-s-line account-chevron"></i>
              </button>

              {isAccountOpen && (
                <div className="account-menu" role="menu">
                  <div className="account-menu-header">
                    <div>
                      <span>Danh sách yêu thích</span>
                      <strong>{wishlistProducts.length} sản phẩm</strong>
                    </div>
                    <i className="ri-heart-3-fill"></i>
                  </div>

                  {wishlistError && (
                    <div className="wishlist-dropdown-error" role="alert">
                      <span>{wishlistError}</span>
                      <button onClick={reloadWishlist}>Thử lại</button>
                    </div>
                  )}

                  <div className="wishlist-dropdown-list">
                    {isWishlistLoading ? (
                      <div className="wishlist-dropdown-loading" aria-label="Đang tải danh sách yêu thích">
                        {[1, 2, 3].map((item) => (
                          <span key={item}></span>
                        ))}
                      </div>
                    ) : wishlistProducts.length ? (
                      wishlistProducts.map((product, index) => (
                        <article
                          className="wishlist-dropdown-item"
                          key={product.id}
                          style={{ '--item-delay': `${index * 45}ms` }}
                        >
                          <button
                            className="wishlist-product-link"
                            onClick={() =>
                              handleWishlistProductClick(product)
                            }
                          >
                            <img src={product.image} alt="" />
                            <span>
                              <strong>{product.name}</strong>
                              <small>{formatPrice(product.price)}</small>
                            </span>
                          </button>
                          <button
                            className="wishlist-remove-btn"
                            onClick={() => toggleWishlist(product.id)}
                            aria-label={`Bỏ ${product.name} khỏi yêu thích`}
                          >
                            <i className="ri-close-line"></i>
                          </button>
                        </article>
                      ))
                    ) : (
                      <div className="wishlist-dropdown-empty">
                        <span><i className="ri-heart-add-2-line"></i></span>
                        <strong>Chưa có sản phẩm yêu thích</strong>
                        <p>Nhấn biểu tượng trái tim trên sản phẩm để lưu lại.</p>
                      </div>
                    )}
                  </div>

                  <div className="account-menu-footer">
                    <span>{user.email || 'Tài khoản My Store'}</span>
                    <button onClick={handleLogout} role="menuitem">
                      <i className="ri-logout-box-r-line"></i>
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button className="login-btn" onClick={() => setIsAuthOpen(true)}>
              <i className="ri-user-3-line"></i>
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
