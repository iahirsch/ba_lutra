import type { Object3D } from 'three';

/** Parents `part` under a named bone on `bodyRoot` so it follows skeletal animation. */
export function attachPartToBone(
  bodyRoot: Object3D,
  part: Object3D,
  boneName: string,
): boolean {
  const bone = bodyRoot.getObjectByName(boneName);
  if (!bone) {
    console.warn(`[companion] bone "${boneName}" not found on body`);
    return false;
  }

  bone.add(part);
  return true;
}

export function detachPart(part: Object3D): void {
  part.parent?.remove(part);
}
