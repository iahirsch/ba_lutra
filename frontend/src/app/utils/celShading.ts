import {
  ClampToEdgeWrapping,
  Color,
  DataTexture,
  Mesh,
  MeshLambertMaterial,
  MeshPhongMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  MeshToonMaterial,
  NearestFilter,
  RGBAFormat,
  UnsignedByteType,
  Vector2,
  type Material,
  type Object3D,
} from 'three';
import { HUB_TERRAIN_MESH_NAME } from '../constants/hub-scene';

let sharedGradient: DataTexture | null = null;

/** Narrow horizontal ramp so lighting snaps into a few flat tones. */
function getCelGradientMap(): DataTexture {
  if (sharedGradient) return sharedGradient;

  const bands: [number, number, number, number][] = [
    [48, 48, 58, 255],
    [105, 105, 120, 255],
    [175, 175, 190, 255],
    [255, 255, 255, 255],
  ];
  const data = new Uint8Array(bands.length * 4);
  let i = 0;
  for (const band of bands) {
    data.set(band, i);
    i += 4;
  }

  const tex = new DataTexture(
    data,
    bands.length,
    1,
    RGBAFormat,
    UnsignedByteType,
  );
  tex.magFilter = NearestFilter;
  tex.minFilter = NearestFilter;
  tex.wrapS = ClampToEdgeWrapping;
  tex.wrapT = ClampToEdgeWrapping;
  tex.needsUpdate = true;
  sharedGradient = tex;
  return tex;
}

function toToonMaterial(
  source:
    | MeshStandardMaterial
    | MeshPhysicalMaterial
    | MeshLambertMaterial
    | MeshPhongMaterial,
): MeshToonMaterial {
  const gradientMap = getCelGradientMap();
  const emissiveIntensity =
    'emissiveIntensity' in source &&
    typeof source.emissiveIntensity === 'number'
      ? source.emissiveIntensity
      : 1;

  const toon = new MeshToonMaterial({
    color: source.color.clone(),
    map: source.map,
    gradientMap,
    normalMap: source.normalMap,
    normalScale: source.normalScale?.clone() ?? new Vector2(1, 1),
    emissive: source.emissive.clone(),
    emissiveMap: source.emissiveMap,
    emissiveIntensity,
    transparent: source.transparent,
    opacity: source.opacity,
    side: source.side,
    alphaTest: source.alphaTest,
    depthWrite: source.depthWrite,
    depthTest: source.depthTest,
    vertexColors: source.vertexColors,
  });
  toon.name = source.name;
  return toon;
}

function upgradeMaterial(material: Material): Material {
  if (material instanceof MeshToonMaterial) {
    material.gradientMap = getCelGradientMap();
    material.needsUpdate = true;
    return material;
  }
  if (
    material instanceof MeshStandardMaterial ||
    material instanceof MeshPhysicalMaterial ||
    material instanceof MeshLambertMaterial ||
    material instanceof MeshPhongMaterial
  ) {
    return toToonMaterial(material);
  }
  return material;
}

export function applyHubTerrainMaterial(root: Object3D): void {
  const ground = root.getObjectByName(HUB_TERRAIN_MESH_NAME);
  if (!(ground instanceof Mesh)) return;
  ground.material = new MeshStandardMaterial({ color: 0xffffff });
}

/** Replaces lit materials with stepped toon shading */
export function applyCelShading(root: Object3D): void {
  root.traverse((node) => {
    if (!(node instanceof Mesh) || !node.material) return;
    const { material } = node;
    if (Array.isArray(material)) {
      node.material = material.map((m) => upgradeMaterial(m));
    } else {
      node.material = upgradeMaterial(material);
    }
  });
}

export const BACKPACK_CONDUIT_MESH_NAME = 'conduit';
export const ANCHOR_CONDUIT_MESH_NAME = 'Anchor_Conduit';

const CONDUIT_GLOW_COLOR = new Color(0x7cfdfd);

/** Maps normalized effortScore to emissive intensity on the conduit orb. */
export function effortToConduitGlow(effort: number): number {
  const e = Math.min(1, Math.max(0, effort));
  if (e <= 0) return 0;
  return 0.1 + e * 1;
}

/** Sets emissive glow on the conduit mesh after cel shading. */
export function setConduitGlow(
  root: Object3D,
  intensity: number,
  meshName: string = BACKPACK_CONDUIT_MESH_NAME,
): void {
  root.traverse((node) => {
    if (!(node instanceof Mesh) || node.name !== meshName) {
      return;
    }
    const materials = Array.isArray(node.material)
      ? node.material
      : [node.material];
    for (const mat of materials) {
      if (!(mat instanceof MeshToonMaterial)) continue;
      mat.emissive.copy(CONDUIT_GLOW_COLOR);
      mat.emissiveIntensity = intensity;
      mat.needsUpdate = true;
    }
  });
}
