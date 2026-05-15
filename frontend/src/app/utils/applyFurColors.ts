import { Color, Mesh, type Material, type Object3D } from 'three';
import type { FurColor } from '@ba-praktisch/shared-types';

function setMaterialHex(mat: Material, hex: string): void {
  if ('color' in mat && mat.color instanceof Color) {
    mat.color.set(hex);
    mat.needsUpdate = true;
  }
}

function applyFurToMaterial(mat: Material, furColor: FurColor): void {
  const name = mat.name.toLowerCase();
  if (name === 'fur01' || name.includes('fur01')) {
    setMaterialHex(mat, furColor.primary);
  }
  if (name === 'fur02' || name.includes('fur02')) {
    setMaterialHex(mat, furColor.secondary);
  }
}

/** Sets fur01 / fur02 material colors on meshes. */
export function applyFurColorsToObject(
  root: Object3D,
  furColor: FurColor,
): void {
  root.traverse((node) => {
    if (!(node instanceof Mesh) || !node.material) return;
    const materials = Array.isArray(node.material)
      ? node.material
      : [node.material];
    for (const mat of materials) {
      applyFurToMaterial(mat, furColor);
    }
  });
}
