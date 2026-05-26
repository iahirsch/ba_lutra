import { PerspectiveCamera } from 'three';

/** Hub GLB and scene layout used by hub, interaction, and editor stages. */
export const HUB_GLTF_URL = '/assets/environment/hub.glb';

export const HUB_TERRAIN_MESH_NAME = 'ground';
export const HUB_TERRAIN_COLOR = '#5e875e';

export const HUB_ENVIRONMENT_TRANSFORM = {
  position: [0, 0, 0] as [number, number, number],
  scale: 1 as number,
};

/** Empty-object markers inside hub.glb for companion placement. */
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

export const INTERACTION_CAMERA = createDualScreenCamera(0, LEFT_SCREEN_WIDTH);
export const HUB_VIEW_CAMERA = createDualScreenCamera(
  LEFT_SCREEN_WIDTH,
  RIGHT_SCREEN_WIDTH,
);
