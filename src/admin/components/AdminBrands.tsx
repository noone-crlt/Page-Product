import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Plus, 
  Trash, 
  PencilSimple, 
  MagnifyingGlass, 
  Warning, 
  List,
  X,
  Tag
} from '@phosphor-icons/react';
import { 
  getProductBrands, 
  createBrand, 
  updateBrand, 
  deleteBrand,
  uploadProductThumbnail
} from '../../services/productApi';
import { AdminSidebar } from './AdminSidebar';
import '../styles/admin-dashboard.css';

interface Brand {
  brand_id: number;
  name: string;
  logo_url?: string;
}

export default function AdminBrands() {
  const { user, logout } = useApp();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);

  // Form state
  const [brandFormName, setBrandFormName] = useState('');
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null);
  const [brandLogoPreview, setBrandLogoPreview] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadBrands();
  }, []);

  useEffect(() => {
    return () => {
      if (brandLogoPreview && brandLogoFile) {
        URL.revokeObjectURL(brandLogoPreview);
      }
    };
  }, [brandLogoPreview, brandLogoFile]);

  const loadBrands = async () => {
    setLoading(true);
    try {
      const result = await getProductBrands();
      setBrands(Array.isArray(result?.data) ? result.data : []);
    } catch (err) {
      setError('Không thể tải danh sách thương hiệu.');
    } finally {
      setLoading(false);
    }
  };

  const filteredBrands = brands.filter(b => 
    !query || b.name.toLowerCase().includes(query.toLowerCase()) || String(b.brand_id).includes(query)
  );

  const openCreate = () => {
    setBrandFormName('');
    setBrandLogoFile(null);
    setBrandLogoPreview('');
    setFormError('');
    setIsCreateOpen(true);
  };

  const openEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setBrandFormName(brand.name);
    setBrandLogoFile(null);
    setBrandLogoPreview(brand.logo_url || '');
    setFormError('');
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFormError('Vui lòng chọn file hình ảnh hợp lệ.');
      return;
    }
    setFormError('');
    setBrandLogoFile(file);
    setBrandLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandFormName.trim()) {
      setFormError('Tên thương hiệu không được để trống');
      return;
    }
    
    setIsSaving(true);
    setFormError('');

    try {
      let finalImageUrl = editingBrand?.logo_url || '';
      
      if (brandLogoFile) {
        const uploadData = await uploadProductThumbnail(brandLogoFile);
        // /api/image trả về: { success: true, message: "...", data: "https://res.cloudinary.com/..." }
        if (typeof uploadData === 'string') {
          finalImageUrl = uploadData;
        } else if (uploadData?.data && typeof uploadData.data === 'string') {
          finalImageUrl = uploadData.data;
        } else {
          finalImageUrl = uploadData?.url || uploadData?.image_url || '';
        }
      }

      const payload = { 
        name: brandFormName,
        ...(finalImageUrl ? { logo_url: finalImageUrl } : {})
      };

      if (editingBrand) {
        await updateBrand(editingBrand.brand_id, payload);
      } else {
        await createBrand(payload);
      }
      await loadBrands();
      setIsCreateOpen(false);
      setEditingBrand(null);
    } catch (err) {
      setFormError(editingBrand ? 'Lỗi khi cập nhật thương hiệu' : 'Lỗi khi tạo thương hiệu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBrand) return;
    setIsSaving(true);
    setFormError('');
    try {
      await deleteBrand(deletingBrand.brand_id);
      await loadBrands();
      setDeletingBrand(null);
    } catch (err) {
      setFormError('Lỗi khi xóa thương hiệu (có thể đang có sản phẩm thuộc thương hiệu này).');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="admin-shell">
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <main className="admin-main">
        <header className="admin-header">
          <button className="admin-menu-button" onClick={() => setSidebarOpen(true)}>
            <List size={22} />
          </button>
          <label className="admin-search">
            <MagnifyingGlass size={18} />
            <input 
              value={query} 
              onChange={e => setQuery(e.target.value)} 
              placeholder="Tìm thương hiệu..." 
            />
          </label>
        </header>

        <div className="admin-content">
          <section className="admin-page-heading">
            <div>
              <span className="admin-eyebrow">Danh mục cửa hàng</span>
              <h1>Thương hiệu</h1>
              <p>Quản lý các thương hiệu sản phẩm trong hệ thống.</p>
            </div>
            <div className="admin-products-heading-actions">
              <button className="admin-add-product-button" onClick={openCreate}>
                <Plus size={18} weight="bold" />Thêm thương hiệu
              </button>
              <div className="admin-products-count">
                <Tag size={19} />
                <span>
                  <small>Tổng thương hiệu</small>
                  <strong>{brands.length.toLocaleString('vi-VN')}</strong>
                </span>
              </div>
            </div>
          </section>

          <section className="admin-panel">
            {loading ? (
              <div className="admin-product-list-skeleton">
                {Array.from({ length: 5 }).map((_, i) => <span key={i} />)}
              </div>
            ) : error ? (
              <div className="admin-state">
                <Warning size={36} />
                <h2>Không thể tải dữ liệu</h2>
                <button onClick={loadBrands}>Thử lại</button>
              </div>
            ) : filteredBrands.length === 0 ? (
              <div className="admin-empty">
                <MagnifyingGlass size={34} />
                <h3>Không tìm thấy thương hiệu</h3>
                <p>Thử tìm từ khóa khác hoặc thêm thương hiệu mới.</p>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Thương hiệu</th>
                      <th style={{ textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBrands.map(brand => (
                      <tr key={brand.brand_id}>
                        <td>
                          {brand.logo_url ? (
                            <img src={brand.logo_url} alt={brand.name} style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#fff' }} />
                          ) : (
                            <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                              <Tag size={16} color="var(--admin-muted)" />
                            </div>
                          )}
                          <div>
                            <strong>{brand.name}</strong>
                            <small>ID: #{brand.brand_id}</small>
                          </div>
                        </td>
                        <td>
                          <div className="admin-product-actions" style={{ justifyContent: 'flex-end' }}>
                            <button className="admin-icon-button" onClick={() => openEdit(brand)}>
                              <PencilSimple size={16} />
                            </button>
                            <button className="admin-icon-button is-danger" onClick={() => setDeletingBrand(brand)}>
                              <Trash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Modal Thêm/Sửa */}
      {(isCreateOpen || editingBrand) && (
        <div className="admin-detail-backdrop" onClick={(e) => e.target === e.currentTarget && !isSaving && (setIsCreateOpen(false), setEditingBrand(null))}>
          <div className="admin-product-detail" style={{ maxWidth: '500px', height: 'auto', borderRadius: '12px', padding: '24px' }}>
            <header style={{ padding: '0 0 20px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <div>
                <h2>{editingBrand ? 'Sửa thương hiệu' : 'Thêm thương hiệu mới'}</h2>
              </div>
              <button aria-label="Đóng" disabled={isSaving} onClick={() => (setIsCreateOpen(false), setEditingBrand(null))}>
                <X size={19} />
              </button>
            </header>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <label className="admin-edit-form" style={{ display: 'block' }}>
                <span style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '13px' }}>Tên thương hiệu</span>
                <input 
                  type="text" 
                  value={brandFormName} 
                  onChange={e => setBrandFormName(e.target.value)} 
                  placeholder="Nhập tên thương hiệu (VD: Apple)"
                  required
                  autoFocus
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </label>

              <div className="admin-image-upload-field">
                <span style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '13px' }}>Logo thương hiệu</span>
                <label className="admin-image-upload-button" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', cursor: 'pointer', justifyContent: 'center' }}>
                  <Plus size={18} />
                  <span>{brandLogoFile ? 'Đổi logo khác' : 'Tải logo lên'}</span>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
                </label>
                {brandLogoPreview && (
                  <div style={{ marginTop: '12px', textAlign: 'center' }}>
                    <img src={brandLogoPreview} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px', background: '#fff' }} />
                  </div>
                )}
              </div>
              
              {formError && <p className="admin-form-error">{formError}</p>}
              
              <div className="admin-dialog-actions">
                <button type="button" className="admin-button-secondary" disabled={isSaving} onClick={() => (setIsCreateOpen(false), setEditingBrand(null))}>Hủy</button>
                <button type="submit" className="admin-button-primary admin-create-submit" disabled={isSaving}>{isSaving ? 'Đang lưu...' : 'Lưu thương hiệu'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xóa */}
      {deletingBrand && (
        <div className="admin-detail-backdrop" onClick={(e) => e.target === e.currentTarget && !isSaving && setDeletingBrand(null)}>
          <div className="admin-product-detail" style={{ maxWidth: '400px', height: 'auto', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <Warning size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>Xác nhận xóa thương hiệu?</h2>
            <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px', lineHeight: 1.5 }}>
              Bạn sắp xóa thương hiệu <strong>{deletingBrand.name}</strong>. Hành động này không thể hoàn tác.
            </p>
            {formError && <p className="admin-form-error" style={{ marginBottom: '16px' }}>{formError}</p>}
            <div className="admin-dialog-actions" style={{ justifyContent: 'center' }}>
              <button type="button" className="admin-button-secondary" disabled={isSaving} onClick={() => setDeletingBrand(null)}>Hủy</button>
              <button type="button" className="admin-button-danger" disabled={isSaving} onClick={handleDelete}>{isSaving ? 'Đang xóa...' : 'Xóa ngay'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
