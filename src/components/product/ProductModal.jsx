import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';

const formatMoney = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);

export default function ProductModal() {
  const {
    selectedProduct,
    setSelectedProduct,
    addToCart,
    setIsCartOpen,
  } = useApp();

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedCapacity, setSelectedCapacity] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!selectedProduct) return;

    setSelectedColor(selectedProduct.colors?.[0] || null);
    setSelectedCapacity(selectedProduct.capacities?.[0] || null);
    setQuantity(1);
  }, [selectedProduct]);

  useEffect(() => {
    if (!selectedProduct) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') setSelectedProduct(null);
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedProduct, setSelectedProduct]);

  if (!selectedProduct) return null;

  const handleAddToCart = (buyNow = false) => {
    addToCart(
      selectedProduct,
      quantity,
      selectedColor,
      selectedCapacity,
    );
    setSelectedProduct(null);

    if (buyNow) setIsCartOpen(true);
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={() => setSelectedProduct(null)}
      role="presentation"
    >
      <section
        className="modal-container"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-product-name"
      >
        <button
          className="modal-close-btn"
          onClick={() => setSelectedProduct(null)}
          aria-label="Đóng xem nhanh"
        >
          <i className="ri-close-line"></i>
        </button>

        <div className="modal-grid">
          <div className="modal-image">
            <img src={selectedProduct.image} alt={selectedProduct.name} />
          </div>

          <div className="modal-details">
            <span>{selectedProduct.brand}</span>
            <h2 id="modal-product-name">{selectedProduct.name}</h2>

            <div className="modal-rating">
              <i className="ri-star-fill"></i> {selectedProduct.rating} ·{' '}
              {selectedProduct.reviewsCount} đánh giá
            </div>

            <div className="modal-price">
              <strong>{formatMoney(selectedProduct.price)}</strong>
              {selectedProduct.originalPrice && (
                <del>{formatMoney(selectedProduct.originalPrice)}</del>
              )}
            </div>

            <p>{selectedProduct.description}</p>

            {selectedProduct.colors?.length > 0 && (
              <fieldset>
                <legend>
                  Màu sắc: <b>{selectedColor?.name}</b>
                </legend>
                <div className="option-row">
                  {selectedProduct.colors.map((color) => (
                    <button
                      key={color.name}
                      className={
                        selectedColor?.name === color.name ? 'active' : ''
                      }
                      onClick={() => setSelectedColor(color)}
                    >
                      <span style={{ background: color.hex }}></span>
                      {color.name}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {selectedProduct.capacities?.length > 0 && (
              <fieldset>
                <legend>Phiên bản</legend>
                <div className="option-row">
                  {selectedProduct.capacities.map((capacity) => (
                    <button
                      key={capacity}
                      className={
                        selectedCapacity === capacity ? 'active' : ''
                      }
                      onClick={() => setSelectedCapacity(capacity)}
                    >
                      {capacity}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            <div className="modal-quantity">
              <span>Số lượng</span>
              <div>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Giảm số lượng"
                >
                  <i className="ri-subtract-line"></i>
                </button>
                <b>{quantity}</b>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  aria-label="Tăng số lượng"
                >
                  <i className="ri-add-line"></i>
                </button>
              </div>
              <small>Còn {selectedProduct.stock} sản phẩm</small>
            </div>

            <div className="modal-actions">
              <button onClick={() => handleAddToCart(false)}>
                <i className="ri-shopping-cart-add-line"></i>
                Thêm vào giỏ
              </button>
              <button onClick={() => handleAddToCart(true)}>
                <i className="ri-flashlight-line"></i>
                Mua ngay
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
