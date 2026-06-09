import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Box3, Mesh, Object3D, Vector3 } from 'three';
import {
  ENVIRONMENT_SPAWN,
  HUB_ENVIRONMENT_TRANSFORM,
  HUB_GLTF_URL,
  HUB_TERRAIN_MESH_NAME,
} from '../constants/hub-scene';
import {
  effortTotalToGrowRadius,
  GRASS_GROW_RADIUS_RATIO,
  VEGETATION_GROW_FADE_RATIO,
} from '../constants/environment-vegetation';
import { resolveEnvironmentSpawn } from './environmentSpawn';

const GROW_RADIUS_LERP = 0.2;

export function distanceFromGrowAnchorXZ(
  x: number,
  z: number,
  anchorX: number,
  anchorZ: number,
): number {
  return Math.hypot(x - anchorX, z - anchorZ);
}

export function computeGrowReveal(
  distance: number,
  growRadius: number,
  fadeWidth: number,
): number {
  if (growRadius <= 0) return 0;
  if (fadeWidth <= 0) return distance <= growRadius ? 1 : 0;
  const inner = growRadius - fadeWidth;
  if (distance <= inner) return 1;
  if (distance >= growRadius) return 0;
  return 1 - (distance - inner) / fadeWidth;
}

export function vegetationGrowFadeWidth(terrainWorldWidth: number): number {
  return terrainWorldWidth * VEGETATION_GROW_FADE_RATIO;
}

export function computeTerrainWorldWidth(
  terrainMesh: Mesh,
  envScale: number,
): number {
  terrainMesh.geometry.computeBoundingBox();
  if (!terrainMesh.geometry.boundingBox) {
    throw new Error('Expected ground mesh geometry bounds');
  }
  const size = new Vector3();
  terrainMesh.geometry.boundingBox.getSize(size);
  const worldX = size.x * terrainMesh.scale.x * envScale;
  const worldZ = size.z * terrainMesh.scale.z * envScale;
  return Math.max(worldX, worldZ);
}

export function useEnvironmentTerrainWorldWidth(
  applyEnvironmentTransform = true,
): number {
  const { scene } = useGLTF(HUB_GLTF_URL);
  const envScale = applyEnvironmentTransform
    ? HUB_ENVIRONMENT_TRANSFORM.scale
    : 1;

  return useMemo(() => {
    const terrainMesh = scene.getObjectByName(HUB_TERRAIN_MESH_NAME);
    if (!(terrainMesh instanceof Mesh)) {
      throw new Error(`Expected mesh "${HUB_TERRAIN_MESH_NAME}" in hub GLB`);
    }
    return computeTerrainWorldWidth(terrainMesh, envScale);
  }, [scene, envScale]);
}

/** Horizontal extent of an object for whole-object reveal (trees, bushes). */
export function computeHorizontalFootprintRadius(root: Object3D): number {
  const box = new Box3().setFromObject(root);
  const size = new Vector3();
  box.getSize(size);
  return Math.max(size.x, size.z) * 0.5;
}

export function useVegetationGrowAnchor(
  applyEnvironmentTransform = true,
): readonly [number, number] {
  const { scene } = useGLTF(HUB_GLTF_URL);
  return useMemo(() => {
    const [anchorX, , anchorZ] = resolveEnvironmentSpawn(
      scene,
      ENVIRONMENT_SPAWN.anchor,
      applyEnvironmentTransform,
    );
    return [anchorX, anchorZ] as const;
  }, [scene, applyEnvironmentTransform]);
}

export interface UseVegetationGrowOptions {
  applyEnvironmentTransform?: boolean;
  totalEffortScore: number;
  terrainWorldWidth: number;
  growRadiusRatio?: number;
}

export function useVegetationGrow({
  applyEnvironmentTransform = true,
  totalEffortScore,
  terrainWorldWidth,
  growRadiusRatio = GRASS_GROW_RADIUS_RATIO,
}: UseVegetationGrowOptions) {
  const [anchorX, anchorZ] = useVegetationGrowAnchor(applyEnvironmentTransform);
  const growRadiusRef = useRef(0);
  const fadeWidth = vegetationGrowFadeWidth(terrainWorldWidth);

  useFrame((_state, delta) => {
    const target = effortTotalToGrowRadius(
      totalEffortScore,
      terrainWorldWidth,
      growRadiusRatio,
    );
    growRadiusRef.current +=
      (target - growRadiusRef.current) * Math.min(1, delta * GROW_RADIUS_LERP);
  });

  return {
    anchorX,
    anchorZ,
    growRadiusRef,
    fadeWidth,
  };
}
