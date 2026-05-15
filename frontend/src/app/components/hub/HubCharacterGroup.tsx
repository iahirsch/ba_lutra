import { Suspense } from 'react';
import { Text } from '@react-three/drei';
import {
  RENDERED_COMPANION_PARTS,
  type RenderedCompanionPart,
  type SavedCompanion,
} from '@ba-praktisch/shared-types';
import { CompanionBody } from '../common/CompanionBodyGlb';
import { CompanionPartGlb } from '../common/CompanionPartGlb';

interface HubCharacterGroupProps {
  companion: SavedCompanion;
  position: [number, number, number];
}

/** One saved companion in the hub row */
export function HubCharacterGroup({
  companion,
  position,
}: HubCharacterGroupProps) {
  const bodyMorphs = companion.bodyMorphs ?? {};

  return (
    <group position={position}>
      <Suspense fallback={null}>
        <CompanionBody bodyMorphs={bodyMorphs} furColor={companion.furColor} />
        {RENDERED_COMPANION_PARTS.map((category: RenderedCompanionPart) => {
          const variantId = companion[category];
          if (!variantId) return null;
          return (
            <CompanionPartGlb
              key={`${companion.id}-${category}`}
              category={category}
              variantId={variantId}
              bodyMorphs={bodyMorphs}
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
