import axios from 'axios';

const defaultApiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://wealthpulse.onrender.com';

export const API_URL = import.meta.env.VITE_API_URL || defaultApiUrl;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;