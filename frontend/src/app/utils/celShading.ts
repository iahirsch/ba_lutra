import {
  ClampToEdgeWrapping,
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
