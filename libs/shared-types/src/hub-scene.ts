/** Shared hub GLB and camera tuning used by hub, interaction, and builder scenes. */
export const HUB_GLTF_URL = '/assets/backgrounds/hub.glb';

export const HUB_ENVIRONMENT_TRANSFORM = {
  position: [0, 0, 0] as [number, number, number],
  scale: 0.8 as number,
};

export const HUB_CAMERA = {
  position: [0, 2, 12] as [number, number, number],
  fov: 40,
  near: 0.1,
  far: 1500,
} as const;
