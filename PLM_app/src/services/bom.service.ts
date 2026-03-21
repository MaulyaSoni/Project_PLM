import api from './api';
import type { BOM } from '@/data/mockData';

export const bomService = {
  async getAll(): Promise<BOM[]> {
    const { data } = await api.get('/boms');
    return data.data;
  },

  async getById(id: string): Promise<BOM | undefined> {
    const { data } = await api.get(`/boms/${id}`);
    return data.data;
  },

  async create(data: Partial<BOM>): Promise<BOM> {
    const response = await api.post('/boms', data);
    return response.data.data;
  },

  async archive(id: string): Promise<void> {
    await api.patch(`/boms/${id}/archive`);
  },
};
