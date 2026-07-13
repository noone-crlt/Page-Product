# My Store (Page - Product)

Dự án **My Store** là một ứng dụng web thương mại điện tử đơn giản với giao diện hiển thị sản phẩm và hệ thống quản trị (Admin Dashboard) mạnh mẽ.

## 🚀 Công nghệ sử dụng

Dự án được xây dựng bằng các công nghệ hiện đại:

- **Frontend Framework:** React 19, Vite
- **Ngôn ngữ:** JavaScript / TypeScript
- **UI & Styling:** Ant Design, Phosphor Icons, Remixicon, CSS tuỳ chỉnh
- **Biểu đồ:** Chart.js, react-chartjs-2
- **Thời gian thực (Real-time):** @microsoft/signalr (Hỗ trợ hệ thống thông báo realtime cho Admin)

## 📂 Cấu trúc dự án

- `/src/pages`: Chứa trang chính của cửa hàng (ví dụ: `ProductsPage.jsx` hiển thị danh sách sản phẩm).
- `/src/admin`: Chứa toàn bộ logic và giao diện cho khu vực Quản trị viên (Admin Dashboard, Quản lý Đơn hàng, Quản lý Sản phẩm, v.v.).
- `/src/context`: Chứa Context API quản lý trạng thái chung của ứng dụng (`AppContext`).
- `/src/services`: Chứa các API client và dịch vụ xác thực (`apiClient.js`, `authApi.js`).
- `/src/components`: Các component dùng chung (ví dụ: Header, Layout...).

## 🌟 Chức năng chính

1. **Cửa hàng (Client):**
   - Xem danh sách sản phẩm.
2. **Khu vực Quản trị (Admin Dashboard):**
   - Phân quyền: Yêu cầu xác thực tài khoản quản trị mới có thể truy cập `/admin`.
   - **Dashboard**: Trang tổng quan với các biểu đồ thống kê (sử dụng Chart.js).
   - **Quản lý Sản phẩm**: Xem và thao tác với các sản phẩm (`/admin/products`).
   - **Quản lý Đơn hàng**: Theo dõi và xử lý đơn hàng (`/admin/orders`).
   - **Thông báo Real-time**: Nhận thông báo trực tiếp khi có sự kiện mới trong hệ thống.

## 🛠 Hướng dẫn cài đặt và chạy dự án

### 1. Cài đặt thư viện

Đảm bảo bạn đã cài đặt Node.js, sau đó chạy lệnh sau trong thư mục gốc của dự án:

```bash
npm install
```

### 2. Chạy ứng dụng môi trường phát triển (Development)

```bash
npm run dev
```

Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:5174` (mặc định của Vite).

### 3. Build cho Production

```bash
npm run build
```

Lệnh này sẽ tối ưu hóa và build các file tĩnh vào thư mục `dist`.

### 4. Xem trước bản Build (Preview)

```bash
npm run preview
```

## 🔒 Phân quyền Admin

Để vào trang quản trị, truy cập đường dẫn `/admin`. Hệ thống sẽ tự động kiểm tra quyền quản trị của người dùng hiện tại thông qua `authApi.js`. Nếu không có quyền, người dùng sẽ bị từ chối và hiển thị màn hình "Không có quyền truy cập".