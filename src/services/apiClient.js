const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'https://myapp-fmoh.onrender.com'
).replace(/\/$/, '');

const parseResponse = async (response) => {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const apiClient = async (path, options = {}) => {
  const accessToken = localStorage.getItem('accessToken');
  const headers = new Headers(options.headers || {});

  headers.set('Content-Type', 'application/json; charset=utf-8');

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new ApiError(
      'Không thể kết nối API. Nếu trình duyệt báo lỗi CORS, backend cần cho phép origin của frontend.',
      0,
      error,
    );
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      (response.status === 401
        ? 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'
        : `Yêu cầu API thất bại với mã ${response.status}.`);

    throw new ApiError(message, response.status, data);
  }

  return data;
};

export { API_BASE_URL };
