import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { createOrder, getOrderById } from '../../services/orderApi';
import { createPaymentHubConnection, createSepayQrUrl, getDefaultTransferContent } from '../../services/paymentHub';

const formatMoney = (value) => new Intl.NumberFormat('vi-VN', {
  style: 'currency', currency: 'VND', maximumFractionDigits: 0,
}).format(value || 0);

const getOrderData = (result) => result?.data || result || {};
const getOrderId = (order) => order?.order_id ?? order?.orderId ?? order?.id;
const getQrSource = (order) => {
  const value = order?.qr_code_url || order?.qrCodeUrl || order?.qr_url || order?.qrCode || order?.qr_code || order?.payment_url;
  if (value) {
    if (String(value).startsWith('data:image') || String(value).startsWith('http')) return value;
    return `data:image/png;base64,${value}`;
  }
  return createSepayQrUrl({
    orderId: getOrderId(order),
    amount: order?._checkout_total,
    content: order?._transfer_content,
  });
};
const getSignalOrderId = (payload) => typeof payload === 'object'
  ? payload?.order_id ?? payload?.orderId ?? payload?.id
  : payload;
const normalizeProductName = (value = '') => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('vi')
  .replace(/\s+/g, ' ')
  .trim();

export default function CartSummary({ mode }) {
  const { products, cart, removeFromCart, isCartOpen, setIsCartOpen, cartError, loadCart, user, setIsAuthOpen } = useApp();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingPhoneError, setShippingPhoneError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [orderError, setOrderError] = useState('');
  const [completedOrder, setCompletedOrder] = useState(null);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hubStatus, setHubStatus] = useState('idle');
  const connectionRef = useRef(null);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingFee = subtotal === 0 || subtotal >= 10000000 ? 0 : 35000;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = subtotal + shippingFee;
  const pendingOrderId = getOrderId(pendingOrder);
  const qrSource = useMemo(() => getQrSource(pendingOrder), [pendingOrder]);

  useEffect(() => {
    if (mode !== 'drawer' || !isCartOpen) return undefined;
    const handleEscape = (event) => { if (event.key === 'Escape' && !pendingOrder) setIsCartOpen(false); };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isCartOpen, mode, pendingOrder, setIsCartOpen]);

  useEffect(() => {
    if (!pendingOrderId) return undefined;
    let disposed = false;
    const connection = createPaymentHubConnection();
    connectionRef.current = connection;

    const handlePaymentSuccess = async (payload) => {
      if (String(getSignalOrderId(payload)) !== String(pendingOrderId)) return;
      let verifiedOrder = pendingOrder;
      try { verifiedOrder = getOrderData(await getOrderById(pendingOrderId)); } catch { /* Sự kiện Hub là nguồn xác nhận chính. */ }
      if (!disposed) {
        setCompletedOrder(verifiedOrder);
        setPendingOrder(null);
        setHubStatus('paid');
        await loadCart().catch(() => undefined);
      }
    };

    connection.on('PaymentSuccess', handlePaymentSuccess);
    connection.onreconnecting(() => !disposed && setHubStatus('reconnecting'));
    connection.onreconnected(() => !disposed && setHubStatus('connected'));
    connection.onclose(() => !disposed && setHubStatus('error'));
    setHubStatus('connecting');
    connection.start()
      .then(() => !disposed && setHubStatus('connected'))
      .catch(() => !disposed && setHubStatus('error'));

    return () => {
      disposed = true;
      connection.off('PaymentSuccess', handlePaymentSuccess);
      connection.stop().catch(() => undefined);
      if (connectionRef.current === connection) connectionRef.current = null;
    };
  }, [pendingOrderId]);

  const openCheckout = () => {
    if (!user) { setIsAuthOpen(true); return; }
    setOrderError(''); setCompletedOrder(null);
    if (mode === 'summary') { setIsCartOpen(true); return; }
    setIsCheckoutOpen(true);
  };

  const handleCreateOrder = async (event) => {
    event.preventDefault(); setIsSubmitting(true); setOrderError(''); setCompletedOrder(null);
    const phoneDigits = shippingPhone.replace(/\D/g, '');
    if (phoneDigits.length < 9 || phoneDigits.length > 11) {
      setShippingPhoneError('Số điện thoại phải có từ 9 đến 11 chữ số.');
      setIsSubmitting(false);
      return;
    }
    setShippingPhoneError('');
    const checkoutTotal = total;
    try {
      const result = await createOrder({ paymentMethod, shippingAddress: shippingAddress.trim(), shippingPhone: shippingPhone.trim() });
      const order = getOrderData(result);
      const orderId = getOrderId(order);
      if (!orderId) throw new Error('Máy chủ chưa trả về mã đơn hàng.');
      const orderSnapshot = {
        ...order,
        _checkout_total: Number(order.total_amount || order.total || checkoutTotal),
        _transfer_content: order.transfer_content || order.payment_content || order.content || getDefaultTransferContent(orderId),
      };
      setIsCheckoutOpen(false);
      await loadCart().catch(() => undefined);
      if (paymentMethod === 'COD') {
        setCompletedOrder(orderSnapshot);
      } else {
        setPendingOrder(orderSnapshot);
      }
    } catch (error) {
      setOrderError(error.message || 'Không thể tạo đơn hàng.');
    } finally { setIsSubmitting(false); }
  };

  const resetOrderFlow = () => {
    setCompletedOrder(null); setPendingOrder(null); setHubStatus('idle'); setShippingAddress(''); setShippingPhone(''); setPaymentMethod('COD');
  };

  const content = <>
    <div className="cart-summary-heading"><div><span>Giỏ hàng</span><strong>{cartCount} sản phẩm</strong></div>{mode === 'drawer' && <button onClick={() => setIsCartOpen(false)} aria-label="Đóng giỏ hàng"><i className="ri-close-line" /></button>}</div>
    <div className="cart-summary-items">
      {(cartError || orderError) && <p className="cart-api-error" role="alert"><i className="ri-error-warning-line" />{cartError || orderError}</p>}

      {completedOrder ? <div className="payment-success-state" role="status"><span className="payment-success-icon"><i className="ri-check-line" /></span><small>Đơn hàng đã được ghi nhận</small><strong>{paymentMethod === 'COD' ? 'Đặt hàng thành công' : 'Thanh toán thành công'}</strong><p>{paymentMethod === 'COD' ? 'Bạn sẽ thanh toán khi nhận hàng.' : 'Giao dịch chuyển khoản đã được xác nhận.'}</p><b>Mã đơn: {getOrderId(completedOrder)}</b><button onClick={resetOrderFlow}>Tiếp tục mua sắm</button></div>
      : pendingOrder ? <div className="qr-payment-state"><div className="qr-payment-heading"><span><i className="ri-qr-code-line" /></span><div><small>Đơn hàng #{pendingOrderId}</small><strong>Quét mã để thanh toán</strong></div></div>{qrSource ? <div className="qr-code-frame"><img src={qrSource} alt={`Mã QR thanh toán đơn hàng ${pendingOrderId}`} /></div> : <div className="qr-code-missing"><i className="ri-qr-code-line" /><strong>Chưa thể tạo mã QR</strong><p>Hãy cấu hình <code>VITE_SEPAY_BANK_ACCOUNT</code> và <code>VITE_SEPAY_BANK_NAME</code> trong file môi trường.</p></div>}<div className="qr-payment-total"><span>Số tiền cần chuyển</span><strong>{formatMoney(pendingOrder._checkout_total)}</strong></div><div className="qr-transfer-content"><span>Nội dung chuyển khoản</span><strong>{pendingOrder._transfer_content}</strong></div><p className={`payment-live-status is-${hubStatus}`}><i />{hubStatus === 'connected' ? 'Đang chờ ngân hàng xác nhận...' : hubStatus === 'reconnecting' ? 'Đang kết nối lại hệ thống thanh toán...' : hubStatus === 'error' ? 'Mất kết nối xác nhận. Vui lòng tải lại trang.' : 'Đang kết nối hệ thống thanh toán...'}</p><button className="cancel-qr-payment" onClick={() => setPendingOrder(null)}>Đóng và thanh toán sau</button></div>
      : <>{cart.length === 0 ? <div className="empty-cart"><i className="ri-shopping-bag-line" /><strong>Giỏ hàng trống</strong><p>Hãy chọn phiên bản sản phẩm để thêm vào giỏ.</p></div> : cart.map((item) => {
        const cartProductName = normalizeProductName(item.product.name);
        const localProduct = products.find((product) =>
          String(product.id) === String(item.product.id) ||
          normalizeProductName(product.name) === cartProductName,
        );
        const localImage = localProduct?.image;
        const cartImage = item.product.image;
        const displayImage = localImage && !localImage.includes('picsum')
          ? localImage
          : cartImage;
        return <div className="cart-summary-item" key={item.cartItemId}><img src={displayImage} alt="" /><div><strong>{item.product.name}</strong><span>{formatMoney(item.product.price)}</span><small>{[item.color?.name, item.capacity].filter(Boolean).join(' · ') || 'Phiên bản mặc định'}</small><b>Số lượng: {item.quantity}</b></div><button className="remove-cart-item" onClick={() => removeFromCart(item.cartItemId)} aria-label={`Xóa ${item.product.name}`}><i className="ri-delete-bin-6-line" /></button></div>;
      })}</>}
    </div>

    {!completedOrder && !pendingOrder && (isCheckoutOpen && mode === 'drawer' ? <form className="checkout-form checkout-order-form" onSubmit={handleCreateOrder}><div className="checkout-section-heading"><span>1</span><div><strong>Thông tin nhận hàng</strong><small>Nhập địa chỉ và số điện thoại người nhận</small></div></div><label>Địa chỉ giao hàng<textarea value={shippingAddress} onChange={(event) => setShippingAddress(event.target.value)} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" required /></label><label>Số điện thoại<input type="tel" value={shippingPhone} onChange={(event) => { setShippingPhone(event.target.value); setShippingPhoneError(''); }} placeholder="Ví dụ: 0912 345 678" inputMode="tel" required />{shippingPhoneError && <small className="checkout-field-error">{shippingPhoneError}</small>}</label><div className="checkout-section-heading"><span>2</span><div><strong>Phương thức thanh toán</strong><small>Chọn cách thanh toán phù hợp</small></div></div><div className="payment-method-options"><label className={paymentMethod === 'COD' ? 'active' : ''}><input type="radio" name="paymentMethod" value="COD" checked={paymentMethod === 'COD'} onChange={(event) => setPaymentMethod(event.target.value)} /><i className="ri-truck-line" /><span><strong>Thanh toán khi nhận hàng</strong><small>Xác nhận đơn ngay, trả tiền cho người giao hàng</small></span></label><label className={paymentMethod === 'BankTransfer' ? 'active' : ''}><input type="radio" name="paymentMethod" value="BankTransfer" checked={paymentMethod === 'BankTransfer'} onChange={(event) => setPaymentMethod(event.target.value)} /><i className="ri-qr-code-line" /><span><strong>Chuyển khoản bằng QR</strong><small>Quét mã và chờ ngân hàng xác nhận tự động</small></span></label></div><div className="checkout-actions"><button type="button" onClick={() => setIsCheckoutOpen(false)}>Quay lại</button><button type="submit" disabled={isSubmitting}>{isSubmitting ? <><i className="ri-loader-4-line spinner" />Đang tạo đơn...</> : paymentMethod === 'COD' ? 'Xác nhận đặt hàng' : 'Tạo mã thanh toán'}</button></div></form>
      : <div className="cart-totals"><p><span>Tạm tính</span><b>{formatMoney(subtotal)}</b></p><p><span>Phí vận chuyển</span><b>{shippingFee ? formatMoney(shippingFee) : 'Miễn phí'}</b></p><p className="total"><span>Tổng cộng</span><b>{formatMoney(total)}</b></p><button disabled={!cart.length} onClick={openCheckout}><i className="ri-shopping-bag-check-line" />Tiến hành đặt hàng</button></div>)}
  </>;


  if (mode === 'summary') return <aside className="cart-summary-desktop">{content}</aside>;
  return <><button className={`cart-backdrop ${isCartOpen ? 'show' : ''}`} onClick={() => !pendingOrder && setIsCartOpen(false)} aria-label="Đóng giỏ hàng" /><aside className={`cart-drawer-panel ${isCartOpen ? 'open' : ''}`} aria-hidden={!isCartOpen}>{content}</aside></>;
}
