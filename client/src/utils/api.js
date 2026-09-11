import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://wealthpulse.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Sends cross-domain cookies automatically
});

// Automatically attach Bearer token from localStorage (if your backend uses tokens)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;