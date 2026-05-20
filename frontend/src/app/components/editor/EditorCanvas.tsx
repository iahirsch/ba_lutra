import { useRef, useLayoutEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {
  EffectComposer,
  DepthOfField,
  BrightnessContrast,
  Vignette,
} from '@react-three/postprocessing';
import { Vector3, MathUtils, Spherical } from 'three';
import { useCompanionStore } from '../../store/companionStore';
import {
  CAMERA_PRESETS,
  isHorizontalOrbitCategory,
} from '../../constants/camera-presets';
import { HUB_CAMERA } from '@ba-praktisch/shared-types';

const EDITOR_DOF = {
  bokehScale: 20,
  focusRange: 40,
} as const;

function EditorCameraRig() {
  const { camera } = useThree();

  const targetPosition = useRef(new Vector3(0, 1.0, 4.5));
  const targetLookAt = useRef(new Vector3(0, 0.8, 0));
  const currentLookAt = useRef(new Vector3(0, 0.8, 0));
  const offset = useRef(new Vector3());
  const spherical = useRef(new Spherical());

  const activeCategory = useCompanionStore((s) => s.activeCategory);
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
    targetPosition.current.set(...p.position);
    targetLookAt.current.set(...p.target);
    setCameraTransitioning(true);
    prevCategoryRef.current = activeCategory;
  }, [activeCategory]);

  useFrame((_state, delta) => {
    if (!cameraTransitioning) return;

    const p = CAMERA_PRESETS[activeCategory];
    const t = MathUtils.clamp(delta / p.duration, 0, 1);
    camera.position.lerp(targetPosition.current, t);
    currentLookAt.current.lerp(targetLookAt.current, t);
    camera.lookAt(currentLookAt.current);

    const eps = 0.02;
    if (
      camera.position.distanceToSquared(targetPosition.current) < eps * eps &&
      currentLookAt.current.distanceToSquared(targetLookAt.current) < eps * eps
    ) {
      if (isHorizontalOrbitCategory(activeCategory)) {
        offset.current.subVectors(camera.position, currentLookAt.current);
        setPolarLock(spherical.current.setFromVector3(offset.current).phi);
      }
      setCameraTransitioning(false);
    }
  });

  return (
    <OrbitControls
      enabled={orbitEnabled}
      target={[preset.target[0], preset.target[1], preset.target[2]]}
      minPolarAngle={polarLock}
      maxPolarAngle={polarLock}
      enablePan={false}
      enableZoom={false}
      enableDamping
    />
  );
}

function EditorSceneLights() {
  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[5, 8, 7]} intensity={1.7} />
    </>
  );
}

function EditorDepthOfField() {
  const activeCategory = useCompanionStore((s) => s.activeCategory);
  const target = CAMERA_PRESETS[activeCategory].target;

  return (
    <DepthOfField
      target={target}
      bokehScale={EDITOR_DOF.bokehScale}
      focusRange={EDITOR_DOF.focusRange}
    />
  );
}

interface EditorCanvasProps {
  children?: React.ReactNode;
}

export function EditorCanvas({ children }: EditorCanvasProps) {
  return (
    <Canvas
      camera={{
        position: [0, 2.0, 4.5],
        fov: 40,
        near: HUB_CAMERA.near,
        far: HUB_CAMERA.far,
      }}
      style={{ width: '100%', height: '100%' }}
      gl={{ alpha: true }}
    >
      <EditorCameraRig />
      <EditorSceneLights />
      {children}
      <EffectComposer depthBuffer multisampling={4}>
        <EditorDepthOfField />
        <BrightnessContrast brightness={0.055} contrast={0.11} />
        <Vignette offset={0.42} darkness={0.22} />
      </EffectComposer>
    </Canvas>
  );
}
