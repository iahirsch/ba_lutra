import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { Mesh, Vector3 } from 'three';
import {
  HUB_POI_NAME_PREFIX,
  HUB_WALK_MASK_ATTRIBUTE,
  HUB_WALK_MIN_SAMPLE_WEIGHT,
  HUB_WALK_SAMPLE_MAX_ATTEMPTS,
} from '../constants/hub-companion-behavior';
import { HUB_GLTF_URL, HUB_TERRAIN_MESH_NAME } from '../constants/hub-scene';
import { collectHubSceneMarkers } from '../utils/environmentSpawn';
import { isTooCloseToOtherCompanions } from '../utils/hubCompanionRegistry';
import {
  createTerrainWeightedSampler,
  constrainTerrainWalkPosition,
  getTerrainWorldHeightAt,
  isTerrainWalkableAt,
  sampleTerrainLocalPoint,
  terrainLocalToHubWorld,
} from '../utils/terrainSampler';

export interface HubPoi {
  name: string;
  position: Vector3;
  rotationY: number;
}

export interface HubWalkTerrain {
  pois: HubPoi[];
  sampleRoamWorldPosition: (
    companionId: string,
    minSeparation: number,
  ) => Vector3 | null;
  getGroundHeight: (worldX: number, worldZ: number) => number | null;
  isWalkableAt: (worldX: number, worldZ: number) => boolean;
  constrainWalkPosition: (
    x: number,
    z: number,
    prevX: number,
    prevZ: number,
  ) => { x: number; z: number; blocked: boolean };
}

export function useHubWalkTerrain(): HubWalkTerrain {
  const { scene } = useGLTF(HUB_GLTF_URL);

  const walkTerrain = useMemo(() => {
    const terrainMesh = scene.getObjectByName(HUB_TERRAIN_MESH_NAME);
    if (!(terrainMesh instanceof Mesh)) {
      throw new Error(`Expected mesh "${HUB_TERRAIN_MESH_NAME}" in hub GLB`);
    }

    const { sampler, samplingGeometry } = createTerrainWeightedSampler(
      terrainMesh,
      HUB_WALK_MASK_ATTRIBUTE,
    );
    const pois = collectHubSceneMarkers(scene, HUB_POI_NAME_PREFIX);

    const sampleRoamWorldPosition = (
      companionId: string,
      minSeparation: number,
    ): Vector3 | null => {
      const localPoint = sampleTerrainLocalPoint(
        sampler,
        HUB_WALK_MIN_SAMPLE_WEIGHT,
        HUB_WALK_SAMPLE_MAX_ATTEMPTS,
        (localX, localZ) => {
          // sampleTerrainLocalPoint already rejects points below
          // HUB_WALK_MIN_SAMPLE_WEIGHT, so no redundant walkability
          // raycast is needed here — only check separation.
          const world = terrainLocalToHubWorld(
            new Vector3(localX, 0, localZ),
            terrainMesh,
          );
          return isTooCloseToOtherCompanions(
            world.x,
            world.z,
            companionId,
            minSeparation,
          );
        },
      );
      if (!localPoint) {
        return null;
      }

      return terrainLocalToHubWorld(localPoint, terrainMesh);
    };

    return {
      pois,
      sampleRoamWorldPosition,
      getGroundHeight: (worldX: number, worldZ: number) =>
        getTerrainWorldHeightAt(worldX, worldZ, terrainMesh),
      isWalkableAt: (worldX: number, worldZ: number) =>
        isTerrainWalkableAt(
          worldX,
          worldZ,
          terrainMesh,
          HUB_WALK_MASK_ATTRIBUTE,
          HUB_WALK_MIN_SAMPLE_WEIGHT,
        ),
      constrainWalkPosition: (
        x: number,
        z: number,
        prevX: number,
        prevZ: number,
      ) =>
        constrainTerrainWalkPosition(
          x,
          z,
          prevX,
          prevZ,
          terrainMesh,
          HUB_WALK_MASK_ATTRIBUTE,
          HUB_WALK_MIN_SAMPLE_WEIGHT,
        ),
      samplingGeometry,
    };
  }, [scene]);

  useEffect(() => {
    return () => {
      walkTerrain.samplingGeometry.dispose();
    };
  }, [walkTerrain]);

  return walkTerrain;
}
