import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CATEGORIES } from '../constants/productsData';
import { getProducts, getProductCategories, getProductBrands } from '../services/productApi';
import { addCartItem, deleteCartItem, getCart } from '../services/cartApi';
import { clearAuthTokens, getAuthenticatedUser } from '../services/authApi';
import { getWishlist, toggleWishlist as toggleWishlistApi } from '../services/wishlistApi';
import { getProfile } from '../services/profileApi';

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
  brand_id: product.brand_id,
  category_id: product.category_id,
  brand: product.brand_id ? String(product.brand_id) : inferBrand(product.name),
  category: product.category_id ? String(product.category_id) : inferCategory(product.name),
  price: Number(product.min_price || 0),
  originalPrice: Number(product.max_price || product.min_price || 0),
  discount: Number(product.discount_percentage || 0),
  rating: Number(product.average_rating || 0).toFixed(1),
  reviewsCount: Number(product.total_reviews || 0),
  soldCount: 0,
  stock: 0,
  image: product.thumbnail_url || product.image_url || product.images?.[0]?.image_url || 'https://picsum.photos/seed/product/720/720',
  createdAt: null,
  description: 'Thông tin chi tiết sản phẩm sẽ được cập nhật từ hệ thống.',
  colors: [],
  capacities: [],
  variants: [],
});

const mapCartItem = (item) => {
  const variant = item.product_variant || item.variant || {};
  const productData = item.product || variant.product || {};
  const productId =
    productData.product_id || item.product_id || variant.product_id || 0;
  const price = Number(
    item.sale_price || item.unit_price || variant.sale_price || variant.price || 0,
  );

  return {
    cartItemId: item.cart_item_id,
    quantity: Number(item.quantity || 1),
    color: item.color || variant.color
      ? { name: item.color || variant.color }
      : null,
    capacity: item.storage || variant.storage || null,
    product: {
      id: productId,
      name: productData.name || item.product_name || 'Sản phẩm',
      image:
        productData.thumbnail_url ||
        productData.image_url ||
        productData.images?.[0]?.image_url ||
        item.thumbnail_url ||
        item.image_url ||
        'https://picsum.photos/seed/cart-product/200/200',
      price,
    },
  };
};

export const AppProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [cartError, setCartError] = useState('');
  const [cart, setCart] = useState(readCart);
  const [searchQuery, setSearchQueryState] = useState('');
  const [activeCategory, setActiveCategoryState] = useState('all');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [storeCategories, setStoreCategories] = useState([]);
  const [storeBrands, setStoreBrands] = useState([]);
  const [priceRange, setPriceRangeState] = useState([0, 50000000]);
  const [ratingFilter, setRatingFilterState] = useState(null);
  const [sortBy, setSortByState] = useState('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [wishlistError, setWishlistError] = useState('');
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const syncedTokenRef = useRef(null);

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

  const loadCart = async () => {
    const result = await getCart();
    const data = result?.data || result || {};
    const items = Array.isArray(data.items) ? data.items : [];
    setCart(items.map(mapCartItem));
    return result;
  };

  const loadWishlist = async () => {
    setIsWishlistLoading(true);
    setWishlistError('');
    try {
      const result = await getWishlist();
      const data = Array.isArray(result?.data) ? result.data : [];
      setWishlistIds(
        data
          .map((item) => item.product_id || item.product?.product_id)
          .filter(Boolean),
      );
      return result;
    } catch (error) {
      setWishlistError(
        error.message || 'Không thể tải danh sách yêu thích.',
      );
      return null;
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const syncAccountData = async ({ force = false } = {}) => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;
    if (!force && syncedTokenRef.current === accessToken) return;

    syncedTokenRef.current = accessToken;
    const [cartResult] = await Promise.allSettled([
      loadCart(),
      loadWishlist(),
    ]);

    if (cartResult.status === 'rejected') {
      setCartError(
        cartResult.reason?.message || 'Không thể tải giỏ hàng từ máy chủ.',
      );
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) return;
    const authUser = getAuthenticatedUser() || { name: 'Tài khoản', email: '' };
    setUser(authUser);
    getProfile()
      .then((result) => {
        const profile = result?.data?.profile ?? result?.data ?? result;
        if (!profile) return;
        setUser((current) => ({
          ...current,
          name: profile.full_name || profile.name || current?.name || 'Tài khoản',
          email: profile.email || current?.email || '',
          phone: profile.phone_number || profile.phone || '',
          avatarUrl: profile.avatar_url || profile.avatarUrl || '',
        }));
      })
      .catch(() => {
        // Giữ thông tin từ token nếu API hồ sơ tạm thời không phản hồi.
      });
    syncAccountData();
    getProductCategories().then(res => setStoreCategories(res?.data || [])).catch(() => {});
    getProductBrands().then(res => setStoreBrands(res?.data || [])).catch(() => {});
  }, []);

  const addToCart = async (product, variant, quantity = 1) => {
    setCartError('');
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      setIsAuthOpen(true);
      setCartError('Vui lòng đăng nhập trước khi thêm sản phẩm vào giỏ.');
      return false;
    }

    try {
      if (!variant?.product_variant_id) {
        throw new Error('Sản phẩm chưa có biến thể để thêm vào giỏ.');
      }

      await addCartItem(variant.product_variant_id, quantity);
      await loadCart();
      return true;
    } catch (error) {
      setCartError(error.message || 'Không thể thêm sản phẩm vào giỏ.');
      return false;
    }
  };

  const removeFromCart = async (productId, colorName, capacity) => {
    const item = cart.find((cartItem) => {
      if (cartItem.cartItemId === productId) return true;
      return (
        cartItem.product.id === productId &&
        cartItem.color?.name === colorName &&
        cartItem.capacity === capacity
      );
    });

    try {
      if (item?.cartItemId && localStorage.getItem('accessToken')) {
        await deleteCartItem(item.cartItemId);
      }

      await loadCart();
    } catch (error) {
      setCartError(error.message || 'Không thể xóa sản phẩm khỏi giỏ.');
    }
  };

  const toggleWishlist = async (productId) => {
    if (!localStorage.getItem('accessToken')) {
      setIsAuthOpen(true);
      return false;
    }

    setWishlistError('');
    try {
      await toggleWishlistApi(productId);
      await loadWishlist();
      return true;
    } catch (error) {
      setWishlistError(error.message || 'Không thể cập nhật danh sách yêu thích.');
      return false;
    }
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
        storeCategories.find((item) => String(item.category_id) === String(product.category_id))?.name || CATEGORIES.find((item) => item.key === product.category)?.label || '';
      const brandLabel =
        storeBrands.find((item) => String(item.brand_id) === String(product.brand_id))?.name || product.brand || '';
      const matchesSearch =
        !query ||
        [product.name, brandLabel, categoryLabel].some((value) =>
          normalize(value).includes(query),
        );

      return (
        matchesSearch &&
        (activeCategory === 'all' || String(product.category_id) === String(activeCategory) || product.category === activeCategory) &&
        (!selectedBrands.length || selectedBrands.includes(String(product.brand_id)) || selectedBrands.includes(product.brand)) &&
        product.price >= priceRange[0] &&
        product.price <= priceRange[1] &&
        (ratingFilter === null || product.rating >= ratingFilter)
      );
    });

    return result.sort((a, b) => {
      if (sortBy === 'newest') {
        const timeB = b.createdAt ? new Date(b.createdAt.endsWith('Z') ? b.createdAt : b.createdAt + 'Z').getTime() : 0;
        const timeA = a.createdAt ? new Date(a.createdAt.endsWith('Z') ? a.createdAt : a.createdAt + 'Z').getTime() : 0;
        return timeB - timeA;
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
    
    getProfile()
      .then((result) => {
        const profile = result?.data?.profile ?? result?.data ?? result;
        if (!profile) return;
        setUser((current) => ({
          ...current,
          name: profile.full_name || profile.name || current?.name || 'Tài khoản',
          email: profile.email || current?.email || '',
          phone: profile.phone_number || profile.phone || '',
          avatarUrl: profile.avatar_url || profile.avatarUrl || '',
        }));
      })
      .catch(() => {});

    await syncAccountData({ force: true });
  };

  const logout = () => {
    clearAuthTokens();
    syncedTokenRef.current = null;
    setUser(null);
    setCart([]);
    setWishlistIds([]);

    if (window.location.pathname.startsWith('/admin')) {
      window.location.href = '/';
    }
  };

  const updateCurrentUser = (profile) => {
    setUser((current) => ({ ...current, ...profile }));
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
        clearCart: () => setCart([]),
        loadCart,
        wishlistIds,
        wishlistError,
        isWishlistLoading,
        reloadWishlist: loadWishlist,
        toggleWishlist,
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
        storeCategories,
        storeBrands,
        selectedProduct,
        setSelectedProduct,
        isCartOpen,
        setIsCartOpen,
        user,
        isAuthOpen,
        setIsAuthOpen,
        login,
        logout,
        updateCurrentUser,
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
