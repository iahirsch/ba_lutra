import { useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Mesh, MathUtils } from 'three';
import { useCompanionStore } from '../store/companion.store';

const BODY_URL = '/assets/companion/glb/body.glb';

useGLTF.preload(BODY_URL);

const MORPH_LERP_SPEED = 0.08;

export function CompanionBody() {
  const { scene } = useGLTF(BODY_URL);
  const meshRef = useRef<Mesh | null>(null);
  const bodyMorphs = useCompanionStore((s) => s.bodyMorphs);

  useEffect(() => {
    scene.traverse((node) => {
      if (
        meshRef.current === null &&
        node instanceof Mesh &&
        node.morphTargetDictionary
      ) {
        meshRef.current = node;
      }
    });
  }, [scene]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh?.morphTargetDictionary || !mesh.morphTargetInfluences) return;

    const dictionary = mesh.morphTargetDictionary;
    const influences = mesh.morphTargetInfluences;

    Object.entries(bodyMorphs).forEach(([morphName, targetInfluence]) => {
      const index = dictionary[morphName];
      if (index === undefined) return;

      influences[index] = MathUtils.lerp(
        influences[index],
        targetInfluence,
        MORPH_LERP_SPEED,
      );
    });
  });

  return <primitive object={scene} />;
}
