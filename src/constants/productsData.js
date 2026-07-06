const image = (seed) => `https://picsum.photos/seed/${seed}/720/720`;

const baseSpecs = {
  screen: "Không áp dụng",
  cpu: "Không áp dụng",
  ram: "Không áp dụng",
  storage: "Không áp dụng",
  battery: "Không áp dụng",
  camera: "Không áp dụng",
};

const createProduct = (product) => ({
  colors: [{ name: "Đen", hex: "#25282d" }],
  capacities: ["Tiêu chuẩn"],
  specs: baseSpecs,
  ...product,
});

export const PRODUCTS = [
  createProduct({ id: 1, name: "iPhone 15 128GB", brand: "Apple", category: "dien-thoai", price: 19990000, originalPrice: 24990000, discount: 20, rating: 4.8, reviewsCount: 128, soldCount: 520, stock: 20, image: image("iphone-15-blue"), createdAt: "2025-01-18", description: "Dynamic Island, camera chính 48MP và cổng USB-C trong thiết kế kính pha màu bền bỉ.", capacities: ["128GB", "256GB", "512GB"], colors: [{ name: "Đen", hex: "#25282d" }, { name: "Xanh", hex: "#cbdde8" }], specs: { ...baseSpecs, screen: "6.1 inch Super Retina XDR", cpu: "Apple A16 Bionic", storage: "128GB", camera: "48MP" } }),
  createProduct({ id: 2, name: "Samsung Galaxy S24 Ultra", brand: "Samsung", category: "dien-thoai", price: 26990000, originalPrice: 29990000, discount: 10, rating: 4.9, reviewsCount: 96, soldCount: 438, stock: 16, image: image("galaxy-s24-ultra"), createdAt: "2025-02-06", description: "Khung titan, bút S Pen và camera 200MP kết hợp các tính năng Galaxy AI.", capacities: ["256GB", "512GB"], specs: { ...baseSpecs, screen: "6.8 inch Dynamic AMOLED 2X", cpu: "Snapdragon 8 Gen 3", ram: "12GB", camera: "200MP" } }),
  createProduct({ id: 3, name: "Xiaomi Redmi Note 13", brand: "Xiaomi", category: "dien-thoai", price: 4290000, originalPrice: 4890000, discount: 12, rating: 4.5, reviewsCount: 112, soldCount: 864, stock: 38, image: image("redmi-note-13"), createdAt: "2024-11-12", description: "Màn hình AMOLED 120Hz, camera 108MP và pin 5.000mAh hỗ trợ sạc nhanh.", capacities: ["128GB", "256GB"], specs: { ...baseSpecs, screen: "6.67 inch AMOLED 120Hz", cpu: "Snapdragon 685", ram: "6GB", camera: "108MP" } }),
  createProduct({ id: 4, name: "iPhone 16 Pro 256GB", brand: "Apple", category: "dien-thoai", price: 28990000, originalPrice: 31990000, discount: 9, rating: 4.9, reviewsCount: 82, soldCount: 296, stock: 12, image: image("iphone-16-pro"), createdAt: "2025-04-24", description: "Chip A18 Pro mạnh mẽ, nút Điều khiển Camera và hệ thống camera chuyên nghiệp.", capacities: ["256GB", "512GB", "1TB"], specs: { ...baseSpecs, screen: "6.3 inch Super Retina XDR", cpu: "Apple A18 Pro", ram: "8GB", camera: "48MP" } }),
  createProduct({ id: 5, name: "MacBook Air M2 13 inch", brand: "Apple", category: "laptop", price: 24990000, originalPrice: 27990000, discount: 11, rating: 4.9, reviewsCount: 95, soldCount: 312, stock: 14, image: image("macbook-air-m2"), createdAt: "2024-09-05", description: "Thiết kế mỏng nhẹ, chip Apple M2 và thời lượng pin lên đến 18 giờ.", capacities: ["8GB/256GB", "16GB/512GB"], specs: { ...baseSpecs, screen: "13.6 inch Liquid Retina", cpu: "Apple M2", ram: "8GB", storage: "256GB SSD" } }),
  createProduct({ id: 6, name: "ASUS Zenbook 14 OLED", brand: "ASUS", category: "laptop", price: 22990000, originalPrice: 24990000, discount: 8, rating: 4.7, reviewsCount: 67, soldCount: 204, stock: 11, image: image("asus-zenbook-oled"), createdAt: "2025-03-10", description: "Laptop mỏng nhẹ với màn hình OLED sắc nét và hiệu năng ổn định cho công việc.", capacities: ["16GB/512GB"], specs: { ...baseSpecs, screen: "14 inch OLED 2.8K", cpu: "Intel Core Ultra 5", ram: "16GB", storage: "512GB SSD" } }),
  createProduct({ id: 7, name: "Dell Inspiron 14 Plus", brand: "Dell", category: "laptop", price: 20990000, originalPrice: 22990000, discount: 9, rating: 4.6, reviewsCount: 54, soldCount: 176, stock: 9, image: image("dell-inspiron-14"), createdAt: "2025-01-27", description: "Thiết kế nhôm chắc chắn, màn hình tỷ lệ 16:10 và bàn phím thoải mái.", capacities: ["16GB/512GB"], specs: { ...baseSpecs, screen: "14 inch 2.2K", cpu: "Intel Core Ultra 5", ram: "16GB", storage: "512GB SSD" } }),
  createProduct({ id: 8, name: "Sony WH-1000XM5", brand: "Sony", category: "am-thanh", price: 6990000, originalPrice: 8490000, discount: 18, rating: 4.7, reviewsCount: 84, soldCount: 418, stock: 23, image: image("sony-wh1000xm5"), createdAt: "2024-08-20", description: "Tai nghe chống ồn chủ động cao cấp, âm thanh rõ nét và đàm thoại tự nhiên.", colors: [{ name: "Đen", hex: "#25282d" }, { name: "Bạc", hex: "#d8d7d2" }], specs: { ...baseSpecs, cpu: "Sony V1", battery: "30 giờ" } }),
  createProduct({ id: 9, name: "AirPods Pro 2 USB-C", brand: "Apple", category: "am-thanh", price: 5490000, originalPrice: 6190000, discount: 11, rating: 4.8, reviewsCount: 142, soldCount: 728, stock: 34, image: image("airpods-pro-2"), createdAt: "2024-12-02", description: "Chống ồn chủ động, âm thanh thích ứng và hộp sạc USB-C tiện dụng.", colors: [{ name: "Trắng", hex: "#f3f3f1" }], specs: { ...baseSpecs, cpu: "Apple H2", battery: "30 giờ kèm hộp sạc" } }),
  createProduct({ id: 10, name: "Loa Sony SRS-XG300", brand: "Sony", category: "am-thanh", price: 4590000, originalPrice: 5290000, discount: 13, rating: 4.6, reviewsCount: 61, soldCount: 188, stock: 18, image: image("sony-xg300-speaker"), createdAt: "2024-10-15", description: "Loa di động âm trầm mạnh, kháng nước và thời lượng pin bền bỉ cho những chuyến đi.", specs: { ...baseSpecs, battery: "25 giờ" } }),
  createProduct({ id: 11, name: "Apple Watch Series 9", brand: "Apple", category: "dong-ho", price: 10490000, originalPrice: 11290000, discount: 7, rating: 4.6, reviewsCount: 74, soldCount: 263, stock: 15, image: image("apple-watch-series-9"), createdAt: "2024-07-11", description: "Chip S9 mạnh mẽ, cử chỉ chạm hai lần và màn hình Retina luôn bật.", capacities: ["41mm", "45mm"], specs: { ...baseSpecs, screen: "Retina OLED", cpu: "Apple S9", storage: "64GB", battery: "18 giờ" } }),
  createProduct({ id: 12, name: "Samsung Galaxy Watch7", brand: "Samsung", category: "dong-ho", price: 6490000, originalPrice: 7290000, discount: 11, rating: 4.5, reviewsCount: 59, soldCount: 214, stock: 21, image: image("galaxy-watch-7"), createdAt: "2025-02-22", description: "Theo dõi sức khỏe chuyên sâu, GPS băng tần kép và thiết kế hiện đại.", capacities: ["40mm", "44mm"], specs: { ...baseSpecs, screen: "Super AMOLED", cpu: "Exynos W1000", storage: "32GB", battery: "40 giờ" } }),
  createProduct({ id: 13, name: "Logitech MX Master 3S", brand: "Logitech", category: "phu-kien", price: 2290000, originalPrice: 2490000, discount: 8, rating: 4.8, reviewsCount: 156, soldCount: 912, stock: 42, image: image("mx-master-3s"), createdAt: "2024-06-18", description: "Chuột công thái học với cảm biến 8.000 DPI và thao tác cuộn MagSpeed yên tĩnh.", specs: { ...baseSpecs, battery: "70 ngày" } }),
  createProduct({ id: 14, name: "Bàn phím ASUS ROG Strix Scope II", brand: "ASUS", category: "phu-kien", price: 3290000, originalPrice: 3790000, discount: 13, rating: 4.7, reviewsCount: 73, soldCount: 347, stock: 26, image: image("rog-scope-keyboard"), createdAt: "2025-03-28", description: "Bàn phím cơ không dây, switch có thể thay nóng và đệm kê tay thoải mái.", specs: { ...baseSpecs, battery: "1.500 giờ" } }),
  createProduct({ id: 15, name: "Sạc nhanh Samsung 45W", brand: "Samsung", category: "phu-kien", price: 890000, originalPrice: 1090000, discount: 18, rating: 4.4, reviewsCount: 203, soldCount: 1246, stock: 65, image: image("samsung-charger-45w"), createdAt: "2024-05-09", description: "Bộ sạc USB-C công suất 45W hỗ trợ chuẩn Power Delivery an toàn.", colors: [{ name: "Đen", hex: "#25282d" }, { name: "Trắng", hex: "#f3f3f1" }], specs: { ...baseSpecs, battery: "Công suất 45W" } }),
  createProduct({ id: 16, name: "Máy đọc sách Xiaomi 7 inch", brand: "Xiaomi", category: "khac", price: 3890000, originalPrice: 4290000, discount: 9, rating: 4.3, reviewsCount: 48, soldCount: 139, stock: 13, image: image("xiaomi-ereader"), createdAt: "2025-04-08", description: "Màn hình mực điện tử chống chói, thân máy nhẹ và pin dùng nhiều tuần.", capacities: ["64GB"], specs: { ...baseSpecs, screen: "7 inch E-Ink", storage: "64GB", battery: "Nhiều tuần" } }),
];

export const CATEGORIES = [
  { key: "all", label: "Tất cả" },
  { key: "dien-thoai", label: "Điện thoại" },
  { key: "laptop", label: "Laptop" },
  { key: "phu-kien", label: "Phụ kiện" },
  { key: "dong-ho", label: "Đồng hồ" },
  { key: "am-thanh", label: "Âm thanh" },
  { key: "khac", label: "Khác" },
];

export const BRANDS = ["Apple", "Samsung", "Xiaomi", "ASUS", "Dell", "Sony", "Logitech"];
