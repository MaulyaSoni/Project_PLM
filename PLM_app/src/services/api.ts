import axios from 'axios';
import { API_BASE_URL } from '@/config/env';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

const redirectToLogin = (message: string) => {
  localStorage.removeItem('plm_token');
  toast.error(message);
  window.location.href = '/login';
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('plm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      redirectToLogin('Session expired, please login again');
    } else if (error.response?.status === 403) {
      redirectToLogin(error.response?.data?.error || 'Access denied. Please login again.');
    } else if (!error.response) {
      toast.error('Connection failed. Please check your network.');
    }
    return Promise.reject(error);
  }
);

export default api;
