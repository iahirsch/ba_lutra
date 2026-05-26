import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import {
  HUB_ENVIRONMENT_TRANSFORM,
  HUB_GLTF_URL,
} from '../../constants/hub-scene';
import {
  applyCelShading,
  applyHubTerrainMaterial,
} from '../../utils/celShading';

useGLTF.preload(HUB_GLTF_URL);

/** Cel-shaded camp background mesh (hub + interaction stages). */
export function HubBackground() {
  const { scene } = useGLTF(HUB_GLTF_URL);
  const { position, scale } = HUB_ENVIRONMENT_TRANSFORM;

  const celScene = useMemo(() => {
    const cloned = scene.clone(true);
    applyHubTerrainMaterial(cloned);
    applyCelShading(cloned);
    return cloned;
  }, [scene]);

  return <primitive object={celScene} position={position} scale={scale} />;
}
