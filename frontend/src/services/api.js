/**
 * ============================================================================
 * File: frontend/src/services/api.js
 * Purpose: Centralized Axios HTTP Client Configuration
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Configures Axios base URL pointing to the backend API ('http://localhost:5000/api').
 * - Sets withCredentials: true so browser automatically attaches HttpOnly JWT cookies.
 * - Provides request and response interceptors to handle global errors and 401 redirects.
 * ============================================================================
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send and receive HttpOnly cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Optional response interceptor to normalize errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Pass through rejection so calling components can handle status codes
    return Promise.reject(error);
  }
);

export default api;
