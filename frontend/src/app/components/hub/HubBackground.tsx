import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { HUB_GLTF_URL, HUB_ENVIRONMENT_TRANSFORM } from '@ba-praktisch/shared-types';
import { applyCelShading } from '../../utils/celShading';

useGLTF.preload(HUB_GLTF_URL);

/** Cel-shaded camp background mesh (hub + interaction stages). */
export function HubBackground() {
  const { scene } = useGLTF(HUB_GLTF_URL);
  const { position, scale } = HUB_ENVIRONMENT_TRANSFORM;

  const celScene = useMemo(() => {
    const cloned = scene.clone(true);
    applyCelShading(cloned);
    return cloned;
  }, [scene]);

  return <primitive object={celScene} position={position} scale={scale} />;
}
