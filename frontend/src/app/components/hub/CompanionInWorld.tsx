// Renders a companion at a specific position in the hub world.
import { Suspense } from 'react';
import { Text } from '@react-three/drei';
import type { SavedCompanion } from '../../store/companion-socket.types';
import type { PartCategory } from '../../store/companion.store';
import { WorldCompanionPart } from './WorldCompanionPart';

const RENDERED_PARTS: PartCategory[] = ['fur', 'eyes', 'nose', 'clothing'];

interface CompanionInWorldProps {
  companion: SavedCompanion;
  position: [number, number, number];
}

export function CompanionInWorld({
  companion,
  position,
}: CompanionInWorldProps) {
  return (
    <group position={position}>
      <Suspense fallback={null}>
        {RENDERED_PARTS.map((category) => {
          const variantId = companion[category];
          if (!variantId) return null;
          return (
            <WorldCompanionPart
              key={`${companion.id}-${category}`}
              category={category}
              variantId={variantId}
              bodyMorphs={companion.bodyMorphs ?? {}}
            />
          );
        })}
      </Suspense>

      {/* Name Tag */}
      <Text
        position={[0, 2.4, 0]}
        fontSize={0.18}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        // outlineWidth={0.02}
        // outlineColor="#000000"
      >
        {companion.name}
      </Text>
    </group>
  );
}
