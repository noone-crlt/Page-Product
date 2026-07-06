import React from 'react';
import { useApp } from '../../context/AppContext';
import ProductCard from './ProductCard';

export default function ProductGrid() {
  const {
    displayedProducts,
    resetFilters,
    isProductsLoading,
    productsError,
    reloadProducts,
  } = useApp();

  if (isProductsLoading) {
    return (
      <div className="product-grid" aria-label="Đang tải sản phẩm">
        {Array.from({ length: 8 }, (_, index) => (
          <div className="product-skeleton" key={index} aria-hidden="true">
            <div></div>
            <span></span>
            <span></span>
          </div>
        ))}
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="empty-products-state" role="alert">
        <i className="ri-wifi-off-line"></i>
        <h2>Không thể tải sản phẩm</h2>
        <p>{productsError}</p>
        <button onClick={reloadProducts}>Thử lại</button>
      </div>
    );
  }

  if (!displayedProducts.length) {
    return (
      <div className="empty-products-state">
        <i className="ri-search-eye-line"></i>
        <h2>Không tìm thấy sản phẩm phù hợp</h2>
        <p>Hãy thử thay đổi từ khóa hoặc điều chỉnh bộ lọc.</p>
        <button onClick={resetFilters}>Xóa tất cả bộ lọc</button>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {displayedProducts.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </div>
  );
}
