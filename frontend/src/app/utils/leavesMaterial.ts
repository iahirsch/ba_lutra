import { useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as veg from '../constants/environment-vegetation';
import {
  Color,
  DoubleSide,
  Mesh,
  MeshLambertMaterial,
  RepeatWrapping,
  Vector2,
  type Material,
  type Object3D,
  type Texture,
} from 'three';
import { cloneMaterialsOnObject } from './cloneMaterials';
import { materialNameMatches } from './materialUtils';

interface TreeLeavesUniform {
  value: number | Color | Texture | Vector2;
}

export interface TreeLeavesMaterialState {
  material: MeshLambertMaterial;
  uniforms: Record<string, TreeLeavesUniform>;
}

function createLeavesUniformSet(
  config: veg.LeavesMaterialConfig,
): Record<string, TreeLeavesUniform> {
  return {
    uTime: { value: 0 },
    uGrassLightIntensity: { value: config.lightIntensity },
    uNoiseScale: { value: config.colorVariationNoiseScale },
    uColorVariationStrength: { value: config.colorVariationStrength },
    uTerrainSize: { value: config.terrainSize },
    uWindScale: { value: config.windScale },
    baseColor: { value: new Color(config.baseColor) },
    tipColor1: { value: new Color(config.tipColor1) },
    tipColor2: { value: new Color(config.tipColor2) },
    noiseTexture: { value: null as unknown as Texture },
    leavesAlphaTexture: { value: null as unknown as Texture },
  };
}

let sharedTreeState: TreeLeavesMaterialState | null = null;
let sharedBushState: TreeLeavesMaterialState | null = null;
let sharedFlowerState: TreeLeavesMaterialState | null = null;

// Shared wind-animation vertex shader used by all foliage materials.
const LEAVES_WIND_VERTEX_SHADER = `
  #include <common>
  #include <fog_pars_vertex>
  uniform sampler2D uNoiseTexture;
  uniform float uNoiseScale;
  uniform float uTerrainSize;
  uniform float uTime;
  uniform float uWindScale;

  varying vec2 vGlobalUV;
  varying vec2 vUv;

  void main() {
    #include <color_vertex>
    #include <begin_vertex>
    #include <project_vertex>
    #include <fog_vertex>
    #include <worldpos_vertex>

    vec2 uWindDirection = vec2(1.0, 1.0);
    float uWindAmp = 0.02 * uWindScale;
    float uWindFreq = 50.0;
    float uSpeed = 1.0;
    float uNoiseFactor = 5.50;
    float uNoiseSpeed = 0.001;

    vec2 windDirection = normalize(uWindDirection);
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    vGlobalUV = (uTerrainSize - vec2(modelPosition.xz)) / uTerrainSize;

    vec4 noise = texture2D(uNoiseTexture, vGlobalUV + uTime * uNoiseSpeed);
    float tipFactor = 1.0 - uv.y;
    float sinWave =
      sin(uWindFreq * dot(windDirection, vGlobalUV) + noise.g * uNoiseFactor + uTime * uSpeed)
      * uWindAmp
      * tipFactor;

    modelPosition.x += sinWave;
    modelPosition.z += sinWave;
    modelPosition.y +=
      exp(texture2D(uNoiseTexture, vGlobalUV * uNoiseScale).r) * 0.1 * uWindScale * tipFactor;

    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;

    vUv = vec2(uv.x, 1.0 - uv.y);
  }
`;

function attachTreeLeavesShaders(
  material: Material,
  uniforms: Record<string, TreeLeavesUniform>,
): void {
  material.onBeforeCompile = (shader) => {
    shader.uniforms = {
      ...shader.uniforms,
      uTime: uniforms.uTime,
      uTipColor1: uniforms.tipColor1,
      uTipColor2: uniforms.tipColor2,
      uBaseColor: uniforms.baseColor,
      uGrassLightIntensity: uniforms.uGrassLightIntensity,
      uNoiseScale: uniforms.uNoiseScale,
      uColorVariationStrength: uniforms.uColorVariationStrength,
      uTerrainSize: uniforms.uTerrainSize,
      uWindScale: uniforms.uWindScale,
      uNoiseTexture: uniforms.noiseTexture,
      uLeavesAlphaTexture: uniforms.leavesAlphaTexture,
    };

    shader.vertexShader = LEAVES_WIND_VERTEX_SHADER;

    shader.fragmentShader = `
      #include <alphatest_pars_fragment>
      #include <alphamap_pars_fragment>
      #include <fog_pars_fragment>
      #include <common>

      uniform vec3 uBaseColor;
      uniform vec3 uTipColor1;
      uniform vec3 uTipColor2;
      uniform sampler2D uLeavesAlphaTexture;
      uniform sampler2D uNoiseTexture;
      uniform float uNoiseScale;
      uniform float uColorVariationStrength;
      uniform float uGrassLightIntensity;

      varying vec2 vUv;
      varying vec2 vGlobalUV;

      void main() {
        vec4 leavesAlpha = texture2D(uLeavesAlphaTexture, vUv);
        vec4 leavesVariation = texture2D(uNoiseTexture, vGlobalUV * uNoiseScale);
        float variationMix = clamp(
          0.5 + (leavesVariation.r - 0.5) * uColorVariationStrength,
          0.0,
          1.0
        );
        vec3 tipColor = mix(uTipColor1, uTipColor2, variationMix);

        vec4 diffuseColor = vec4(mix(uBaseColor, tipColor, vUv.y), step(0.1, leavesAlpha.r));
        vec3 leavesFinalColor = diffuseColor.rgb * uGrassLightIntensity;

        #include <alphatest_fragment>
        gl_FragColor = vec4(leavesFinalColor, 1.0);

        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `;
  };
}

export function createTreeLeavesMaterial(
  config: veg.LeavesMaterialConfig = veg.TREE_LEAVES_MATERIAL_CONFIG,
): TreeLeavesMaterialState {
  const uniforms = createLeavesUniformSet(config);
  const material = new MeshLambertMaterial({
    side: DoubleSide,
    color: new Color(config.baseColor),
    transparent: true,
    alphaTest: 0.5,
  });
  attachTreeLeavesShaders(material, uniforms);
  return { material, uniforms };
}

function createFlowerUniformSet(): Record<string, TreeLeavesUniform> {
  return {
    uTime: { value: 0 },
    uGrassLightIntensity: { value: 1.0 },
    uNoiseScale: { value: 1.0 },
    uTerrainSize: { value: 50 },
    uWindScale: { value: 2 },
    noiseTexture: { value: null as unknown as Texture },
    leavesAlphaTexture: { value: null as unknown as Texture },
  };
}

function attachFlowerShaders(
  material: Material,
  uniforms: Record<string, TreeLeavesUniform>,
): void {
  material.onBeforeCompile = (shader) => {
    shader.uniforms = {
      ...shader.uniforms,
      uTime: uniforms.uTime,
      uTerrainSize: uniforms.uTerrainSize,
      uWindScale: uniforms.uWindScale,
      uNoiseScale: uniforms.uNoiseScale,
      uGrassLightIntensity: uniforms.uGrassLightIntensity,
      uNoiseTexture: uniforms.noiseTexture,
      uLeavesAlphaTexture: uniforms.leavesAlphaTexture,
    };

    shader.vertexShader = LEAVES_WIND_VERTEX_SHADER;

    // Samples flowers.png as full RGBA: RGB = color, A = cutout alpha.
    shader.fragmentShader = `
      #include <fog_pars_fragment>
      #include <common>

      uniform sampler2D uLeavesAlphaTexture;
      uniform float uGrassLightIntensity;

      varying vec2 vUv;
      varying vec2 vGlobalUV;

      void main() {
        vec4 flowerTex = texture2D(uLeavesAlphaTexture, vUv);
        if (flowerTex.a < 0.1) discard;
        gl_FragColor = vec4(flowerTex.rgb * uGrassLightIntensity, 1.0);

        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `;
  };
}

export function createFlowerLeavesMaterial(): TreeLeavesMaterialState {
  const uniforms = createFlowerUniformSet();
  const material = new MeshLambertMaterial({
    side: DoubleSide,
    transparent: true,
    alphaTest: 0.1,
  });
  attachFlowerShaders(material, uniforms);
  return { material, uniforms };
}

export function getOrCreateFlowerLeavesMaterial(): TreeLeavesMaterialState {
  if (!sharedFlowerState) {
    sharedFlowerState = createFlowerLeavesMaterial();
  }
  return sharedFlowerState;
}

export function getOrCreateTreeLeavesMaterial(): TreeLeavesMaterialState {
  if (!sharedTreeState) {
    sharedTreeState = createTreeLeavesMaterial(veg.TREE_LEAVES_MATERIAL_CONFIG);
  }
  return sharedTreeState;
}

export function getOrCreateBushLeavesMaterial(): TreeLeavesMaterialState {
  if (!sharedBushState) {
    sharedBushState = createTreeLeavesMaterial(veg.BUSH_LEAVES_MATERIAL_CONFIG);
  }
  return sharedBushState;
}

export function setTreeLeavesMaterialTextures(
  state: TreeLeavesMaterialState,
  leavesAlphaTexture: Texture,
  noiseTexture: Texture,
): void {
  noiseTexture.wrapS = RepeatWrapping;
  noiseTexture.wrapT = RepeatWrapping;
  state.uniforms.leavesAlphaTexture.value = leavesAlphaTexture;
  state.uniforms.noiseTexture.value = noiseTexture;
}

export function updateTreeLeavesMaterialTime(
  state: TreeLeavesMaterialState,
  time: number,
): void {
  state.uniforms.uTime.value = time;
}

const HIDDEN_PROP_NODE_NAMES = new Set(['ground', 'grass.001']);

export function hideVegetationPropHelperMeshes(root: Object3D): void {
  root.traverse((node) => {
    if (HIDDEN_PROP_NODE_NAMES.has(node.name.toLowerCase())) {
      node.visible = false;
    }
    if (!(node instanceof Mesh) || !node.material) return;
    const materials = Array.isArray(node.material)
      ? node.material
      : [node.material];
    if (materials.some((mat) => materialNameMatches(mat, 'ground'))) {
      node.visible = false;
    }
  });
}

/** Replaces leaf materials with the shared grass-style foliage shader. */
export function applyTreeLeavesMaterialToObject(
  root: Object3D,
  leavesMaterial: MeshLambertMaterial,
): void {
  root.traverse((node) => {
    if (!(node instanceof Mesh) || !node.material) return;
    const materials = Array.isArray(node.material)
      ? node.material
      : [node.material];
    if (!materials.some((mat) => materialNameMatches(mat, 'leaves'))) {
      return;
    }
    if (Array.isArray(node.material)) {
      node.material = node.material.map((mat) =>
        materialNameMatches(mat, 'leaves') ? leavesMaterial : mat,
      );
      return;
    }
    node.material = leavesMaterial;
  });
}

/** Applies the leaves material to every mesh in the object — use for models that are entirely foliage. */
export function applyLeavesMaterialToAllMeshes(
  root: Object3D,
  leavesMaterial: MeshLambertMaterial,
): void {
  root.traverse((node) => {
    if (!(node instanceof Mesh) || !node.material) return;
    node.material = leavesMaterial;
  });
}

export function prepareVegetationPropModel(
  root: Object3D,
  leavesState: TreeLeavesMaterialState,
): void {
  cloneMaterialsOnObject(root);
  hideVegetationPropHelperMeshes(root);
  applyTreeLeavesMaterialToObject(root, leavesState.material);
}

export function prepareFlowerPropModel(
  root: Object3D,
  leavesState: TreeLeavesMaterialState,
): void {
  cloneMaterialsOnObject(root);
  hideVegetationPropHelperMeshes(root);
  applyLeavesMaterialToAllMeshes(root, leavesState.material);
}

export function useLeavesMaterial(
  materialState: TreeLeavesMaterialState,
  alphaTexture: Texture,
  noiseTexture: Texture,
): void {
  useEffect(() => {
    setTreeLeavesMaterialTextures(materialState, alphaTexture, noiseTexture);
  }, [materialState, alphaTexture, noiseTexture]);

  useFrame((state) => {
    updateTreeLeavesMaterialTime(materialState, state.clock.elapsedTime);
  });
}
