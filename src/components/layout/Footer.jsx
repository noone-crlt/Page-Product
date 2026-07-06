import React from 'react';

export default function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-brand">
          <h2><i className="ri-store-2-fill"></i> My Store</h2>
          <p>Thiết bị công nghệ chính hãng cho công việc, sáng tạo và giải trí mỗi ngày.</p>
        </div>
        <div>
          <h3>Về chúng tôi</h3>
          <a href="#product-catalog">Sản phẩm</a>
          <a href="#product-catalog">Thương hiệu</a>
          <a href="#product-catalog">Chính sách</a>
        </div>
        <div>
          <h3>Hỗ trợ</h3>
          <a href="#product-catalog">Hướng dẫn mua hàng</a>
          <a href="#product-catalog">Bảo hành</a>
          <a href="#product-catalog">Liên hệ</a>
        </div>
        <div>
          <h3>Kết nối với chúng tôi</h3>
          <div className="social-links">
            <a href="#product-catalog" aria-label="Facebook"><i className="ri-facebook-fill"></i></a>
            <a href="#product-catalog" aria-label="Instagram"><i className="ri-instagram-line"></i></a>
            <a href="#product-catalog" aria-label="YouTube"><i className="ri-youtube-line"></i></a>
          </div>
          <p>Thanh toán an toàn <i className="ri-visa-line"></i> <i className="ri-mastercard-line"></i></p>
        </div>
      </div>
      <div className="footer-bottom">© 2026 My Store. Bảo lưu mọi quyền.</div>
    </footer>
  );
}
