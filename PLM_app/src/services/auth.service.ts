import api from './api';
import type { User, Role } from '@/data/mockData';

const normalizeRole = (role: string): Role => {
  if (String(role).toUpperCase() === 'OBSERVER') return 'OPERATIONS';
  return role as Role;
};

const normalizeUser = (user: User): User => ({
  ...user,
  role: normalizeRole(user.role),
});

export const authService = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const { data } = await api.post('/auth/login', { email, password });
    return { ...data.data, user: normalizeUser(data.data.user) };
  },

  async register(name: string, email: string, password: string, role: Role): Promise<{ user: User; token: string }> {
    const { data } = await api.post('/auth/register', { name, email, password, role });
    return { ...data.data, user: normalizeUser(data.data.user) };
  },

  async getMe(): Promise<User> {
    const { data } = await api.get('/auth/me');
    return normalizeUser(data.data);
  },
};
