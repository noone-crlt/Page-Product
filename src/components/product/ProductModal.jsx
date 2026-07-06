import React, { useEffect, useMemo, useState } from 'react';
import { Carousel, Rate } from 'antd';
import { useApp } from '../../context/AppContext';
import {
  createProductReview,
  getProductById,
  getProductReviews,
} from '../../services/productApi';

const formatMoney = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value || 0);

const extractReviews = (result) => {
  const data = result?.data || result;
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.items) ? data.items : [];
};

export default function ProductModal() {
  const {
    selectedProduct,
    setSelectedProduct,
    addToCart,
    setIsCartOpen,
    user,
    setIsAuthOpen,
  } = useApp();
  const [detail, setDetail] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const variants = useMemo(
    () => (Array.isArray(detail?.variants) ? detail.variants : []),
    [detail],
  );
  const selectedVariant = variants.find(
    (variant) => variant.product_variant_id === selectedVariantId,
  );
  const productImages = useMemo(() => {
    const detailImages = Array.isArray(detail?.images)
      ? detail.images
          .map((image) =>
            typeof image === 'string'
              ? image
              : image.image_url || image.url || image.imageUrl,
          )
          .filter(Boolean)
      : [];

    return [...new Set([selectedProduct?.image, ...detailImages].filter(Boolean))];
  }, [detail, selectedProduct]);

  useEffect(() => {
    if (!selectedProduct) return undefined;
    let active = true;

    const load = async () => {
      setIsLoading(true);
      setError('');
      setQuantity(1);

      try {
        const [detailResult, reviewsResult] = await Promise.all([
          getProductById(selectedProduct.id),
          getProductReviews(selectedProduct.id),
        ]);
        if (!active) return;

        const detailData = detailResult?.data || detailResult || {};
        const detailVariants = Array.isArray(detailData.variants)
          ? detailData.variants
          : [];
        setDetail(detailData);
        setReviews(extractReviews(reviewsResult));
        setSelectedVariantId(detailVariants[0]?.product_variant_id || null);
      } catch (requestError) {
        if (active) {
          setError(requestError.message || 'Không thể tải chi tiết sản phẩm.');
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
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

  const handleAddToCart = async (buyNow = false) => {
    if (!selectedVariant) {
      setError('Vui lòng chọn phiên bản sản phẩm.');
      return;
    }

    setIsSubmitting(true);
    const success = await addToCart(selectedProduct, selectedVariant, quantity);
    setIsSubmitting(false);

    if (success) {
      setSelectedProduct(null);
      if (buyNow) setIsCartOpen(true);
    }
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await createProductReview(selectedProduct.id, rating, comment.trim());
      const result = await getProductReviews(selectedProduct.id);
      setReviews(extractReviews(result));
      setComment('');
      setRating(5);
    } catch (requestError) {
      setError(requestError.message || 'Không thể gửi đánh giá.');
    } finally {
      setIsSubmitting(false);
    }
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
            <Carousel
              className="product-detail-carousel"
              arrows
              infinite={false}
              dotPlacement="bottom"
              prevArrow={
                <button type="button" aria-label="Ảnh trước">
                  <i className="ri-arrow-left-s-line"></i>
                </button>
              }
              nextArrow={
                <button type="button" aria-label="Ảnh sau">
                  <i className="ri-arrow-right-s-line"></i>
                </button>
              }
            >
              {productImages.map((image, index) => (
                <div key={`${image}-${index}`}>
                  <div className="product-detail-slide">
                    <img
                      src={image}
                      alt={`${selectedProduct.name} - ảnh ${index + 1}`}
                    />
                    <span>
                      {String(index + 1).padStart(2, '0')} /{' '}
                      {String(productImages.length).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              ))}
            </Carousel>
          </div>

          <div className="modal-details">
            <span>{selectedProduct.brand}</span>
            <h2 id="modal-product-name">{selectedProduct.name}</h2>
            <div className="modal-rating">
              <i className="ri-star-fill"></i>{' '}
              {Number(detail?.average_rating ?? selectedProduct.rating).toFixed(1)} ·{' '}
              {detail?.total_reviews ?? selectedProduct.reviewsCount} đánh giá
            </div>

            {isLoading ? (
              <p className="modal-status">Đang tải phiên bản sản phẩm...</p>
            ) : (
              <>
                <div className="modal-price">
                  <strong>
                    {formatMoney(
                      selectedVariant?.sale_price || selectedProduct.price,
                    )}
                  </strong>
                  {selectedVariant?.original_price >
                    selectedVariant?.sale_price && (
                    <del>{formatMoney(selectedVariant.original_price)}</del>
                  )}
                </div>

                <p>
                  {detail?.description || selectedProduct.description}
                </p>

                <fieldset>
                  <legend>Chọn phiên bản</legend>
                  <div className="variant-options">
                    {variants.map((variant) => (
                      <button
                        key={variant.product_variant_id}
                        type="button"
                        disabled={variant.stock_quantity <= 0}
                        className={
                          selectedVariantId === variant.product_variant_id
                            ? 'active'
                            : ''
                        }
                        onClick={() =>
                          setSelectedVariantId(variant.product_variant_id)
                        }
                      >
                        <strong>{variant.color || 'Mặc định'}</strong>
                        <span>{variant.storage || 'Tiêu chuẩn'}</span>
                        <small>
                          {variant.stock_quantity > 0
                            ? `Còn ${variant.stock_quantity}`
                            : 'Hết hàng'}
                        </small>
                      </button>
                    ))}
                  </div>
                </fieldset>

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
                      onClick={() =>
                        setQuantity(
                          Math.min(
                            selectedVariant?.stock_quantity || quantity + 1,
                            quantity + 1,
                          ),
                        )
                      }
                      aria-label="Tăng số lượng"
                    >
                      <i className="ri-add-line"></i>
                    </button>
                  </div>
                </div>

                {error && <p className="modal-api-error">{error}</p>}

                <div className="modal-actions">
                  <button
                    onClick={() => handleAddToCart(false)}
                    disabled={!selectedVariant || isSubmitting}
                  >
                    <i className="ri-shopping-cart-add-line"></i>
                    Thêm vào giỏ
                  </button>
                  <button
                    onClick={() => handleAddToCart(true)}
                    disabled={!selectedVariant || isSubmitting}
                  >
                    <i className="ri-flashlight-line"></i>
                    Mua ngay
                  </button>
                </div>
              </>
            )}

            <section className="reviews-section">
              <h3>Đánh giá sản phẩm</h3>
              <div className="reviews-list">
                {reviews.length ? (
                  reviews.slice(0, 3).map((review, index) => (
                    <article key={review.review_id || index}>
                      <strong>
                        {review.user_name || review.full_name || 'Khách hàng'}
                      </strong>
                      <span>
                        <i className="ri-star-fill"></i>{' '}
                        {review.rating_stars || review.rating}
                      </span>
                      <p>{review.comment || 'Không có nội dung.'}</p>
                    </article>
                  ))
                ) : (
                  <p>Chưa có đánh giá nào.</p>
                )}
              </div>

              <form className="review-form" onSubmit={handleReviewSubmit}>
                <label>
                  Số sao
                  <Rate value={rating} onChange={setRating} style={{ color: '#f1a619' }} />
                </label>
                <label>
                  Nhận xét
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Chia sẻ trải nghiệm của bạn"
                    required
                  ></textarea>
                </label>
                <button type="submit" disabled={isSubmitting}>
                  {user ? 'Gửi đánh giá' : 'Đăng nhập để đánh giá'}
                </button>
              </form>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
