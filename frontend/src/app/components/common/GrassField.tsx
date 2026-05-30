import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import {
  Box3,
  BufferAttribute,
  BufferGeometry,
  Color,
  Euler,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshLambertMaterial,
  Object3D,
  Quaternion,
  TextureLoader,
  Vector3,
} from 'three';
import * as hub from '../../constants/hub-scene';
import * as veg from '../../constants/environment-vegetation';
import {
  createGrassMaterial,
  setGrassBladeDimensions,
  setGrassGrowReveal,
  setGrassMaterialTextures,
  updateGrassMaterialTime,
} from '../../utils/grassMaterial';
import {
  computeTerrainWorldWidth,
  useVegetationGrow,
} from '../../utils/vegetationGrow';
import { useTotalEffortScore } from '../../hooks/useTotalEffortScore';

useGLTF.preload(hub.HUB_GLTF_URL);
useGLTF.preload(veg.GRASS_LODS_URL);

interface GrassFieldProps {
  applyEnvironmentTransform?: boolean;
  totalEffortScore?: number;
}

interface GrassChunk {
  localCenter: Vector3;
  lodMeshes: InstancedMesh[];
}

interface LodDistances {
  lod1: number;
  lod2: number;
  cull: number;
}

function findMeshByName(root: Object3D, name: string): Mesh {
  const mesh = root.getObjectByName(name);
  if (!(mesh instanceof Mesh)) {
    throw new Error(`Expected mesh "${name}" in GLB scene`);
  }
  return mesh;
}

function prepareBladeGeometry(source: BufferGeometry): BufferGeometry {
  const geometry = source.clone();
  geometry.computeBoundingBox();
  if (geometry.boundingBox) {
    geometry.translate(0, -geometry.boundingBox.min.y, 0);
  }
  return geometry;
}

function extractGrassLodGeometries(lodScene: Object3D): BufferGeometry[] {
  const byName = new Map<string, BufferGeometry>();
  lodScene.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    for (const lodName of veg.GRASS_LOD_MESH_NAMES) {
      if (child.name.includes(lodName)) {
        byName.set(lodName, prepareBladeGeometry(child.geometry));
      }
    }
  });

  return veg.GRASS_LOD_MESH_NAMES.map((lodName) => {
    const geometry = byName.get(lodName);
    if (!geometry) {
      throw new Error(`Expected "${lodName}" mesh in grass LOD GLB`);
    }
    return geometry;
  });
}

function computeLodDistances(terrainWorldWidth: number): LodDistances {
  return {
    lod1: terrainWorldWidth * veg.GRASS_LOD1_DISTANCE_RATIO,
    lod2: terrainWorldWidth * veg.GRASS_LOD2_DISTANCE_RATIO,
    cull: terrainWorldWidth * veg.GRASS_LOD_CULL_DISTANCE_RATIO,
  };
}

function getChunkKey(position: Vector3, bounds: Box3, grid: number): string {
  const spanX = bounds.max.x - bounds.min.x;
  const spanZ = bounds.max.z - bounds.min.z;
  const cellX = Math.min(
    grid - 1,
    Math.max(0, Math.floor(((position.x - bounds.min.x) / spanX) * grid)),
  );
  const cellZ = Math.min(
    grid - 1,
    Math.max(0, Math.floor(((position.z - bounds.min.z) / spanZ) * grid)),
  );
  return `${cellX},${cellZ}`;
}

const GRASS_WEIGHT_BUFFER = 'grassWeight';

function getVertexColorLuminance(
  colorAttribute: {
    getX: (index: number) => number;
    getY: (index: number) => number;
    getZ: (index: number) => number;
    count: number;
  },
  index: number,
): number {
  const r = colorAttribute.getX(index);
  const g = colorAttribute.getY(index);
  const b = colorAttribute.getZ(index);
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}

function getSampleColorWeight(color: Color): number {
  return color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722;
}

/** Maps sampled mask luminance to 0–1 for shader bury (0 at min placement weight). */
function normalizeGrassMaskWeight(
  rawWeight: number,
  minSampleWeight: number,
): number {
  if (rawWeight <= minSampleWeight) return 0;
  return Math.min(1, (rawWeight - minSampleWeight) / (1 - minSampleWeight));
}

function resolveGrassMaskAttribute(geometry: BufferGeometry) {
  const maskAttribute = geometry.getAttribute(veg.GRASS_WEIGHT_ATTRIBUTE);
  if (maskAttribute) {
    return maskAttribute;
  }

  const fallback = geometry.getAttribute('color');
  if (fallback) {
    return fallback;
  }

  throw new Error(
    `Ground mesh "${hub.HUB_TERRAIN_MESH_NAME}" is missing vertex colors (${veg.GRASS_WEIGHT_ATTRIBUTE} or color). Paint the grass mask in hub.glb.`,
  );
}

function createGrassSampler(terrainMesh: Mesh): {
  sampler: MeshSurfaceSampler;
  samplingGeometry: BufferGeometry;
} {
  const densityAttribute = resolveGrassMaskAttribute(terrainMesh.geometry);
  const surfaceAttribute = terrainMesh.geometry.getAttribute(
    veg.GROUND_SURFACE_MASK_ATTRIBUTE,
  );

  const samplingGeometry = terrainMesh.geometry.clone();
  const vertexCount = densityAttribute.count;
  const weights = new Float32Array(vertexCount);
  const combinedColors = new Float32Array(vertexCount * 3);

  for (let i = 0; i < vertexCount; i++) {
    const densityWeight = getVertexColorLuminance(densityAttribute, i);
    const surfaceWeight = surfaceAttribute
      ? 1 - getVertexColorLuminance(surfaceAttribute, i)
      : 1;
    const combinedWeight = densityWeight * surfaceWeight;
    weights[i] = combinedWeight;
    combinedColors[i * 3] = combinedWeight;
    combinedColors[i * 3 + 1] = combinedWeight;
    combinedColors[i * 3 + 2] = combinedWeight;
  }

  samplingGeometry.setAttribute(
    GRASS_WEIGHT_BUFFER,
    new BufferAttribute(weights, 1),
  );
  // MeshSurfaceSampler interpolates `color` for sampleColor at the pick point.
  samplingGeometry.setAttribute(
    'color',
    new BufferAttribute(combinedColors, 3),
  );

  const sampler = new MeshSurfaceSampler(new Mesh(samplingGeometry))
    .setWeightAttribute(GRASS_WEIGHT_BUFFER)
    .build();

  return { sampler, samplingGeometry };
}

function buildGrassChunks(
  terrainMesh: Mesh,
  lodGeometries: BufferGeometry[],
  count: number,
  bladeWidth: number,
  bladeHeight: number,
  grid: number,
  material: MeshLambertMaterial,
  minSampleWeight: number,
): {
  chunks: GrassChunk[];
  samplingGeometry: BufferGeometry;
  instanceGeometries: BufferGeometry[];
} {
  const { sampler, samplingGeometry } = createGrassSampler(terrainMesh);
  terrainMesh.geometry.computeBoundingBox();
  if (!terrainMesh.geometry.boundingBox) {
    throw new Error('Expected ground mesh geometry bounds');
  }
  const bounds = new Box3().copy(terrainMesh.geometry.boundingBox);

  const chunkMatrices = new Map<string, Matrix4[]>();
  const chunkMaskWeights = new Map<string, number[]>();
  const chunkCenterSums = new Map<string, Vector3>();
  const chunkCounts = new Map<string, number>();

  const position = new Vector3();
  const quaternion = new Quaternion();
  const instanceScale = new Vector3(bladeWidth, bladeHeight, bladeWidth);
  const normal = new Vector3();
  const yAxis = new Vector3(0, 1, 0);
  const matrix = new Matrix4();
  const sampleColor = new Color();

  let placed = 0;
  let attempts = 0;
  const maxAttempts = count * 30;

  while (placed < count && attempts < maxAttempts) {
    attempts++;
    sampler.sample(position, normal, sampleColor);
    const sampleWeight = getSampleColorWeight(sampleColor);
    if (sampleWeight < minSampleWeight) {
      continue;
    }
    const maskWeight = normalizeGrassMaskWeight(sampleWeight, minSampleWeight);

    const key = getChunkKey(position, bounds, grid);

    quaternion.setFromUnitVectors(yAxis, normal);
    const randomQuaternion = new Quaternion().setFromEuler(
      new Euler(0, Math.random() * Math.PI * 2, 0),
    );
    quaternion.multiply(randomQuaternion);
    matrix.compose(position, quaternion, instanceScale);

    if (!chunkMatrices.has(key)) {
      chunkMatrices.set(key, []);
      chunkMaskWeights.set(key, []);
      chunkCenterSums.set(key, new Vector3());
      chunkCounts.set(key, 0);
    }
    const matrices = chunkMatrices.get(key);
    const maskWeights = chunkMaskWeights.get(key);
    if (matrices && maskWeights) {
      matrices.push(matrix.clone());
      maskWeights.push(maskWeight);
    }
    const centerSum = chunkCenterSums.get(key);
    const sampleCount = chunkCounts.get(key);
    if (centerSum && sampleCount !== undefined) {
      centerSum.add(position);
      chunkCounts.set(key, sampleCount + 1);
    }
    placed++;
  }

  const chunks: GrassChunk[] = [];
  const instanceGeometries: BufferGeometry[] = [];

  for (const [key, matrices] of chunkMatrices) {
    const centerSum = chunkCenterSums.get(key);
    const sampleCount = chunkCounts.get(key);
    const maskWeights = chunkMaskWeights.get(key);
    if (!centerSum || !sampleCount || !maskWeights) continue;

    const localCenter = centerSum.divideScalar(sampleCount);
    const maskArray = new Float32Array(maskWeights);

    const lodMeshes = lodGeometries.map((sourceGeometry) => {
      const geometry = sourceGeometry.clone();
      instanceGeometries.push(geometry);
      geometry.setAttribute(
        veg.GRASS_MASK_INSTANCE_ATTRIBUTE,
        new InstancedBufferAttribute(maskArray, 1),
      );

      const mesh = new InstancedMesh(geometry, material, matrices.length);
      for (let i = 0; i < matrices.length; i++) {
        mesh.setMatrixAt(i, matrices[i]);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
      mesh.frustumCulled = true;
      return mesh;
    });

    lodMeshes[1].visible = false;
    lodMeshes[2].visible = false;

    chunks.push({ localCenter, lodMeshes });
  }

  return { chunks, samplingGeometry, instanceGeometries };
}

/** Horizontal world-space distance from camera to chunk (ground-plane LOD). */
function horizontalDistanceToChunk(
  cameraPosition: Vector3,
  chunkLocalCenter: Vector3,
  terrainMatrixWorld: Matrix4,
  target: Vector3,
): number {
  target.copy(chunkLocalCenter).applyMatrix4(terrainMatrixWorld);
  const dx = cameraPosition.x - target.x;
  const dz = cameraPosition.z - target.z;
  return Math.hypot(dx, dz);
}

function updateChunkLods(
  chunks: GrassChunk[],
  cameraPosition: Vector3,
  terrainMatrixWorld: Matrix4,
  lodDistances: LodDistances,
): void {
  const worldCenter = new Vector3();

  for (const chunk of chunks) {
    const distance = horizontalDistanceToChunk(
      cameraPosition,
      chunk.localCenter,
      terrainMatrixWorld,
      worldCenter,
    );

    if (distance >= lodDistances.cull) {
      chunk.lodMeshes[0].visible = false;
      chunk.lodMeshes[1].visible = false;
      chunk.lodMeshes[2].visible = false;
      continue;
    }

    if (distance < lodDistances.lod1) {
      chunk.lodMeshes[0].visible = true;
      chunk.lodMeshes[1].visible = false;
      chunk.lodMeshes[2].visible = false;
    } else if (distance < lodDistances.lod2) {
      chunk.lodMeshes[0].visible = false;
      chunk.lodMeshes[1].visible = true;
      chunk.lodMeshes[2].visible = false;
    } else {
      chunk.lodMeshes[0].visible = false;
      chunk.lodMeshes[1].visible = false;
      chunk.lodMeshes[2].visible = true;
    }
  }
}

/** Chunked instanced grass with per-chunk distance LOD */
export function GrassField({
  applyEnvironmentTransform = true,
  totalEffortScore: totalEffortProp,
}: GrassFieldProps) {
  const liveEffort = useTotalEffortScore();
  const totalEffortScore = totalEffortProp ?? liveEffort;
  const { scene: hubScene } = useGLTF(hub.HUB_GLTF_URL);
  const { scene: grassLodScene } = useGLTF(veg.GRASS_LODS_URL);
  const [grassAlphaTexture, noiseTexture] = useLoader(TextureLoader, [
    veg.GRASS_ALPHA_TEXTURE_URL,
    veg.GRASS_NOISE_TEXTURE_URL,
  ]);
  const camera = useThree((state) => state.camera);

  const timeRef = useRef(0);
  const terrainGroupRef = useRef<Group>(null);
  const { position, scale } = hub.HUB_ENVIRONMENT_TRANSFORM;

  const {
    chunks,
    materialState,
    lodGeometries,
    instanceGeometries,
    samplingGeometry,
    terrainTransform,
    lodDistances,
    terrainWorldWidth,
  } = useMemo(() => {
    const terrainMesh = findMeshByName(hubScene, hub.HUB_TERRAIN_MESH_NAME);
    const lodGeometries = extractGrassLodGeometries(grassLodScene);
    const materialState = createGrassMaterial();
    const lod0 = lodGeometries[0];
    lod0.computeBoundingBox();
    const localBladeExtent = lod0.boundingBox?.max.y ?? 1;
    setGrassBladeDimensions(
      materialState,
      veg.GRASS_BLADE_HEIGHT,
      localBladeExtent,
    );
    setGrassMaterialTextures(materialState, grassAlphaTexture, noiseTexture);

    const envScale = applyEnvironmentTransform ? scale : 1;
    const terrainWorldWidth = computeTerrainWorldWidth(terrainMesh, envScale);
    const lodDistances = computeLodDistances(terrainWorldWidth);

    const { chunks, samplingGeometry, instanceGeometries } = buildGrassChunks(
      terrainMesh,
      lodGeometries,
      veg.GRASS_INSTANCE_COUNT,
      veg.GRASS_BLADE_WIDTH,
      veg.GRASS_BLADE_HEIGHT,
      veg.GRASS_CHUNK_GRID,
      materialState.material,
      veg.GRASS_MIN_SAMPLE_WEIGHT,
    );

    return {
      chunks,
      materialState,
      lodGeometries,
      instanceGeometries,
      samplingGeometry,
      lodDistances,
      terrainWorldWidth,
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
  }, [
    hubScene,
    grassLodScene,
    grassAlphaTexture,
    noiseTexture,
    applyEnvironmentTransform,
    scale,
  ]);

  const { anchorX, anchorZ, growRadiusRef, fadeWidth } = useVegetationGrow({
    applyEnvironmentTransform,
    totalEffortScore,
    terrainWorldWidth,
  });

  useEffect(() => {
    return () => {
      for (const geometry of lodGeometries) {
        geometry.dispose();
      }
      for (const geometry of instanceGeometries) {
        geometry.dispose();
      }
      samplingGeometry.dispose();
      materialState.material.dispose();
    };
  }, [lodGeometries, instanceGeometries, samplingGeometry, materialState]);

  useFrame((_state, delta) => {
    timeRef.current += delta;
    updateGrassMaterialTime(materialState, timeRef.current);
    setGrassGrowReveal(
      materialState,
      anchorX,
      anchorZ,
      growRadiusRef.current,
      fadeWidth,
    );

    const terrainGroup = terrainGroupRef.current;
    if (!terrainGroup) return;
    terrainGroup.updateMatrixWorld(true);
    updateChunkLods(
      chunks,
      camera.position,
      terrainGroup.matrixWorld,
      lodDistances,
    );
  });

  return (
    <group
      position={applyEnvironmentTransform ? position : undefined}
      scale={applyEnvironmentTransform ? scale : undefined}
    >
      <group
        ref={terrainGroupRef}
        position={terrainTransform.position}
        rotation={terrainTransform.rotation}
        scale={terrainTransform.scale}
      >
        {chunks.map((chunk, index) => (
          <group key={index}>
            {chunk.lodMeshes.map((mesh, lodIndex) => (
              <primitive key={lodIndex} object={mesh} />
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}
