import React from 'react';
import { useApp } from '../../context/AppContext';

export default function SortDropdown() {
  const { sortBy, setSortBy, filteredProductsCount } = useApp();

  return (
    <div className="sort-dropdown-container">
      <p>
        Hiển thị <strong>{filteredProductsCount}</strong> sản phẩm phù hợp
      </p>

      <label>
        <span>Sắp xếp</span>
        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
        >
          <option value="popular">Phổ biến nhất</option>
          <option value="newest">Mới nhất</option>
          <option value="price-asc">Giá thấp đến cao</option>
          <option value="price-desc">Giá cao đến thấp</option>
          <option value="rating">Đánh giá cao nhất</option>
          <option value="best-selling">Bán chạy nhất</option>
        </select>
        <i className="ri-arrow-down-s-line"></i>
      </label>
    </div>
  );
}
