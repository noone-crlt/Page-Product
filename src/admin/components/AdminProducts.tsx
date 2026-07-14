import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  CaretDown,
  CaretLeft,
  CaretRight,
  Cube,
  Eye,
  House,
  List,
  MagnifyingGlass,
  Package,
  PencilSimple,
  Plus,
  SignOut,
  Star,
  Trash,
  UploadSimple,
  Warning,
  X,
} from '@phosphor-icons/react';
import {
  addProductVariants,
  createProduct,
  deleteProductImages,
  deleteProduct,
  deleteProductVariants,
  getProductBrands,
  getProductById,
  getProductCategories,
  getProducts,
  toggleProductStatus,
  updateProduct,
  uploadProductImages,
  uploadProductThumbnail,
} from '../../services/productApi';
import { useNotifications } from '../hooks/useNotifications';
import '../styles/admin-dashboard.css';
import { AdminSidebar } from './AdminSidebar';

interface ApiProduct {
  product_id: number;
  name: string;
  description?: string;
  thumbnail_url?: string;
  min_price?: number | string;
  max_price?: number | string;
  average_rating?: number | string;
  total_reviews?: number;
  is_featured?: boolean;
  status?: string;
  category_id?: number;
  brand_id?: number;
}

interface ProductVariant {
  product_variant_id: number;
  color?: string;
  storage?: string;
  original_price?: number | string;
  discount_percentage?: number | string;
  sale_price?: number | string;
  stock_quantity?: number;
}

interface ProductDetail extends ApiProduct {
  variants?: ProductVariant[];
  images?: ProductImage[];
}

interface ProductImage {
  product_image_id: number;
  image_url: string;
  sort_order?: number;
}

interface ProductForm {
  name: string;
  description: string;
  thumbnail_url: string;
  category_id: string;
  brand_id: string;
  status: string;
  is_featured: boolean;
}

interface ProductOption {
  category_id?: number;
  brand_id?: number;
  name: string;
}

interface NewProductForm {
  name: string;
  description: string;
  category_id: string;
  brand_id: string;
  is_featured: boolean;
}

interface NewProductVariant {
  client_id: string;
  product_variant_id?: number;
  color: string;
  storage: string;
  original_price: string;
  discount_percentage: string;
  stock_quantity: string;
}

const PAGE_SIZE = 6;

const EMPTY_NEW_PRODUCT: NewProductForm = {
  name: '',
  description: '',
  category_id: '',
  brand_id: '',
  is_featured: false,
};

const createEmptyVariant = (): NewProductVariant => ({
  client_id: crypto.randomUUID(),
  color: '',
  storage: '',
  original_price: '',
  discount_percentage: '0',
  stock_quantity: '0',
});

const createVariantFromApi = (variant: ProductVariant): NewProductVariant => ({
  client_id: `variant-${variant.product_variant_id}`,
  product_variant_id: variant.product_variant_id,
  color: variant.color || '',
  storage: variant.storage || '',
  original_price: String(variant.original_price || ''),
  discount_percentage: String(variant.discount_percentage || 0),
  stock_quantity: String(variant.stock_quantity || 0),
});

const normalizePriceInput = (value: string) =>
  value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');

const formatPriceInput = (value: string) =>
  normalizePriceInput(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const formatCurrency = (value?: number | string) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
    .format(Number(value || 0))
    .replace('₫', 'VNĐ');

const getInitials = (name?: string) => {
  if (!name) return 'AD';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const createProductForm = (product: ApiProduct | ProductDetail): ProductForm => ({
  name: product.name || '',
  description: product.description || '',
  thumbnail_url: product.thumbnail_url || '',
  category_id: product.category_id ? String(product.category_id) : '',
  brand_id: product.brand_id ? String(product.brand_id) : '',
  status: product.status || 'active',
  is_featured: Boolean(product.is_featured),
});

export default function AdminProducts() {
  const { user, logout } = useApp();
  const appUser = user as { name?: string; email?: string } | null;
  const userName = appUser?.name || '';
  const userRole = appUser?.email || 'Quản trị viên';
  const userInitials = getInitials(userName);

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);
  const [editForm, setEditForm] = useState<ProductForm>(() => createProductForm({ product_id: 0, name: '' }));
  const [editVariants, setEditVariants] = useState<NewProductVariant[]>([]);
  const [removedVariantIds, setRemovedVariantIds] = useState<number[]>([]);
  const [editImages, setEditImages] = useState<ProductImage[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([]);
  const [editNewImages, setEditNewImages] = useState<File[]>([]);
  const [useNewEditThumbnail, setUseNewEditThumbnail] = useState(false);
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [newProductForm, setNewProductForm] = useState<NewProductForm>(EMPTY_NEW_PRODUCT);
  const [newProductImages, setNewProductImages] = useState<File[]>([]);
  const [newProductVariants, setNewProductVariants] = useState<NewProductVariant[]>(() => [createEmptyVariant()]);
  const [categories, setCategories] = useState<ProductOption[]>([]);
  const [brands, setBrands] = useState<ProductOption[]>([]);
  const [createError, setCreateError] = useState('');
  const [savingCreate, setSavingCreate] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ApiProduct | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const { notifications, unreadCount, markAllAsRead } = useNotifications();

  const imagePreviews = useMemo(
    () => newProductImages.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [newProductImages],
  );

  useEffect(() => () => {
    imagePreviews.forEach(({ url }) => URL.revokeObjectURL(url));
  }, [imagePreviews]);

  const editImagePreviews = useMemo(
    () => editNewImages.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [editNewImages],
  );

  useEffect(() => () => {
    editImagePreviews.forEach(({ url }) => URL.revokeObjectURL(url));
  }, [editImagePreviews]);

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getProducts({ page: 1, limit: 100 });
      setProducts(Array.isArray(result?.data) ? result.data : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  const openCreateProduct = async () => {
    setCreatingProduct(true);
    setNewProductForm(EMPTY_NEW_PRODUCT);
    setNewProductImages([]);
    setNewProductVariants([createEmptyVariant()]);
    setCreateError('');

    if (categories.length && brands.length) return;

    try {
      const [categoryResult, brandResult] = await Promise.all([
        getProductCategories(),
        getProductBrands(),
      ]);
      setCategories(Array.isArray(categoryResult?.data) ? categoryResult.data : []);
      setBrands(Array.isArray(brandResult?.data) ? brandResult.data : []);
    } catch (loadError) {
      setCreateError(loadError instanceof Error
        ? loadError.message
        : 'Không thể tải danh mục và thương hiệu.');
    }
  };

  const closeCreateProduct = () => {
    if (savingCreate) return;
    setCreatingProduct(false);
    setNewProductImages([]);
    setNewProductVariants([createEmptyVariant()]);
    setCreateError('');
  };

  const handleNewProductImages = (files: FileList | null) => {
    if (!files) return;
    const selectedFiles = Array.from(files);
    const invalidFile = selectedFiles.find((file) => !file.type.startsWith('image/'));

    if (invalidFile) {
      setCreateError('Vui lòng chỉ chọn các tệp hình ảnh.');
      return;
    }

    setCreateError('');
    setNewProductImages((current) => {
      const existingKeys = new Set(current.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
      const newFiles = selectedFiles.filter((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (existingKeys.has(key)) return false;
        existingKeys.add(key);
        return true;
      });

      return [...current, ...newFiles];
    });
  };

  const setImageAsThumbnail = (imageIndex: number) => {
    setNewProductImages((current) => {
      if (imageIndex <= 0 || imageIndex >= current.length) return current;
      const selectedImage = current[imageIndex];
      return [selectedImage, ...current.filter((_, index) => index !== imageIndex)];
    });
  };

  const removeNewProductImage = (imageIndex: number) => {
    setNewProductImages((current) => current.filter((_, index) => index !== imageIndex));
  };

  const updateNewProductVariant = (
    clientId: string,
    field: keyof Omit<NewProductVariant, 'client_id'>,
    value: string,
  ) => {
    setNewProductVariants((current) => current.map((variant) =>
      variant.client_id === clientId ? { ...variant, [field]: value } : variant
    ));
  };

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newProductForm.name.trim();

    if (!name) {
      setCreateError('Tên sản phẩm không được để trống.');
      return;
    }
    if (!newProductForm.category_id || !newProductForm.brand_id) {
      setCreateError('Vui lòng chọn danh mục và thương hiệu.');
      return;
    }
    if (!newProductImages.length) {
      setCreateError('Vui lòng chọn ít nhất một hình ảnh sản phẩm.');
      return;
    }
    if (!newProductVariants.length) {
      setCreateError('Vui lòng thêm ít nhất một phiên bản sản phẩm.');
      return;
    }

    const invalidVariant = newProductVariants.find((variant) =>
      !variant.color.trim() ||
      !variant.storage.trim() ||
      !variant.original_price ||
      Number(variant.original_price) <= 0 ||
      Number(variant.discount_percentage) < 0 ||
      Number(variant.discount_percentage) > 100 ||
      Number(variant.stock_quantity) < 0
    );

    if (invalidVariant) {
      setCreateError('Vui lòng nhập đầy đủ biến thể; giá gốc phải lớn hơn 0, tồn kho không được âm và giảm giá từ 0–100%.');
      return;
    }

    setSavingCreate(true);
    setCreateError('');
    let productWasCreated = false;

    try {
      const thumbnailResult = await uploadProductThumbnail(newProductImages[0]);
      const thumbnailData = thumbnailResult?.data ?? thumbnailResult;
      const thumbnailUrl = typeof thumbnailData === 'string'
        ? thumbnailData
        : thumbnailData?.image_url || thumbnailData?.url || thumbnailData?.thumbnail_url;

      if (!thumbnailUrl) throw new Error('API tải ảnh không trả về đường dẫn ảnh thumbnail.');

      const createResult = await createProduct({
        category_id: Number(newProductForm.category_id),
        brand_id: Number(newProductForm.brand_id),
        name,
        description: newProductForm.description.trim(),
        thumbnail_url: thumbnailUrl,
        is_featured: newProductForm.is_featured,
        variants: newProductVariants.map((variant) => ({
          color: variant.color.trim(),
          storage: variant.storage.trim(),
          original_price: Number(variant.original_price),
          discount_percentage: Number(variant.discount_percentage),
          stock_quantity: Number(variant.stock_quantity),
        })),
      });
      const createdData = createResult?.data ?? createResult;
      const productId = createdData?.product_id || createdData?.id;

      if (!productId) throw new Error('API tạo sản phẩm không trả về mã sản phẩm.');
      productWasCreated = true;
      await uploadProductImages(productId, newProductImages);
      await loadProducts();
      setCreatingProduct(false);
      setNewProductForm(EMPTY_NEW_PRODUCT);
      setNewProductImages([]);
      setNewProductVariants([createEmptyVariant()]);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Không thể thêm sản phẩm.';
      setCreateError(productWasCreated
        ? `Sản phẩm đã được tạo nhưng chưa tải đủ ảnh. ${message}`
        : message);
      if (productWasCreated) await loadProducts();
    } finally {
      setSavingCreate(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const value = query.trim().toLocaleLowerCase('vi');
    return products.filter((product) =>
      (!value || product.name.toLocaleLowerCase('vi').includes(value) || String(product.product_id).includes(value)) &&
      (statusFilter === 'all' || product.status === statusFilter)
    );
  }, [products, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const visibleProducts = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [query, statusFilter]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const openDetail = async (product: ApiProduct) => {
    setSelectedProduct({ ...product, variants: [] });
    setDetailLoading(true);
    setDetailError('');
    try {
      const result = await getProductById(product.product_id);
      setSelectedProduct(result?.data || { ...product, variants: [] });
    } catch (loadError) {
      setDetailError(loadError instanceof Error ? loadError.message : 'Không thể tải chi tiết sản phẩm.');
    } finally {
      setDetailLoading(false);
    }
  };

  const openEdit = async (product: ApiProduct) => {
    setEditingProduct(product);
    setEditForm(createProductForm(product));
    setEditVariants([]);
    setRemovedVariantIds([]);
    setEditImages([]);
    setRemovedImageIds([]);
    setEditNewImages([]);
    setUseNewEditThumbnail(false);
    setEditError('');

    try {
      const [result, categoryResult, brandResult] = await Promise.all([
        getProductById(product.product_id),
        categories.length ? Promise.resolve(null) : getProductCategories(),
        brands.length ? Promise.resolve(null) : getProductBrands(),
      ]);
      if (categoryResult) setCategories(Array.isArray(categoryResult?.data) ? categoryResult.data : []);
      if (brandResult) setBrands(Array.isArray(brandResult?.data) ? brandResult.data : []);
      const detail = result?.data;
      if (detail) {
        const mergedProduct = { ...product, ...detail };
        setEditingProduct(mergedProduct);
        setEditForm(createProductForm(mergedProduct));
        setEditVariants(Array.isArray(detail.variants) ? detail.variants.map(createVariantFromApi) : []);
        setEditImages(Array.isArray(detail.images) ? detail.images : []);
      }
    } catch (loadError) {
      setEditError(loadError instanceof Error ? loadError.message : 'Không thể tải đầy đủ dữ liệu chỉnh sửa.');
    }
  };

  const updateEditVariant = (
    clientId: string,
    field: keyof Omit<NewProductVariant, 'client_id' | 'product_variant_id'>,
    value: string,
  ) => {
    setEditVariants((current) => current.map((variant) =>
      variant.client_id === clientId ? { ...variant, [field]: value } : variant
    ));
  };

  const removeEditVariant = (variant: NewProductVariant) => {
    if (variant.product_variant_id) {
      setRemovedVariantIds((current) => [...current, variant.product_variant_id as number]);
    }
    setEditVariants((current) => current.filter((item) => item.client_id !== variant.client_id));
  };

  const handleEditImages = (files: FileList | null) => {
    if (!files) return;
    const selectedFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    setEditNewImages((current) => {
      const keys = new Set(current.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
      return [...current, ...selectedFiles.filter((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (keys.has(key)) return false;
        keys.add(key);
        return true;
      })];
    });
  };

  const removeExistingEditImage = (image: ProductImage) => {
    setRemovedImageIds((current) => [...current, image.product_image_id]);
    setEditImages((current) => current.filter((item) => item.product_image_id !== image.product_image_id));
    if (editForm.thumbnail_url === image.image_url) {
      setEditForm((current) => ({ ...current, thumbnail_url: '' }));
    }
  };

  const setNewEditImageAsThumbnail = (imageIndex: number) => {
    setEditNewImages((current) => {
      if (imageIndex <= 0 || imageIndex >= current.length) return current;
      return [current[imageIndex], ...current.filter((_, index) => index !== imageIndex)];
    });
    setUseNewEditThumbnail(true);
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingProduct) return;
    const name = editForm.name.trim();

    if (!name) {
      setEditError('Tên sản phẩm không được để trống.');
      return;
    }

    if (!editVariants.length) {
      setEditError('Sản phẩm phải có ít nhất một phiên bản.');
      return;
    }

    const invalidVariant = editVariants.find((variant) =>
      !variant.color.trim() ||
      !variant.storage.trim() ||
      !variant.original_price ||
      Number(variant.original_price) <= 0 ||
      Number(variant.discount_percentage) < 0 ||
      Number(variant.discount_percentage) > 100 ||
      Number(variant.stock_quantity) < 0
    );

    if (invalidVariant) {
      setEditError('Vui lòng nhập đầy đủ biến thể; giá gốc phải lớn hơn 0, tồn kho không được âm và giảm giá từ 0–100%.');
      return;
    }

    setSavingEdit(true);
    setEditError('');

    try {
      let thumbnailUrl = editForm.thumbnail_url.trim();
      if (useNewEditThumbnail && editNewImages[0]) {
        const thumbnailResult = await uploadProductThumbnail(editNewImages[0]);
        const thumbnailData = thumbnailResult?.data ?? thumbnailResult;
        thumbnailUrl = typeof thumbnailData === 'string'
          ? thumbnailData
          : thumbnailData?.image_url || thumbnailData?.url || thumbnailData?.thumbnail_url;
        if (!thumbnailUrl) throw new Error('API tải ảnh không trả về đường dẫn ảnh thumbnail.');
      }

      const existingVariants = editVariants.filter((variant) => variant.product_variant_id).map((variant) => ({
        product_variant_id: variant.product_variant_id,
        color: variant.color.trim(),
        storage: variant.storage.trim(),
        original_price: Number(variant.original_price),
        discount_percentage: Number(variant.discount_percentage),
        stock_quantity: Number(variant.stock_quantity),
      }));
      const newVariants = editVariants.filter((variant) => !variant.product_variant_id).map((variant) => ({
        color: variant.color.trim(),
        storage: variant.storage.trim(),
        original_price: Number(variant.original_price),
        discount_percentage: Number(variant.discount_percentage),
        stock_quantity: Number(variant.stock_quantity),
      }));
      const payload = {
        ...(editForm.category_id ? { category_id: Number(editForm.category_id) } : {}),
        ...(editForm.brand_id ? { brand_id: Number(editForm.brand_id) } : {}),
        name,
        description: editForm.description.trim(),
        thumbnail_url: thumbnailUrl,
        is_featured: editForm.is_featured,
        variants: existingVariants,
      };

      const result = await updateProduct(editingProduct.product_id, payload);
      if (editForm.status !== (editingProduct.status || 'active')) {
        await toggleProductStatus(editingProduct.product_id);
      }
      if (newVariants.length) await addProductVariants(editingProduct.product_id, newVariants);
      if (removedVariantIds.length) await deleteProductVariants(editingProduct.product_id, removedVariantIds);
      if (editNewImages.length) await uploadProductImages(editingProduct.product_id, editNewImages);
      if (removedImageIds.length) await deleteProductImages(editingProduct.product_id, removedImageIds);
      const updatedProduct = {
        ...editingProduct,
        ...payload,
        ...(result?.data || {}),
      };

      setProducts((current) =>
        current.map((product) => product.product_id === editingProduct.product_id ? updatedProduct : product)
      );
      setSelectedProduct((current) =>
        current?.product_id === editingProduct.product_id ? { ...current, ...updatedProduct } : current
      );
      setEditingProduct(null);
      await loadProducts();
    } catch (saveError) {
      setEditError(saveError instanceof Error ? saveError.message : 'Không thể cập nhật sản phẩm.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    setDeleteError('');

    try {
      await deleteProduct(productToDelete.product_id);
      setProducts((current) => current.filter((product) => product.product_id !== productToDelete.product_id));
      if (selectedProduct?.product_id === productToDelete.product_id) setSelectedProduct(null);
      if (editingProduct?.product_id === productToDelete.product_id) setEditingProduct(null);
      setProductToDelete(null);
    } catch (removeError) {
      setDeleteError(removeError instanceof Error ? removeError.message : 'Không thể xóa sản phẩm.');
    } finally {
      setDeleting(false);
    }
  };

  return <div className="admin-shell">
    <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

    <main className="admin-main">
      <header className="admin-header">
        <button className="admin-menu-button" aria-label="Mở menu" onClick={() => setSidebarOpen(true)}><List size={22} /></button>
        <label className="admin-search">
          <MagnifyingGlass size={18} />
          <span className="sr-only">Tìm kiếm sản phẩm</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm sản phẩm, mã sản phẩm..." />
        </label>
        <div className="admin-header__actions">
          <button className="admin-notification-button" aria-label="Thông báo" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((value) => !value)}><Bell size={20} />{unreadCount > 0 && <span />}</button>
          <div className="admin-header-profile-wrapper">
            <button className={`admin-header-profile ${profileOpen ? 'is-active' : ''}`} onClick={() => setProfileOpen((prev) => !prev)} aria-expanded={profileOpen}>
              <span>{userInitials}</span><div><strong>{userName}</strong><small>{userRole}</small></div><CaretDown size={14} />
            </button>
            {profileOpen && (
              <div className="admin-profile-dropdown">
                <div className="admin-profile-dropdown__header">
                  <strong>{userName}</strong>
                  <small>{appUser?.email || 'Quản trị viên'}</small>
                </div>
                <div className="admin-profile-dropdown__menu">
                  <button onClick={() => window.location.href = '/'}><House size={16} />Trang chủ cửa hàng</button>
                  <hr />
                  <button className="is-danger" onClick={logout}><SignOut size={16} />Đăng xuất an toàn</button>
                </div>
              </div>
            )}
          </div>
          {notificationsOpen && <div className="admin-notification-popover"><div className="admin-notification-popover__top"><strong>Thông báo mới</strong>{unreadCount > 0 && <button onClick={markAllAsRead}>Đánh dấu đã đọc</button>}</div>{notifications.length ? notifications.map((item) => <p key={item.id} className={item.unread ? 'is-unread' : ''}>{item.title}<small>{item.time}</small></p>) : <p>Chưa có thông báo mới<small>Hệ thống sẽ cập nhật khi có hoạt động.</small></p>}</div>}
        </div>
      </header>

      <div className="admin-content admin-products-page">
        <section className="admin-page-heading">
          <div>
            <span className="admin-eyebrow">Danh mục cửa hàng</span>
            <h1>Quản lý sản phẩm</h1>
            <p>Theo dõi thông tin, giá bán và trạng thái sản phẩm từ hệ thống.</p>
          </div>
          <div className="admin-products-heading-actions">
            <button className="admin-add-product-button" onClick={openCreateProduct}><Plus size={18} weight="bold" />Thêm sản phẩm</button>
            <div className="admin-products-count"><Cube size={19} /><span><small>Tổng sản phẩm</small><strong>{products.length.toLocaleString('vi-VN')}</strong></span></div>
          </div>
        </section>

        <section className="admin-product-toolbar" aria-label="Bộ lọc sản phẩm">
          <div><strong>Danh sách sản phẩm</strong><span>{filteredProducts.length} kết quả</span></div>
          <label><span>Trạng thái</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Tất cả</option><option value="active">Đang bán</option><option value="inactive">Ngừng bán</option></select></label>
        </section>

        <section className="admin-panel admin-product-list-panel">
          {loading ? <div className="admin-product-list-skeleton" aria-label="Đang tải sản phẩm">{Array.from({ length: PAGE_SIZE }, (_, index) => <span key={index} />)}</div>
            : error ? <div className="admin-state" role="alert"><Warning size={36} /><h2>Không thể tải sản phẩm</h2><p>{error}</p><button onClick={loadProducts}>Thử lại</button></div>
            : !visibleProducts.length ? <div className="admin-empty"><MagnifyingGlass size={34} /><h3>Không tìm thấy sản phẩm</h3><p>Hãy thử từ khóa khác hoặc thay đổi bộ lọc trạng thái.</p><button onClick={() => { setQuery(''); setStatusFilter('all'); }}>Xóa bộ lọc</button></div>
            : <div className="admin-table-wrap admin-products-table"><table><thead><tr><th>Sản phẩm</th><th>Khoảng giá</th><th>Đánh giá</th><th>Nổi bật</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{visibleProducts.map((product) => <tr key={product.product_id}><td><span className="admin-product-image">{product.thumbnail_url ? <img src={product.thumbnail_url} alt="" /> : <Package size={20} />}</span><div><strong>{product.name}</strong><small>SP-{String(product.product_id).padStart(4, '0')}</small></div></td><td><strong>{formatCurrency(product.min_price)}</strong>{Number(product.max_price) > Number(product.min_price) && <small> đến {formatCurrency(product.max_price)}</small>}</td><td><span className="admin-rating"><Star size={13} weight="fill" />{Number(product.average_rating || 0).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}</span><small>{product.total_reviews || 0} đánh giá</small></td><td>{product.is_featured ? <span className="admin-featured">Nổi bật</span> : <span className="admin-muted-value">Thông thường</span>}</td><td><span className={`admin-status admin-status--${product.status === 'active' ? 'active' : 'inactive'}`}><i />{product.status === 'active' ? 'Đang bán' : 'Ngừng bán'}</span></td><td><div className="admin-product-actions"><button className="admin-view-button" onClick={() => openDetail(product)}><Eye size={16} />Xem</button><button className="admin-icon-button" onClick={() => openEdit(product)} aria-label={`Sửa ${product.name}`}><PencilSimple size={16} /></button><button className="admin-icon-button is-danger" onClick={() => { setProductToDelete(product); setDeleteError(''); }} aria-label={`Xóa ${product.name}`}><Trash size={16} /></button></div></td></tr>)}</tbody></table></div>}
        </section>

        {!loading && !error && filteredProducts.length > 0 && <nav className="admin-products-pagination" aria-label="Phân trang sản phẩm"><span>Trang {page} / {totalPages}</span><div><button aria-label="Trang trước" disabled={page === 1} onClick={() => setPage((value) => value - 1)}><CaretLeft size={16} /></button>{Array.from({ length: totalPages }, (_, index) => <button key={index + 1} className={page === index + 1 ? 'active' : ''} onClick={() => setPage(index + 1)}>{index + 1}</button>)}<button aria-label="Trang sau" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}><CaretRight size={16} /></button></div></nav>}
      </div>
    </main>

    {creatingProduct && <div className="admin-detail-backdrop" onMouseDown={(event) => event.currentTarget === event.target && closeCreateProduct()}><section className="admin-product-detail admin-create-product" role="dialog" aria-modal="true" aria-labelledby="product-create-title"><header><div><span>Thêm sản phẩm</span><h2 id="product-create-title">Sản phẩm mới</h2></div><button aria-label="Đóng form thêm sản phẩm" disabled={savingCreate} onClick={closeCreateProduct}><X size={19} /></button></header><form className="admin-edit-form" onSubmit={handleCreateSubmit}><label>Tên sản phẩm<input value={newProductForm.name} onChange={(event) => setNewProductForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nhập tên sản phẩm" required autoFocus /></label><label>Mô tả sản phẩm<textarea value={newProductForm.description} onChange={(event) => setNewProductForm((current) => ({ ...current, description: event.target.value }))} placeholder="Nhập mô tả chi tiết sản phẩm..." rows={4} /></label><div className="admin-create-form-grid"><label>Danh mục<select value={newProductForm.category_id} onChange={(event) => setNewProductForm((current) => ({ ...current, category_id: event.target.value }))} required><option value="">Chọn danh mục</option>{categories.map((category) => <option key={category.category_id} value={category.category_id}>{category.name}</option>)}</select></label><label>Thương hiệu<select value={newProductForm.brand_id} onChange={(event) => setNewProductForm((current) => ({ ...current, brand_id: event.target.value }))} required><option value="">Chọn thương hiệu</option>{brands.map((brand) => <option key={brand.brand_id} value={brand.brand_id}>{brand.name}</option>)}</select></label></div><label className="admin-check-option admin-create-featured"><input type="checkbox" checked={newProductForm.is_featured} onChange={(event) => setNewProductForm((current) => ({ ...current, is_featured: event.target.checked }))} /><span>Đánh dấu là sản phẩm nổi bật</span></label><div className="admin-new-variants"><div className="admin-new-variants__heading"><div><strong>Phiên bản sản phẩm</strong><small>Thêm màu sắc, dung lượng, giá và số lượng tồn kho.</small></div><button type="button" disabled={savingCreate} onClick={() => setNewProductVariants((current) => [...current, createEmptyVariant()])}><Plus size={15} weight="bold" />Thêm phiên bản</button></div><div className="admin-new-variants__list">{newProductVariants.map((variant, index) => <fieldset key={variant.client_id}><legend>Phiên bản {index + 1}</legend><button type="button" className="admin-remove-variant" aria-label={`Xóa phiên bản ${index + 1}`} disabled={savingCreate || newProductVariants.length === 1} onClick={() => setNewProductVariants((current) => current.filter((item) => item.client_id !== variant.client_id))}><Trash size={15} /></button><div className="admin-variant-fields"><label>Màu sắc<input value={variant.color} onChange={(event) => updateNewProductVariant(variant.client_id, 'color', event.target.value)} placeholder="Ví dụ: Đen" required /></label><label>Dung lượng<input value={variant.storage} onChange={(event) => updateNewProductVariant(variant.client_id, 'storage', event.target.value)} placeholder="Ví dụ: 256GB" required /></label><label>Giá gốc<input type="text" inputMode="numeric" value={formatPriceInput(variant.original_price)} onChange={(event) => updateNewProductVariant(variant.client_id, 'original_price', normalizePriceInput(event.target.value))} placeholder="0" required /></label><label>Giảm giá (%)<input type="number" min="0" max="100" value={variant.discount_percentage} onChange={(event) => updateNewProductVariant(variant.client_id, 'discount_percentage', event.target.value)} required /></label><label>Tồn kho<input type="number" min="0" step="1" value={variant.stock_quantity} onChange={(event) => updateNewProductVariant(variant.client_id, 'stock_quantity', event.target.value)} required /></label></div></fieldset>)}</div></div><div className="admin-image-upload-field"><div><strong>Hình ảnh sản phẩm</strong><small>Chọn nhiều ảnh, sau đó chọn một ảnh bất kỳ làm thumbnail. Các ảnh còn lại sẽ nằm trong thư viện sản phẩm.</small></div><label className="admin-image-upload-button"><UploadSimple size={18} /><span>{newProductImages.length ? `Đã chọn ${newProductImages.length} ảnh · Chọn lại` : 'Tải nhiều ảnh từ máy'}</span><input type="file" accept="image/*" multiple onChange={(event) => handleNewProductImages(event.target.files)} /></label>{imagePreviews.length > 0 && <div className="admin-image-preview-list">{imagePreviews.map(({ file, url }, index) => <figure key={`${file.name}-${file.lastModified}`} className={index === 0 ? 'is-thumbnail' : ''}><img src={url} alt={`Ảnh xem trước ${index + 1}`} />{index === 0 ? <b>Thumbnail</b> : <button type="button" className="admin-set-thumbnail" disabled={savingCreate} onClick={() => setImageAsThumbnail(index)}>Đặt thumbnail</button>}<button type="button" className="admin-remove-image" aria-label={`Xóa ảnh ${file.name}`} disabled={savingCreate} onClick={() => removeNewProductImage(index)}><X size={14} /></button><figcaption>{file.name}</figcaption></figure>)}</div>}</div>{createError && <p className="admin-form-error" role="alert">{createError}</p>}<div className="admin-dialog-actions"><button type="button" className="admin-button-secondary" disabled={savingCreate} onClick={closeCreateProduct}>Hủy</button><button type="submit" className="admin-button-primary admin-create-submit" disabled={savingCreate}>{savingCreate ? 'Đang thêm sản phẩm...' : 'Thêm sản phẩm'}</button></div></form></section></div>}

    {selectedProduct && <div className="admin-detail-backdrop" onMouseDown={(event) => event.currentTarget === event.target && setSelectedProduct(null)}><section className="admin-product-detail" role="dialog" aria-modal="true" aria-labelledby="product-detail-title"><header><div><span>Chi tiết sản phẩm</span><h2 id="product-detail-title">{selectedProduct.name}</h2></div><button aria-label="Đóng chi tiết" onClick={() => setSelectedProduct(null)}><X size={19} /></button></header>{detailLoading ? <div className="admin-detail-loading"><span /><span /><span /></div> : detailError ? <div className="admin-state"><Warning size={32} /><h2>Không thể tải chi tiết</h2><p>{detailError}</p></div> : <div className="admin-variant-list"><div className="admin-variant-summary"><span><small>Số phiên bản</small><strong>{selectedProduct.variants?.length || 0}</strong></span><span><small>Tổng tồn kho</small><strong>{(selectedProduct.variants || []).reduce((total, variant) => total + Number(variant.stock_quantity || 0), 0)}</strong></span></div><h3>Phiên bản sản phẩm</h3>{selectedProduct.variants?.length ? selectedProduct.variants.map((variant) => <article key={variant.product_variant_id}><div><strong>{variant.color || 'Chưa xác định màu'}</strong><span>{variant.storage || 'Không có dung lượng'}</span></div><div><strong>{formatCurrency(variant.sale_price)}</strong><span>Giá gốc {formatCurrency(variant.original_price)}</span></div><span className={Number(variant.stock_quantity) < 10 ? 'is-low' : ''}>Còn {variant.stock_quantity || 0}</span></article>) : <p className="admin-no-variants">Sản phẩm chưa có phiên bản.</p>}</div>}</section></div>}

    {editingProduct && (
      <div className="admin-detail-backdrop" onMouseDown={(event) => event.currentTarget === event.target && !savingEdit && setEditingProduct(null)}>
        <section className="admin-product-detail admin-create-product" role="dialog" aria-modal="true" aria-labelledby="product-edit-title">
          <header>
            <div><span>Chỉnh sửa sản phẩm</span><h2 id="product-edit-title">{editingProduct.name}</h2></div>
            <button aria-label="Đóng form chỉnh sửa" disabled={savingEdit} onClick={() => setEditingProduct(null)}><X size={19} /></button>
          </header>
          <form className="admin-edit-form" onSubmit={handleEditSubmit}>
            <label>Tên sản phẩm<input value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nhập tên sản phẩm" required /></label>
            <label>Mô tả sản phẩm<textarea value={editForm.description} onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))} placeholder="Nhập mô tả sản phẩm..." rows={4} /></label>
            <div className="admin-create-form-grid">
              <label>Danh mục<select value={editForm.category_id} onChange={(event) => setEditForm((current) => ({ ...current, category_id: event.target.value }))}><option value="">Giữ nguyên danh mục</option>{categories.map((category) => <option key={category.category_id} value={category.category_id}>{category.name}</option>)}</select></label>
              <label>Thương hiệu<select value={editForm.brand_id} onChange={(event) => setEditForm((current) => ({ ...current, brand_id: event.target.value }))}><option value="">Giữ nguyên thương hiệu</option>{brands.map((brand) => <option key={brand.brand_id} value={brand.brand_id}>{brand.name}</option>)}</select></label>
            </div>
            <div className="admin-form-grid">
              <label>Trạng thái<select value={editForm.status} onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value }))}><option value="active">Đang bán</option><option value="inactive">Ngừng bán</option></select></label>
              <label className="admin-check-option"><input type="checkbox" checked={editForm.is_featured} onChange={(event) => setEditForm((current) => ({ ...current, is_featured: event.target.checked }))} /><span>Nổi bật</span></label>
            </div>

            <div className="admin-new-variants">
              <div className="admin-new-variants__heading">
                <div><strong>Phiên bản sản phẩm</strong><small>Chỉnh sửa hoặc thêm màu sắc, dung lượng, giá và tồn kho.</small></div>
                <button type="button" disabled={savingEdit} onClick={() => setEditVariants((current) => [...current, createEmptyVariant()])}><Plus size={15} weight="bold" />Thêm phiên bản</button>
              </div>
              <div className="admin-new-variants__list">
                {editVariants.map((variant, index) => (
                  <fieldset key={variant.client_id}>
                    <legend>Phiên bản {index + 1}</legend>
                    <button type="button" className="admin-remove-variant" aria-label={`Xóa phiên bản ${index + 1}`} disabled={savingEdit || editVariants.length === 1} onClick={() => removeEditVariant(variant)}><Trash size={15} /></button>
                    <div className="admin-variant-fields">
                      <label>Màu sắc<input value={variant.color} onChange={(event) => updateEditVariant(variant.client_id, 'color', event.target.value)} placeholder="Ví dụ: Đen" required /></label>
                      <label>Dung lượng<input value={variant.storage} onChange={(event) => updateEditVariant(variant.client_id, 'storage', event.target.value)} placeholder="Ví dụ: 256GB" required /></label>
                      <label>Giá gốc<input type="text" inputMode="numeric" value={formatPriceInput(variant.original_price)} onChange={(event) => updateEditVariant(variant.client_id, 'original_price', normalizePriceInput(event.target.value))} placeholder="0" required /></label>
                      <label>Giảm giá (%)<input type="number" min="0" max="100" value={variant.discount_percentage} onChange={(event) => updateEditVariant(variant.client_id, 'discount_percentage', event.target.value)} required /></label>
                      <label>Tồn kho<input type="number" min="0" step="1" value={variant.stock_quantity} onChange={(event) => updateEditVariant(variant.client_id, 'stock_quantity', event.target.value)} required /></label>
                    </div>
                  </fieldset>
                ))}
              </div>
            </div>

            <div className="admin-image-upload-field">
              <div><strong>Hình ảnh sản phẩm</strong><small>Chọn ảnh hiện có hoặc ảnh mới làm thumbnail; có thể thêm và xóa nhiều ảnh.</small></div>
              <label className="admin-image-upload-button"><UploadSimple size={18} /><span>{editNewImages.length ? `Đã thêm ${editNewImages.length} ảnh · Thêm tiếp` : 'Tải thêm ảnh từ máy'}</span><input type="file" accept="image/*" multiple onChange={(event) => { handleEditImages(event.target.files); event.currentTarget.value = ''; }} /></label>
              {editImages.length > 0 && <div className="admin-image-preview-list">{editImages.map((image) => (
                <figure key={image.product_image_id} className={!useNewEditThumbnail && editForm.thumbnail_url === image.image_url ? 'is-thumbnail' : ''}>
                  <img src={image.image_url} alt="Ảnh sản phẩm hiện có" />
                  {!useNewEditThumbnail && editForm.thumbnail_url === image.image_url ? <b>Thumbnail</b> : <button type="button" className="admin-set-thumbnail" disabled={savingEdit} onClick={() => { setEditForm((current) => ({ ...current, thumbnail_url: image.image_url })); setUseNewEditThumbnail(false); }}>Đặt thumbnail</button>}
                  <button type="button" className="admin-remove-image" aria-label="Xóa ảnh sản phẩm" disabled={savingEdit} onClick={() => removeExistingEditImage(image)}><X size={14} /></button>
                  <figcaption>Ảnh hiện có #{image.sort_order || image.product_image_id}</figcaption>
                </figure>
              ))}</div>}
              {editImagePreviews.length > 0 && <div className="admin-image-preview-list">{editImagePreviews.map(({ file, url }, index) => (
                <figure key={`${file.name}-${file.lastModified}`} className={useNewEditThumbnail && index === 0 ? 'is-thumbnail' : ''}>
                  <img src={url} alt={`Ảnh mới ${index + 1}`} />
                  {useNewEditThumbnail && index === 0 ? <b>Thumbnail</b> : <button type="button" className="admin-set-thumbnail" disabled={savingEdit} onClick={() => setNewEditImageAsThumbnail(index)}>Đặt thumbnail</button>}
                  <button type="button" className="admin-remove-image" aria-label={`Xóa ảnh ${file.name}`} disabled={savingEdit} onClick={() => setEditNewImages((current) => current.filter((_, imageIndex) => imageIndex !== index))}><X size={14} /></button>
                  <figcaption>{file.name}</figcaption>
                </figure>
              ))}</div>}
            </div>

            {editError && <p className="admin-form-error" role="alert">{editError}</p>}
            <div className="admin-dialog-actions">
              <button type="button" className="admin-button-secondary" disabled={savingEdit} onClick={() => setEditingProduct(null)}>Hủy</button>
              <button type="submit" className="admin-button-primary admin-create-submit" disabled={savingEdit}>{savingEdit ? 'Đang lưu thay đổi...' : 'Lưu thay đổi'}</button>
            </div>
          </form>
        </section>
      </div>
    )}

    {productToDelete && <div className="admin-detail-backdrop" onMouseDown={(event) => event.currentTarget === event.target && !deleting && setProductToDelete(null)}><section className="admin-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="product-delete-title"><header><span><Trash size={20} /></span><div><h2 id="product-delete-title">Xóa sản phẩm?</h2><p>Sản phẩm “{productToDelete.name}” sẽ bị xóa khỏi danh sách quản lý. Hành động này không thể hoàn tác.</p></div></header>{deleteError && <p className="admin-form-error" role="alert">{deleteError}</p>}<div className="admin-dialog-actions"><button type="button" className="admin-button-secondary" disabled={deleting} onClick={() => setProductToDelete(null)}>Hủy</button><button type="button" className="admin-button-danger" disabled={deleting} onClick={handleDeleteProduct}>{deleting ? 'Đang xóa...' : 'Xóa sản phẩm'}</button></div></section></div>}
  </div>;
}
