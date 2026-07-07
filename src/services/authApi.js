import { apiClient } from './apiClient';

const getTokenPayload = (result) => result?.data || result || {};
const ADMIN_EMAIL = 'user@gmail.com';

const decodeJwtPayload = (token) => {
  try {
    const encodedPayload = token.split('.')[1];
    if (!encodedPayload) return null;
    const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const decoded = decodeURIComponent(
      atob(normalized)
        .split('')
        .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const getEmailClaim = (payload) =>
  payload?.email ||
  payload?.unique_name ||
  payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
  '';

export const getAuthenticatedUserEmail = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return '';

  const payload = decodeJwtPayload(token);
  if (!payload) return '';
  if (payload.exp && payload.exp * 1000 <= Date.now()) return '';

  return String(getEmailClaim(payload)).trim().toLocaleLowerCase('en-US');
};

export const canAccessDashboard = () =>
  getAuthenticatedUserEmail() === ADMIN_EMAIL;

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
