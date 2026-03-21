import api from './api';
import type { ECO } from '@/data/mockData';

export const ecoService = {
  async getAll(): Promise<ECO[]> {
    const { data } = await api.get('/eco');
    return data;
  },
  async getById(id: string): Promise<ECO | undefined> {
    const { data } = await api.get(`/eco/${id}`);
    return data;
  },
  async create(data: Partial<ECO>): Promise<ECO> {
    const response = await api.post('/eco', data);
    return response.data;
  },
  async submitForReview(id: string): Promise<void> {
    await api.post(`/eco/${id}/submit`);
  },
  async approve(id: string, comment: string, userId: string, userName: string): Promise<void> {
    await api.post(`/eco/${id}/approve`, { comment, userId, userName });
  },
  async reject(id: string, comment: string, userId: string, userName: string): Promise<void> {
    await api.post(`/eco/${id}/reject`, { comment, userId, userName });
  },
  async apply(id: string): Promise<void> {
    await api.post(`/eco/${id}/apply`);
  },
};
