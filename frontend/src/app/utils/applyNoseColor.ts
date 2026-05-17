import type { Material, Object3D } from 'three';
import {
  forEachMeshMaterial,
  materialNameMatches,
  setMaterialHex,
} from './materialUtils';

function applyNoseToMaterial(mat: Material, noseColor: string): void {
  if (materialNameMatches(mat, 'nose')) {
    setMaterialHex(mat, noseColor);
  }
}

/** Sets nose material color on body meshes. */
export function applyNoseColorToObject(root: Object3D, noseColor: string): void {
  forEachMeshMaterial(root, (mat) => applyNoseToMaterial(mat, noseColor));
}
