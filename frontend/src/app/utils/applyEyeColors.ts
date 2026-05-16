import { Color, Mesh, type Material, type Object3D } from 'three';
import type { EyeColor } from '@ba-praktisch/shared-types';

function setMaterialHex(mat: Material, hex: string): void {
  if ('color' in mat && mat.color instanceof Color) {
    mat.color.set(hex);
    mat.needsUpdate = true;
  }
}

function applyEyeToMaterial(mat: Material, eyeColor: EyeColor): void {
  const name = mat.name.toLowerCase();
  if (name === 'iris' || name.includes('iris')) {
    setMaterialHex(mat, eyeColor.secondary);
  }
  if (name === 'eyes' || name.includes('eyes')) {
    setMaterialHex(mat, eyeColor.primary);
  }
}

/** Sets `eyes` / `iris` material colors on body meshes. */
export function applyEyeColorsToObject(
  root: Object3D,
  eyeColor: EyeColor,
): void {
  root.traverse((node) => {
    if (!(node instanceof Mesh) || !node.material) return;
    const materials = Array.isArray(node.material)
      ? node.material
      : [node.material];
    for (const mat of materials) {
      applyEyeToMaterial(mat, eyeColor);
    }
  });
}
