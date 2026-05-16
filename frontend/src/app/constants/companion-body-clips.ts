/** Clip names from companion body GLB. */
export const COMPANION_BODY_CLIPS = ['idle', 'wave'] as const;

export type CompanionBodyClip = (typeof COMPANION_BODY_CLIPS)[number];

export const DEFAULT_COMPANION_BODY_CLIP: CompanionBodyClip = 'idle';

/* Used by the controller to ignore unknown clips */
export function isCompanionBodyClip(name: string): name is CompanionBodyClip {
  return (COMPANION_BODY_CLIPS as readonly string[]).includes(name);
}
