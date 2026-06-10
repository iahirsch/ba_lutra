import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { Euler, Quaternion, Vector3, type Object3D } from 'three';
import {
  ENVIRONMENT_SPAWN,
  HUB_ENVIRONMENT_TRANSFORM,
  HUB_GLTF_URL,
} from '../constants/hub-scene';

type SpawnName = (typeof ENVIRONMENT_SPAWN)[keyof typeof ENVIRONMENT_SPAWN];

export interface EnvironmentSpawnTransform {
  position: [number, number, number];
  rotationY: number;
}

export function resolveEnvironmentSpawn(
  scene: Object3D,
  spawnName: SpawnName | string,
  applyEnvironmentTransform = true,
): [number, number, number] {
  const marker = scene.getObjectByName(spawnName);
  const position = new Vector3();
  if (marker) {
    scene.updateMatrixWorld(true);
    marker.getWorldPosition(position);
  }
  if (applyEnvironmentTransform) {
    const { position: envPosition, scale } = HUB_ENVIRONMENT_TRANSFORM;
    position.multiplyScalar(scale);
    position.add(new Vector3(...envPosition));
  }
  return [position.x, position.y, position.z];
}

export function resolveEnvironmentSpawnTransform(
  scene: Object3D,
  spawnName: SpawnName | string,
  applyEnvironmentTransform = true,
): EnvironmentSpawnTransform {
  const marker = scene.getObjectByName(spawnName);
  const position = new Vector3();
  const quaternion = new Quaternion();
  if (marker) {
    scene.updateMatrixWorld(true);
    marker.getWorldPosition(position);
    marker.getWorldQuaternion(quaternion);
  }
  if (applyEnvironmentTransform) {
    const { position: envPosition, scale } = HUB_ENVIRONMENT_TRANSFORM;
    position.multiplyScalar(scale);
    position.add(new Vector3(...envPosition));
  }
  const rotationY = new Euler().setFromQuaternion(quaternion, 'YXZ').y;
  return { position: [position.x, position.y, position.z], rotationY };
}

export function addSpawnOffset(
  point: [number, number, number],
  offset: [number, number, number],
): [number, number, number] {
  return [point[0] + offset[0], point[1] + offset[1], point[2] + offset[2]];
}

export function resolveHubScenePosition(
  scene: Object3D,
  objectName: string,
  applyEnvironmentTransform = true,
): Vector3 {
  const [x, y, z] = resolveEnvironmentSpawn(
    scene,
    objectName,
    applyEnvironmentTransform,
  );
  return new Vector3(x, y, z);
}

export function collectHubSceneMarkers(
  scene: Object3D,
  namePrefix: string,
  applyEnvironmentTransform = true,
): Array<{ name: string; position: Vector3; rotationY: number }> {
  const markers: Array<{ name: string; position: Vector3; rotationY: number }> =
    [];
  const quaternion = new Quaternion();

  scene.updateMatrixWorld(true);
  scene.traverse((object) => {
    if (!object.name.startsWith(namePrefix)) {
      return;
    }
    object.getWorldQuaternion(quaternion);
    const rotationY = new Euler().setFromQuaternion(quaternion, 'YXZ').y;
    markers.push({
      name: object.name,
      position: resolveHubScenePosition(
        scene,
        object.name,
        applyEnvironmentTransform,
      ),
      rotationY,
    });
  });

  return markers;
}

export function useEnvironmentSpawn(
  spawnName: SpawnName,
  applyEnvironmentTransform = true,
): [number, number, number] {
  const { scene } = useGLTF(HUB_GLTF_URL);
  return useMemo(
    () => resolveEnvironmentSpawn(scene, spawnName, applyEnvironmentTransform),
    [scene, spawnName, applyEnvironmentTransform],
  );
}

export function useEnvironmentSpawnTransform(
  spawnName: SpawnName,
  applyEnvironmentTransform = true,
): EnvironmentSpawnTransform {
  const { scene } = useGLTF(HUB_GLTF_URL);
  return useMemo(
    () =>
      resolveEnvironmentSpawnTransform(
        scene,
        spawnName,
        applyEnvironmentTransform,
      ),
    [scene, spawnName, applyEnvironmentTransform],
  );
}
