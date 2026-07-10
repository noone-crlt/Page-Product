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

export const updateProduct = (productId, product) =>
  apiClient(`/api/products/${encodeURIComponent(productId)}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  });

export const deleteProduct = (productId) =>
  apiClient(`/api/products/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
  });

export const getProductReviews = (productId) =>
  apiClient(`/api/products/${encodeURIComponent(productId)}/reviews`);

export const createProductReview = (productId, ratingStars, comment) =>
  apiClient(`/api/products/${encodeURIComponent(productId)}/reviews`, {
    method: 'POST',
    body: JSON.stringify({
      rating_stars: ratingStars,
      comment,
    }),
  });
