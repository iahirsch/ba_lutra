import { create } from 'zustand';
import { DEFAULT_EYE_COLOR } from '../constants/eye-color-presets';
import { DEFAULT_FUR_COLOR } from '../constants/fur-color-presets';
import { DEFAULT_NOSE_COLOR } from '../constants/nose-color-presets';
import type {
  CompanionConfig,
  EyeColor,
  FurColor,
} from '@ba-praktisch/shared-types';
export type {
  CompanionConfig,
  EyeColor,
  FurColor,
} from '@ba-praktisch/shared-types';

export type PartCategory =
  | 'clothingTop'
  | 'clothingBottom'
  | 'backpack'
  | 'ears' // reserved
  | 'tail'; // reserved

export type EditorTab =
  | 'body'
  | 'fur'
  | 'eyes'
  | 'iris'
  | 'nose'
  | 'clothingTop'
  | 'clothingBottom';

export type EditorSection = 'lutra' | 'clothing';

interface CompanionStore extends CompanionConfig {
  activeSection: EditorSection;
  activeCategory: EditorTab;
  setActiveCategory: (category: EditorTab) => void;
  setActiveSection: (section: EditorSection) => void;
  setPartVariant: (part: PartCategory, variantId: string) => void;
  setFurColor: (furColor: FurColor) => void;
  setEyeColorPart: (part: keyof EyeColor, color: string) => void;
  setNoseColor: (noseColor: string) => void;
  setBodyMorph: (morphName: string, influence: number) => void;
}

export const DEFAULT_CONFIG: CompanionConfig = {
  furColor: { ...DEFAULT_FUR_COLOR },
  eyeColor: { ...DEFAULT_EYE_COLOR },
  noseColor: DEFAULT_NOSE_COLOR,
  clothingTop: '',
  clothingBottom: '',
  ears: '',
  tail: '',
  backpack: 'backpack01',
  bodyMorphs: { body_fat: 0.5, face_fat: 0.5 },
};

export const useCompanionStore = create<CompanionStore>((set) => ({
  ...DEFAULT_CONFIG,
  activeSection: 'lutra',
  activeCategory: 'body',

  setActiveCategory: (category) => set({ activeCategory: category }),

  setActiveSection: (section) =>
    set({
      activeSection: section,
      activeCategory: section === 'lutra' ? 'body' : 'clothingTop',
    }),

  setPartVariant: (part, variantId) => set({ [part]: variantId }),

  setFurColor: (furColor) => set({ furColor }),

  setEyeColorPart: (part, color) =>
    set((state) => ({
      eyeColor: { ...state.eyeColor, [part]: color },
    })),

  setNoseColor: (noseColor) => set({ noseColor }),

  setBodyMorph: (morphName, influence) =>
    set((state) => ({
      bodyMorphs: { ...state.bodyMorphs, [morphName]: influence },
    })),
}));
