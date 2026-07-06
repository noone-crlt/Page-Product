import { apiClient } from './apiClient';

export const getCart = () => apiClient('/api/carts');

export const addCartItem = (productVariantId, quantity) =>
  apiClient('/api/carts/items', {
    method: 'POST',
    body: JSON.stringify({
      product_variant_id: productVariantId,
      quantity,
    }),
  });

export const deleteCartItem = (cartItemId) =>
  apiClient(`/api/carts/items/${encodeURIComponent(cartItemId)}`, {
    method: 'DELETE',
  });
