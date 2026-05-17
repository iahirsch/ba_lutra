import { Suspense } from 'react';
import { Html } from '@react-three/drei';
import {
  RENDERED_COMPANION_PARTS,
  type RenderedCompanionPart,
  type SavedCompanion,
} from '@ba-praktisch/shared-types';
import { CompanionBody } from '../common/CompanionBodyGlb';
import { CompanionPartGlb } from '../common/CompanionPartGlb';
import { effortToConduitGlow } from '../../utils/celShading';

interface HubCharacterGroupProps {
  companion: SavedCompanion;
  position: [number, number, number];
  effortScore?: number;
}

/** One saved companion in the hub row */
export function HubCharacterGroup({
  companion,
  position,
  effortScore,
}: HubCharacterGroupProps) {
  const bodyMorphs = companion.bodyMorphs ?? {};
  const conduitGlow = effortToConduitGlow(effortScore ?? 0);

  return (
    <group position={position}>
      <Suspense fallback={null}>
        <CompanionBody
          bodyMorphs={bodyMorphs}
          furColor={companion.furColor}
          eyeColor={companion.eyeColor}
          noseColor={companion.noseColor}
        >
          {RENDERED_COMPANION_PARTS.map((category: RenderedCompanionPart) => {
            const variantId = companion[category];
            if (!variantId) return null;
            return (
              <CompanionPartGlb
                key={`${companion.id}-${category}`}
                category={category}
                variantId={variantId}
                bodyMorphs={bodyMorphs}
                conduitGlow={category === 'backpack' ? conduitGlow : undefined}
              />
            );
          })}
        </CompanionBody>
      </Suspense>

      <Html
        position={[0, 2.2, 0]}
        center
        distanceFactor={10}
        pointerEvents="none"
        style={{
          color: '#ffffff',
          fontSize: '16px',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}
      >
        {companion.name}
      </Html>
    </group>
  );
}
