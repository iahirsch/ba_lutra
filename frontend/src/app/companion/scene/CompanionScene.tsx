import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Vector3, MathUtils } from 'three';
import { useCompanionStore } from '../store/companion.store';
import { CAMERA_PRESETS } from '../constants/camera-presets';

// Camera Rig
function CameraRig() {
  const { camera } = useThree();

  const targetPosition = useRef(new Vector3(0, 1.0, 4.5));
  const targetLookAt = useRef(new Vector3(0, 0.8, 0));
  const currentLookAt = useRef(new Vector3(0, 0.8, 0));

  const activeCategory = useCompanionStore((s) => s.activeCategory);

  useEffect(() => {
    const preset = CAMERA_PRESETS[activeCategory];
    targetPosition.current.set(...preset.position);
    targetLookAt.current.set(...preset.target);
  }, [activeCategory]);

  useFrame((_state, delta) => {
    const preset = CAMERA_PRESETS[activeCategory];
    const speed = MathUtils.clamp(delta / preset.duration, 0, 1);

    camera.position.lerp(targetPosition.current, speed);

    currentLookAt.current.lerp(targetLookAt.current, speed);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}

// Lighting
function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 3]} intensity={1.2} />
      <directionalLight position={[-2, 2, -2]} intensity={0.3} />
    </>
  );
}

// Fallback
function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshBasicMaterial color="#aaaaaa" wireframe />
    </mesh>
  );
}

// Public Component
interface CompanionSceneProps {
  children?: React.ReactNode;
}

export function CompanionScene({ children }: CompanionSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 1.0, 4.5], fov: 45, near: 0.1, far: 100 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ alpha: true }}
    >
      <CameraRig />
      <SceneLighting />
      <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
    </Canvas>
  );
}
