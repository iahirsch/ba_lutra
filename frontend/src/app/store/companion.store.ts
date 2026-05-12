import { create } from 'zustand';
import type { CompanionConfig } from '@ba-praktisch/shared-types';
export type { CompanionConfig } from '@ba-praktisch/shared-types';

export type PartCategory =
  | 'fur'
  | 'eyes'
  | 'nose'
  | 'clothing'
  | 'ears' // reserved
  | 'tail' // reserved
  | 'backpack'; // reserved

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
  backpack: 'backpack01',
  bodyMorphs: { body_fat: 0.5, face_fat: 0.5 },
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
