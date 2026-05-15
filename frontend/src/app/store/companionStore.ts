import { create } from 'zustand';
import { DEFAULT_FUR_COLOR } from '../constants/fur-color-presets';
import type { CompanionConfig, FurColor } from '@ba-praktisch/shared-types';
export type { CompanionConfig, FurColor } from '@ba-praktisch/shared-types';

export type PartCategory =
  | 'eyes'
  | 'nose'
  | 'clothing'
  | 'backpack'
  | 'ears' // reserved
  | 'tail'; // reserved

export type EditorTab = PartCategory | 'body' | 'fur';

interface CompanionStore extends CompanionConfig {
  activeCategory: EditorTab;
  setActiveCategory: (category: EditorTab) => void;
  setPartVariant: (part: PartCategory, variantId: string) => void;
  setFurColor: (furColor: FurColor) => void;
  setBodyMorph: (morphName: string, influence: number) => void;
}

export const DEFAULT_CONFIG: CompanionConfig = {
  furColor: { ...DEFAULT_FUR_COLOR },
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

  setFurColor: (furColor) => set({ furColor }),

  setBodyMorph: (morphName, influence) =>
    set((state) => ({
      bodyMorphs: { ...state.bodyMorphs, [morphName]: influence },
    })),
}));
