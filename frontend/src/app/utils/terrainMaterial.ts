import * as veg from '../constants/environment-vegetation';
import { HUB_TERRAIN_MESH_NAME } from '../constants/hub-scene';
import { Color, Mesh, MeshToonMaterial, Vector2, type Object3D } from 'three';

interface TerrainUniform {
  value: number | Color | Vector2;
}

const terrainUniforms: Record<string, TerrainUniform> = {
  uDesertColor: { value: new Color(veg.GROUND_DESERT_COLOR) },
  uGrassColor: { value: new Color(veg.GROUND_GRASS_COLOR) },
  uGrowAnchor: { value: new Vector2() },
  uGrowRadius: { value: 0 },
  uGrowFade: { value: 0 },
};

function attachTerrainGrowShaderToMaterial(material: MeshToonMaterial): void {
  material.onBeforeCompile = (shader) => {
    shader.uniforms = {
      ...shader.uniforms,
      uDesertColor: terrainUniforms.uDesertColor,
      uGrassColor: terrainUniforms.uGrassColor,
      uGrowAnchor: terrainUniforms.uGrowAnchor,
      uGrowRadius: terrainUniforms.uGrowRadius,
      uGrowFade: terrainUniforms.uGrowFade,
    };

    shader.vertexShader =
      `
      varying vec3 vTerrainWorldPosition;
    ` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
        #include <begin_vertex>
        vTerrainWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
      `,
    );

    shader.fragmentShader =
      `
      varying vec3 vTerrainWorldPosition;
      uniform vec2 uGrowAnchor;
      uniform float uGrowRadius;
      uniform float uGrowFade;
      uniform vec3 uDesertColor;
      uniform vec3 uGrassColor;
    ` + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `
        #include <color_fragment>
        float growDist = length(vTerrainWorldPosition.xz - uGrowAnchor);
        float reveal = 1.0 - smoothstep(uGrowRadius - uGrowFade, uGrowRadius, growDist);
        diffuseColor.rgb = mix(uDesertColor, uGrassColor, reveal);
      `,
    );
  };
  material.customProgramCacheKey = () => 'terrain-grow';
  material.needsUpdate = true;
}

/** Radial desert-to-grass ground tint on the hub terrain mesh (after cel shading). */
export function attachTerrainGrowShader(root: Object3D): void {
  const ground = root.getObjectByName(HUB_TERRAIN_MESH_NAME);
  if (!(ground instanceof Mesh)) return;

  const material = ground.material;
  if (!(material instanceof MeshToonMaterial)) return;

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
