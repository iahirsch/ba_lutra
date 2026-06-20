import { useGLTF } from '@react-three/drei';
import {
  COMPANION_BODY_GLB_URL,
  COMPANION_GLB_BASE,
} from '@ba-praktisch/shared-types';
import type { PartCategory } from '../store/companionStore';

function variantUrl(category: PartCategory, variantId: string): string {
  return `${COMPANION_GLB_BASE}/${category}/${variantId}.glb`;
}

export const PART_VARIANTS: Record<PartCategory, string[]> = {
  clothingTop: [
    't_cloth01',
    't_cloth02',
    't_cloth03',
    't_cloth04',
    't_cloth05',
    't_cloth06',
    't_cloth07',
    't_cloth08',
  ],
  clothingBottom: [
    'b_cloth01',
    'b_cloth02',
    'b_cloth03',
    'b_cloth04',
    'b_cloth05',
    'b_cloth06',
  ],
  backpack: ['backpack01'],
  ears: [],
  tail: [],
};

useGLTF.preload(COMPANION_BODY_GLB_URL);

Object.entries(PART_VARIANTS).forEach(([category, variants]) => {
  variants.forEach((id) =>
    useGLTF.preload(variantUrl(category as PartCategory, id)),
  );
});
