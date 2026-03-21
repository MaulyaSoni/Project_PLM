import { create } from 'zustand';
import type { BOM } from '@/data/mockData';
import { bomService } from '@/services/bom.service';

interface BOMState {
  boms: BOM[];
  isLoading: boolean;
  fetchBOMs: () => Promise<void>;
  createBOM: (data: Partial<BOM>) => Promise<void>;
  archiveBOM: (id: string) => Promise<void>;
}

export const useBOMStore = create<BOMState>((set) => ({
  boms: [],
  isLoading: false,

  fetchBOMs: async () => {
    set({ isLoading: true });
    try {
      const boms = await bomService.getAll();
      set({ boms, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch BOMs:', error);
      set({ isLoading: false });
    }
  },

  createBOM: async (data) => {
    await bomService.create(data);
    const boms = await bomService.getAll();
    set({ boms });
  },

  archiveBOM: async (id) => {
    await bomService.archive(id);
    const boms = await bomService.getAll();
    set({ boms });
  },
}));
