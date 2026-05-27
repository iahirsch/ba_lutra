import * as veg from '../constants/environment-vegetation';
import { HUB_TERRAIN_MESH_NAME } from '../constants/hub-scene';
import {
  Mesh,
  MeshToonMaterial,
  RepeatWrapping,
  Vector2,
  type Object3D,
  type Texture,
} from 'three';

export interface GroundTextures {
  sandColor: Texture;
  sandNormal: Texture;
  sandHeight: Texture;
  grassColor: Texture;
  grassNormal: Texture;
}

interface TerrainUniform {
  value: number | Vector2 | Texture;
}

const terrainUniforms: Record<string, TerrainUniform> = {
  uSandColorMap: { value: null as unknown as Texture },
  uSandNormalMap: { value: null as unknown as Texture },
  uSandHeightMap: { value: null as unknown as Texture },
  uGrassColorMap: { value: null as unknown as Texture },
  uGrassNormalMap: { value: null as unknown as Texture },
  uGrowAnchor: { value: new Vector2() },
  uGrowRadius: { value: 0 },
  uGrowFade: { value: 0 },
};

function configureGroundTexture(texture: Texture): void {
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(veg.GROUND_TEXTURE_REPEAT, veg.GROUND_TEXTURE_REPEAT);
  texture.needsUpdate = true;
}

function attachTerrainGrowShaderToMaterial(material: MeshToonMaterial): void {
  material.onBeforeCompile = (shader) => {
    shader.uniforms = {
      ...shader.uniforms,
      uSandColorMap: terrainUniforms.uSandColorMap,
      uSandNormalMap: terrainUniforms.uSandNormalMap,
      uSandHeightMap: terrainUniforms.uSandHeightMap,
      uGrassColorMap: terrainUniforms.uGrassColorMap,
      uGrassNormalMap: terrainUniforms.uGrassNormalMap,
      uGrowAnchor: terrainUniforms.uGrowAnchor,
      uGrowRadius: terrainUniforms.uGrowRadius,
      uGrowFade: terrainUniforms.uGrowFade,
    };

    shader.vertexShader =
      `
      varying vec3 vTerrainWorldPosition;
      uniform vec2 uGrowAnchor;
      uniform float uGrowRadius;
      uniform float uGrowFade;
      uniform sampler2D uSandHeightMap;
    ` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
        #include <begin_vertex>
        vTerrainWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
      `,
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <displacementmap_vertex>',
      `
        float growDistD = length(vTerrainWorldPosition.xz - uGrowAnchor);
        float revealD = 1.0 - smoothstep(uGrowRadius - uGrowFade, uGrowRadius, growDistD);
        float sandHeight = texture2D(uSandHeightMap, vDisplacementMapUv).r;
        transformed += normalize(objectNormal) * sandHeight * displacementScale * (1.0 - revealD);
      `,
    );

    shader.fragmentShader =
      `
      varying vec3 vTerrainWorldPosition;
      uniform vec2 uGrowAnchor;
      uniform float uGrowRadius;
      uniform float uGrowFade;
      uniform sampler2D uSandColorMap;
      uniform sampler2D uSandNormalMap;
      uniform sampler2D uGrassColorMap;
      uniform sampler2D uGrassNormalMap;
    ` + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `
        #include <color_fragment>
        float growDist = length(vTerrainWorldPosition.xz - uGrowAnchor);
        float reveal = 1.0 - smoothstep(uGrowRadius - uGrowFade, uGrowRadius, growDist);
        vec3 sandCol = texture2D(uSandColorMap, vMapUv).rgb;
        vec3 grassCol = texture2D(uGrassColorMap, vMapUv).rgb;
        diffuseColor.rgb = mix(sandCol, grassCol, reveal);
      `,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normalmap_fragment>',
      `
        float growDistN = length(vTerrainWorldPosition.xz - uGrowAnchor);
        float revealN = 1.0 - smoothstep(uGrowRadius - uGrowFade, uGrowRadius, growDistN);
        vec3 sandMapN = texture2D(uSandNormalMap, vNormalMapUv).xyz * 2.0 - 1.0;
        vec3 grassMapN = texture2D(uGrassNormalMap, vNormalMapUv).xyz * 2.0 - 1.0;
        vec3 mapN = mix(sandMapN, grassMapN, revealN);
        normal = perturbNormal2Arb(-vViewPosition, normal, mapN, uNormalScale);
      `,
    );
  };
  material.customProgramCacheKey = () => 'terrain-grow-textured';
  material.needsUpdate = true;
}

function setTerrainTextureUniforms(textures: GroundTextures): void {
  terrainUniforms.uSandColorMap.value = textures.sandColor;
  terrainUniforms.uSandNormalMap.value = textures.sandNormal;
  terrainUniforms.uSandHeightMap.value = textures.sandHeight;
  terrainUniforms.uGrassColorMap.value = textures.grassColor;
  terrainUniforms.uGrassNormalMap.value = textures.grassNormal;
}

/** Sand/grass ground textures with radial grow blend (after cel shading). */
export function attachTerrainGrowShader(
  root: Object3D,
  textures: GroundTextures,
): void {
  const ground = root.getObjectByName(HUB_TERRAIN_MESH_NAME);
  if (!(ground instanceof Mesh)) return;

  const material = ground.material;
  if (!(material instanceof MeshToonMaterial)) return;

  for (const texture of Object.values(textures)) {
    configureGroundTexture(texture);
  }

  material.map = textures.sandColor;
  material.normalMap = textures.sandNormal;
  material.displacementMap = textures.sandHeight;
  material.displacementScale = veg.GROUND_DISPLACEMENT_SCALE;
  material.normalScale.set(veg.GROUND_NORMAL_SCALE, veg.GROUND_NORMAL_SCALE);
  material.color.set(0xffffff);

  setTerrainTextureUniforms(textures);
  attachTerrainGrowShaderToMaterial(material);
}

export function setTerrainGrowReveal(
  anchorX: number,
  anchorZ: number,
  radius: number,
  fadeWidth: number,
): void {
  const anchor = terrainUniforms.uGrowAnchor.value;
  if (anchor instanceof Vector2) {
    anchor.set(anchorX, anchorZ);
  }
  terrainUniforms.uGrowRadius.value = radius;
  terrainUniforms.uGrowFade.value = fadeWidth;
}
