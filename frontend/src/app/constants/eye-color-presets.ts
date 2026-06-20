import type { EyeColor } from '@ba-praktisch/shared-types';

/** Sclera / eye-white (`eyes` material). */
export const EYE_SCLERA_PRESETS = [
  '#ffffff',
  '#e4e3d4',
  '#c9c7bb',
  '#0c0c0c',
  '#424242',
  '#666666',
  '#98c5b4',
  '#a7bfe0',
  '#e2a7a7',
  '#cab3e0',
  '#e2dca4',
  '#b9bce6',
  '#b5e2c4',
] as const;

/** Iris (`iris` material). */
export const IRIS_COLOR_PRESETS = [
  '#0c0c0c',
  '#383838',
  '#4d4d4d',
  '#897366',
  '#6D6664',
  '#a3887a',
  '#8d7557',
  '#978869',
  '#b19562',
  '#696D7B',
  '#c4c4c4',
  '#ffffff',
  '#7d64b1',
  '#576fb3',
  '#8195cc',
  '#628174',
  '#77a193',
  '#c7bb4f',
  '#994b4b',
  '#b4624b',
  '#b1728c',
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
