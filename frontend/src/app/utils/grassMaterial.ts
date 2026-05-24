import {
  Color,
  DoubleSide,
  MeshLambertMaterial,
  RepeatWrapping,
  type Material,
  type Texture,
} from 'three';

interface GrassUniform {
  value: number | boolean | Color | Texture;
}

export interface GrassMaterialState {
  material: MeshLambertMaterial;
  uniforms: Record<string, GrassUniform>;
}

const grassUniforms: Record<string, GrassUniform> = {
  uTime: { value: 0 },
  uGrassLightIntensity: { value: 1 },
  uNoiseScale: { value: 1.5 },
  uBladeHeight: { value: 1 },
  baseColor: { value: new Color('#313f1b') },
  tipColor1: { value: new Color('#9bd38d') },
  tipColor2: { value: new Color('#1f352a') },
  noiseTexture: { value: null as unknown as Texture },
  grassAlphaTexture: { value: null as unknown as Texture },
};

function attachGrassShaders(material: Material): void {
  material.onBeforeCompile = (shader) => {
    shader.uniforms = {
      ...shader.uniforms,
      uTime: grassUniforms.uTime,
      uTipColor1: grassUniforms.tipColor1,
      uTipColor2: grassUniforms.tipColor2,
      uBaseColor: grassUniforms.baseColor,
      uGrassLightIntensity: grassUniforms.uGrassLightIntensity,
      uNoiseScale: grassUniforms.uNoiseScale,
      uBladeHeight: grassUniforms.uBladeHeight,
      uNoiseTexture: grassUniforms.noiseTexture,
      uGrassAlphaTexture: grassUniforms.grassAlphaTexture,
    };

    shader.vertexShader = `
      #include <common>
      #include <fog_pars_vertex>
      uniform sampler2D uNoiseTexture;
      uniform float uNoiseScale;
      uniform float uTime;
      uniform float uBladeHeight;

      varying vec2 vGlobalUV;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        #include <color_vertex>
        #include <begin_vertex>
        #include <project_vertex>
        #include <fog_vertex>
        #include <beginnormal_vertex>
        #include <defaultnormal_vertex>
        #include <worldpos_vertex>

        vec2 uWindDirection = vec2(1.0, 1.0);
        float uWindAmp = 0.02 * uBladeHeight;
        float uWindFreq = 50.0;
        float uSpeed = 1.0;
        float uNoiseFactor = 5.50;
        float uNoiseSpeed = 0.001;

        vec2 windDirection = normalize(uWindDirection);
        vec4 modelPosition = modelMatrix * instanceMatrix * vec4(position, 1.0);

        float terrainSize = 100.0;
        vGlobalUV = (terrainSize - vec2(modelPosition.xz)) / terrainSize;

        vec4 noise = texture2D(uNoiseTexture, vGlobalUV + uTime * uNoiseSpeed);
        float sinWave =
          sin(uWindFreq * dot(windDirection, vGlobalUV) + noise.g * uNoiseFactor + uTime * uSpeed)
          * uWindAmp
          * (1.0 - uv.y);

        modelPosition.x += sinWave;
        modelPosition.z += sinWave;
        modelPosition.y +=
          exp(texture2D(uNoiseTexture, vGlobalUV * uNoiseScale).r) * 0.1 * uBladeHeight * (1.0 - uv.y);

        vec4 viewPosition = viewMatrix * modelPosition;
        gl_Position = projectionMatrix * viewPosition;

        vUv = vec2(uv.x, 1.0 - uv.y);
        vNormal = normalize(normalMatrix * normal);
        vViewPosition = mvPosition.xyz;
      }
    `;

    shader.fragmentShader = `
      #include <alphatest_pars_fragment>
      #include <alphamap_pars_fragment>
      #include <fog_pars_fragment>
      #include <common>

      uniform vec3 uBaseColor;
      uniform vec3 uTipColor1;
      uniform vec3 uTipColor2;
      uniform sampler2D uGrassAlphaTexture;
      uniform sampler2D uNoiseTexture;
      uniform float uNoiseScale;
      uniform float uGrassLightIntensity;

      varying vec2 vUv;
      varying vec2 vGlobalUV;

      void main() {
        vec4 grassAlpha = texture2D(uGrassAlphaTexture, vUv);
        vec4 grassVariation = texture2D(uNoiseTexture, vGlobalUV * uNoiseScale);
        vec3 tipColor = mix(uTipColor1, uTipColor2, grassVariation.r);

        vec4 diffuseColor = vec4(mix(uBaseColor, tipColor, vUv.y), step(0.1, grassAlpha.r));
        vec3 grassFinalColor = diffuseColor.rgb * uGrassLightIntensity;

        #include <alphatest_fragment>
        gl_FragColor = vec4(grassFinalColor, 1.0);

        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `;
  };
}

export function createGrassMaterial(): GrassMaterialState {
  const material = new MeshLambertMaterial({
    side: DoubleSide,
    color: 0x229944,
    transparent: true,
    alphaTest: 0.1,
  });
  attachGrassShaders(material);
  return { material, uniforms: grassUniforms };
}

export function setGrassMaterialTextures(
  state: GrassMaterialState,
  grassAlphaTexture: Texture,
  noiseTexture: Texture,
): void {
  noiseTexture.wrapS = RepeatWrapping;
  noiseTexture.wrapT = RepeatWrapping;
  state.uniforms.grassAlphaTexture.value = grassAlphaTexture;
  state.uniforms.noiseTexture.value = noiseTexture;
}

export function setGrassBladeDimensions(
  state: GrassMaterialState,
  bladeHeight: number,
): void {
  state.uniforms.uBladeHeight.value = bladeHeight;
}

export function updateGrassMaterialTime(
  state: GrassMaterialState,
  time: number,
): void {
  state.uniforms.uTime.value = time;
}
