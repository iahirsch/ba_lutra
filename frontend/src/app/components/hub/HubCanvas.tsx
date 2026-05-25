import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import type { Activity, SavedCompanion } from '@ba-praktisch/shared-types';
import { ENVIRONMENT_SPAWN, HUB_VIEW_CAMERA } from '@ba-praktisch/shared-types';
import {
  addSpawnOffset,
  useEnvironmentSpawn,
} from '../../utils/environmentSpawn';
import { HubLights } from './HubLights';
import { HubBackground } from './HubBackground';
import { HubGrass } from '../common/HubGrass';
import { HubCharacterGroup } from './HubCharacterGroup';

const COMPANION_ROW_GAP = 1.5;

function getCompanionRowPosition(
  base: [number, number, number],
  index: number,
  total: number,
): [number, number, number] {
  if (total <= 1) return base;
  const startX = (-(total - 1) * COMPANION_ROW_GAP) / 2;
  return addSpawnOffset(base, [startX + index * COMPANION_ROW_GAP, 0, 0]);
}

interface HubCanvasContentsProps {
  companions: SavedCompanion[];
  latestActivitiesByCompanion: Map<string, Activity>;
  totalEffortScore: number;
}

function HubCanvasContents({
  companions,
  latestActivitiesByCompanion,
  totalEffortScore,
}: HubCanvasContentsProps) {
  const hubSpawn = useEnvironmentSpawn(ENVIRONMENT_SPAWN.hub);

  return (
    <>
      <HubLights />

      <Suspense fallback={null}>
        <HubBackground />
        <HubGrass totalEffortScore={totalEffortScore} />
      </Suspense>

      {companions.map((companion, index) => (
        <HubCharacterGroup
          key={companion.id}
          companion={companion}
          position={getCompanionRowPosition(hubSpawn, index, companions.length)}
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
  totalEffortScore: number;
}

export function HubCanvas({
  companions,
  latestActivitiesByCompanion,
  totalEffortScore,
}: HubCanvasProps) {
  return (
    <Canvas
      camera={HUB_VIEW_CAMERA}
      gl={{ alpha: false }}
      style={{ width: '100%', height: '100%' }}
    >
      <HubCanvasContents
        companions={companions}
        latestActivitiesByCompanion={latestActivitiesByCompanion}
        totalEffortScore={totalEffortScore}
      />
    </Canvas>
  );
}
