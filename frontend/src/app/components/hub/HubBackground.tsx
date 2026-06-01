import { useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { TextureLoader } from 'three';
import {
  HUB_ENVIRONMENT_TRANSFORM,
  HUB_GLTF_URL,
} from '../../constants/hub-scene';
import * as veg from '../../constants/environment-vegetation';
import {
  applyCelShading,
  applyHubTerrainMaterial,
} from '../../utils/celShading';
import {
  attachTerrainGrowShader,
  setTerrainGrowReveal,
} from '../../utils/terrainMaterial';
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
  const [
    sandColor,
    sandNormal,
    sandHeight,
    grassColor,
    grassNormal,
    dirtColor,
    dirtNormal,
  ] = useLoader(TextureLoader, [
    veg.GROUND_SAND_COLOR_URL,
    veg.GROUND_SAND_NORMAL_URL,
    veg.GROUND_SAND_HEIGHT_URL,
    veg.GROUND_GRASS_COLOR_URL,
    veg.GROUND_GRASS_NORMAL_URL,
    veg.GROUND_DIRT_COLOR_URL,
    veg.GROUND_DIRT_NORMAL_URL,
  ]);

  const celScene = useMemo(() => {
    const cloned = scene.clone(true);
    applyHubTerrainMaterial(cloned);
    applyCelShading(cloned);
    attachTerrainGrowShader(cloned, {
      sandColor,
      sandNormal,
      sandHeight,
      grassColor,
      grassNormal,
      dirtColor,
      dirtNormal,
    });
    return cloned;
  }, [
    scene,
    sandColor,
    sandNormal,
    sandHeight,
    grassColor,
    grassNormal,
    dirtColor,
    dirtNormal,
  ]);

  const { anchorX, anchorZ, growRadiusRef, fadeWidth } = useVegetationGrow({
    applyEnvironmentTransform: true,
    totalEffortScore,
    terrainWorldWidth,
    growRadiusRatio: veg.GROUND_GROW_RADIUS_RATIO,
  });

  useFrame(() => {
    setTerrainGrowReveal(anchorX, anchorZ, growRadiusRef.current, fadeWidth);
  });

  return <primitive object={celScene} position={position} scale={scale} />;
}
