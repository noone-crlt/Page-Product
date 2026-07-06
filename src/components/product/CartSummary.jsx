import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';

const formatMoney = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);

export default function CartSummary({ mode }) {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    isCartOpen,
    setIsCartOpen,
    cartError,
  } = useApp();

  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const shippingFee =
    subtotal === 0 || subtotal >= 10000000 ? 0 : 35000;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (mode !== 'drawer' || !isCartOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsCartOpen(false);
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isCartOpen, mode, setIsCartOpen]);

  const renderCartItem = (item) => {
    const itemKey = [
      item.product.id,
      item.color?.name,
      item.capacity,
    ].join('-');

    return (
      <div className="cart-summary-item" key={itemKey}>
        <img src={item.product.image} alt="" />

        <div>
          <strong>{item.product.name}</strong>
          <span>{formatMoney(item.product.price)}</span>

          <div className="quantity-control">
            <button
              onClick={() =>
                updateCartQuantity(
                  item.product.id,
                  item.color?.name,
                  item.capacity,
                  item.quantity - 1,
                )
              }
              aria-label="Giảm số lượng"
            >
              <i className="ri-subtract-line"></i>
            </button>

            <b>{item.quantity}</b>

            <button
              onClick={() =>
                updateCartQuantity(
                  item.product.id,
                  item.color?.name,
                  item.capacity,
                  item.quantity + 1,
                )
              }
              aria-label="Tăng số lượng"
            >
              <i className="ri-add-line"></i>
            </button>
          </div>
        </div>

        <button
          className="remove-cart-item"
          onClick={() =>
            removeFromCart(
              item.product.id,
              item.color?.name,
              item.capacity,
            )
          }
          aria-label={`Xóa ${item.product.name}`}
        >
          <i className="ri-delete-bin-6-line"></i>
        </button>
      </div>
    );
  };

  const content = (
    <>
      <div className="cart-summary-heading">
        <div>
          <span>Giỏ hàng</span>
          <strong>{cartCount} sản phẩm</strong>
        </div>

        {mode === 'drawer' && (
          <button
            onClick={() => setIsCartOpen(false)}
            aria-label="Đóng giỏ hàng"
          >
            <i className="ri-close-line"></i>
          </button>
        )}
      </div>

      <div className="cart-summary-items">
        {cartError && (
          <p className="cart-api-error" role="alert">
            <i className="ri-error-warning-line"></i>
            {cartError}
          </p>
        )}
        {cart.length === 0 ? (
          <div className="empty-cart">
            <i className="ri-shopping-bag-line"></i>
            <strong>Giỏ hàng trống</strong>
            <p>Thêm sản phẩm bạn yêu thích để bắt đầu.</p>
          </div>
        ) : (
          cart.map(renderCartItem)
        )}
      </div>

      <div className="cart-totals">
        <p>
          <span>Tạm tính</span>
          <b>{formatMoney(subtotal)}</b>
        </p>
        <p>
          <span>Phí vận chuyển</span>
          <b>{shippingFee ? formatMoney(shippingFee) : 'Miễn phí'}</b>
        </p>
        <p className="total">
          <span>Tổng cộng</span>
          <b>{formatMoney(subtotal + shippingFee)}</b>
        </p>

        <button disabled={!cart.length}>
          <i className="ri-shopping-bag-check-line"></i>
          Xem giỏ hàng
        </button>
      </div>
    </>
  );

  if (mode === 'summary') {
    return <aside className="cart-summary-desktop">{content}</aside>;
  }

  return (
    <>
      <button
        className={`cart-backdrop ${isCartOpen ? 'show' : ''}`}
        onClick={() => setIsCartOpen(false)}
        aria-label="Đóng giỏ hàng"
      ></button>

      <aside
        className={`cart-drawer-panel ${isCartOpen ? 'open' : ''}`}
        aria-hidden={!isCartOpen}
      >
        {content}
      </aside>
    </>
  );
}
