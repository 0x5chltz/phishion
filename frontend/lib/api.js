const DEFAULT_API_URL = 'http://localhost:4000';
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

/**
 * Keep the API on the same hostname the page was opened with.
 *
 * NEXT_PUBLIC_API_URL is baked in at build time as http://localhost:4000. If
 * you then browse to http://127.0.0.1:3000, every call goes to a different
 * host: the browser blocks it on CORS, and because 127.0.0.1 and localhost are
 * different sites the SameSite=Lax session cookie is dropped too.
 *
 * So when the configured host is a loopback name, follow the page's hostname
 * instead. A real deployment sets NEXT_PUBLIC_API_URL to a non-loopback host,
 * where this rewrite never applies.
 */
function resolveApiOrigin() {
  const base = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/$/, '');
  if (typeof window === 'undefined') return base;

  try {
    const url = new URL(base);
    if (LOOPBACK_HOSTS.has(url.hostname) && window.location.hostname !== url.hostname) {
      url.hostname = window.location.hostname;
      return url.origin;
    }
  } catch (_) {
    // Relative or malformed value; use it as given.
  }
  return base;
}

export function apiBaseUrl() {
  const namespace = process.env.NEXT_PUBLIC_BACKEND_NAME || 'api';
  return `${resolveApiOrigin()}/${namespace.replace(/^\//, '').replace(/\/$/, '')}`;
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
  login: (email, password) => apiFetch('/login', { method: 'POST', body: { email, password } }),
  register: (email, username, password) =>
    apiFetch('/register', { method: 'POST', body: { email, username, password } }),
  scans: () => apiFetch('/scans'),
  scan: (url) => apiFetch('/scan', { method: 'POST', body: { url } }),
  scanDetail: (id) => apiFetch(`/scans/${encodeURIComponent(id)}`),
  domain: (hostname) => apiFetch(`/domain/${encodeURIComponent(hostname)}`),
  logout: () => apiFetch('/logout', { method: 'POST' }),
  deleteAccount: () => apiFetch('/delete', { method: 'POST' }),

  // Batch scanning
  batchScan: (urls) => apiFetch('/batch-scan', { method: 'POST', body: { urls } }),

  // Tags
  tags: () => apiFetch('/tags'),
  createTag: (name, color) => apiFetch('/tags', { method: 'POST', body: { name, color } }),
  addTagToScan: (scanId, tagId) => apiFetch(`/scans/${scanId}/tags/${tagId}`, { method: 'POST' }),

  // Whitelist
  whitelist: () => apiFetch('/whitelist'),
  addWhitelist: (url_pattern) => apiFetch('/whitelist', { method: 'POST', body: { url_pattern } }),
  removeWhitelist: (id) => apiFetch(`/whitelist/${id}`, { method: 'DELETE' }),

  // Blacklist
  blacklist: () => apiFetch('/blacklist'),
  addBlacklist: (url_pattern, reason) => apiFetch('/blacklist', { method: 'POST', body: { url_pattern, reason } }),

  // Scheduled scans
  scheduledScans: () => apiFetch('/scheduled-scans'),
  createScheduledScan: (url, frequency) => apiFetch('/scheduled-scans', { method: 'POST', body: { url, frequency } }),
  updateScheduledScan: (id, payload) => apiFetch(`/scheduled-scans/${id}`, { method: 'PUT', body: payload }),
  deleteScheduledScan: (id) => apiFetch(`/scheduled-scans/${id}`, { method: 'DELETE' }),

  // Preferences
  preferences: () => apiFetch('/preferences'),
  updatePreferences: (payload) => apiFetch('/preferences', { method: 'PUT', body: payload }),

  // Analytics
  analytics: () => apiFetch('/analytics'),

  // Search
  searchScans: (params) => apiFetch(`/scans/search?${new URLSearchParams(params).toString()}`),

  // Comparison
  compareScans: (id1, id2) => apiFetch(`/scans/${id1}/compare/${id2}`),

  // API usage
  apiUsage: () => apiFetch('/api-usage'),
};

export function exportUrl(format) {
  return `${apiBaseUrl()}/scans/export/${format}`;
}

export async function importScans(file) {
  const csrf = await apiFetch('/csrf');
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${apiBaseUrl()}/scans/import`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-CSRF-Token': csrf?.csrf_token },
    body: formData,
  });
  const data = await parseResponse(response);
  if (!response.ok) {
    const error = new Error(data?.error || 'Import failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

