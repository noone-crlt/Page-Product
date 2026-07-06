import React from 'react';
import { useApp } from '../../context/AppContext';
import { BRANDS, CATEGORIES } from '../../constants/productsData';

export default function SidebarFilter() {
  const {
    activeCategory,
    setActiveCategory,
    selectedBrands,
    toggleBrand,
    priceRange,
    setPriceRange,
    ratingFilter,
    setRatingFilter,
    resetFilters,
    filteredProductsCount,
  } = useApp();

  const formatPrice = (value) => new Intl.NumberFormat('vi-VN').format(value);

  return (
    <aside className="sidebar-filter" aria-label="Bộ lọc sản phẩm">
      <div className="filter-heading">
        <div>
          <span>Bộ lọc</span>
          <strong>{filteredProductsCount} sản phẩm</strong>
        </div>
        <button onClick={resetFilters}>Đặt lại</button>
      </div>

      <div className="filter-group">
        <h2>Danh mục</h2>
        {CATEGORIES.map((category) => (
          <button
            key={category.key}
            className={`filter-option ${
              activeCategory === category.key ? 'active' : ''
            }`}
            onClick={() => setActiveCategory(category.key)}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="filter-group">
        <h2>Thương hiệu</h2>
        {BRANDS.map((brand) => (
          <label className="checkbox-option" key={brand}>
            <input
              type="checkbox"
              checked={selectedBrands.includes(brand)}
              onChange={() => toggleBrand(brand)}
            />
            <span>{brand}</span>
          </label>
        ))}
      </div>

      <div className="filter-group">
        <h2>Khoảng giá</h2>
        <input
          className="price-slider"
          type="range"
          min="0"
          max="50000000"
          step="1000000"
          value={priceRange[1]}
          onChange={(event) => setPriceRange([0, Number(event.target.value)])}
          aria-label="Giá tối đa"
        />
        <div className="price-range-label">
          <span>0 ₫</span>
          <strong>{formatPrice(priceRange[1])} ₫</strong>
        </div>
      </div>

      <div className="filter-group">
        <h2>Đánh giá</h2>
        {[4, 3, 2, 1].map((stars) => (
          <button
            key={stars}
            className={`rating-filter ${
              ratingFilter === stars ? 'active' : ''
            }`}
            onClick={() =>
              setRatingFilter(ratingFilter === stars ? null : stars)
            }
          >
            <span>
              {[1, 2, 3, 4, 5].map((star) => (
                <i
                  key={star}
                  className={star <= stars ? 'ri-star-fill' : 'ri-star-line'}
                ></i>
              ))}
            </span>
            {stars} sao trở lên
          </button>
        ))}
      </div>
    </aside>
  );
}
