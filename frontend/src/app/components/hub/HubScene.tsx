import { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { EffectComposer, DepthOfField } from '@react-three/postprocessing';
import type { SavedCompanion } from '../../store/companion-socket.types';
import { HubEnvironment } from './HubEnvironment';
import { CompanionInWorld } from './CompanionInWorld';

// Constants
const CAMERA_POSITION: [number, number, number] = [0, 2, 12];
const CAMERA_TARGET: [number, number, number] = [0.2, 2, 0];
const CAMERA_FOV = 50;

const SPAWN_RADIUS_PER_COMPANION = 0.5;
const SPAWN_RADIUS_MIN = 1;
const SPAWN_ARC = Math.PI * 1.2;
const SPAWN_Y = 0;

const HANDHELD_STRENGTH = 0.1;

const DOF_TARGET = new Vector3(0, 1, 0);
const DOF_FOCAL_LENGTH = 0;
const DOF_BOKEH_SCALE = 0;

// Companion placement
function getCompanionPosition(
  index: number,
  total: number,
): [number, number, number] {
  if (total === 0) return [0, SPAWN_Y, 0];
  const radius = Math.max(SPAWN_RADIUS_MIN, total * SPAWN_RADIUS_PER_COMPANION);
  const angle =
    total === 1 ? 0 : -SPAWN_ARC / 2 + (index / (total - 1)) * SPAWN_ARC;
  return [Math.sin(angle) * radius, SPAWN_Y, Math.cos(angle) * radius];
}

// Handheld camera
function HandheldCamera() {
  const { camera } = useThree();
  const timeRef = useRef(0);

  useFrame((_state, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;
    const s = HANDHELD_STRENGTH;

    camera.position.set(
      CAMERA_POSITION[0] +
        Math.sin(t * 0.31) * s +
        Math.sin(t * 0.87) * s * 0.4,
      CAMERA_POSITION[1] +
        Math.sin(t * 0.45) * s * 0.7 +
        Math.sin(t * 0.62) * s * 0.3,
      CAMERA_POSITION[2] + Math.sin(t * 0.23) * s * 0.5,
    );
    camera.lookAt(...CAMERA_TARGET);
  });

  return null;
}

// Scene Contents
interface HubSceneContentsProps {
  companions: SavedCompanion[];
}

function HubSceneContents({ companions }: HubSceneContentsProps) {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />
      <directionalLight position={[-4, 3, -4]} intensity={0.3} />

      <Suspense fallback={null}>
        <HubEnvironment />
      </Suspense>

      {companions.map((companion, index) => (
        <CompanionInWorld
          key={companion.id}
          companion={companion}
          position={getCompanionPosition(index, companions.length)}
        />
      ))}

      <HandheldCamera />

      <EffectComposer>
        <DepthOfField
          target={DOF_TARGET}
          focalLength={DOF_FOCAL_LENGTH}
          bokehScale={DOF_BOKEH_SCALE}
        />
      </EffectComposer>
    </>
  );
}

// Public Component
interface HubSceneProps {
  companions: SavedCompanion[];
}

export function HubScene({ companions }: HubSceneProps) {
  return (
    <Canvas
      camera={{
        position: CAMERA_POSITION,
        fov: CAMERA_FOV,
        near: 0.1,
        far: 1500,
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <HubSceneContents companions={companions} />
    </Canvas>
  );
}
