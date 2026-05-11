import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { Mesh, type Object3D } from 'three';
import type { PartCategory } from '../../store/companion.store';

function applyBodyMorphs(target: Object3D, bodyMorphs: Record<string, number>) {
  target.traverse((node) => {
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

interface WorldCompanionPartProps {
  category: PartCategory;
  variantId: string;
  bodyMorphs: Record<string, number>;
}

export function WorldCompanionPart({
  category,
  variantId,
  bodyMorphs,
}: WorldCompanionPartProps) {
  const url = `/assets/companion/glb/${category}/${variantId}.glb`;
  const gltf = useGLTF(url);

  // Value-based key so parents can pass a new `bodyMorphs` object each render without re-cloning.
  const morphKey = JSON.stringify(bodyMorphs);

  const scene = useMemo(() => {
    const cloned = gltf.scene.clone(true); // Deep clone to avoid caching problems
    applyBodyMorphs(cloned, JSON.parse(morphKey) as Record<string, number>);
    return cloned;
  }, [gltf.scene, morphKey]);

  return <primitive object={scene} />;
}
