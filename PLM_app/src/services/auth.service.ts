import { mockUsers, type User, type Role } from '@/data/mockData';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export const authService = {
  async login(email: string, _password: string): Promise<{ user: User; token: string }> {
    await delay(500);
    const user = mockUsers.find(u => u.email === email);
    if (!user) throw new Error('Invalid credentials');
    return { user, token: 'mock-jwt-token-' + user.id };
  },

  async register(name: string, email: string, _password: string, role: Role): Promise<{ user: User; token: string }> {
    await delay(500);
    const user: User = { id: 'u' + Date.now(), name, email, role };
    return { user, token: 'mock-jwt-token-' + user.id };
  },

  async getMe(): Promise<User> {
    await delay(200);
    const token = localStorage.getItem('plm_token');
    if (!token) throw new Error('Not authenticated');
    const userId = token.replace('mock-jwt-token-', '');
    const user = mockUsers.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    return user;
  },
};
