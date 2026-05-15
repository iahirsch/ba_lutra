import { useGLTF } from '@react-three/drei';
import { COMPANION_BODY_GLB_URL, COMPANION_GLB_BASE } from '@ba-praktisch/shared-types';
import type { PartCategory } from '../store/companionStore';

function variantUrl(category: PartCategory, variantId: string): string {
  return `${COMPANION_GLB_BASE}/${category}/${variantId}.glb`;
}

export const PART_VARIANTS: Record<PartCategory, string[]> = {
  eyes: ['eyes01', 'eyes02'],
  nose: ['nose01', 'nose02', 'nose03'],
  clothing: ['clothing01'],
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
