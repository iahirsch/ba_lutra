import { useGLTF } from '@react-three/drei';
import { COMPANION_GLB_BASE } from '@ba-praktisch/shared-types';
import type { PartCategory } from '../store/companionStore';

function variantUrl(category: PartCategory, variantId: string): string {
  return `${COMPANION_GLB_BASE}/${category}/${variantId}.glb`;
}

export const PART_VARIANTS: Record<PartCategory, string[]> = {
  fur: ['fur01', 'fur02', 'fur03'],
  eyes: ['eyes01', 'eyes02'],
  nose: ['nose01', 'nose02', 'nose03'],
  clothing: ['clothing01'],
  backpack: ['backpack01'],
  ears: [],
  tail: [],
};

Object.entries(PART_VARIANTS).forEach(([category, variants]) => {
  variants.forEach((id) =>
    useGLTF.preload(variantUrl(category as PartCategory, id)),
  );
});
