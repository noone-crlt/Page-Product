import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { useApp } from '../../context/AppContext';
import './ProductCoverflow.css';

const THEMES = [
  { bg: '#0F172A', textColor: '#FFFFFF' }, // Dark slate
  { bg: '#F8FAFC', textColor: '#0F172A' }, // Light slate
  { bg: '#18181B', textColor: '#FFFFFF' }, // Zinc dark
  { bg: '#F3F4F6', textColor: '#111827' }, // Gray light
  { bg: '#1E1B4B', textColor: '#FFFFFF' }, // Indigo dark
  { bg: '#FEF2F2', textColor: '#450A0A' }, // Red light
];

export default function ProductCoverflow() {
  const { displayedProducts } = useApp();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const timerRef = useRef(null);

  // Lấy tối đa 6 sản phẩm đầu tiên có ảnh hợp lệ
  const carouselProducts = useMemo(() => {
    if (!displayedProducts || displayedProducts.length === 0) return [];
    return displayedProducts.slice(0, 6).map((product, index) => {
      const theme = THEMES[index % THEMES.length];
      const ghostText = (product.brand?.name || product.brand || 'STORE').toUpperCase();
      
      return {
        id: product.id,
        name: product.name,
        brand: product.brand?.name || product.brand || 'Thương hiệu',
        price: new Intl.NumberFormat('vi-VN').format(product.price) + 'đ',
        description: product.description || 'Sản phẩm chính hãng chất lượng cao.',
        image: product.image,
        bg: theme.bg,
        textColor: theme.textColor,
        ghostText: ghostText.length > 8 ? ghostText.substring(0, 8) : ghostText
      };
    });
  }, [displayedProducts]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Preload images
  useEffect(() => {
    carouselProducts.forEach((product) => {
      if (product.image) {
        const img = new Image();
        img.src = product.image;
      }
    });
  }, [carouselProducts]);

  const handleNext = () => {
    if (isAnimating || carouselProducts.length === 0) return;
    setIsAnimating(true);
    setActiveIndex((prev) => (prev + 1) % carouselProducts.length);
    setTimeout(() => setIsAnimating(false), 650);
    resetAutoPlay();
  };

  const handlePrev = () => {
    if (isAnimating || carouselProducts.length === 0) return;
    setIsAnimating(true);
    setActiveIndex((prev) => (prev - 1 + carouselProducts.length) % carouselProducts.length);
    setTimeout(() => setIsAnimating(false), 650);
    resetAutoPlay();
  };
  
  const resetAutoPlay = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (carouselProducts.length > 0) {
      timerRef.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % carouselProducts.length);
      }, 5000);
    }
  };
  
  useEffect(() => {
    resetAutoPlay();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [carouselProducts.length]);

  if (carouselProducts.length === 0) return null;

  const activeProduct = carouselProducts[activeIndex] || carouselProducts[0];

  return (
    <div 
      className="coverflow-container"
      style={{
        backgroundColor: activeProduct.bg,
        color: activeProduct.textColor
      }}
    >
      {/* SVG Grain Overlay */}
      <div className="coverflow-grain" />

      {/* Background Ghost Text */}
      <div className="coverflow-ghost-text" key={activeProduct.id}>
        {activeProduct.ghostText}
      </div>

      <div className="coverflow-brand">MY STORE</div>

      <div className="coverflow-layout">
        {/* Left Side: Product Info */}
        <div className="coverflow-info">
          <div className="coverflow-info-content">
            <span className="coverflow-brand-tag">{activeProduct.brand}</span>
            <h1 className="coverflow-title">{activeProduct.name}</h1>
            <p className="coverflow-desc">{activeProduct.description}</p>
            <strong className="coverflow-price">{activeProduct.price}</strong>
            
            <div className="coverflow-actions">
              <a href="#product-catalog" className="coverflow-btn">Khám phá ngay</a>
            </div>
          </div>
          
          <div className="coverflow-nav">
            <button onClick={handlePrev} disabled={isAnimating} aria-label="Previous">
              <CaretLeft size={24} weight="bold" />
            </button>
            <div className="coverflow-indicators">
              {carouselProducts.map((_, idx) => (
                <span 
                  key={idx} 
                  className={idx === activeIndex ? 'active' : ''} 
                  onClick={() => {
                    if (isAnimating || idx === activeIndex) return;
                    setIsAnimating(true);
                    setActiveIndex(idx);
                    setTimeout(() => setIsAnimating(false), 650);
                    resetAutoPlay();
                  }}
                />
              ))}
            </div>
            <button onClick={handleNext} disabled={isAnimating} aria-label="Next">
              <CaretRight size={24} weight="bold" />
            </button>
          </div>
        </div>

        {/* Right Side: Carousel */}
        <div className="coverflow-gallery">
          {carouselProducts.map((product, idx) => {
            let role = 'back';
            if (idx === activeIndex) role = 'center';
            else if (idx === (activeIndex - 1 + carouselProducts.length) % carouselProducts.length) role = 'left';
            else if (idx === (activeIndex + 1) % carouselProducts.length) role = 'right';

            return (
              <div 
                key={product.id}
                className={`coverflow-item is-${role}`}
                onClick={() => {
                  if (role === 'right') handleNext();
                  if (role === 'left') handlePrev();
                }}
              >
                <img src={product.image} alt={product.name} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
