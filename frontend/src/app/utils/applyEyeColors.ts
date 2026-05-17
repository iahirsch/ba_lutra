import type { Material, Object3D } from 'three';
import type { EyeColor } from '@ba-praktisch/shared-types';
import {
  forEachMeshMaterial,
  materialNameMatches,
  setMaterialHex,
} from './materialUtils';

function applyEyeToMaterial(mat: Material, eyeColor: EyeColor): void {
  if (materialNameMatches(mat, 'iris')) {
    setMaterialHex(mat, eyeColor.secondary);
  }
  if (materialNameMatches(mat, 'eyes')) {
    setMaterialHex(mat, eyeColor.primary);
  }
}

/** Sets `eyes` / `iris` material colors on body meshes. */
export function applyEyeColorsToObject(
  root: Object3D,
  eyeColor: EyeColor,
): void {
  forEachMeshMaterial(root, (mat) => applyEyeToMaterial(mat, eyeColor));
}
