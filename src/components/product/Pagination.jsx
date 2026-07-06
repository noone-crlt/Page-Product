import React from 'react';
import { useApp } from '../../context/AppContext';

export default function Pagination() {
  const { currentPage, setCurrentPage, totalPages } = useApp();

  if (totalPages <= 1) return null;

  const goToPage = (page) => {
    setCurrentPage(page);
    document
      .getElementById('product-catalog')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="pagination-container" aria-label="Phân trang sản phẩm">
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Trang trước"
      >
        <i className="ri-arrow-left-s-line"></i>
      </button>

      {Array.from({ length: totalPages }, (_, index) => index + 1).map(
        (page) => (
          <button
            key={page}
            className={page === currentPage ? 'active' : ''}
            onClick={() => goToPage(page)}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ),
      )}

      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Trang sau"
      >
        <i className="ri-arrow-right-s-line"></i>
      </button>
    </nav>
  );
}
