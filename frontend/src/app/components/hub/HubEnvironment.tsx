import { useGLTF } from '@react-three/drei';

export const HUB_GLTF_URL = '/assets/backgrounds/hub.glb';

export const HUB_ENVIRONMENT_TRANSFORM = {
  position: [0, 0, 0] as [number, number, number],
  scale: 0.8 as number,
};

export const HUB_CAMERA = {
  position: [0, 2, 12] as [number, number, number],
  fov: 50,
  near: 0.1,
  far: 1500,
} as const;

useGLTF.preload(HUB_GLTF_URL);

export function HubSharedLights() {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />
      <directionalLight position={[-4, 3, -4]} intensity={0.3} />
    </>
  );
}

export function HubEnvironment() {
  const { scene } = useGLTF(HUB_GLTF_URL);
  const { position, scale } = HUB_ENVIRONMENT_TRANSFORM;
  return <primitive object={scene} position={position} scale={scale} />;
}
