import { create } from 'zustand';
import type { ECO } from '@/data/mockData';
import { ecoService } from '@/services/eco.service';

interface ECOState {
  ecos: ECO[];
  currentECO: ECO | null;
  isLoading: boolean;
  fetchECOs: () => Promise<void>;
  fetchECOById: (id: string) => Promise<void>;
  createECO: (data: Partial<ECO>) => Promise<ECO>;
  updateECOStage: (id: string, action: 'submit' | 'approve' | 'reject' | 'apply', comment?: string, userId?: string, userName?: string) => Promise<void>;
}

export const useECOStore = create<ECOState>((set) => ({
  ecos: [],
  currentECO: null,
  isLoading: false,

  fetchECOs: async () => {
    set({ isLoading: true });
    try {
      const ecos = await ecoService.getAll();
      set({ ecos, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch ECOs:', error);
      set({ isLoading: false });
    }
  },

  fetchECOById: async (id) => {
    set({ isLoading: true });
    try {
      const eco = await ecoService.getById(id);
      set({ currentECO: eco || null, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch ECO details:', error);
      set({ isLoading: false });
    }
  },

  createECO: async (data) => {
    const eco = await ecoService.create(data);
    const ecos = await ecoService.getAll();
    set({ ecos });
    return eco;
  },

  updateECOStage: async (id, action, comment, userId, userName) => {
    if (action === 'submit') await ecoService.submitForReview(id);
    else if (action === 'approve') await ecoService.approve(id, comment!, userId!, userName!);
    else if (action === 'reject') await ecoService.reject(id, comment!, userId!, userName!);
    else if (action === 'apply') await ecoService.apply(id);
    const eco = await ecoService.getById(id);
    const ecos = await ecoService.getAll();
    set({ currentECO: eco || null, ecos });
  },
}));
