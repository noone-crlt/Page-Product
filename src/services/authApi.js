import { apiClient } from './apiClient';

const getTokenPayload = (result) => result?.data || result || {};

const saveTokens = (result) => {
  const payload = getTokenPayload(result);
  const accessToken = payload.accessToken || payload.access_token;
  const refreshToken = payload.refreshToken || payload.refresh_token;

  if (accessToken) localStorage.setItem('accessToken', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

  return result;
};

export const login = async (email, password) => {
  const result = await apiClient('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  return saveTokens(result);
};

export const register = (payload) =>
  apiClient('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const refreshToken = async (token) => {
  const result = await apiClient('/api/auth/refresh-token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: token }),
  });

  return saveTokens(result);
};

export const clearAuthTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};
