import api from './api';
import { mockUsers, type User, type Role } from '@/data/mockData';

export const authService = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      return data;
    } catch (e) {
      // Mock login: find user by email, accept any password
      const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) throw new Error('User not found. Try: alice@plmcontrol.com, bob@plmcontrol.com, carol@plmcontrol.com, david@plmcontrol.com');
      return { user, token: 'mock-token-' + user.id };
    }
  },

  async register(name: string, email: string, password: string, role: Role): Promise<{ user: User; token: string }> {
    try {
      const { data } = await api.post('/auth/register', { name, email, password, role });
      return data;
    } catch (e) {
      const user: User = { id: Date.now().toString(), name, email, role };
      mockUsers.push(user);
      return { user, token: 'mock-token-' + user.id };
    }
  },

  async getMe(): Promise<User> {
    try {
      const { data } = await api.get('/auth/me');
      return data;
    } catch (e) {
      // Read from token stored in localStorage to find mock user
      const token = localStorage.getItem('plm_token') || '';
      const userId = token.replace('mock-token-', '');
      const user = mockUsers.find(u => u.id === userId);
      if (!user) throw new Error('Not authenticated');
      return user;
    }
  },
};
