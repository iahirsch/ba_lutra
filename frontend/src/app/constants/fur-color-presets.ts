import type { FurColor } from '@ba-praktisch/shared-types';

export const FUR_COLOR_PRESETS: FurColor[] = [
  { primary: '#897366', secondary: '#D9B6A3' },
  { primary: '#6D6664', secondary: '#BFAFA3' },
  { primary: '#BF7B3F', secondary: '#F2BC8D' },
  { primary: '#696D7B', secondary: '#C1C9D9' },
  { primary: '#A36881', secondary: '#EBC3D4' },
  { primary: '#E3E3E3', secondary: '#F7F7F7' },
  { primary: '#5A776B', secondary: '#A2B9B0' },
];

export const DEFAULT_FUR_COLOR = FUR_COLOR_PRESETS[0];

export function resolveFurColor(
  furColor: FurColor | null | undefined,
): FurColor {
  if (!furColor?.primary || !furColor?.secondary) {
    return DEFAULT_FUR_COLOR;
  }
  return furColor;
}
