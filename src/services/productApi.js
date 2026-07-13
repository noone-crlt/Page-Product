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

export const getProductCategories = () =>
  apiClient('/api/categories?page=1&limit=100');

export const createCategory = (category) =>
  apiClient('/api/categories', {
    method: 'POST',
    body: JSON.stringify(category),
  });

export const updateCategory = (categoryId, category) =>
  apiClient(`/api/categories/${encodeURIComponent(categoryId)}`, {
    method: 'PUT',
    body: JSON.stringify(category),
  });

export const deleteCategory = (categoryId) =>
  apiClient(`/api/categories/${encodeURIComponent(categoryId)}`, {
    method: 'DELETE',
  });

export const getProductBrands = () =>
  apiClient('/api/brands?page=1&limit=100');

export const createBrand = (brand) =>
  apiClient('/api/brands', {
    method: 'POST',
    body: JSON.stringify(brand),
  });

export const updateBrand = (brandId, brand) =>
  apiClient(`/api/brands/${encodeURIComponent(brandId)}`, {
    method: 'PUT',
    body: JSON.stringify(brand),
  });

export const deleteBrand = (brandId) =>
  apiClient(`/api/brands/${encodeURIComponent(brandId)}`, {
    method: 'DELETE',
  });

export const createProduct = (product) =>
  apiClient('/api/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });

export const uploadProductThumbnail = (file) => {
  const body = new FormData();
  body.append('file', file);

  return apiClient('/api/image', {
    method: 'POST',
    body,
  });
};

export const uploadProductImages = (productId, files) => {
  const body = new FormData();
  files.forEach((file) => body.append('images', file));

  return apiClient(`/api/products/${encodeURIComponent(productId)}/images`, {
    method: 'POST',
    body,
  });
};

export const addProductVariants = (productId, variants) =>
  apiClient(`/api/products/${encodeURIComponent(productId)}/variants`, {
    method: 'POST',
    body: JSON.stringify(variants),
  });

export const deleteProductVariants = (productId, variantIds) =>
  apiClient(`/api/products/${encodeURIComponent(productId)}/variants`, {
    method: 'DELETE',
    body: JSON.stringify(variantIds),
  });

export const deleteProductImages = (productId, imageIds) =>
  apiClient(`/api/products/${encodeURIComponent(productId)}/images`, {
    method: 'DELETE',
    body: JSON.stringify(imageIds),
  });

export const toggleProductStatus = (productId) =>
  apiClient(`/api/products/${encodeURIComponent(productId)}/toggle-status`, {
    method: 'PUT',
  });

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
