import { PerspectiveCamera } from 'three';

/** Shared hub GLB and camera tuning used by hub, interaction, and builder scenes. */
export const HUB_GLTF_URL = '/assets/backgrounds/environment.glb';

export const HUB_ENVIRONMENT_TRANSFORM = {
  position: [0, 0, 0] as [number, number, number],
  scale: 0.8 as number,
};

/** Empty-object markers inside HUB_GLTF for companion placement. */
export const ENVIRONMENT_SPAWN = {
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

// TODO: adjust to exhibition setup
const w = 1720;
const h = 1440;
const fullWidth = w * 2;
const fullHeight = h;

function createDualScreenCamera(x: number): PerspectiveCamera {
  const camera = new PerspectiveCamera(
    HUB_CAMERA.fov,
    fullWidth / fullHeight,
    HUB_CAMERA.near,
    HUB_CAMERA.far,
  );
  camera.position.set(...HUB_CAMERA.position);
  camera.setViewOffset(fullWidth, fullHeight, x, 0, w, h);
  (camera as PerspectiveCamera & { manual: true }).manual = true;
  return camera;
}

// Left camera
export const INTERACTION_CAMERA = createDualScreenCamera(0);
// Right camera
export const HUB_VIEW_CAMERA = createDualScreenCamera(w);
