import React, { lazy, Suspense } from 'react'
import { AppProvider } from './context/AppContext'
import ProductsPage from './pages/ProductsPage'
import { canAccessDashboard } from './services/authApi'
import ChatBubble from './components/chat/ChatBubble'
import AdminChatBubble from './admin/components/AdminChatBubble'

const AdminDashboard = lazy(() => import('./admin/components/AdminDashboard'))
const AdminProducts = lazy(() => import('./admin/components/AdminProducts'))
const AdminOrders = lazy(() => import('./admin/components/AdminOrders'))
const AdminCustomers = lazy(() => import('./admin/components/AdminCustomers'))
const AdminBrands = lazy(() => import('./admin/components/AdminBrands'))
const AdminCategories = lazy(() => import('./admin/components/AdminCategories'))

function App() {
  const isAdminPage = window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/')

  const renderContent = () => {
    if (isAdminPage) {
      if (!canAccessDashboard()) {
        return (
          <main className="admin-access-denied">
            <div className="admin-access-denied__icon" aria-hidden="true">
              <i className="ri-shield-keyhole-line"></i>
            </div>
            <span>Khu vực quản trị</span>
            <h1>Bạn không có quyền truy cập</h1>
            <p>Dashboard chỉ dành cho tài khoản quản trị được cấp phép.</p>
            <a href="/">Quay về cửa hàng</a>
          </main>
        )
      }

      const AdminPage = window.location.pathname.startsWith('/admin/products')
        ? AdminProducts
        : window.location.pathname.startsWith('/admin/categories')
          ? AdminCategories
          : window.location.pathname.startsWith('/admin/brands')
            ? AdminBrands
            : window.location.pathname.startsWith('/admin/orders')
              ? AdminOrders
              : window.location.pathname.startsWith('/admin/customers')
                ? AdminCustomers
                : AdminDashboard

      return (
        <Suspense fallback={<div className="admin-route-loading" aria-live="polite">Đang tải trang quản trị...</div>}>
          <AdminPage />
        </Suspense>
      )
    }

    return (
      <div className="app-container">
        <ProductsPage />
      </div>
    )
  }

  return (
    <AppProvider>
      {renderContent()}
      {!isAdminPage && <ChatBubble />}
      {isAdminPage && canAccessDashboard() && <AdminChatBubble />}
    </AppProvider>
  )
}


export default App
