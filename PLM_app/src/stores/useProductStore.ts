import { create } from 'zustand';
import type { Product } from '@/data/mockData';
import { productsService } from '@/services/products.service';

interface ProductState {
  products: Product[];
  isLoading: boolean;
  fetchProducts: () => Promise<void>;
  createProduct: (data: { name: string; salePrice: number; costPrice: number }) => Promise<void>;
  archiveProduct: (id: string) => Promise<void>;
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  isLoading: false,

  fetchProducts: async () => {
    set({ isLoading: true });
    const products = await productsService.getAll();
    set({ products, isLoading: false });
  },

  createProduct: async (data) => {
    await productsService.create(data);
    const products = await productsService.getAll();
    set({ products });
  },

  archiveProduct: async (id) => {
    await productsService.archive(id);
    const products = await productsService.getAll();
    set({ products });
  },
}));
