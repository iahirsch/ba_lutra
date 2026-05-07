import { useMemo, useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Mesh, MathUtils } from 'three';
import type { PartCategory } from '../../store/companion.store';
import { useCompanionStore } from '../../store/companion.store';

const ASSET_BASE = '/assets/companion/glb';
const MORPH_LERP_SPEED = 0.08;

function variantUrl(category: PartCategory, variantId: string): string {
  return `${ASSET_BASE}/${category}/${variantId}.glb`;
}

// All known part variants
export const PART_VARIANTS: Record<PartCategory, string[]> = {
  fur: ['fur01', 'fur02', 'fur03'],
  eyes: ['eyes01', 'eyes02'],
  nose: ['nose01', 'nose02', 'nose03'],
  clothing: [],
  ears: [], // reserved
  tail: [], // reserved
  backpack: [], // reserved
};

Object.entries(PART_VARIANTS).forEach(([category, variants]) => {
  variants.forEach((id) =>
    useGLTF.preload(variantUrl(category as PartCategory, id)),
  );
});

// Part Offset if necessary
interface PartOffset {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

const PART_OFFSETS: Record<PartCategory, PartOffset> = {
  fur: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  eyes: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  nose: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  clothing: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  ears: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  tail: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  backpack: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
};

// Component
interface CompanionPartProps {
  category: PartCategory;
  variantId: string;
}

function PartMesh({ category, variantId }: CompanionPartProps) {
  const url = variantUrl(category, variantId);
  const gltf = useGLTF(url);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  const morphMeshesRef = useRef<Mesh[]>([]);
  const bodyMorphs = useCompanionStore((s) => s.bodyMorphs);

  useEffect(() => {
    morphMeshesRef.current = [];
    scene.traverse((node) => {
      if (node instanceof Mesh && node.morphTargetDictionary) {
        morphMeshesRef.current.push(node);
      }
    });
  }, [scene]);

  // Sync morph targets every frame — no-op if this GLB has none
  useFrame(() => {
    for (const mesh of morphMeshesRef.current) {
      if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) continue;

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
    }
  });

  const { position, rotation, scale } = PART_OFFSETS[category];

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

// Keys on variantId so React remounts PartMesh on variant change (the swap mechanism)
export function CompanionPart({ category, variantId }: CompanionPartProps) {
  return <PartMesh key={variantId} category={category} variantId={variantId} />;
}
