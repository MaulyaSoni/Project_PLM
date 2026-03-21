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
  async getAuditLog() {
    const { data } = await api.get('/reports/audit-log');
    return data.data;
  },
};
