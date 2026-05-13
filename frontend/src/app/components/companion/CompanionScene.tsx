import { Suspense, useRef, useLayoutEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3, MathUtils, Spherical } from 'three';
import { useCompanionStore } from '../../store/companion.store';
import {
  CAMERA_PRESETS,
  isHorizontalOrbitCategory,
} from '../../constants/camera-presets';

function CameraRig() {
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

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 3]} intensity={1.2} />
      <directionalLight position={[-2, 2, -2]} intensity={0.3} />
    </>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshBasicMaterial color="#aaaaaa" wireframe />
    </mesh>
  );
}

interface CompanionSceneProps {
  children?: React.ReactNode;
}

export function CompanionScene({ children }: CompanionSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 1.0, 4.5], fov: 40, near: 0.1, far: 100 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ alpha: true }}
    >
      <CameraRig />
      <SceneLighting />
      <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
    </Canvas>
  );
}
