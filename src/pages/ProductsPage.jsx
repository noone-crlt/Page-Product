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
import ProductCoverflow from '../components/carousel/ProductCoverflow';

const BANNERS = [];

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
    <ProductCoverflow />
    <main className="main-content">
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

