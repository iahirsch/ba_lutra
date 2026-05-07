import { create } from 'zustand';

export type PartCategory =
  | 'fur'
  | 'eyes'
  | 'nose'
  | 'clothing'
  | 'ears' // reserved — UI hidden for now
  | 'tail' // reserved — UI hidden for now
  | 'backpack'; // reserved — UI hidden for now

export interface CompanionConfig {
  fur: string;
  eyes: string;
  nose: string;
  clothing: string;
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
  fur: 'fur01',
  eyes: 'eyes01',
  nose: 'nose01',
  clothing: '', // no clothing by default
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
