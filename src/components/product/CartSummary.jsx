import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { createOrder, getOrderById } from '../../services/orderApi';

const formatMoney = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value || 0);

export default function CartSummary({ mode }) {
  const {
    products,
    cart,
    removeFromCart,
    isCartOpen,
    setIsCartOpen,
    cartError,
    loadCart,
    user,
    setIsAuthOpen,
  } = useApp();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const shippingFee = subtotal === 0 || subtotal >= 10000000 ? 0 : 35000;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (mode !== 'drawer' || !isCartOpen) return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsCartOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isCartOpen, mode, setIsCartOpen]);

  const openCheckout = () => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    setOrderError('');
    setOrderSuccess(null);
    if (mode === 'summary') {
      setIsCartOpen(true);
      return;
    }
    setIsCheckoutOpen(true);
  };

  const handleCreateOrder = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setOrderError('');

    try {
      const result = await createOrder({
        paymentMethod,
        shippingAddress,
        shippingPhone,
      });
      const data = result?.data || result || {};
      const orderId = data.order_id;
      const verifiedOrder = orderId ? await getOrderById(orderId) : result;
      setOrderSuccess(verifiedOrder?.data || verifiedOrder || data);
      setIsCheckoutOpen(false);
      await loadCart();
    } catch (error) {
      setOrderError(error.message || 'Không thể tạo đơn hàng.');
    } finally {
      setIsSubmitting(false);
    }
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
        {(cartError || orderError) && (
          <p className="cart-api-error" role="alert">
            <i className="ri-error-warning-line"></i>
            {cartError || orderError}
          </p>
        )}

        {orderSuccess && (
          <div className="order-success" role="status">
            <i className="ri-checkbox-circle-fill"></i>
            <strong>Đặt hàng thành công</strong>
            <span>Mã đơn: {orderSuccess.order_id || 'Đang cập nhật'}</span>
          </div>
        )}

        {cart.length === 0 ? (
          <div className="empty-cart">
            <i className="ri-shopping-bag-line"></i>
            <strong>Giỏ hàng trống</strong>
            <p>Hãy chọn phiên bản sản phẩm để thêm vào giỏ.</p>
          </div>
        ) : (
          cart.map((item) => {
            const localProduct = products.find((p) => p.id === item.product.id);
            const displayImage =
              localProduct?.image && !localProduct.image.includes('picsum')
                ? localProduct.image
                : item.product.image;

            return (
              <div className="cart-summary-item" key={item.cartItemId}>
                <img src={displayImage} alt="" />
              <div>
                <strong>{item.product.name}</strong>
                <span>{formatMoney(item.product.price)}</span>
                <small>
                  {[item.color?.name, item.capacity]
                    .filter(Boolean)
                    .join(' · ') || 'Phiên bản mặc định'}
                </small>
                <b>Số lượng: {item.quantity}</b>
              </div>
              <button
                className="remove-cart-item"
                onClick={() => removeFromCart(item.cartItemId)}
                aria-label={`Xóa ${item.product.name}`}
              >
                <i className="ri-delete-bin-6-line"></i>
              </button>
            </div>
          );
        })
        )}
      </div>

      {isCheckoutOpen && mode === 'drawer' ? (
        <form className="checkout-form" onSubmit={handleCreateOrder}>
          <label>
            Địa chỉ giao hàng
            <textarea
              value={shippingAddress}
              onChange={(event) => setShippingAddress(event.target.value)}
              required
            ></textarea>
          </label>
          <label>
            Số điện thoại
            <input
              type="tel"
              value={shippingPhone}
              onChange={(event) => setShippingPhone(event.target.value)}
              required
            />
          </label>
          <label>
            Phương thức thanh toán
            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
            >
              <option value="COD">Thanh toán khi nhận hàng</option>
              <option value="BANK_TRANSFER">Chuyển khoản</option>
            </select>
          </label>
          <div>
            <button type="button" onClick={() => setIsCheckoutOpen(false)}>
              Quay lại
            </button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang tạo đơn...' : 'Xác nhận đặt hàng'}
            </button>
          </div>
        </form>
      ) : (
        <div className="cart-totals">
          <p><span>Tạm tính</span><b>{formatMoney(subtotal)}</b></p>
          <p>
            <span>Phí vận chuyển</span>
            <b>{shippingFee ? formatMoney(shippingFee) : 'Miễn phí'}</b>
          </p>
          <p className="total">
            <span>Tổng cộng</span>
            <b>{formatMoney(subtotal + shippingFee)}</b>
          </p>
          <button disabled={!cart.length} onClick={openCheckout}>
            <i className="ri-shopping-bag-check-line"></i>
            Tiến hành đặt hàng
          </button>
        </div>
      )}
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
