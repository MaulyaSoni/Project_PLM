import { mockBOMs, type BOM } from '@/data/mockData';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export const bomService = {
  async getAll(): Promise<BOM[]> {
    await delay(300);
    return [...mockBOMs];
  },
  async getById(id: string): Promise<BOM | undefined> {
    await delay(200);
    return mockBOMs.find(b => b.id === id);
  },
  async create(data: Partial<BOM>): Promise<BOM> {
    await delay(400);
    const bom: BOM = {
      id: 'b' + Date.now(), productId: data.productId!, productName: data.productName!,
      currentVersion: 1, status: 'ACTIVE', createdAt: new Date().toISOString().split('T')[0],
      components: data.components || [], operations: data.operations || [],
      versions: [{ version: 1, status: 'ACTIVE', createdAt: new Date().toISOString().split('T')[0], components: data.components || [], operations: data.operations || [] }],
    };
    mockBOMs.push(bom);
    return bom;
  },
  async archive(id: string): Promise<void> {
    await delay(300);
    const b = mockBOMs.find(b => b.id === id);
    if (b) b.status = 'ARCHIVED';
  },
};
