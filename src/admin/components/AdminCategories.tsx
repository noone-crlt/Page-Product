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
  FolderOpen,
  DeviceMobile,
  DeviceTablet,
  Laptop,
  Headphones,
  Watch,
  Plug,
  Monitor,
  SpeakerHifi,
  Tag
} from '@phosphor-icons/react';
import { 
  getProductCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '../../services/productApi';
import { AdminSidebar } from './AdminSidebar';
import '../styles/admin-dashboard.css';

interface Category {
  category_id: number;
  name: string;
}

export default function AdminCategories() {
  const { user, logout } = useApp();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // Form state
  const [categoryFormName, setCategoryFormName] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('điện thoại') || n.includes('phone')) return DeviceMobile;
    if (n.includes('laptop') || n.includes('máy tính')) return Laptop;
    if (n.includes('tablet') || n.includes('máy tính bảng') || n.includes('ipad')) return DeviceTablet;
    if (n.includes('tai nghe') || n.includes('audio') || n.includes('âm thanh')) return Headphones;
    if (n.includes('đồng hồ') || n.includes('watch')) return Watch;
    if (n.includes('loa') || n.includes('speaker')) return SpeakerHifi;
    if (n.includes('màn hình') || n.includes('monitor')) return Monitor;
    if (n.includes('phụ kiện') || n.includes('sạc') || n.includes('cáp')) return Plug;
    return Tag;
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const result = await getProductCategories();
      setCategories(Array.isArray(result?.data) ? result.data : []);
    } catch (err) {
      setError('Không thể tải danh sách danh mục.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(c => 
    !query || c.name.toLowerCase().includes(query.toLowerCase()) || String(c.category_id).includes(query)
  );

  const openCreate = () => {
    setCategoryFormName('');
    setFormError('');
    setIsCreateOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormName(category.name);
    setFormError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormName.trim()) {
      setFormError('Tên danh mục không được để trống');
      return;
    }
    
    setIsSaving(true);
    setFormError('');

    try {
      const payload = { name: categoryFormName };

      if (editingCategory) {
        await updateCategory(editingCategory.category_id, payload);
      } else {
        await createCategory(payload);
      }
      await loadCategories();
      setIsCreateOpen(false);
      setEditingCategory(null);
    } catch (err) {
      setFormError(editingCategory ? 'Lỗi khi cập nhật danh mục' : 'Lỗi khi tạo danh mục');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    setIsSaving(true);
    setFormError('');
    try {
      await deleteCategory(deletingCategory.category_id);
      await loadCategories();
      setDeletingCategory(null);
    } catch (err) {
      setFormError('Lỗi khi xóa danh mục (có thể đang có sản phẩm thuộc danh mục này).');
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
              placeholder="Tìm danh mục..." 
            />
          </label>
        </header>

        <div className="admin-content">
          <section className="admin-page-heading">
            <div>
              <span className="admin-eyebrow">Danh mục cửa hàng</span>
              <h1>Danh mục sản phẩm</h1>
              <p>Quản lý các danh mục phân loại sản phẩm.</p>
            </div>
            <div className="admin-products-heading-actions">
              <button className="admin-add-product-button" onClick={openCreate}>
                <Plus size={18} weight="bold" />Thêm danh mục
              </button>
              <div className="admin-products-count">
                <FolderOpen size={19} />
                <span>
                  <small>Tổng danh mục</small>
                  <strong>{categories.length.toLocaleString('vi-VN')}</strong>
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
                <button onClick={loadCategories}>Thử lại</button>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="admin-empty">
                <MagnifyingGlass size={34} />
                <h3>Không tìm thấy danh mục</h3>
                <p>Thử tìm từ khóa khác hoặc thêm danh mục mới.</p>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Danh mục</th>
                      <th style={{ textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map(category => (
                      <tr key={category.category_id}>
                        <td>
                          <div style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--admin-accent-bg, #ede9fe)', borderRadius: '8px' }}>
                            {React.createElement(getCategoryIcon(category.name), { size: 18, color: "var(--admin-accent, #7c3aed)", weight: "duotone" })}
                          </div>
                          <div>
                            <strong>{category.name}</strong>
                            <small>ID: #{category.category_id}</small>
                          </div>
                        </td>
                        <td>
                          <div className="admin-product-actions" style={{ justifyContent: 'flex-end' }}>
                            <button className="admin-icon-button" onClick={() => openEdit(category)}>
                              <PencilSimple size={16} />
                            </button>
                            <button className="admin-icon-button is-danger" onClick={() => setDeletingCategory(category)}>
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
      {(isCreateOpen || editingCategory) && (
        <div className="admin-detail-backdrop" onClick={(e) => e.target === e.currentTarget && !isSaving && (setIsCreateOpen(false), setEditingCategory(null))}>
          <div className="admin-product-detail" style={{ maxWidth: '500px', height: 'auto', borderRadius: '12px', padding: '24px' }}>
            <header style={{ padding: '0 0 20px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <div>
                <h2>{editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h2>
              </div>
              <button aria-label="Đóng" disabled={isSaving} onClick={() => (setIsCreateOpen(false), setEditingCategory(null))}>
                <X size={19} />
              </button>
            </header>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <label className="admin-edit-form" style={{ display: 'block' }}>
                <span style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '13px' }}>Tên danh mục</span>
                <input 
                  type="text" 
                  value={categoryFormName} 
                  onChange={e => setCategoryFormName(e.target.value)} 
                  placeholder="Nhập tên danh mục (VD: Điện thoại)"
                  required
                  autoFocus
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </label>
              
              {formError && <p className="admin-form-error">{formError}</p>}
              
              <div className="admin-dialog-actions">
                <button type="button" className="admin-button-secondary" disabled={isSaving} onClick={() => (setIsCreateOpen(false), setEditingCategory(null))}>Hủy</button>
                <button type="submit" className="admin-button-primary admin-create-submit" disabled={isSaving}>{isSaving ? 'Đang lưu...' : 'Lưu danh mục'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xóa */}
      {deletingCategory && (
        <div className="admin-detail-backdrop" onClick={(e) => e.target === e.currentTarget && !isSaving && setDeletingCategory(null)}>
          <div className="admin-product-detail" style={{ maxWidth: '400px', height: 'auto', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <Warning size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>Xác nhận xóa danh mục?</h2>
            <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px', lineHeight: 1.5 }}>
              Bạn sắp xóa danh mục <strong>{deletingCategory.name}</strong>. Hành động này không thể hoàn tác.
            </p>
            {formError && <p className="admin-form-error" style={{ marginBottom: '16px' }}>{formError}</p>}
            <div className="admin-dialog-actions" style={{ justifyContent: 'center' }}>
              <button type="button" className="admin-button-secondary" disabled={isSaving} onClick={() => setDeletingCategory(null)}>Hủy</button>
              <button type="button" className="admin-button-danger" disabled={isSaving} onClick={handleDelete}>{isSaving ? 'Đang xóa...' : 'Xóa ngay'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
