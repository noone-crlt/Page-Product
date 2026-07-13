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
    storeCategories,
    storeBrands,
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
        <button
          className={`filter-option ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          Tất cả
        </button>
        {(storeCategories.length > 0 ? storeCategories : CATEGORIES.filter(c => c.key !== 'all')).map((category) => (
          <button
            key={category.category_id || category.key}
            className={`filter-option ${
              String(activeCategory) === String(category.category_id || category.key) ? 'active' : ''
            }`}
            onClick={() => setActiveCategory(String(category.category_id || category.key))}
          >
            {category.name || category.label}
          </button>
        ))}
      </div>

      <div className="filter-group">
        <h2>Thương hiệu</h2>
        {(storeBrands.length > 0 ? storeBrands : BRANDS.map(name => ({ brand_id: name, name }))).map((brand) => (
          <label className="checkbox-option" key={brand.brand_id}>
            <input
              type="checkbox"
              checked={selectedBrands.includes(String(brand.brand_id))}
              onChange={() => toggleBrand(String(brand.brand_id))}
            />
            <span>{brand.name}</span>
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
