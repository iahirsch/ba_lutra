import type { Material, Object3D } from 'three';
import type { FurColor } from '@ba-praktisch/shared-types';
import {
  forEachMeshMaterial,
  materialNameMatches,
  setMaterialHex,
} from './materialUtils';

function applyFurToMaterial(mat: Material, furColor: FurColor): void {
  if (materialNameMatches(mat, 'fur01')) {
    setMaterialHex(mat, furColor.primary);
  }
  if (materialNameMatches(mat, 'fur02')) {
    setMaterialHex(mat, furColor.secondary);
  }
}

/** Sets fur01 / fur02 material colors on meshes. */
export function applyFurColorsToObject(
  root: Object3D,
  furColor: FurColor,
): void {
  forEachMeshMaterial(root, (mat) => applyFurToMaterial(mat, furColor));
}
