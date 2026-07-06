import { apiClient } from './apiClient';

export const getProducts = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value);
    }
  });

  const suffix = query.size ? `?${query.toString()}` : '';
  return apiClient(`/api/products${suffix}`);
};

export const getProductById = (productId) =>
  apiClient(`/api/products/${encodeURIComponent(productId)}`);
