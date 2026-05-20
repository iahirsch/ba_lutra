/** Part categories rendered as separate GLB meshes */
export const RENDERED_COMPANION_PARTS = [
  'clothingTop',
  'clothingBottom',
  'backpack',
] as const;

export type RenderedCompanionPart = (typeof RENDERED_COMPANION_PARTS)[number];

export const COMPANION_GLB_BASE = '/assets/companion/glb';

export const COMPANION_BODY_GLB_URL = `${COMPANION_GLB_BASE}/body.glb`;

export const COMPANION_THUMBNAIL_BASE = '/assets/companion/thumbnails';
