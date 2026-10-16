const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const authApi = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: (token) => request('/auth/me', { token }),
};

// Same endpoint set is exposed for the historical CSV dataset (/stations) and the real-time GBFS feed (/live)
const makeApi = (prefix) => ({
  summary: (token) => request(`${prefix}/summary`, { token }),
  quality: (token) => request(`${prefix}/quality`, { token }),
  regionSummary: (token) => request(`${prefix}/regions/summary`, { token }),
  regions: (token) => request(`${prefix}/regions`, { token }),
  conditions: (token) => request(`${prefix}/conditions`, { token }),
  temporal: (token) => request(`${prefix}/temporal`, { token }),
  correlation: (token) => request(`${prefix}/correlation`, { token }),
  capacityStats: (token) => request(`${prefix}/capacity-stats`, { token }),
  heatGrid: (token) => request(`${prefix}/heat-grid`, { token }),
  list: (token, params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return request(`${prefix}${qs ? `?${qs}` : ''}`, { token });
  },
  detail: (token, id) => request(`${prefix}/${id}`, { token }),
});

export const stationsApi = makeApi('/stations');
export const liveApi = { ...makeApi('/live'), status: (token) => request('/live/status', { token }), trend: (token) => request('/live/trend', { token }) };

export const dbApi = {
  schema: (token, source) => request(`/db/schema?source=${source}`, { token }),
  rows: (token, params) => request(`/db/rows?${new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null))}`, { token }),
  exportCsv: async (token, source) => {
    const res = await fetch(`${BASE_URL}/db/export.csv?source=${source}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Export failed');
    const url = URL.createObjectURL(await res.blob());
    const a = Object.assign(document.createElement('a'), { href: url, download: `citibike_${source}.csv` });
    a.click(); URL.revokeObjectURL(url);
  },
};
