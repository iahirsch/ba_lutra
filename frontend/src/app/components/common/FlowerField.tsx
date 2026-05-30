import { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Mesh, TextureLoader, Vector3 } from 'three';
import {
  HUB_ENVIRONMENT_TRANSFORM,
  HUB_GLTF_URL,
  HUB_TERRAIN_MESH_NAME,
} from '../../constants/hub-scene';
import * as veg from '../../constants/environment-vegetation';
import { useTotalEffortScore } from '../../hooks/useTotalEffortScore';
import {
  createTerrainWeightedSampler,
  sampleTerrainLocalPoint,
  terrainLocalToHubWorld,
} from '../../utils/terrainSampler';
import {
  getOrCreateFlowerLeavesMaterial,
  prepareFlowerPropModel,
  useLeavesMaterial,
} from '../../utils/leavesMaterial';
import { useEnvironmentTerrainWorldWidth } from '../../utils/vegetationGrow';
import { VegetationProp } from './VegetationProp';

useGLTF.preload(HUB_GLTF_URL);
for (const url of veg.FLOWER_GLBS) {
  useGLTF.preload(url);
}

interface FlowerFieldProps {
  applyEnvironmentTransform?: boolean;
  totalEffortScore?: number;
}

export function FlowerField({
  applyEnvironmentTransform = true,
  totalEffortScore: totalEffortProp,
}: FlowerFieldProps) {
  const liveEffort = useTotalEffortScore();
  const totalEffortScore = totalEffortProp ?? liveEffort;
  const { scene: hubScene } = useGLTF(HUB_GLTF_URL);

  const [flowerAlphaTexture, noiseTexture] = useLoader(TextureLoader, [
    veg.FLOWER_ALPHA_TEXTURE_URL,
    veg.GRASS_NOISE_TEXTURE_URL,
  ]);

  const flowerMaterialState = useMemo(
    () => getOrCreateFlowerLeavesMaterial(),
    [],
  );
  useLeavesMaterial(flowerMaterialState, flowerAlphaTexture, noiseTexture);

  const terrainWorldWidth = useEnvironmentTerrainWorldWidth(
    applyEnvironmentTransform,
  );

  const flowerPlacements = useMemo(() => {
    const terrainMesh = hubScene.getObjectByName(HUB_TERRAIN_MESH_NAME);
    if (!(terrainMesh instanceof Mesh)) return [];

    const { sampler, samplingGeometry } = createTerrainWeightedSampler(
      terrainMesh,
      veg.FLOWER_WEIGHT_ATTRIBUTE,
    );

    hubScene.updateMatrixWorld(true);
    const { scale, position: envPosition } = HUB_ENVIRONMENT_TRANSFORM;

    const placements: Array<{
      id: string;
      glbUrl: string;
      position: [number, number, number];
      rotation: [number, number, number];
    }> = [];

    for (let i = 0; i < veg.FLOWER_COUNT; i++) {
      const localPoint = sampleTerrainLocalPoint(
        sampler,
        veg.GRASS_MIN_SAMPLE_WEIGHT,
        veg.FLOWER_SPAWN_MAX_ATTEMPTS,
      );
      if (!localPoint) continue;

      const worldPoint = terrainLocalToHubWorld(localPoint, terrainMesh);

      if (applyEnvironmentTransform) {
        worldPoint.multiplyScalar(scale);
        worldPoint.add(new Vector3(...envPosition));
      }

      placements.push({
        id: `flower-${i}`,
        glbUrl:
          veg.FLOWER_GLBS[Math.floor(Math.random() * veg.FLOWER_GLBS.length)],
        position: [worldPoint.x, worldPoint.y, worldPoint.z],
        rotation: [0, Math.random() * Math.PI * 2, 0],
      });
    }

    samplingGeometry.dispose();
    return placements;
  }, [hubScene, applyEnvironmentTransform]);

  if (flowerPlacements.length === 0) return null;

  return (
    <>
      {flowerPlacements.map((flower) => (
        <VegetationProp
          key={flower.id}
          glbUrl={flower.glbUrl}
          position={flower.position}
          rotation={flower.rotation}
          applyEnvironmentTransform={applyEnvironmentTransform}
          totalEffortScore={totalEffortScore}
          terrainWorldWidth={terrainWorldWidth}
          leavesMaterialState={flowerMaterialState}
          prepareModel={prepareFlowerPropModel}
        />
      ))}
    </>
  );
}
