import { mockProducts, type Product } from '@/data/mockData';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export const productsService = {
  async getAll(): Promise<Product[]> {
    await delay(300);
    return [...mockProducts];
  },
  async getById(id: string): Promise<Product | undefined> {
    await delay(200);
    return mockProducts.find(p => p.id === id);
  },
  async create(data: { name: string; salePrice: number; costPrice: number }): Promise<Product> {
    await delay(400);
    const product: Product = {
      id: 'p' + Date.now(), name: data.name, currentVersion: 1,
      salePrice: data.salePrice, costPrice: data.costPrice,
      status: 'ACTIVE', createdAt: new Date().toISOString().split('T')[0],
      versions: [{ version: 1, salePrice: data.salePrice, costPrice: data.costPrice, status: 'ACTIVE', createdAt: new Date().toISOString().split('T')[0] }],
    };
    mockProducts.push(product);
    return product;
  },
  async archive(id: string): Promise<void> {
    await delay(300);
    const p = mockProducts.find(p => p.id === id);
    if (p) p.status = 'ARCHIVED';
  },
};
