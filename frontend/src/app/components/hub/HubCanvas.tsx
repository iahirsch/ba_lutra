import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import type { SavedCompanion } from '@ba-praktisch/shared-types';
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

function HubCanvasContents({ companions }: { companions: SavedCompanion[] }) {
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
        />
      ))}
    </>
  );
}

interface HubCanvasProps {
  companions: SavedCompanion[];
}

export function HubCanvas({ companions }: HubCanvasProps) {
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
      <HubCanvasContents companions={companions} />
    </Canvas>
  );
}
