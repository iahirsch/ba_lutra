export interface EnvironmentVegetationEntry {
  id: string;
  glbUrl: string;
  spawn: string;
  scale?: number;
}

export const TREES_URL = '/assets/environment/trees/';
export const BUSHES_URL = '/assets/environment/bushes/';

export const ENVIRONMENT_VEGETATION: EnvironmentVegetationEntry[] = [
  {
    id: 'tree-1',
    glbUrl: TREES_URL + 'tree01.glb',
    spawn: 'EMPTY_Tree01',
    scale: 1,
  },
  {
    id: 'tree-2',
    glbUrl: TREES_URL + 'tree02.glb',
    spawn: 'EMPTY_Tree02',
    scale: 1,
  },
];

export const GRASS_LODS_URL = '/assets/environment/grassLODs.glb';
export const GRASS_ALPHA_TEXTURE_URL = '/assets/environment/grass.jpeg';
export const GRASS_NOISE_TEXTURE_URL = '/assets/environment/perlinnoise.webp';

export const GRASS_WEIGHT_ATTRIBUTE = 'color_1';
export const GRASS_MIN_SAMPLE_WEIGHT = 0.08;

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

export const GRASS_BASE_COLOR = '#313F1B';
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

export const GROUND_DESERT_COLOR = '#C4A574';
export const GROUND_GRASS_COLOR = '#5E875E';

/** Total companion effort at which grass reaches full spread. */
export const GRASS_GROW_EFFORT_REF = 3;
/** Max grow radius as a fraction of terrain world width at {@link GRASS_GROW_EFFORT_REF}. */
export const GRASS_GROW_RADIUS_RATIO = 0.55;
export const GROUND_GROW_RADIUS_RATIO = 0.75;
export const VEGETATION_GROW_FADE_RATIO = 0.2;

export function effortTotalToGrowRadius(
  totalEffort: number,
  terrainWorldWidth: number,
  radiusRatio: number = GRASS_GROW_RADIUS_RATIO,
): number {
  const t = Math.min(1, Math.max(0, totalEffort / GRASS_GROW_EFFORT_REF));
  return terrainWorldWidth * radiusRatio * t;
}

export function effortTotalToGroundGrowRadius(
  totalEffort: number,
  terrainWorldWidth: number,
): number {
  return effortTotalToGrowRadius(
    totalEffort,
    terrainWorldWidth,
    GROUND_GROW_RADIUS_RATIO,
  );
}
