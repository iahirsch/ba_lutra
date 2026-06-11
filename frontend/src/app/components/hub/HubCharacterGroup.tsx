import { Suspense, useCallback, useState } from 'react';
import { Html } from '@react-three/drei';
import {
  RENDERED_COMPANION_PARTS,
  type RenderedCompanionPart,
  type SavedCompanion,
} from '@ba-praktisch/shared-types';
import { CompanionBody } from '../common/CompanionBodyGlb';
import { CompanionPartGlb } from '../common/CompanionPartGlb';
import { effortToConduitGlow } from '../../utils/celShading';
import { useCompanionHubBehavior } from '../../hooks/useCompanionHubBehavior';
import { CompanionParticleReform } from '../common/CompanionParticleReform';
import type { HubWalkTerrain } from '../../hooks/useHubWalkTerrain';
import type { Vector3 } from 'three';

interface HubCharacterGroupProps {
  companion: SavedCompanion;
  walkTerrain: HubWalkTerrain;
  initialPosition: Vector3;
  effortScore?: number;
}

/** One saved companion roaming the hub camp. */
export function HubCharacterGroup({
  companion,
  walkTerrain,
  initialPosition,
  effortScore,
}: HubCharacterGroupProps) {
  const bodyMorphs = companion.bodyMorphs ?? {};
  const conduitGlow = effortToConduitGlow(effortScore ?? 0.1);
  const [reformDone, setReformDone] = useState(false);
  const [entryWaveDone, setEntryWaveDone] = useState(false);
  const playingEntryWave = reformDone && !entryWaveDone;

  const { groupRef, activeClip } = useCompanionHubBehavior({
    companionId: companion.id,
    walkTerrain,
    initialPosition,
    frozen: !entryWaveDone,
  });

  const displayClip = playingEntryWave ? 'wave' : activeClip;
  const displayClipKey = playingEntryWave ? 'entry-wave' : activeClip;
  const onEntryWaveComplete = useCallback(() => setEntryWaveDone(true), []);

  return (
    <>
      {!reformDone && (
        <CompanionParticleReform
          onComplete={() => setReformDone(true)}
          parentWorldPosition={[
            initialPosition.x,
            initialPosition.y,
            initialPosition.z,
          ]}
        />
      )}
      <group ref={groupRef}>
        <Suspense fallback={null}>
          <group visible={reformDone}>
            <CompanionBody
              bodyMorphs={bodyMorphs}
              furColor={companion.furColor}
              eyeColor={companion.eyeColor}
              noseColor={companion.noseColor}
              activeClip={displayClip}
              activeClipKey={displayClipKey}
              onRestoredToIdle={
                playingEntryWave ? onEntryWaveComplete : undefined
              }
            >
              {RENDERED_COMPANION_PARTS.map(
                (category: RenderedCompanionPart) => {
                  const variantId = companion[category];
                  if (!variantId) return null;
                  return (
                    <CompanionPartGlb
                      key={`${companion.id}-${category}`}
                      category={category}
                      variantId={variantId}
                      bodyMorphs={
                        category === 'backpack'
                          ? {
                              ...bodyMorphs,
                              cloth_on: companion.clothingTop ? 1 : 0,
                            }
                          : bodyMorphs
                      }
                      conduitGlow={
                        category === 'backpack' ? conduitGlow : undefined
                      }
                    />
                  );
                },
              )}
            </CompanionBody>
          </group>
        </Suspense>

        <Html
          position={[0, 2.2, 0]}
          center
          distanceFactor={10}
          pointerEvents="none"
          style={{
            color: '#ffffff',
            fontSize: '24px',
            fontWeight: 600,
            textShadow: '0 0 10px rgba(0, 0, 0, 0.6)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          {companion.name}
        </Html>
      </group>
    </>
  );
}
