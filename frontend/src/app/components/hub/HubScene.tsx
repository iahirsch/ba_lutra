import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import type { SavedCompanion } from '../../store/companion-socket.types';
import { HubEnvironment, HubSharedLights, HUB_CAMERA } from './HubEnvironment';
import { CompanionInWorld } from './CompanionInWorld';

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

interface HubSceneContentsProps {
  companions: SavedCompanion[];
}

function HubSceneContents({ companions }: HubSceneContentsProps) {
  return (
    <>
      <HubSharedLights />

      <Suspense fallback={null}>
        <HubEnvironment />
      </Suspense>

      {companions.map((companion, index) => (
        <CompanionInWorld
          key={companion.id}
          companion={companion}
          position={getCompanionRowPosition(index, companions.length)}
        />
      ))}
    </>
  );
}

interface HubSceneProps {
  companions: SavedCompanion[];
}

export function HubScene({ companions }: HubSceneProps) {
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
      <HubSceneContents companions={companions} />
    </Canvas>
  );
}
