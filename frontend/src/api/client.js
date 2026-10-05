import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api` : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// In-memory cache map and in-flight request deduplication map
const cacheMap = new Map();
const inFlightMap = new Map();
const DEFAULT_TTL_MS = 60 * 1000; // 60 seconds default TTL for GET requests

export const clearApiCache = (keyPattern = '') => {
  if (!keyPattern) {
    cacheMap.clear();
  } else {
    for (const key of cacheMap.keys()) {
      if (key.includes(keyPattern)) {
        cacheMap.delete(key);
      }
    }
  }
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tamil_erp_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toLowerCase();
    // Whenever a mutation occurs (POST, PUT, PATCH, DELETE), automatically invalidate cached GET endpoints
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      clearApiCache();
      try {
        // Also clear any sessionStorage caches for dynamic page data
        sessionStorage.removeItem('tamil_erp_dashboard_stats');
        sessionStorage.removeItem('tamil_erp_stores');
        sessionStorage.removeItem('tamil_erp_products');
        sessionStorage.removeItem('tamil_erp_field_orders');
      } catch (e) {
        // Ignore storage errors
      }
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if invalid or expired
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('tamil_erp_token');
        localStorage.removeItem('tamil_erp_user');
      }
    }
    return Promise.reject(error);
  }
);

// Helper to deep clone response objects to protect cached data from accidental in-place mutation
const cloneResponse = (res) => {
  if (!res) return res;
  return {
    ...res,
    data: typeof res.data === 'object' && res.data !== null ? JSON.parse(JSON.stringify(res.data)) : res.data,
  };
};

// Wrap native api.get with intelligent caching, deduplication & stale-while-revalidate capability
const originalGet = api.get.bind(api);

api.get = function (url, config = {}) {
  // Check if caller requested to bypass cache
  const bypassCache = config.cache === false || config.params?.fresh === 'true' || config.params?.fresh === true;

  const serializedParams = config.params ? JSON.stringify(config.params) : '';
  const cacheKey = `${url}?${serializedParams}`;

  if (!bypassCache) {
    const cached = cacheMap.get(cacheKey);
    const now = Date.now();
    const ttl = config.ttl || DEFAULT_TTL_MS;

    if (cached && now - cached.timestamp < ttl) {
      // Return cached copy instantly (0ms latency)
      return Promise.resolve(cloneResponse(cached.response));
    }

    // Request deduplication: if an identical GET request is currently in-flight, return the same promise
    if (inFlightMap.has(cacheKey)) {
      return inFlightMap.get(cacheKey).then(cloneResponse);
    }
  }

  // Issue the network request
  const requestPromise = originalGet(url, config)
    .then((response) => {
      if (!bypassCache && response.status >= 200 && response.status < 300) {
        cacheMap.set(cacheKey, {
          timestamp: Date.now(),
          response: cloneResponse(response),
        });
      }
      return response;
    })
    .finally(() => {
      inFlightMap.delete(cacheKey);
    });

  if (!bypassCache) {
    inFlightMap.set(cacheKey, requestPromise);
  }

  return requestPromise;
};

export default api;
