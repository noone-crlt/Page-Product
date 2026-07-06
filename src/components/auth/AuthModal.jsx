import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import * as authApi from '../../services/authApi';

export default function AuthModal() {
  const { isAuthOpen, setIsAuthOpen, login } = useApp();
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthOpen) return undefined;

    const timer = setTimeout(() => {
      setActiveTab('login');
      setEmail('');
      setPassword('');
      setFullName('');
      setPhoneNumber('');
      setError('');
    }, 200);

    return () => clearTimeout(timer);
  }, [isAuthOpen]);

  useEffect(() => {
    if (!isAuthOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsAuthOpen(false);
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isAuthOpen, setIsAuthOpen]);

  if (!isAuthOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (activeTab === 'register') {
        await authApi.register({
          full_name: fullName,
          email,
          password,
          phone_number: phoneNumber || null,
        });
      }

      const result = await authApi.login(email, password);
      const data = result?.data || result || {};
      const userData = data.user || data;

      await login({
        name: userData.full_name || userData.name || email.split('@')[0],
        email: userData.email || email,
      });
    } catch (requestError) {
      setError(
        requestError.status === 401
          ? 'Email hoặc mật khẩu không đúng.'
          : requestError.message || 'Không thể xác thực tài khoản.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeTab = (tab) => {
    setActiveTab(tab);
    setError('');
  };

  return (
    <div
      className="auth-backdrop"
      onMouseDown={() => setIsAuthOpen(false)}
      role="presentation"
    >
      <section
        className="auth-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <button
          className="auth-close-btn"
          onClick={() => setIsAuthOpen(false)}
          aria-label="Đóng"
        >
          <i className="ri-close-line"></i>
        </button>

        <div className="auth-header">
          <h2 id="auth-title">
            {activeTab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </h2>
          <p>
            {activeTab === 'login'
              ? 'Chào mừng bạn quay trở lại My Store.'
              : 'Đăng ký để đồng bộ giỏ hàng với tài khoản của bạn.'}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            className={activeTab === 'login' ? 'active' : ''}
            onClick={() => changeTab('login')}
            type="button"
          >
            Đăng nhập
          </button>
          <button
            className={activeTab === 'register' ? 'active' : ''}
            onClick={() => changeTab('register')}
            type="button"
          >
            Đăng ký
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {activeTab === 'register' && (
            <>
              <div className="form-group">
                <label htmlFor="full-name">Họ và tên</label>
                <input
                  id="full-name"
                  type="text"
                  placeholder="Nguyễn Văn An"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone-number">Số điện thoại</label>
                <input
                  id="phone-number"
                  type="tel"
                  placeholder="0901 234 567"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              placeholder="hello@mystore.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Mật khẩu</label>
            <input
              id="auth-password"
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error && (
            <p className="auth-error" role="alert">
              <i className="ri-error-warning-line"></i>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <i className="ri-loader-4-line spinner"></i>
                Đang xử lý...
              </>
            ) : activeTab === 'login' ? (
              'Đăng nhập'
            ) : (
              'Đăng ký ngay'
            )}
          </button>
        </form>
      </section>
    </div>
  );
}
