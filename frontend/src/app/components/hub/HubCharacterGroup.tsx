import { Suspense } from 'react';
import { Text } from '@react-three/drei';
import {
  RENDERED_COMPANION_PARTS,
  type RenderedCompanionPart,
  type SavedCompanion,
} from '@ba-praktisch/shared-types';
import { CharacterGlbPart } from '../common/CharacterGlbPart';

interface HubCharacterGroupProps {
  companion: SavedCompanion;
  position: [number, number, number];
}

/** One saved companion in the hub row: parts + 3D name label. */
export function HubCharacterGroup({
  companion,
  position,
}: HubCharacterGroupProps) {
  return (
    <group position={position}>
      <Suspense fallback={null}>
        {RENDERED_COMPANION_PARTS.map((category: RenderedCompanionPart) => {
          const variantId = companion[category];
          if (!variantId) return null;
          return (
            <CharacterGlbPart
              key={`${companion.id}-${category}`}
              category={category}
              variantId={variantId}
              bodyMorphs={companion.bodyMorphs ?? {}}
            />
          );
        })}
      </Suspense>

      <Text
        position={[0, 2.4, 0]}
        fontSize={0.18}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {companion.name}
      </Text>
    </group>
  );
}
