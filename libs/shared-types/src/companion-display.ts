/** Part categories rendered as GLB meshes in hub and interaction scenes. */
export const RENDERED_COMPANION_PARTS = [
  'fur',
  'eyes',
  'nose',
  'clothing',
  'backpack',
] as const;

export type RenderedCompanionPart = (typeof RENDERED_COMPANION_PARTS)[number];

export const COMPANION_GLB_BASE = '/assets/companion/glb';

export const COMPANION_THUMBNAIL_BASE = '/assets/companion/thumbnails';
