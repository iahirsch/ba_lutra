import { create } from 'zustand';
import { DEFAULT_FUR_COLOR } from '../constants/fur-color-presets';
import { DEFAULT_NOSE_COLOR } from '../constants/nose-color-presets';
import type { CompanionConfig, FurColor } from '@ba-praktisch/shared-types';
export type { CompanionConfig, FurColor } from '@ba-praktisch/shared-types';

export type PartCategory =
  | 'eyes'
  | 'clothing'
  | 'backpack'
  | 'ears' // reserved
  | 'tail'; // reserved

export type EditorTab = PartCategory | 'body' | 'fur' | 'nose';

interface CompanionStore extends CompanionConfig {
  activeCategory: EditorTab;
  setActiveCategory: (category: EditorTab) => void;
  setPartVariant: (part: PartCategory, variantId: string) => void;
  setFurColor: (furColor: FurColor) => void;
  setNoseColor: (noseColor: string) => void;
  setBodyMorph: (morphName: string, influence: number) => void;
}

export const DEFAULT_CONFIG: CompanionConfig = {
  furColor: { ...DEFAULT_FUR_COLOR },
  noseColor: DEFAULT_NOSE_COLOR,
  eyes: 'eyes01',
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

  setNoseColor: (noseColor) => set({ noseColor }),

  setBodyMorph: (morphName, influence) =>
    set((state) => ({
      bodyMorphs: { ...state.bodyMorphs, [morphName]: influence },
    })),
}));
