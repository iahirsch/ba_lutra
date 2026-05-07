import { useMemo, useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Mesh, MathUtils } from 'three';
import type { PartCategory } from '../../store/companion.store';

const MORPH_LERP_SPEED = 0.08;

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
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]); // Deep clone to avoid caching problems

  const morphMeshesRef = useRef<Mesh[]>([]);

  useEffect(() => {
    morphMeshesRef.current = [];
    scene.traverse((node) => {
      if (node instanceof Mesh && node.morphTargetDictionary) {
        morphMeshesRef.current.push(node);
      }
    });
  }, [scene]);

  useFrame(() => {
    for (const mesh of morphMeshesRef.current) {
      if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) continue;

      const dictionary = mesh.morphTargetDictionary;
      const influences = mesh.morphTargetInfluences;

      Object.entries(bodyMorphs).forEach(([morphName, target]) => {
        const index = dictionary[morphName];
        if (index === undefined) return;
        influences[index] = MathUtils.lerp(
          influences[index],
          target,
          MORPH_LERP_SPEED,
        );
      });
    }
  });

  return <primitive object={scene} />;
}
