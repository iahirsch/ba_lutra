import { PerspectiveCamera } from 'three';

/** Shared hub GLB and camera tuning used by hub, interaction, and builder scenes. */
export const HUB_GLTF_URL = '/assets/environment/hub.glb';

export const GRASS_LODS_URL = '/assets/environment/grassLODs.glb';
export const GRASS_ALPHA_TEXTURE_URL = '/assets/environment/grass.jpeg';
export const GRASS_NOISE_TEXTURE_URL = '/assets/environment/perlinnoise.webp';
export const HUB_TERRAIN_MESH_NAME = 'ground';

export const GRASS_WEIGHT_ATTRIBUTE = 'color_1';
export const GRASS_MIN_SAMPLE_WEIGHT = 0.08;

export const HUB_TERRAIN_COLOR = '#5e875e';
export const GRASS_LOD0_MESH_NAME = 'GrassLOD00';
export const GRASS_LOD1_MESH_NAME = 'GrassLOD01';
export const GRASS_LOD2_MESH_NAME = 'GrassLOD02';
export const GRASS_LOD_MESH_NAMES = [
  GRASS_LOD0_MESH_NAME,
  GRASS_LOD1_MESH_NAME,
  GRASS_LOD2_MESH_NAME,
] as const;

export const GRASS_DEBUG_SLIDER = true;

export const GRASS_INSTANCE_COUNT = 20000;
export const GRASS_BLADE_WIDTH = 6;
export const GRASS_BLADE_HEIGHT = 2.5;

export const GRASS_BASE_COLOR = '#313f1b';
export const GRASS_TIP_COLOR_1 = '#B7E882';
export const GRASS_TIP_COLOR_2 = '#608A53';

export const GRASS_COLOR_VARIATION_NOISE_SCALE = 1.25;
export const GRASS_COLOR_VARIATION_STRENGTH = 2.5;
export const GRASS_COLOR_VARIATION_TERRAIN_SIZE = 125;
export const GRASS_LIGHT_INTENSITY = 1;

export const GRASS_CHUNK_GRID = 8;

export const GRASS_LOD1_DISTANCE_RATIO = 0.14;
export const GRASS_LOD2_DISTANCE_RATIO = 0.28;
export const GRASS_LOD_CULL_DISTANCE_RATIO = 0.55;

/** TODO: Total companion effort at which grass reaches full spread. */
export const GRASS_GROW_EFFORT_REF = 3;
/** TODO: Max grow radius as a fraction of terrain world width at {@link GRASS_GROW_EFFORT_REF}. */
export const GRASS_GROW_RADIUS_RATIO = 0.55;

export function effortTotalToGrowRadius(
  totalEffort: number,
  terrainWorldWidth: number,
): number {
  const t = Math.min(1, Math.max(0, totalEffort / GRASS_GROW_EFFORT_REF));
  return terrainWorldWidth * GRASS_GROW_RADIUS_RATIO * t;
}

export const HUB_ENVIRONMENT_TRANSFORM = {
  position: [0, 0, 0] as [number, number, number],
  scale: 1 as number,
};

/** Empty-object markers inside HUB_GLTF for companion placement. */
export const ENVIRONMENT_SPAWN = {
  anchor: 'EMPTY_AnchorPos',
  editor: 'EMPTY_EditorSpawn',
  hub: 'EMPTY_HubSpawn',
  interact: 'EMPTY_InteractSpawn',
} as const;

export const HUB_CAMERA = {
  position: [0, 2, 8] as [number, number, number],
  fov: 40,
  near: 0.1,
  far: 1500,
} as const;

/** Exhibition layout: left 1920×1080, right 1607×1080. */
const LEFT_SCREEN_WIDTH = 1920;
const RIGHT_SCREEN_WIDTH = 1607;
const SCREEN_HEIGHT = 1080;
const fullWidth = LEFT_SCREEN_WIDTH + RIGHT_SCREEN_WIDTH;
const fullHeight = SCREEN_HEIGHT;

function createDualScreenCamera(
  x: number,
  viewportWidth: number,
): PerspectiveCamera {
  const camera = new PerspectiveCamera(
    HUB_CAMERA.fov,
    viewportWidth / fullHeight,
    HUB_CAMERA.near,
    HUB_CAMERA.far,
  );
  camera.position.set(...HUB_CAMERA.position);
  camera.setViewOffset(fullWidth, fullHeight, x, 0, viewportWidth, fullHeight);
  (camera as PerspectiveCamera & { manual: true }).manual = true;
  return camera;
}

// Left camera
export const INTERACTION_CAMERA = createDualScreenCamera(0, LEFT_SCREEN_WIDTH);
// Right camera
export const HUB_VIEW_CAMERA = createDualScreenCamera(
  LEFT_SCREEN_WIDTH,
  RIGHT_SCREEN_WIDTH,
);
