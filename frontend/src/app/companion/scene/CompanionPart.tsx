import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import type { PartCategory } from '../store/companion.store';

// Asset Helpers
const ASSET_BASE = '/assets/companion/glb';

function variantUrl(category: PartCategory, variantId: string): string {
  return `${ASSET_BASE}/${category}/${variantId}.glb`;
}

// Part Variants
export const PART_VARIANTS: Record<PartCategory, string[]> = {
  eyes: ['eyes01', 'eyes02'],
  nose: ['nose01'],
  ears: [],
  tail: [],
  backpack: [],
};

// Preload all known variants at load time
Object.entries(PART_VARIANTS).forEach(([category, variants]) => {
  variants.forEach((id) =>
    useGLTF.preload(variantUrl(category as PartCategory, id)),
  );
});

// position and rotation relative to the companion root.
interface PartOffset {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

// Adjust individual values if specific part is offset in its GLB
const PART_OFFSETS: Record<PartCategory, PartOffset> = {
  eyes: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  nose: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
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
  // Clone so each mounted instance owns its own Three.js object graph
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  const { position, rotation, scale } = PART_OFFSETS[category];

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

// The outer wrapper keys on variantId — React unmounts+remounts PartMesh
// whenever the variant changes, which is the "swap" mechanism.
export function CompanionPart({ category, variantId }: CompanionPartProps) {
  return <PartMesh key={variantId} category={category} variantId={variantId} />;
}
