import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Vite proxy routes to http://localhost:5000/api
  withCredentials: true, // Crucial for reading/writing httpOnly JWT session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to handle global session expirations (401/403)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Auto-refresh or redirect if cookie expires
      if (window.location.pathname !== '/login' && window.location.pathname !== '/' && window.location.pathname !== '/register') {
        console.warn('Session expired. Redirecting to login page...');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
