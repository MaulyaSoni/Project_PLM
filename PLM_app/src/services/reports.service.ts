import { mockECOs, mockProducts, mockBOMs, mockAuditLog } from '@/data/mockData';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export const reportsService = {
  async getECOReport() {
    await delay(300);
    return mockECOs;
  },
  async getVersionHistory(productId: string) {
    await delay(200);
    return mockProducts.find(p => p.id === productId)?.versions || [];
  },
  async getBOMHistory(productId: string) {
    await delay(200);
    return mockBOMs.filter(b => b.productId === productId);
  },
  async getAuditLog() {
    await delay(300);
    return [...mockAuditLog];
  },
};
