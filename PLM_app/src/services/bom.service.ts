import api from './api';
import { mockBOMs, type BOM } from '@/data/mockData';

export const bomService = {
  async getAll(): Promise<BOM[]> {
    try {
      const { data } = await api.get('/boms');
      return Array.isArray(data) ? data : mockBOMs;
    } catch (e) {
      return mockBOMs;
    }
  },
  async getById(id: string): Promise<BOM | undefined> {
    try {
      const { data } = await api.get(`/boms/${id}`);
      return data || mockBOMs.find(b => b.id === id);
    } catch (e) {
      return mockBOMs.find(b => b.id === id);
    }
  },
  async create(data: Partial<BOM>): Promise<BOM> {
    try {
      const response = await api.post('/boms', data);
      return response.data;
    } catch (e) {
      return { ...mockBOMs[0], id: Date.now().toString() } as BOM;
    }
  },
  async archive(id: string): Promise<void> {
    try {
      await api.patch(`/boms/${id}/archive`);
    } catch (e) {
      console.log('Mock archive BOM', id);
    }
  },
};
