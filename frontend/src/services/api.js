const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiCache = new Map();
const CACHE_DURATION_MS = 3 * 60 * 1000; // 3 minutes

export const fetchApi = async (endpoint, options = {}, forceFetch = false) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = { ...options.headers };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  
  if (isGet && !forceFetch) {
    const cached = apiCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
      return cached.data; // Return immediately from cache
    }
  }

  try {
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Cache successful GET responses
    if (isGet) {
      apiCache.set(url, { data, timestamp: Date.now() });
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
};
