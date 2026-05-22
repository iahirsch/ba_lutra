import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { Vector3, type Object3D } from 'three';
import {
  ENVIRONMENT_SPAWN,
  HUB_ENVIRONMENT_TRANSFORM,
  HUB_GLTF_URL,
} from '@ba-praktisch/shared-types';

type SpawnName = (typeof ENVIRONMENT_SPAWN)[keyof typeof ENVIRONMENT_SPAWN];

export function resolveEnvironmentSpawn(
  scene: Object3D,
  spawnName: SpawnName,
  applyHubTransform = true,
): [number, number, number] {
  const marker = scene.getObjectByName(spawnName);
  const position = new Vector3();
  if (marker) {
    scene.updateMatrixWorld(true);
    marker.getWorldPosition(position);
  }
  if (applyHubTransform) {
    const { position: envPosition, scale } = HUB_ENVIRONMENT_TRANSFORM;
    position.multiplyScalar(scale);
    position.add(new Vector3(...envPosition));
  }
  return [position.x, position.y, position.z];
}

export function addSpawnOffset(
  point: [number, number, number],
  offset: [number, number, number],
): [number, number, number] {
  return [point[0] + offset[0], point[1] + offset[1], point[2] + offset[2]];
}

export function useEnvironmentSpawn(
  spawnName: SpawnName,
  applyHubTransform = true,
): [number, number, number] {
  const { scene } = useGLTF(HUB_GLTF_URL);
  return useMemo(
    () => resolveEnvironmentSpawn(scene, spawnName, applyHubTransform),
    [scene, spawnName, applyHubTransform],
  );
}
