import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { getProfile, updateProfile, uploadProfileAvatar } from '../../services/profileApi';

const EMPTY_FORM = {
  fullName: '',
  email: '',
  phoneNumber: '',
  avatarUrl: '',
};

const getAvatarUrl = (result) => {
  const data = result?.data ?? result;
  if (typeof data === 'string') return data;
  return data?.image_url || data?.url || data?.avatar_url || '';
};

export default function ProfileModal({ open, onClose }) {
  const { user, updateCurrentUser } = useApp();
  const [form, setForm] = useState(EMPTY_FORM);
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const avatarPreview = useMemo(
    () => avatarFile ? URL.createObjectURL(avatarFile) : '',
    [avatarFile],
  );

  useEffect(() => () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleEscape = (event) => {
      if (event.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose, saving]);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    setError('');
    setSuccess('');
    setAvatarFile(null);
    getProfile()
      .then((result) => {
        const profile = result?.data?.profile ?? result?.data ?? result ?? {};
        setForm({
          fullName: profile.full_name || profile.name || user?.name || '',
          email: profile.email || user?.email || '',
          phoneNumber: profile.phone_number || profile.phone || user?.phone || '',
          avatarUrl: profile.avatar_url || profile.avatarUrl || user?.avatarUrl || '',
        });
      })
      .catch((loadError) => {
        setForm({
          fullName: user?.name || '',
          email: user?.email || '',
          phoneNumber: user?.phone || '',
          avatarUrl: user?.avatarUrl || '',
        });
        setError(loadError.message || 'Không thể tải hồ sơ. Bạn vẫn có thể chỉnh sửa thông tin hiện có.');
      })
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const initials = (form.fullName || user?.name || 'Tài khoản')
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn đúng tệp hình ảnh.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ảnh đại diện không được vượt quá 5 MB.');
      return;
    }
    setAvatarFile(file);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const fullName = form.fullName.trim();
    const phoneNumber = form.phoneNumber.trim();

    if (fullName.length < 2) {
      setError('Họ và tên phải có ít nhất 2 ký tự.');
      return;
    }
    if (phoneNumber && !/^[0-9+().\s-]{8,20}$/.test(phoneNumber)) {
      setError('Số điện thoại chưa đúng định dạng.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      let avatarUrl = form.avatarUrl;
      if (avatarFile) {
        avatarUrl = getAvatarUrl(await uploadProfileAvatar(avatarFile));
        if (!avatarUrl) throw new Error('API tải ảnh không trả về đường dẫn ảnh đại diện.');
      }

      const result = await updateProfile({
        full_name: fullName,
        phone_number: phoneNumber || null,
        avatar_url: avatarUrl || null,
      });
      const updated = result?.data?.profile ?? result?.data ?? result ?? {};
      const nextProfile = {
        name: updated.full_name || fullName,
        email: updated.email || form.email,
        phone: updated.phone_number ?? phoneNumber,
        avatarUrl: updated.avatar_url ?? avatarUrl,
      };

      setForm((current) => ({
        ...current,
        fullName: nextProfile.name,
        phoneNumber: nextProfile.phone,
        avatarUrl: nextProfile.avatarUrl,
      }));
      setAvatarFile(null);
      updateCurrentUser(nextProfile);
      setSuccess('Thông tin hồ sơ đã được cập nhật.');
    } catch (saveError) {
      setError(saveError.message || 'Không thể cập nhật hồ sơ. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="profile-modal-backdrop" onMouseDown={(event) => event.currentTarget === event.target && !saving && onClose()}>
      <section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
        <header className="profile-modal__header">
          <div>
            <span>Hồ sơ cá nhân</span>
            <h2 id="profile-modal-title">Chỉnh sửa thông tin</h2>
            <p>Cập nhật thông tin liên hệ và ảnh đại diện của bạn.</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Đóng cửa sổ chỉnh sửa hồ sơ">
            <i className="ri-close-line" />
          </button>
        </header>

        {loading ? (
          <div className="profile-modal__loading" aria-label="Đang tải hồ sơ">
            <span /><span /><span /><span />
          </div>
        ) : (
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="profile-avatar-editor">
              <div className="profile-avatar-preview">
                {(avatarPreview || form.avatarUrl)
                  ? <img src={avatarPreview || form.avatarUrl} alt="Ảnh đại diện hiện tại" />
                  : <span>{initials}</span>}
              </div>
              <div>
                <strong>Ảnh đại diện</strong>
                <p>Chọn ảnh JPG, PNG hoặc WebP có dung lượng tối đa 5 MB.</p>
                <div className="profile-avatar-actions">
                  <label>
                    <i className="ri-upload-cloud-2-line" />
                    {avatarPreview || form.avatarUrl ? 'Thay ảnh' : 'Tải ảnh lên'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} />
                  </label>
                  {(avatarPreview || form.avatarUrl) && (
                    <button type="button" onClick={() => { setAvatarFile(null); setForm((current) => ({ ...current, avatarUrl: '' })); }}>
                      Xóa ảnh
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="profile-form__fields">
              <label>
                <span>Họ và tên</span>
                <div className="profile-input"><i className="ri-user-3-line" /><input value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} autoComplete="name" required /></div>
              </label>
              <label>
                <span>Email</span>
                <div className="profile-input is-readonly"><i className="ri-mail-line" /><input value={form.email} readOnly aria-describedby="profile-email-help" /></div>
                <small id="profile-email-help">Email đăng nhập không thể thay đổi tại đây.</small>
              </label>
              <label>
                <span>Số điện thoại</span>
                <div className="profile-input"><i className="ri-phone-line" /><input value={form.phoneNumber} onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))} inputMode="tel" autoComplete="tel" /></div>
              </label>
            </div>

            {error && <p className="profile-form-message is-error" role="alert"><i className="ri-error-warning-line" />{error}</p>}
            {success && <p className="profile-form-message is-success" role="status"><i className="ri-checkbox-circle-line" />{success}</p>}

            <footer className="profile-form__actions">
              <button type="button" className="profile-button-secondary" onClick={onClose} disabled={saving}>Hủy</button>
              <button type="submit" className="profile-button-primary" disabled={saving}>
                {saving ? <><i className="ri-loader-4-line" />Đang lưu</> : <><i className="ri-save-3-line" />Lưu thay đổi</>}
              </button>
            </footer>
          </form>
        )}
      </section>
    </div>,
    document.body,
  );
}
