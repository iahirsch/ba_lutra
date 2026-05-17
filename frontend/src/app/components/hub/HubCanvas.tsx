import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import type { Activity, SavedCompanion } from '@ba-praktisch/shared-types';
import { HUB_CAMERA } from '@ba-praktisch/shared-types';
import { HubLights } from './HubLights';
import { HubBackground } from './HubBackground';
import { HubCharacterGroup } from './HubCharacterGroup';

const COMPANION_ROW_GAP = 1.5;

function getCompanionRowPosition(
  index: number,
  total: number,
): [number, number, number] {
  if (total <= 0) return [0, 0, 0];
  if (total === 1) return [0, 0, 0];
  const startX = (-(total - 1) * COMPANION_ROW_GAP) / 2;
  return [startX + index * COMPANION_ROW_GAP, 0, 0];
}

interface HubCanvasContentsProps {
  companions: SavedCompanion[];
  latestActivitiesByCompanion: Map<string, Activity>;
}

function HubCanvasContents({
  companions,
  latestActivitiesByCompanion,
}: HubCanvasContentsProps) {
  return (
    <>
      <HubLights />

      <Suspense fallback={null}>
        <HubBackground />
      </Suspense>

      {companions.map((companion, index) => (
        <HubCharacterGroup
          key={companion.id}
          companion={companion}
          position={getCompanionRowPosition(index, companions.length)}
          effortScore={
            latestActivitiesByCompanion.get(companion.id)?.effortScore
          }
        />
      ))}

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.35}
          luminanceSmoothing={0.85}
          intensity={1.15}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

interface HubCanvasProps {
  companions: SavedCompanion[];
  latestActivitiesByCompanion: Map<string, Activity>;
}

export function HubCanvas({
  companions,
  latestActivitiesByCompanion,
}: HubCanvasProps) {
  return (
    <Canvas
      camera={{
        position: [...HUB_CAMERA.position],
        fov: HUB_CAMERA.fov,
        near: HUB_CAMERA.near,
        far: HUB_CAMERA.far,
      }}
      gl={{ alpha: false }}
      style={{ width: '100%', height: '100%' }}
    >
      <HubCanvasContents
        companions={companions}
        latestActivitiesByCompanion={latestActivitiesByCompanion}
      />
    </Canvas>
  );
}
