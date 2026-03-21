import api from './api';
import type { User, Role } from '@/data/mockData';

export const authService = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  async register(name: string, email: string, password: string, role: Role): Promise<{ user: User; token: string }> {
    const { data } = await api.post('/auth/register', { name, email, password, role });
    return data;
  },

  async getMe(): Promise<User> {
    const { data } = await api.get('/auth/me');
    return data;
  },
};
