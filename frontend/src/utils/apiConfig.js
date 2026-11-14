/**
 * apiConfig.js
 * 
 * Provides centralized resolution of API base URLs.
 * In development / single-origin deployments: defaults to relative '' (allowing reverse proxy or Vite dev proxy).
 * In decoupled production environments: reads `import.meta.env.VITE_API_BASE_URL` (e.g. 'https://api.floodwatch.org').
 */

const getApiBaseUrl = () => {
  const envUrl = import.meta.env?.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string') {
    // Strip trailing slash if present
    return envUrl.trim().replace(/\/+$/, '');
  }
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Helper to construct a fully qualified or relative API path.
 * @param {string} endpoint - e.g. '/api/regions' or '/api/water/majuli/boundaries'
 * @returns {string} - Combined URL
 */
export const apiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

