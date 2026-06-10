const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function api(path, options = {}) {
  const token = localStorage.getItem('ustrip_token');
  const isForm = options.body instanceof FormData;
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    },
    body: isForm || typeof options.body === 'string' ? options.body : options.body ? JSON.stringify(options.body) : undefined
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Không thể kết nối máy chủ');
  return data;
}

export const uploadImage = async (file, type = 'bill') => {
  const body = new FormData();
  body.append('image', file);
  return api(`/upload/${type}`, { method: 'POST', body });
};

export const currency = (value = 0) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
export const dateText = (value) => value ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) : '';
