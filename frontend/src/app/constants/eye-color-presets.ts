import type { EyeColor } from '@ba-praktisch/shared-types';

/** Sclera / eye-white (`eyes` material). */
export const EYE_SCLERA_PRESETS = [
  '#FFFFFF',
  '#F5F0E8',
  '#E8E4DC',
  '#1F1F1F',
] as const;

/** Iris (`iris` material). */
export const IRIS_COLOR_PRESETS = [
  '#1F1F1F',
  '#4F3E33',
  '#2E5C4A',
  '#7598C9',
  '#D6A61E',
  '#8A2F2F',
  '#7B5C99',
] as const;

export const DEFAULT_EYE_COLOR: EyeColor = {
  primary: EYE_SCLERA_PRESETS[0],
  secondary: IRIS_COLOR_PRESETS[0],
};

export function resolveEyeColor(
  eyeColor: EyeColor | null | undefined,
): EyeColor {
  const primary =
    eyeColor?.primary &&
    EYE_SCLERA_PRESETS.includes(
      eyeColor.primary as (typeof EYE_SCLERA_PRESETS)[number],
    )
      ? eyeColor.primary
      : DEFAULT_EYE_COLOR.primary;
  const secondary =
    eyeColor?.secondary &&
    IRIS_COLOR_PRESETS.includes(
      eyeColor.secondary as (typeof IRIS_COLOR_PRESETS)[number],
    )
      ? eyeColor.secondary
      : DEFAULT_EYE_COLOR.secondary;
  return { primary, secondary };
}
