const DEFAULT_API_URL = 'http://localhost:4000';
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function apiBaseUrl() {
  const base = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
  const namespace = process.env.NEXT_PUBLIC_BACKEND_NAME || 'api';
  return `${base.replace(/\/$/, '')}/${namespace.replace(/^\//, '').replace(/\/$/, '')}`;
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (_) {
    return null;
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${apiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`, {
    credentials: 'include',
    ...options,
  });
  const data = await parseResponse(response);

  if (!response.ok) {
    const message = data?.error?.message || data?.error || data?.message || response.statusText || `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function apiFetch(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = { ...(options.headers || {}) };
  let body = options.body;

  if (body != null && typeof body !== 'string' && !(body instanceof FormData)) {
    body = JSON.stringify(body);
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (MUTATION_METHODS.has(method)) {
    const csrf = await request('/csrf');
    headers['X-CSRF-Token'] = csrf?.csrf_token;
  }

  return request(path, { ...options, method, headers, body });
}

export const api = {
  userinfo: () => apiFetch('/userinfo'),
  scans: () => apiFetch('/scans'),
  scan: (url) => apiFetch('/scan', { method: 'POST', body: { url } }),
  scanDetail: (id) => apiFetch(`/scans/${encodeURIComponent(id)}`),
  domain: (hostname) => apiFetch(`/domain/${encodeURIComponent(hostname)}`),
  logout: () => apiFetch('/logout', { method: 'POST' }),
  deleteAccount: () => apiFetch('/delete', { method: 'POST' }),
};

export function googleLoginUrl() {
  const base = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
  return `${base.replace(/\/$/, '')}/login/google`;
}
