import React from 'react';
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

export default function ProductsPage() {
  return <>
    <Header />
    <main className="main-content">
      <section className="hero-section" aria-labelledby="products-heading">
        <div className="hero-text-side">
          <span className="hero-eyebrow">Công nghệ cho nhịp sống mới</span>
          <h1 id="products-heading">Chọn thiết bị phù hợp với cách bạn sống</h1>
          <p>Sản phẩm chính hãng, thông tin minh bạch và trải nghiệm mua sắm gọn gàng tại My Store.</p>
          <a className="hero-btn" href="#product-catalog">Khám phá sản phẩm</a>
        </div>
        <div className="hero-visual-side" aria-hidden="true">
          <i className="ri-smartphone-line"></i><i className="ri-headphone-line"></i><i className="ri-macbook-line"></i>
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
