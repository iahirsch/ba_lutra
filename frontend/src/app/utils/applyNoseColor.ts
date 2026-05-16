import { Color, Mesh, type Material, type Object3D } from 'three';

function setMaterialHex(mat: Material, hex: string): void {
  if ('color' in mat && mat.color instanceof Color) {
    mat.color.set(hex);
    mat.needsUpdate = true;
  }
}

function applyNoseToMaterial(mat: Material, noseColor: string): void {
  const name = mat.name.toLowerCase();
  if (name === 'nose' || name.includes('nose')) {
    setMaterialHex(mat, noseColor);
  }
}

/** Sets nose material color on body meshes. */
export function applyNoseColorToObject(root: Object3D, noseColor: string): void {
  root.traverse((node) => {
    if (!(node instanceof Mesh) || !node.material) return;
    const materials = Array.isArray(node.material)
      ? node.material
      : [node.material];
    for (const mat of materials) {
      applyNoseToMaterial(mat, noseColor);
    }
  });
}
