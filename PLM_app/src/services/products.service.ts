import api from './api';
import { mockProducts, type Product } from '@/data/mockData';

export const productsService = {
  async getAll(): Promise<Product[]> {
    try {
      const { data } = await api.get('/products');
      return Array.isArray(data) ? data : mockProducts;
    } catch (e) {
      return mockProducts;
    }
  },
  async getById(id: string): Promise<Product | undefined> {
    try {
      const { data } = await api.get(`/products/${id}`);
      return data || mockProducts.find(p => p.id === id);
    } catch (e) {
      return mockProducts.find(p => p.id === id);
    }
  },
  async create(data: { name: string; salePrice: number; costPrice: number }): Promise<Product> {
    try {
      const response = await api.post('/products', data);
      return response.data;
    } catch (e) {
      return { ...mockProducts[0], id: Date.now().toString(), name: data.name, currentVersion: 1, versions: [] };
    }
  },
  async archive(id: string): Promise<void> {
    try {
      await api.patch(`/products/${id}/archive`);
    } catch (e) {
      console.log('Mock archive', id);
    }
  },
};
