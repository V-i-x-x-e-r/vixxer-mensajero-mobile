// Cliente REST minimalista sobre fetch. Adjunta el token automáticamente.
import { API_URL } from '../config/env.js';
import { getToken } from '../storage/secure.js';

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Error ${res.status}`);
  }
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),
  searchUsers: (q) => request(`/users/search?q=${encodeURIComponent(q)}`),
  getPublicKey: (userId) => request(`/users/${userId}/public-key`),
  history: (userId) => request(`/messages/${userId}`),
};
