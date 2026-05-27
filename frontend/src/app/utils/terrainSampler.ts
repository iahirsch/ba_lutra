import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Mesh,
  Raycaster,
  Vector3,
} from 'three';

const WEIGHT_BUFFER = 'terrainSampleWeight';
const _rayOrigin = new Vector3();
const _rayDirection = new Vector3(0, -1, 0);
const _raycaster = new Raycaster();

function getVertexColorLuminance(
  colorAttribute: {
    getX: (index: number) => number;
    getY: (index: number) => number;
    getZ: (index: number) => number;
  },
  index: number,
): number {
  const r = colorAttribute.getX(index);
  const g = colorAttribute.getY(index);
  const b = colorAttribute.getZ(index);
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}

export function getSampleColorWeight(color: Color): number {
  return color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722;
}

function resolveMaskAttribute(geometry: BufferGeometry, attributeName: string) {
  const maskAttribute =
    geometry.getAttribute(attributeName) ??
    geometry.getAttribute(attributeName.toUpperCase());
  if (maskAttribute) {
    return maskAttribute;
  }

  const fallback = geometry.getAttribute('color');
  if (fallback) {
    return fallback;
  }

  throw new Error(
    `Terrain geometry is missing vertex color attribute "${attributeName}".`,
  );
}

export function createTerrainWeightedSampler(
  terrainMesh: Mesh,
  maskAttributeName: string,
): {
  sampler: MeshSurfaceSampler;
  samplingGeometry: BufferGeometry;
} {
  const maskAttribute = resolveMaskAttribute(
    terrainMesh.geometry,
    maskAttributeName,
  );

  const samplingGeometry = terrainMesh.geometry.clone();
  const vertexCount = maskAttribute.count;
  const weights = new Float32Array(vertexCount);
  const combinedColors = new Float32Array(vertexCount * 3);

  for (let i = 0; i < vertexCount; i++) {
    const weight = getVertexColorLuminance(maskAttribute, i);
    weights[i] = weight;
    combinedColors[i * 3] = weight;
    combinedColors[i * 3 + 1] = weight;
    combinedColors[i * 3 + 2] = weight;
  }

  samplingGeometry.setAttribute(WEIGHT_BUFFER, new BufferAttribute(weights, 1));
  samplingGeometry.setAttribute(
    'color',
    new BufferAttribute(combinedColors, 3),
  );

  const sampler = new MeshSurfaceSampler(new Mesh(samplingGeometry))
    .setWeightAttribute(WEIGHT_BUFFER)
    .build();

  return { sampler, samplingGeometry };
}

export function sampleTerrainLocalPoint(
  sampler: MeshSurfaceSampler,
  minWeight: number,
  maxAttempts: number,
  reject?: (localX: number, localZ: number) => boolean,
): Vector3 | null {
  const position = new Vector3();
  const normal = new Vector3();
  const sampleColor = new Color();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    sampler.sample(position, normal, sampleColor);
    if (getSampleColorWeight(sampleColor) < minWeight) {
      continue;
    }
    if (reject?.(position.x, position.z)) {
      continue;
    }
    return position.clone();
  }

  return null;
}

export function terrainLocalToHubWorld(
  localPoint: Vector3,
  terrainMesh: Mesh,
): Vector3 {
  terrainMesh.updateWorldMatrix(true, false);
  return localPoint.clone().applyMatrix4(terrainMesh.matrixWorld);
}

export function getTerrainWorldHeightAt(
  worldX: number,
  worldZ: number,
  terrainMesh: Mesh,
): number | null {
  terrainMesh.updateWorldMatrix(true, false);
  _rayOrigin.set(worldX, 1e4, worldZ);
  _raycaster.set(_rayOrigin, _rayDirection);
  const hits = _raycaster.intersectObject(terrainMesh, false);
  return hits[0]?.point.y ?? null;
}
