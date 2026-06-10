import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { Activity, SavedCompanion } from '@ba-praktisch/shared-types';
import { ENVIRONMENT_SPAWN, HUB_VIEW_CAMERA } from '../../constants/hub-scene';
import { useEnvironmentSpawn } from '../../utils/environmentSpawn';
import { useHubWalkTerrain } from '../../hooks/useHubWalkTerrain';
import { HubLights } from './HubLights';
import { HubBackground } from './HubBackground';
import { EnvironmentVegetation } from '../common/EnvironmentVegetation';
import { HubCharacterGroup } from './HubCharacterGroup';
import { EnvironmentAtmosphere } from '../common/EnvironmentAtmosphere';
import { EnvironmentComposer } from '../common/EnvironmentComposer';
// import { Perf } from 'r3f-perf';


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
  const walkTerrain = useHubWalkTerrain();
  const hubSpawn = useEnvironmentSpawn(ENVIRONMENT_SPAWN.hub);

  return (
    <>
      <EnvironmentAtmosphere variant="hub" />
      <HubLights variant="hub" />

      <Suspense fallback={null}>
        <HubBackground totalEffortScore={totalEffortScore} />
        <EnvironmentVegetation totalEffortScore={totalEffortScore} />
      </Suspense>

      {companions.map((companion) => (
        <HubCharacterGroup
          key={companion.id}
          companion={companion}
          walkTerrain={walkTerrain}
          initialPosition={new Vector3(...hubSpawn)}
          effortScore={
            latestActivitiesByCompanion.get(companion.id)?.effortScore
          }
        />
      ))}

      <EnvironmentComposer variant="hub" />
      {/*<Perf position="top-left" />*/}
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
      dpr={[1, 1.5]}
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
