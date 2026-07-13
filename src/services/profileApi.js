import { apiClient } from './apiClient';

export const getProfile = () => apiClient('/api/profile');

export const updateProfile = (profile) =>
  apiClient('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });

export const uploadProfileAvatar = (file) => {
  const body = new FormData();
  body.append('file', file);

  return apiClient('/api/image', {
    method: 'POST',
    body,
  });
};
