import { apiClient } from './apiClient';

export const getWishlist = () => apiClient('/api/wishlists');

export const toggleWishlist = (productId) =>
  apiClient('/api/wishlists/toggle', {
    method: 'POST',
    body: JSON.stringify({ product_id: productId }),
  });
