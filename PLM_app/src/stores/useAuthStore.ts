import { create } from 'zustand';
import type { User, Role } from '@/data/mockData';
import { authService } from '@/services/auth.service';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: Role) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('plm_token'),
  isAuthenticated: !!localStorage.getItem('plm_token'),
  isLoading: false,

  login: async (email, password) => {
    const { user, token } = await authService.login(email, password);
    localStorage.setItem('plm_token', token);
    set({ user, token, isAuthenticated: true });
  },

  register: async (name, email, password, role) => {
    const { user, token } = await authService.register(name, email, password, role);
    localStorage.setItem('plm_token', token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('plm_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const user = await authService.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('plm_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
