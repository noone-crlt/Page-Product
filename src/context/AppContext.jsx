import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { CATEGORIES } from '../constants/productsData';
import { getProducts, getProductById } from '../services/productApi';
import { addCartItem, deleteCartItem, getCart } from '../services/cartApi';
import { clearAuthTokens } from '../services/authApi';

const AppContext = createContext(null);
const CART_KEY = 'my_store_cart';

const readCart = () => {
  try {
    const value = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const normalize = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

const inferBrand = (name = '') => {
  const brands = ['Apple', 'Samsung', 'Xiaomi', 'ASUS', 'Dell', 'Sony', 'Logitech'];
  return brands.find((brand) => normalize(name).includes(normalize(brand))) || 'Khác';
};

const inferCategory = (name = '') => {
  const value = normalize(name);

  if (/iphone|galaxy s|redmi|dien thoai/.test(value)) return 'dien-thoai';
  if (/macbook|zenbook|inspiron|laptop/.test(value)) return 'laptop';
  if (/watch|dong ho/.test(value)) return 'dong-ho';
  if (/airpods|tai nghe|loa|headphone/.test(value)) return 'am-thanh';
  if (/chuot|ban phim|sac|keyboard|mouse/.test(value)) return 'phu-kien';
  return 'khac';
};

const mapProduct = (product) => ({
  id: product.product_id,
  name: product.name,
  brand: inferBrand(product.name),
  category: inferCategory(product.name),
  price: Number(product.min_price || 0),
  originalPrice: Number(product.max_price || product.min_price || 0),
  discount: Number(product.discount_percentage || 0),
  rating: Number(product.average_rating || 0),
  reviewsCount: Number(product.total_reviews || 0),
  soldCount: 0,
  stock: 0,
  image: product.thumbnail_url || 'https://picsum.photos/seed/product/720/720',
  createdAt: null,
  description: 'Thông tin chi tiết sản phẩm sẽ được cập nhật từ hệ thống.',
  colors: [],
  capacities: [],
  variants: [],
});

export const AppProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [cartError, setCartError] = useState('');
  const [cart, setCart] = useState(readCart);
  const [searchQuery, setSearchQueryState] = useState('');
  const [activeCategory, setActiveCategoryState] = useState('all');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [priceRange, setPriceRangeState] = useState([0, 50000000]);
  const [ratingFilter, setRatingFilterState] = useState(null);
  const [sortBy, setSortByState] = useState('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const loadProducts = async () => {
    setIsProductsLoading(true);
    setProductsError('');

    try {
      const result = await getProducts({ page: 1, limit: 100 });
      const data = Array.isArray(result?.data) ? result.data : [];
      setProducts(data.map(mapProduct));
    } catch (error) {
      setProductsError(error.message || 'Không thể tải sản phẩm từ máy chủ.');
    } finally {
      setIsProductsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      // Không chặn trải nghiệm nếu trình duyệt khóa bộ nhớ cục bộ.
    }
  }, [cart]);

  const resetPage = (setter) => (value) => {
    setter(value);
    setCurrentPage(1);
  };

  const setSearchQuery = resetPage(setSearchQueryState);
  const setActiveCategory = resetPage(setActiveCategoryState);
  const setPriceRange = resetPage(setPriceRangeState);
  const setRatingFilter = resetPage(setRatingFilterState);
  const setSortBy = resetPage(setSortByState);

  const addLocalCartItem = (product, quantity, color, capacity, cartItemId) => {
    setCart((items) => {
      const index = items.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.color?.name === color?.name &&
          item.capacity === capacity,
      );

      if (index < 0) {
        return [
          ...items,
          { product, quantity, color, capacity, cartItemId },
        ];
      }

      return items.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, quantity: item.quantity + quantity, cartItemId }
          : item,
      );
    });
  };

  const resolveVariant = async (product, color, capacity) => {
    const result = await getProductById(product.id);
    const detail = result?.data || result;
    const variants = Array.isArray(detail?.variants) ? detail.variants : [];

    return (
      variants.find(
        (variant) =>
          (!color || variant.color === color.name) &&
          (!capacity || variant.storage === capacity),
      ) || variants[0]
    );
  };

  const addToCart = async (
    product,
    quantity = 1,
    color = null,
    capacity = null,
  ) => {
    setCartError('');
    const selectedColor = color || product.colors?.[0] || null;
    const selectedCapacity = capacity || product.capacities?.[0] || null;
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      addLocalCartItem(
        product,
        quantity,
        selectedColor,
        selectedCapacity,
        null,
      );
      return;
    }

    try {
      const variant = await resolveVariant(
        product,
        selectedColor,
        selectedCapacity,
      );

      if (!variant?.product_variant_id) {
        throw new Error('Sản phẩm chưa có biến thể để thêm vào giỏ.');
      }

      const result = await addCartItem(variant.product_variant_id, quantity);
      const resultData = result?.data || result;

      addLocalCartItem(
        product,
        quantity,
        selectedColor,
        selectedCapacity,
        resultData?.cart_item_id || null,
      );
    } catch (error) {
      setCartError(error.message || 'Không thể thêm sản phẩm vào giỏ.');
    }
  };

  const removeFromCart = async (productId, colorName, capacity) => {
    const item = cart.find(
      (cartItem) =>
        cartItem.product.id === productId &&
        cartItem.color?.name === colorName &&
        cartItem.capacity === capacity,
    );

    try {
      if (item?.cartItemId && localStorage.getItem('accessToken')) {
        await deleteCartItem(item.cartItemId);
      }

      setCart((items) => items.filter((cartItem) => cartItem !== item));
    } catch (error) {
      setCartError(error.message || 'Không thể xóa sản phẩm khỏi giỏ.');
    }
  };

  const updateCartQuantity = (productId, colorName, capacity, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, colorName, capacity);
      return;
    }

    setCart((items) =>
      items.map((item) =>
        item.product.id === productId &&
        item.color?.name === colorName &&
        item.capacity === capacity
          ? { ...item, quantity }
          : item,
      ),
    );
  };

  const toggleBrand = (brand) => {
    setSelectedBrands((brands) =>
      brands.includes(brand)
        ? brands.filter((item) => item !== brand)
        : [...brands, brand],
    );
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQueryState('');
    setActiveCategoryState('all');
    setSelectedBrands([]);
    setPriceRangeState([0, 50000000]);
    setRatingFilterState(null);
    setSortByState('popular');
    setCurrentPage(1);
  };

  const filteredProducts = useMemo(() => {
    const query = normalize(searchQuery);
    const result = products.filter((product) => {
      const categoryLabel =
        CATEGORIES.find((item) => item.key === product.category)?.label || '';
      const matchesSearch =
        !query ||
        [product.name, product.brand, categoryLabel].some((value) =>
          normalize(value).includes(query),
        );

      return (
        matchesSearch &&
        (activeCategory === 'all' || product.category === activeCategory) &&
        (!selectedBrands.length || selectedBrands.includes(product.brand)) &&
        product.price >= priceRange[0] &&
        product.price <= priceRange[1] &&
        (ratingFilter === null || product.rating >= ratingFilter)
      );
    });

    return result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'best-selling') return b.soldCount - a.soldCount;
      return b.reviewsCount - a.reviewsCount;
    });
  }, [
    activeCategory,
    priceRange,
    products,
    ratingFilter,
    searchQuery,
    selectedBrands,
    sortBy,
  ]);

  const itemsPerPage = 8;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / itemsPerPage),
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const displayedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const login = async (userData) => {
    setUser(userData);
    setIsAuthOpen(false);

    try {
      await getCart();
      setCartError('');
    } catch (error) {
      setCartError(error.message || 'Không thể tải giỏ hàng từ máy chủ.');
    }
  };

  const logout = () => {
    clearAuthTokens();
    setUser(null);
    setCart([]);
  };

  return (
    <AppContext.Provider
      value={{
        products,
        isProductsLoading,
        productsError,
        reloadProducts: loadProducts,
        cart,
        cartError,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart: () => setCart([]),
        searchQuery,
        setSearchQuery,
        activeCategory,
        setActiveCategory,
        selectedBrands,
        toggleBrand,
        priceRange,
        setPriceRange,
        ratingFilter,
        setRatingFilter,
        resetFilters,
        sortBy,
        setSortBy,
        currentPage,
        setCurrentPage,
        totalPages,
        filteredProductsCount: filteredProducts.length,
        displayedProducts,
        selectedProduct,
        setSelectedProduct,
        isCartOpen,
        setIsCartOpen,
        user,
        isAuthOpen,
        setIsAuthOpen,
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useApp phải được dùng bên trong AppProvider');
  }

  return context;
};
