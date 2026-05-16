import type { EyeColor } from '@ba-praktisch/shared-types';

/** Sclera / eye-white (`eyes` material). */
export const EYE_SCLERA_PRESETS = [
  '#FFFFFF',
  '#F5F0E8',
  '#E8E4DC',
  '#FFF8F0',
] as const;

/** Iris (`iris` material). */
export const IRIS_COLOR_PRESETS = [
  '#3D2914',
  '#5C4033',
  '#2E5C4A',
  '#4A6FA5',
  '#8B6914',
  '#1C1C1C',
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
