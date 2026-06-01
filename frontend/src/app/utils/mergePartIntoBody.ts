import { Mesh, Object3D, SkinnedMesh, type Skeleton } from 'three';

function findSkeleton(root: Object3D): Skeleton | null {
  let skeleton: Skeleton | null = null;
  root.traverse((node) => {
    if (skeleton) return;
    if (node instanceof SkinnedMesh && node.skeleton) {
      skeleton = node.skeleton;
    }
  });
  return skeleton;
}

/**
 * Rebases part skinned meshes onto the body's skeleton so they follow body.glb
 * animations.
 */
export function mergePartIntoBody(
  bodyRoot: Object3D,
  partRoot: Object3D,
): Object3D[] {
  const skeleton = findSkeleton(bodyRoot);
  const merged: Object3D[] = [];

  partRoot.traverse((node) => {
    if (!(node instanceof SkinnedMesh)) return;

    const mesh = node.clone(true);
    if (skeleton) {
      mesh.skeleton = skeleton;
      mesh.bind(skeleton, mesh.bindMatrix);
    }
    bodyRoot.add(mesh);
    merged.push(mesh);
  });

  if (merged.length === 0) {
    console.warn('[companion] part has no skinned meshes to merge into body');
  }

  return merged;
}

export function removeMergedParts(parts: Object3D[]): void {
  for (const root of parts) {
    root.parent?.remove(root);
    root.traverse((node) => {
      if (!(node instanceof Mesh)) return;
      node.geometry?.dispose();
      const materials = Array.isArray(node.material)
        ? node.material
        : [node.material];
      for (const material of materials) {
        material?.dispose();
      }
    });
  }
}
