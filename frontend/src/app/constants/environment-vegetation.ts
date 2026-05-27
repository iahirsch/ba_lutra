export interface EnvironmentVegetationEntry {
  id: string;
  glbUrl: string;
  spawn: string;
  scale?: number;
}

export const TREES_URL = '/assets/environment/trees/';
export const TREE_LEAVES_ALPHA_TEXTURE_URL = TREES_URL + 'leaves.png';
export const BUSHES_URL = '/assets/environment/bushes/';

export const TREE_LEAVES_WIND_SCALE = 4;

export const ENVIRONMENT_VEGETATION: EnvironmentVegetationEntry[] = [
  {
    id: 'tree-1',
    glbUrl: TREES_URL + 'tree03.glb',
    spawn: 'EMPTY_Tree01',
    scale: 1,
  },
  {
    id: 'tree-2',
    glbUrl: TREES_URL + 'tree02.glb',
    spawn: 'EMPTY_Tree02',
    scale: 1,
  },
  {
    id: 'tree-3',
    glbUrl: TREES_URL + 'tree01.glb',
    spawn: 'EMPTY_Tree03',
    scale: 1,
  },
];

export const GRASS_LODS_URL = '/assets/environment/grassLODs.glb';
export const GRASS_ALPHA_TEXTURE_URL = '/assets/environment/grass.jpeg';
export const GRASS_NOISE_TEXTURE_URL = '/assets/environment/perlinnoise.webp';

export const GRASS_WEIGHT_ATTRIBUTE = 'color_1';
/** Vertex paint on ground: black = grass texture, white = dirt texture. */
export const GROUND_SURFACE_MASK_ATTRIBUTE = 'color_3';
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

export const GROUND_ASSETS_URL = '/assets/environment/ground/';
export const GROUND_SAND_COLOR_URL = `${GROUND_ASSETS_URL}Sand_basecolor.png`;
export const GROUND_SAND_NORMAL_URL = `${GROUND_ASSETS_URL}Sand_normal.png`;
export const GROUND_SAND_HEIGHT_URL = `${GROUND_ASSETS_URL}Sand_height.png`;
export const GROUND_GRASS_COLOR_URL = `${GROUND_ASSETS_URL}Grass_Basecolor.png`;
export const GROUND_GRASS_NORMAL_URL = `${GROUND_ASSETS_URL}Grass_Normal.png`;
export const GROUND_DIRT_COLOR_URL = `${GROUND_ASSETS_URL}Dirt_basecolor.png`;
export const GROUND_DIRT_NORMAL_URL = `${GROUND_ASSETS_URL}Dirt_Normal.png`;
export const GROUND_TEXTURE_REPEAT = 15;
export const GROUND_DISPLACEMENT_SCALE = 0.15;
export const GROUND_NORMAL_SCALE = 1;

/** Total companion effort at which grass reaches full spread. */
export const GRASS_GROW_EFFORT_REF = 3;
/** Max grow radius as a fraction of terrain world width at {@link GRASS_GROW_EFFORT_REF}. */
export const GRASS_GROW_RADIUS_RATIO = 0.55;
export const GROUND_GROW_RADIUS_RATIO = 0.75;
export const VEGETATION_GROW_FADE_RATIO = 0.14;

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
