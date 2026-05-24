import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import {
  BufferGeometry,
  Euler,
  InstancedMesh,
  Matrix4,
  Mesh,
  Object3D,
  Quaternion,
  TextureLoader,
  Vector3,
} from 'three';
import {
  GRASS_ALPHA_TEXTURE_URL,
  GRASS_BLADE_HEIGHT,
  GRASS_BLADE_WIDTH,
  GRASS_INSTANCE_COUNT,
  GRASS_LOD0_MESH_NAME,
  GRASS_LODS_URL,
  GRASS_NOISE_TEXTURE_URL,
  HUB_ENVIRONMENT_TRANSFORM,
  HUB_GLTF_URL,
  HUB_TERRAIN_MESH_NAME,
} from '@ba-praktisch/shared-types';
import {
  createGrassMaterial,
  setGrassBladeDimensions,
  setGrassMaterialTextures,
  updateGrassMaterialTime,
} from '../../utils/grassMaterial';

useGLTF.preload(HUB_GLTF_URL);
useGLTF.preload(GRASS_LODS_URL);

interface HubGrassProps {
  applyHubTransform?: boolean;
}

function findMeshByName(root: Object3D, name: string): Mesh {
  const mesh = root.getObjectByName(name);
  if (!(mesh instanceof Mesh)) {
    throw new Error(`Expected mesh "${name}" in GLB scene`);
  }
  return mesh;
}

function extractGrassGeometry(lodScene: Object3D): BufferGeometry {
  let geometry: BufferGeometry | null = null;
  lodScene.traverse((child) => {
    if (child instanceof Mesh && child.name.includes(GRASS_LOD0_MESH_NAME)) {
      const cloned = child.geometry.clone();
      cloned.computeBoundingBox();
      if (cloned.boundingBox) {
        cloned.translate(0, -cloned.boundingBox.min.y, 0);
      }
      geometry = cloned;
    }
  });
  if (!geometry) {
    throw new Error(`Expected "${GRASS_LOD0_MESH_NAME}" mesh in grass LOD GLB`);
  }
  return geometry;
}

function buildGrassInstances(
  terrainMesh: Mesh,
  grassGeometry: BufferGeometry,
  count: number,
  bladeWidth: number,
  bladeHeight: number,
) {
  const sampler = new MeshSurfaceSampler(terrainMesh).build();
  const materialState = createGrassMaterial();
  setGrassBladeDimensions(materialState, bladeHeight);
  const instancedMesh = new InstancedMesh(
    grassGeometry,
    materialState.material,
    count,
  );

  const position = new Vector3();
  const quaternion = new Quaternion();
  const instanceScale = new Vector3(bladeWidth, bladeHeight, bladeWidth);
  const normal = new Vector3();
  const yAxis = new Vector3(0, 1, 0);
  const matrix = new Matrix4();

  for (let i = 0; i < count; i++) {
    sampler.sample(position, normal);
    quaternion.setFromUnitVectors(yAxis, normal);
    const randomQuaternion = new Quaternion().setFromEuler(
      new Euler(0, Math.random() * Math.PI * 2, 0),
    );
    quaternion.multiply(randomQuaternion);
    matrix.compose(position, quaternion, instanceScale);
    instancedMesh.setMatrixAt(i, matrix);
  }
  instancedMesh.instanceMatrix.needsUpdate = true;

  return { instancedMesh, materialState };
}

/** Instanced  grass scattered on the hub terrain mesh. */
export function HubGrass({ applyHubTransform = true }: HubGrassProps) {
  const { scene: hubScene } = useGLTF(HUB_GLTF_URL);
  const { scene: grassLodScene } = useGLTF(GRASS_LODS_URL);
  const [grassAlphaTexture, noiseTexture] = useLoader(TextureLoader, [
    GRASS_ALPHA_TEXTURE_URL,
    GRASS_NOISE_TEXTURE_URL,
  ]);

  const timeRef = useRef(0);
  const { position, scale } = HUB_ENVIRONMENT_TRANSFORM;

  const { instancedMesh, materialState, terrainTransform } = useMemo(() => {
    const terrainMesh = findMeshByName(hubScene, HUB_TERRAIN_MESH_NAME);
    const grassGeometry = extractGrassGeometry(grassLodScene);
    const built = buildGrassInstances(
      terrainMesh,
      grassGeometry,
      GRASS_INSTANCE_COUNT,
      GRASS_BLADE_WIDTH,
      GRASS_BLADE_HEIGHT,
    );
    setGrassMaterialTextures(
      built.materialState,
      grassAlphaTexture,
      noiseTexture,
    );
    return {
      ...built,
      terrainTransform: {
        position: terrainMesh.position.toArray() as [number, number, number],
        rotation: [
          terrainMesh.rotation.x,
          terrainMesh.rotation.y,
          terrainMesh.rotation.z,
        ] as [number, number, number],
        scale: terrainMesh.scale.toArray() as [number, number, number],
      },
    };
  }, [hubScene, grassLodScene, grassAlphaTexture, noiseTexture]);

  useEffect(() => {
    return () => {
      instancedMesh.geometry.dispose();
      instancedMesh.material.dispose();
    };
  }, [instancedMesh]);

  useFrame((_state, delta) => {
    timeRef.current += delta;
    updateGrassMaterialTime(materialState, timeRef.current);
  });

  return (
    <group
      position={applyHubTransform ? position : undefined}
      scale={applyHubTransform ? scale : undefined}
    >
      <group
        position={terrainTransform.position}
        rotation={terrainTransform.rotation}
        scale={terrainTransform.scale}
      >
        <primitive object={instancedMesh} />
      </group>
    </group>
  );
}
