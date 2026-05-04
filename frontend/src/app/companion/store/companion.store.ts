import { create } from 'zustand';

export type PartCategory = 'eyes' | 'nose' | 'ears' | 'tail' | 'backpack';

export interface CompanionConfig {
  eyes: string;
  nose: string;
  ears: string;
  tail: string;
  backpack: string;
  bodyMorphs: Record<string, number>;
}

interface CompanionStore extends CompanionConfig {
  activeCategory: PartCategory | 'body';
  setActiveCategory: (category: PartCategory | 'body') => void;
  setPartVariant: (part: PartCategory, variantId: string) => void;
  setBodyMorph: (morphName: string, influence: number) => void;
}

export const DEFAULT_CONFIG: CompanionConfig = {
  eyes: 'eyes01',
  nose: 'nose01',
  ears: '',
  tail: '',
  backpack: '',
  bodyMorphs: { chubby: 0.5 },
};

export const useCompanionStore = create<CompanionStore>((set) => ({
  ...DEFAULT_CONFIG,
  activeCategory: 'body',

  setActiveCategory: (category) => set({ activeCategory: category }),

  setPartVariant: (part, variantId) => set({ [part]: variantId }),

  setBodyMorph: (morphName, influence) =>
    set((state) => ({
      bodyMorphs: { ...state.bodyMorphs, [morphName]: influence },
    })),
}));
