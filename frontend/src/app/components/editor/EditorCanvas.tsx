import { useRef, useLayoutEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Vector3, MathUtils, Spherical } from 'three';
import { ENVIRONMENT_SPAWN, HUB_CAMERA } from '../../constants/hub-scene';
import { useCompanionStore } from '../../store/companionStore';
import {
  CAMERA_PRESETS,
  isHorizontalOrbitCategory,
} from '../../constants/camera-presets';
import {
  addSpawnOffset,
  useEnvironmentSpawn,
} from '../../utils/environmentSpawn';
// import { Perf } from 'r3f-perf';
import { EditorComposer } from './EditorComposer';

function EditorCameraRig({ spawn }: { spawn: [number, number, number] }) {
  const { camera } = useThree();
  const activeCategory = useCompanionStore((s) => s.activeCategory);

  const targetPosition = useRef(new Vector3());
  const targetLookAt = useRef(new Vector3());
  const currentLookAt = useRef(new Vector3());
  const offset = useRef(new Vector3());
  const spherical = useRef(new Spherical());
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const [cameraTransitioning, setCameraTransitioning] = useState(true);
  const [polarLock, setPolarLock] = useState(Math.PI / 2);
  const prevCategoryRef = useRef(activeCategory);
  const categoryJustChanged = prevCategoryRef.current !== activeCategory;

  const preset = CAMERA_PRESETS[activeCategory];
  const orbitEnabled =
    isHorizontalOrbitCategory(activeCategory) &&
    !cameraTransitioning &&
    !categoryJustChanged;

  useLayoutEffect(() => {
    const p = CAMERA_PRESETS[activeCategory];
    targetPosition.current.set(...addSpawnOffset(p.position, spawn));
    targetLookAt.current.set(...addSpawnOffset(p.target, spawn));
    setCameraTransitioning(true);
    prevCategoryRef.current = activeCategory;
  }, [activeCategory, spawn]);

  useFrame((_state, delta) => {
    if (cameraTransitioning) {
      const t = MathUtils.clamp(delta / preset.duration, 0, 1);
      camera.position.lerp(targetPosition.current, t);
      currentLookAt.current.lerp(targetLookAt.current, t);
      camera.lookAt(currentLookAt.current);

      const eps = 0.02;
      if (
        camera.position.distanceToSquared(targetPosition.current) < eps * eps &&
        currentLookAt.current.distanceToSquared(targetLookAt.current) <
          eps * eps
      ) {
        if (isHorizontalOrbitCategory(activeCategory)) {
          offset.current.subVectors(camera.position, currentLookAt.current);
          setPolarLock(spherical.current.setFromVector3(offset.current).phi);
        }
        setCameraTransitioning(false);
      }
    }

    controlsRef.current?.target.copy(currentLookAt.current);
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={orbitEnabled}
      minPolarAngle={polarLock}
      maxPolarAngle={polarLock}
      enablePan={false}
      enableZoom={false}
      enableDamping
    />
  );
}

export function EditorCanvas({
  children,
  disableDOF = false,
}: {
  children?: React.ReactNode;
  disableDOF?: boolean;
}) {
  const spawn = useEnvironmentSpawn(ENVIRONMENT_SPAWN.editor, false);
  const activeCategory = useCompanionStore((s) => s.activeCategory);
  const target = addSpawnOffset(CAMERA_PRESETS[activeCategory].target, spawn);

  return (
    <Canvas
      camera={{
        position: addSpawnOffset([0, 2.0, 4.5], spawn),
        fov: 50,
        near: HUB_CAMERA.near,
        far: HUB_CAMERA.far,
      }}
      style={{ width: '100%', height: '100%' }}
      gl={{ alpha: true }}
    >
      <EditorCameraRig spawn={spawn} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[5, 8, 7]} intensity={1.7} />
      {children}
      <EditorComposer target={target} disableDOF={disableDOF} />
      {/*<Perf position="top-left" />*/}
    </Canvas>
  );
}
