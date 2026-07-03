import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';

export const BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function api(path, options = {}) {
  const token = await SecureStore.getItemAsync('ustrip_token');
  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      },
      body: options.body instanceof FormData || typeof options.body === 'string' ? options.body : options.body ? JSON.stringify(options.body) : undefined
    });
  } catch {
    throw new Error(`Không kết nối được API ${BASE}. Kiểm tra backend, IP LAN và Wi-Fi của điện thoại.`);
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Không thể kết nối máy chủ');
  return data;
}

export async function saveToken(token) { await SecureStore.setItemAsync('ustrip_token', token); }
export async function removeToken() { await SecureStore.deleteItemAsync('ustrip_token'); }
export async function hasToken() { return Boolean(await SecureStore.getItemAsync('ustrip_token')); }
export async function getToken() { return await SecureStore.getItemAsync('ustrip_token'); }
export const money = (value = 0) => `${new Intl.NumberFormat('vi-VN').format(Number(value))}đ`;

export async function pickAndUploadImage(type = 'bill') {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('UsTrip cần quyền truy cập thư viện ảnh.');

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  const body = new FormData();
  if (asset.file) {
    body.append('image', asset.file);
  } else {
    body.append('image', {
      uri: asset.uri,
      name: asset.fileName || `ustrip-${Date.now()}.jpg`,
      type: asset.mimeType || 'image/jpeg'
    });
  }
  return api(`/upload/${type}`, { method: 'POST', body });
}
