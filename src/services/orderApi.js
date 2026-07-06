import { apiClient } from './apiClient';

export const createOrder = (payload) =>
  apiClient('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      payment_method: payload.paymentMethod,
      shipping_address: payload.shippingAddress,
      shipping_phone: payload.shippingPhone,
    }),
  });

export const getOrderById = (orderId) =>
  apiClient(`/api/orders/${encodeURIComponent(orderId)}`);
