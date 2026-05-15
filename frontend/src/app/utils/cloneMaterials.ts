import { Mesh, type Object3D } from 'three';

/** Gives each mesh its own material instances so GLTF cache materials are not mutated. */
export function cloneMaterialsOnObject(root: Object3D): void {
  root.traverse((node) => {
    if (!(node instanceof Mesh) || !node.material) return;
    node.material = Array.isArray(node.material)
      ? node.material.map((m) => m.clone())
      : node.material.clone();
  });
}
