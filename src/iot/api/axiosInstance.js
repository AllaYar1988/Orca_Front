import axios from 'axios';
import { API_BASE_URL } from './config';
import { getIotToken, clearIotUser } from './auth';

/**
 * Axios instance with automatic Authorization header
 * All API calls should use this instance for authenticated requests
 */
const api = axios.create({
  baseURL: API_BASE_URL
});

// Request interceptor - adds Authorization header and token param
api.interceptors.request.use(
  (config) => {
    const token = getIotToken();
    console.log('Making request to:', config.url, 'Token exists:', !!token, 'Token:', token?.substring(0, 10) + '...');
    if (token) {
      // Add as header
      config.headers.Authorization = `Bearer ${token}`;
      // Also add as query param (fallback for servers that strip Authorization header)
      config.params = config.params || {};
      config.params.token = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handles 401 errors (token expired/invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only clear if we actually had a token (avoid clearing on initial load)
      const hadToken = getIotToken();
      console.log('401 error - URL:', error.config?.url, 'Had token:', !!hadToken);
      if (hadToken) {
        console.log('Clearing user due to 401 on:', error.config?.url);
        // Token is invalid or expired - clear stored data
        clearIotUser();
        // Dispatch event to notify the app
        window.dispatchEvent(new CustomEvent('auth:logout', {
          detail: { reason: 'token_expired' }
        }));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
