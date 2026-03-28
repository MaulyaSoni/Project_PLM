import api from './api';

export const reportsService = {
  async getECOReport() {
    const { data } = await api.get('/reports/eco');
    return data.data;
  },
  async getVersionHistory(productId: string) {
    const { data } = await api.get(`/reports/versions/${productId}`);
    return data.data;
  },
  async getBOMHistory(productId: string) {
    const { data } = await api.get(`/reports/bom-history/${productId}`);
    return data.data;
  },
  async getArchivedProducts() {
    const { data } = await api.get('/reports/archived-products');
    return data.data;
  },
  async getActiveMatrix() {
    const { data } = await api.get('/reports/active-matrix');
    return data.data;
  },
  async getUsers() {
    const { data } = await api.get('/reports/users');
    return data.data;
  },
  async getAuditLog() {
    const { data } = await api.get('/reports/audit-log');
    return data.data;
  },
  async getAiResults() {
    const { data } = await api.get('/ai/results');
    return data;
  },
  async getAgentAlerts() {
    const { data } = await api.get('/reports/agent-alerts');
    return data.data;
  },
  async runAgentNow() {
    const { data } = await api.post('/reports/agent/run');
    return data.data;
  },
};
