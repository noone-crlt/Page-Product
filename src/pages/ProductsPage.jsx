import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SidebarFilter from '../components/product/SidebarFilter';
import CategoryFilter from '../components/product/CategoryFilter';
import SortDropdown from '../components/product/SortDropdown';
import ProductGrid from '../components/product/ProductGrid';
import Pagination from '../components/product/Pagination';
import CartSummary from '../components/product/CartSummary';
import ProductModal from '../components/product/ProductModal';
import AuthModal from '../components/auth/AuthModal';

import banner1 from '../picture/banner1.png';
import banner2 from '../picture/banner2.png';

const BANNERS = [banner1, banner2];

export default function ProductsPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNERS.length);
    }, 5000); // Chuyển ảnh sau 5 giây
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + BANNERS.length) % BANNERS.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % BANNERS.length);
  };

  return <>
    <Header />
    <main className="main-content">
      <section className="banner-slider" aria-label="Bảng tin quảng cáo">
        <div className="banner-slides-container">
          {BANNERS.map((banner, index) => (
            <div 
              key={index} 
              className={`banner-slide ${index === currentSlide ? 'active' : ''}`}
            >
              <img src={banner} alt={`Banner quảng cáo ${index + 1}`} />
            </div>
          ))}
        </div>
        
        <button 
          className="banner-control prev" 
          onClick={handlePrev} 
          aria-label="Ảnh trước"
        >
          <i className="ri-arrow-left-s-line"></i>
        </button>
        <button 
          className="banner-control next" 
          onClick={handleNext} 
          aria-label="Ảnh sau"
        >
          <i className="ri-arrow-right-s-line"></i>
        </button>

        <div className="banner-indicators">
          {BANNERS.map((_, index) => (
            <button
              key={index}
              className={`banner-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Chuyển tới ảnh ${index + 1}`}
            />
          ))}
        </div>
      </section>

      <section id="product-catalog" className="products-page-layout" aria-label="Danh sách sản phẩm">
        <SidebarFilter />
        <div className="products-main-area">
          <CategoryFilter />
          <SortDropdown />
          <ProductGrid />
          <Pagination />
        </div>
        <CartSummary mode="summary" />
      </section>
    </main>
    <AuthModal />
    <CartSummary mode="drawer" />
    <ProductModal />
    <Footer />
  </>;
}

