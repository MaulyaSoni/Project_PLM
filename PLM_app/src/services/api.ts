import axios from 'axios';
import { API_BASE_URL } from '@/config/env';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('plm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('plm_token');
      toast.error('Session expired, please login again');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      toast.error(error.response?.data?.error || 'You do not have permission to perform this action');
    } else if (!error.response) {
      toast.error('Connection failed. Please check your network.');
    }
    return Promise.reject(error);
  }
);

export default api;
