import { mockECOs, type ECO } from '@/data/mockData';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export const ecoService = {
  async getAll(): Promise<ECO[]> {
    await delay(300);
    return [...mockECOs];
  },
  async getById(id: string): Promise<ECO | undefined> {
    await delay(200);
    return mockECOs.find(e => e.id === id);
  },
  async create(data: Partial<ECO>): Promise<ECO> {
    await delay(400);
    const eco: ECO = {
      id: 'eco-' + String(mockECOs.length + 1).padStart(3, '0'),
      title: data.title!, type: data.type!, productId: data.productId!,
      productName: data.productName!, bomId: data.bomId,
      assignedTo: data.assignedTo!, assignedToName: data.assignedToName!,
      stage: 'NEW', status: 'NEW', effectiveDate: data.effectiveDate!,
      versionUpdate: data.versionUpdate ?? true,
      createdBy: data.createdBy!, createdByName: data.createdByName!,
      createdAt: new Date().toISOString().split('T')[0],
      productChanges: data.productChanges, bomComponentChanges: data.bomComponentChanges,
      approvals: [], auditLog: [{
        id: 'al' + Date.now(), action: `ECO Created by ${data.createdByName}`,
        actionType: 'CREATE', userId: data.createdBy!, userName: data.createdByName!,
        timestamp: new Date().toISOString(),
      }],
    };
    mockECOs.push(eco);
    return eco;
  },
  async submitForReview(id: string): Promise<void> {
    await delay(300);
    const eco = mockECOs.find(e => e.id === id);
    if (eco) { eco.stage = 'IN_REVIEW'; eco.status = 'IN_REVIEW'; }
  },
  async approve(id: string, comment: string, userId: string, userName: string): Promise<void> {
    await delay(300);
    const eco = mockECOs.find(e => e.id === id);
    if (eco) {
      eco.status = 'APPROVED';
      eco.approvals.push({ id: 'a' + Date.now(), userId, userName, action: 'APPROVED', comment, date: new Date().toISOString().split('T')[0] });
    }
  },
  async reject(id: string, comment: string, userId: string, userName: string): Promise<void> {
    await delay(300);
    const eco = mockECOs.find(e => e.id === id);
    if (eco) {
      eco.status = 'NEW'; eco.stage = 'NEW';
      eco.approvals.push({ id: 'a' + Date.now(), userId, userName, action: 'REJECTED', comment, date: new Date().toISOString().split('T')[0] });
    }
  },
  async apply(id: string): Promise<void> {
    await delay(500);
    const eco = mockECOs.find(e => e.id === id);
    if (eco) { eco.stage = 'DONE'; eco.status = 'DONE'; }
  },
};
