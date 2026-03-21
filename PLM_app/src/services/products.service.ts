import api from './api';
import type { Product } from '@/data/mockData';

export const productsService = {
  async getAll(): Promise<Product[]> {
    const { data } = await api.get('/products');
    return data.data;
  },

  async getById(id: string): Promise<Product | undefined> {
    const { data } = await api.get(`/products/${id}`);
    return data.data;
  },

  async create(data: { name: string; salePrice: number; costPrice: number }): Promise<Product> {
    const response = await api.post('/products', data);
    return response.data.data;
  },

  async archive(id: string): Promise<void> {
    await api.patch(`/products/${id}/archive`);
  },
};
