import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Matrix4,
  Mesh,
  Raycaster,
  Triangle,
  Vector3,
} from 'three';
// Side-effect import: installs BVH-accelerated raycasting + the `firstHitOnly`
// type augmentation on three's prototypes.
import './terrainBvh';

const WEIGHT_BUFFER = 'terrainSampleWeight';
const _rayOrigin = new Vector3();
const _rayDirection = new Vector3(0, -1, 0);
const _raycaster = new Raycaster();
// With a BVH on the terrain geometry this lets the cast bail at the closest
// triangle instead of collecting and sorting every hit along the ray.
_raycaster.firstHitOnly = true;
// Reused result buffer so `intersectObject` doesn't allocate a fresh array on
// every per-frame cast. Cleared before each use.
const _hits: ReturnType<Raycaster['intersectObject']> = [];
const _inverseWorldMatrix = new Matrix4();
const _localHitPoint = new Vector3();
const _triangle = new Triangle();
const _barycoord = new Vector3();

// The terrain never moves, so re-deriving its world matrix on every cast just
// burns time walking the parent chain. Refresh it only when the mesh identity
// changes (e.g. a different terrain instance is passed in).
let _worldMatrixMesh: Mesh | null = null;
function ensureTerrainWorldMatrix(terrainMesh: Mesh): void {
  if (_worldMatrixMesh !== terrainMesh) {
    terrainMesh.updateWorldMatrix(true, false);
    _worldMatrixMesh = terrainMesh;
  }
}

// Shared scratch for sampleTerrainLocalPoint — it runs synchronously and the
// caller copies out the result before the next call, so reusing these is safe.
const _samplePosition = new Vector3();
const _sampleNormal = new Vector3();
const _sampleColor = new Color();

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
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    sampler.sample(_samplePosition, _sampleNormal, _sampleColor);
    if (getSampleColorWeight(_sampleColor) < minWeight) {
      continue;
    }
    if (reject?.(_samplePosition.x, _samplePosition.z)) {
      continue;
    }
    return _samplePosition.clone();
  }

  return null;
}

export function terrainLocalToHubWorld(
  localPoint: Vector3,
  terrainMesh: Mesh,
): Vector3 {
  ensureTerrainWorldMatrix(terrainMesh);
  return localPoint.clone().applyMatrix4(terrainMesh.matrixWorld);
}

export function getTerrainWorldHeightAt(
  worldX: number,
  worldZ: number,
  terrainMesh: Mesh,
): number | null {
  ensureTerrainWorldMatrix(terrainMesh);
  _rayOrigin.set(worldX, 1e4, worldZ);
  _raycaster.set(_rayOrigin, _rayDirection);
  _hits.length = 0;
  _raycaster.intersectObject(terrainMesh, false, _hits);
  return _hits[0]?.point.y ?? null;
}

function getFaceVertexIndices(
  geometry: BufferGeometry,
  faceIndex: number,
): [number, number, number] {
  const index = geometry.index;
  if (index) {
    return [
      index.getX(faceIndex * 3),
      index.getX(faceIndex * 3 + 1),
      index.getX(faceIndex * 3 + 2),
    ];
  }
  const base = faceIndex * 3;
  return [base, base + 1, base + 2];
}

function interpolateTerrainMaskWeightAtHit(
  hit: {
    point: Vector3;
    faceIndex?: number | null;
    barycoord?: Vector3 | null;
  },
  terrainMesh: Mesh,
  maskAttributeName: string,
): number | null {
  if (hit.faceIndex === undefined || hit.faceIndex === null) {
    return null;
  }

  const geometry = terrainMesh.geometry;
  const maskAttribute = resolveMaskAttribute(geometry, maskAttributeName);
  const [ia, ib, ic] = getFaceVertexIndices(geometry, hit.faceIndex);
  const wa = getVertexColorLuminance(maskAttribute, ia);
  const wb = getVertexColorLuminance(maskAttribute, ib);
  const wc = getVertexColorLuminance(maskAttribute, ic);

  if (hit.barycoord) {
    return wa * hit.barycoord.x + wb * hit.barycoord.y + wc * hit.barycoord.z;
  }

  const positionAttribute = geometry.getAttribute('position');
  _triangle.a.fromBufferAttribute(positionAttribute, ia);
  _triangle.b.fromBufferAttribute(positionAttribute, ib);
  _triangle.c.fromBufferAttribute(positionAttribute, ic);
  _inverseWorldMatrix.copy(terrainMesh.matrixWorld).invert();
  _localHitPoint.copy(hit.point).applyMatrix4(_inverseWorldMatrix);
  _triangle.getBarycoord(_localHitPoint, _barycoord);
  return wa * _barycoord.x + wb * _barycoord.y + wc * _barycoord.z;
}

export function getTerrainWalkWeightAt(
  worldX: number,
  worldZ: number,
  terrainMesh: Mesh,
  maskAttributeName: string,
): number | null {
  ensureTerrainWorldMatrix(terrainMesh);
  _rayOrigin.set(worldX, 1e4, worldZ);
  _raycaster.set(_rayOrigin, _rayDirection);
  _hits.length = 0;
  _raycaster.intersectObject(terrainMesh, false, _hits);
  const hit = _hits[0];
  if (!hit) {
    return null;
  }
  return interpolateTerrainMaskWeightAtHit(hit, terrainMesh, maskAttributeName);
}

export function isTerrainWalkableAt(
  worldX: number,
  worldZ: number,
  terrainMesh: Mesh,
  maskAttributeName: string,
  minWeight: number,
): boolean {
  const weight = getTerrainWalkWeightAt(
    worldX,
    worldZ,
    terrainMesh,
    maskAttributeName,
  );
  return weight !== null && weight >= minWeight;
}

// Reused out-object: this runs once per walking companion per frame, so we
// avoid allocating a fresh result each call. The caller reads it synchronously
// before the next invocation.
const _constrainResult = { x: 0, z: 0, blocked: false };

export function constrainTerrainWalkPosition(
  x: number,
  z: number,
  prevX: number,
  prevZ: number,
  terrainMesh: Mesh,
  maskAttributeName: string,
  minWeight: number,
): { x: number; z: number; blocked: boolean } {
  const isWalkable = (nextX: number, nextZ: number) =>
    isTerrainWalkableAt(
      nextX,
      nextZ,
      terrainMesh,
      maskAttributeName,
      minWeight,
    );

  if (isWalkable(x, z)) {
    _constrainResult.x = x;
    _constrainResult.z = z;
    _constrainResult.blocked = false;
  } else if (x !== prevX && isWalkable(x, prevZ)) {
    _constrainResult.x = x;
    _constrainResult.z = prevZ;
    _constrainResult.blocked = false;
  } else if (z !== prevZ && isWalkable(prevX, z)) {
    _constrainResult.x = prevX;
    _constrainResult.z = z;
    _constrainResult.blocked = false;
  } else {
    _constrainResult.x = prevX;
    _constrainResult.z = prevZ;
    _constrainResult.blocked = x !== prevX || z !== prevZ;
  }

  return _constrainResult;
}
