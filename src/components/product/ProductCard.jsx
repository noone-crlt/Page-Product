import React from 'react';
import { useApp } from '../../context/AppContext';

const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);

export default function ProductCard({ product, index }) {
  const { setSelectedProduct, wishlistIds, toggleWishlist } = useApp();
  const isWishlisted = wishlistIds.includes(product.id);

  return (
    <article
      className="product-card"
      style={{ '--delay': `${index * 45}ms` }}
    >
      <div className="product-img-wrapper">
        {product.discount > 0 && (
          <span className="discount-tag">-{product.discount}%</span>
        )}

        <img src={product.image} alt={product.name} loading="lazy" />

        <button
          className={`wishlist-card-btn ${isWishlisted ? 'active' : ''}`}
          onClick={() => toggleWishlist(product.id)}
          aria-label={
            isWishlisted
              ? `Bỏ ${product.name} khỏi yêu thích`
              : `Thêm ${product.name} vào yêu thích`
          }
        >
          <i className={isWishlisted ? 'ri-heart-fill' : 'ri-heart-line'}></i>
        </button>

        <button
          className="quick-view-btn"
          onClick={() => setSelectedProduct(product)}
        >
          <i className="ri-eye-line"></i>
          Xem nhanh
        </button>
      </div>

      <div className="product-info">
        <span className="product-brand">{product.brand}</span>
        <h2>{product.name}</h2>

        <div className="product-rating">
          <span>
            <i className="ri-star-fill"></i> {product.rating}
          </span>
          <small>
            {product.reviewsCount} đánh giá · Đã bán {product.soldCount}
          </small>
        </div>

        <div className="product-price">
          <strong>{formatPrice(product.price)}</strong>
          {product.originalPrice && (
            <del>{formatPrice(product.originalPrice)}</del>
          )}
        </div>
      </div>

      <button
        className="add-to-cart-btn"
        onClick={() => setSelectedProduct(product)}
      >
        <i className="ri-equalizer-3-line"></i>
        Chọn phiên bản
      </button>
    </article>
  );
}
