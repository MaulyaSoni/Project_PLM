import api from './api';

export type StageItem = {
  id: string;
  name: string;
  order: number;
  requiresApproval: boolean;
};

export type UserItem = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'ENGINEERING' | 'APPROVER' | 'OPERATIONS';
  createdAt: string;
};

export const settingsService = {
  async getStages(): Promise<StageItem[]> {
    const { data } = await api.get('/settings/stages');
    return data.data;
  },
  async createStage(payload: Partial<Pick<StageItem, 'name' | 'order' | 'requiresApproval'>>) {
    const { data } = await api.post('/settings/stages', payload);
    return data.data;
  },
  async updateStage(id: string, payload: Partial<Pick<StageItem, 'name' | 'order' | 'requiresApproval'>>) {
    const { data } = await api.patch(`/settings/stages/${id}`, payload);
    return data.data;
  },
  async getUsers(): Promise<UserItem[]> {
    const { data } = await api.get('/reports/users');
    return data.data;
  },
  async updateUserRole(id: string, role: UserItem['role']) {
    const { data } = await api.patch(`/auth/users/${id}/role`, { role });
    return data.data;
  },
};
