import api from './api';
import { mockECOs, type ECO } from '@/data/mockData';

export const ecoService = {
  async getAll(): Promise<ECO[]> {
    try {
      const { data } = await api.get('/eco');
      return Array.isArray(data) ? data : mockECOs;
    } catch (e) {
      return mockECOs;
    }
  },
  async getById(id: string): Promise<ECO | undefined> {
    try {
      const { data } = await api.get(`/eco/${id}`);
      return data || mockECOs.find(e => e.id === id);
    } catch (e) {
      return mockECOs.find(e => e.id === id);
    }
  },
  async create(data: Partial<ECO>): Promise<ECO> {
    try {
      const response = await api.post('/eco', data);
      return response.data;
    } catch (e) {
      const newEco = { ...mockECOs[0], id: Date.now().toString() } as ECO;
      mockECOs.push(newEco);
      return newEco;
    }
  },
  async submitForReview(id: string): Promise<void> {
    try { await api.post(`/eco/${id}/submit`); } catch (e) {
      const eco = mockECOs.find(x => x.id === id);
      if (eco) { eco.stage = 'IN_REVIEW'; eco.status = 'IN_REVIEW'; }
    }
  },
  async approve(id: string, comment: string, userId: string, userName: string): Promise<void> {
    try { await api.post(`/eco/${id}/approve`, { comment, userId, userName }); } catch (e) {
      const eco = mockECOs.find(x => x.id === id);
      if (eco) { eco.stage = 'DONE'; eco.status = 'APPROVED'; eco.approvals = [...eco.approvals, { id: Date.now().toString(), userId, userName, action: 'APPROVED', comment, date: new Date().toISOString().split('T')[0] }]; }
    }
  },
  async reject(id: string, comment: string, userId: string, userName: string): Promise<void> {
    try { await api.post(`/eco/${id}/reject`, { comment, userId, userName }); } catch (e) {
      const eco = mockECOs.find(x => x.id === id);
      if (eco) { eco.status = 'DONE'; eco.approvals = [...eco.approvals, { id: Date.now().toString(), userId, userName, action: 'REJECTED', comment, date: new Date().toISOString().split('T')[0] }]; }
    }
  },
  async apply(id: string): Promise<void> {
    try { await api.post(`/eco/${id}/apply`); } catch (e) {
      const eco = mockECOs.find(x => x.id === id);
      if (eco) eco.status = 'DONE';
    }
  },
};
