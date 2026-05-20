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
  clothingTop: ['t_cloth01'],
  clothingBottom: ['b_cloth01'],
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
