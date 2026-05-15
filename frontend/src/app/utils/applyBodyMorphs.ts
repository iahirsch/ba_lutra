import { Mesh, type Object3D } from 'three';

/** Applies morph target influences by name on every mesh under `root` that exposes morph targets. */
export function applyBodyMorphsToObject(
  root: Object3D,
  bodyMorphs: Record<string, number>,
): void {
  root.traverse((node) => {
    if (
      !(node instanceof Mesh) ||
      !node.morphTargetDictionary ||
      !node.morphTargetInfluences
    ) {
      return;
    }
    const {
      morphTargetDictionary: dictionary,
      morphTargetInfluences: influences,
    } = node;
    for (const [morphName, value] of Object.entries(bodyMorphs)) {
      const index = dictionary[morphName];
      if (index === undefined) continue;
      influences[index] = value;
    }
  });
}
