import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import {
  HUB_ENVIRONMENT_TRANSFORM,
  HUB_GLTF_URL,
} from '../../constants/hub-scene';
import {
  applyCelShading,
  applyHubTerrainMaterial,
} from '../../utils/celShading';
import {
  attachTerrainGrowShader,
  setTerrainGrowReveal,
} from '../../utils/terrainMaterial';
import { GROUND_GROW_RADIUS_RATIO } from '../../constants/environment-vegetation';
import {
  useEnvironmentTerrainWorldWidth,
  useVegetationGrow,
} from '../../utils/vegetationGrow';
import { useTotalEffortScore } from '../../hooks/useTotalEffortScore';

useGLTF.preload(HUB_GLTF_URL);

interface HubBackgroundProps {
  totalEffortScore?: number;
}

/** Cel-shaded camp background mesh (hub + interaction stages). */
export function HubBackground({
  totalEffortScore: totalEffortProp,
}: HubBackgroundProps) {
  const liveEffort = useTotalEffortScore();
  const totalEffortScore = totalEffortProp ?? liveEffort;
  const terrainWorldWidth = useEnvironmentTerrainWorldWidth(true);
  const { scene } = useGLTF(HUB_GLTF_URL);
  const { position, scale } = HUB_ENVIRONMENT_TRANSFORM;

  const celScene = useMemo(() => {
    const cloned = scene.clone(true);
    applyHubTerrainMaterial(cloned);
    applyCelShading(cloned);
    attachTerrainGrowShader(cloned);
    return cloned;
  }, [scene]);

  const { anchorX, anchorZ, growRadiusRef, fadeWidth } = useVegetationGrow({
    applyEnvironmentTransform: true,
    totalEffortScore,
    terrainWorldWidth,
    growRadiusRatio: GROUND_GROW_RADIUS_RATIO,
  });

  useFrame(() => {
    setTerrainGrowReveal(anchorX, anchorZ, growRadiusRef.current, fadeWidth);
  });

  return <primitive object={celScene} position={position} scale={scale} />;
}
