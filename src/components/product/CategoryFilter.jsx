import React from 'react';
import { CATEGORIES } from '../../constants/productsData';
import { useApp } from '../../context/AppContext';

const categoryIcons = {
  all: 'ri-layout-grid-line',
  'dien-thoai': 'ri-smartphone-line',
  laptop: 'ri-macbook-line',
  'phu-kien': 'ri-mouse-line',
  'dong-ho': 'ri-time-line',
  'am-thanh': 'ri-headphone-line',
  khac: 'ri-more-line',
};

export default function CategoryFilter() {
  const { activeCategory, setActiveCategory } = useApp();

  return (
    <div
      className="category-filter-chips"
      aria-label="Lọc nhanh theo danh mục"
    >
      {CATEGORIES.map((category) => (
        <button
          key={category.key}
          className={activeCategory === category.key ? 'active' : ''}
          onClick={() => setActiveCategory(category.key)}
        >
          <i className={categoryIcons[category.key]}></i>
          {category.label}
        </button>
      ))}
    </div>
  );
}
