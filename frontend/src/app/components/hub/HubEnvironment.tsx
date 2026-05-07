import { useGLTF } from '@react-three/drei';

const HUB_URL = '/assets/backgrounds/hub.glb';

useGLTF.preload(HUB_URL);

export function HubEnvironment() {
  const { scene } = useGLTF(HUB_URL);
  return <primitive object={scene} position={[0, 0, 0]} scale={0.8} />;
}
