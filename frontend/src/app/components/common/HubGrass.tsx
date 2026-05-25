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
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshLambertMaterial,
  Object3D,
  Quaternion,
  TextureLoader,
  Vector3,
} from 'three';
import {
  GRASS_ALPHA_TEXTURE_URL,
  GRASS_BLADE_HEIGHT,
  GRASS_BLADE_WIDTH,
  GRASS_CHUNK_GRID,
  GRASS_INSTANCE_COUNT,
  GRASS_LOD1_DISTANCE_RATIO,
  GRASS_LOD2_DISTANCE_RATIO,
  GRASS_LOD_CULL_DISTANCE_RATIO,
  GRASS_LOD_MESH_NAMES,
  GRASS_LODS_URL,
  GRASS_MIN_SAMPLE_WEIGHT,
  GRASS_NOISE_TEXTURE_URL,
  GRASS_WEIGHT_ATTRIBUTE,
  ENVIRONMENT_SPAWN,
  effortTotalToGrowRadius,
  HUB_ENVIRONMENT_TRANSFORM,
  HUB_GLTF_URL,
  HUB_TERRAIN_MESH_NAME,
} from '@ba-praktisch/shared-types';
import {
  createGrassMaterial,
  setGrassBladeDimensions,
  setGrassGrowRadius,
  setGrassMaterialTextures,
  updateGrassMaterialTime,
} from '../../utils/grassMaterial';
import { resolveEnvironmentSpawn } from '../../utils/environmentSpawn';
import { useTotalEffortScore } from '../../hooks/useTotalEffortScore';

useGLTF.preload(HUB_GLTF_URL);
useGLTF.preload(GRASS_LODS_URL);

interface HubGrassProps {
  applyHubTransform?: boolean;
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
    for (const lodName of GRASS_LOD_MESH_NAMES) {
      if (child.name.includes(lodName)) {
        byName.set(lodName, prepareBladeGeometry(child.geometry));
      }
    }
  });

  return GRASS_LOD_MESH_NAMES.map((lodName) => {
    const geometry = byName.get(lodName);
    if (!geometry) {
      throw new Error(`Expected "${lodName}" mesh in grass LOD GLB`);
    }
    return geometry;
  });
}

function computeTerrainWorldWidth(
  terrainMesh: Mesh,
  hubEnvScale: number,
): number {
  terrainMesh.geometry.computeBoundingBox();
  if (!terrainMesh.geometry.boundingBox) {
    throw new Error('Expected ground mesh geometry bounds');
  }
  const size = new Vector3();
  terrainMesh.geometry.boundingBox.getSize(size);
  const worldX = size.x * terrainMesh.scale.x * hubEnvScale;
  const worldZ = size.z * terrainMesh.scale.z * hubEnvScale;
  return Math.max(worldX, worldZ);
}

function computeLodDistances(terrainWorldWidth: number): LodDistances {
  return {
    lod1: terrainWorldWidth * GRASS_LOD1_DISTANCE_RATIO,
    lod2: terrainWorldWidth * GRASS_LOD2_DISTANCE_RATIO,
    cull: terrainWorldWidth * GRASS_LOD_CULL_DISTANCE_RATIO,
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

function resolveGrassMaskAttribute(geometry: BufferGeometry) {
  const maskAttribute = geometry.getAttribute(GRASS_WEIGHT_ATTRIBUTE);
  if (maskAttribute) {
    return maskAttribute;
  }

  const fallback = geometry.getAttribute('color');
  if (fallback) {
    return fallback;
  }

  throw new Error(
    `Ground mesh "${HUB_TERRAIN_MESH_NAME}" is missing vertex colors (${GRASS_WEIGHT_ATTRIBUTE} or color). Paint the grass mask in hub.glb.`,
  );
}

/** Builds a luminance weight buffer; MeshSurfaceSampler only reads .getX(). */
function createGrassSampler(terrainMesh: Mesh): {
  sampler: MeshSurfaceSampler;
  samplingGeometry: BufferGeometry;
} {
  const maskAttribute = resolveGrassMaskAttribute(terrainMesh.geometry);

  const samplingGeometry = terrainMesh.geometry.clone();
  const weights = new Float32Array(maskAttribute.count);
  for (let i = 0; i < maskAttribute.count; i++) {
    weights[i] = getVertexColorLuminance(maskAttribute, i);
  }
  samplingGeometry.setAttribute(
    GRASS_WEIGHT_BUFFER,
    new BufferAttribute(weights, 1),
  );
  // MeshSurfaceSampler interpolates `color` for sampleColor, not color_1.
  samplingGeometry.setAttribute('color', maskAttribute.clone());

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
): { chunks: GrassChunk[]; samplingGeometry: BufferGeometry } {
  const { sampler, samplingGeometry } = createGrassSampler(terrainMesh);
  terrainMesh.geometry.computeBoundingBox();
  if (!terrainMesh.geometry.boundingBox) {
    throw new Error('Expected ground mesh geometry bounds');
  }
  const bounds = new Box3().copy(terrainMesh.geometry.boundingBox);

  const chunkMatrices = new Map<string, Matrix4[]>();
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
    if (getSampleColorWeight(sampleColor) < minSampleWeight) {
      continue;
    }

    const key = getChunkKey(position, bounds, grid);

    quaternion.setFromUnitVectors(yAxis, normal);
    const randomQuaternion = new Quaternion().setFromEuler(
      new Euler(0, Math.random() * Math.PI * 2, 0),
    );
    quaternion.multiply(randomQuaternion);
    matrix.compose(position, quaternion, instanceScale);

    if (!chunkMatrices.has(key)) {
      chunkMatrices.set(key, []);
      chunkCenterSums.set(key, new Vector3());
      chunkCounts.set(key, 0);
    }
    const matrices = chunkMatrices.get(key);
    if (matrices) {
      matrices.push(matrix.clone());
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

  for (const [key, matrices] of chunkMatrices) {
    const centerSum = chunkCenterSums.get(key);
    const sampleCount = chunkCounts.get(key);
    if (!centerSum || !sampleCount) continue;

    const localCenter = centerSum.divideScalar(sampleCount);

    const lodMeshes = lodGeometries.map((geometry) => {
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

  return { chunks, samplingGeometry };
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
export function HubGrass({
  applyHubTransform = true,
  totalEffortScore: totalEffortProp,
}: HubGrassProps) {
  const liveEffort = useTotalEffortScore();
  const totalEffortScore = totalEffortProp ?? liveEffort;
  const { scene: hubScene } = useGLTF(HUB_GLTF_URL);
  const { scene: grassLodScene } = useGLTF(GRASS_LODS_URL);
  const [grassAlphaTexture, noiseTexture] = useLoader(TextureLoader, [
    GRASS_ALPHA_TEXTURE_URL,
    GRASS_NOISE_TEXTURE_URL,
  ]);
  const camera = useThree((state) => state.camera);

  const timeRef = useRef(0);
  const growRadiusRef = useRef(0);
  const terrainGroupRef = useRef<Group>(null);
  const { position, scale } = HUB_ENVIRONMENT_TRANSFORM;

  const {
    chunks,
    materialState,
    lodGeometries,
    samplingGeometry,
    terrainTransform,
    lodDistances,
    growAnchor,
    terrainWorldWidth,
  } = useMemo(() => {
    const terrainMesh = findMeshByName(hubScene, HUB_TERRAIN_MESH_NAME);
    const lodGeometries = extractGrassLodGeometries(grassLodScene);
    const materialState = createGrassMaterial();
    setGrassBladeDimensions(materialState, GRASS_BLADE_HEIGHT);
    setGrassMaterialTextures(materialState, grassAlphaTexture, noiseTexture);

    const hubEnvScale = applyHubTransform ? scale : 1;
    const terrainWorldWidth = computeTerrainWorldWidth(
      terrainMesh,
      hubEnvScale,
    );
    const lodDistances = computeLodDistances(terrainWorldWidth);
    const [anchorX, , anchorZ] = resolveEnvironmentSpawn(
      hubScene,
      ENVIRONMENT_SPAWN.anchor,
      applyHubTransform,
    );

    const { chunks, samplingGeometry } = buildGrassChunks(
      terrainMesh,
      lodGeometries,
      GRASS_INSTANCE_COUNT,
      GRASS_BLADE_WIDTH,
      GRASS_BLADE_HEIGHT,
      GRASS_CHUNK_GRID,
      materialState.material,
      GRASS_MIN_SAMPLE_WEIGHT,
    );

    return {
      chunks,
      materialState,
      lodGeometries,
      samplingGeometry,
      lodDistances,
      growAnchor: [anchorX, anchorZ] as [number, number],
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
    applyHubTransform,
    scale,
  ]);

  useEffect(() => {
    return () => {
      for (const geometry of lodGeometries) {
        geometry.dispose();
      }
      samplingGeometry.dispose();
      materialState.material.dispose();
    };
  }, [lodGeometries, samplingGeometry, materialState]);

  useEffect(() => {
    growRadiusRef.current = effortTotalToGrowRadius(
      totalEffortScore,
      terrainWorldWidth,
    );
  }, [totalEffortScore, terrainWorldWidth]);

  useFrame((_state, delta) => {
    timeRef.current += delta;
    updateGrassMaterialTime(materialState, timeRef.current);

    const targetGrowRadius = effortTotalToGrowRadius(
      totalEffortScore,
      terrainWorldWidth,
    );
    growRadiusRef.current +=
      (targetGrowRadius - growRadiusRef.current) * Math.min(1, delta * 2.5);
    setGrassGrowRadius(
      materialState,
      growAnchor[0],
      growAnchor[1],
      growRadiusRef.current,
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
      position={applyHubTransform ? position : undefined}
      scale={applyHubTransform ? scale : undefined}
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
