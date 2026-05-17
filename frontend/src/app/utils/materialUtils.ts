import { Color, Mesh, type Material, type Object3D } from 'three';

export function setMaterialHex(mat: Material, hex: string): void {
  if ('color' in mat && mat.color instanceof Color) {
    mat.color.set(hex);
    mat.needsUpdate = true;
  }
}

export function materialNameMatches(mat: Material, token: string): boolean {
  const name = mat.name.toLowerCase();
  return name === token || name.includes(token);
}

export function forEachMeshMaterial(
  root: Object3D,
  fn: (mat: Material) => void,
): void {
  root.traverse((node) => {
    if (!(node instanceof Mesh) || !node.material) return;
    const materials = Array.isArray(node.material)
      ? node.material
      : [node.material];
    for (const mat of materials) {
      fn(mat);
    }
  });
}
