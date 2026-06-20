import type { FurColor } from '@ba-praktisch/shared-types';

export const FUR_COLOR_PRESETS: FurColor[] = [
  { primary: '#897366', secondary: '#D9B6A3' },
  { primary: '#6D6664', secondary: '#BFAFA3' },
  { primary: '#90724e', secondary: '#d8b162' },
  { primary: '#7e734f', secondary: '#c5bc84' },
  { primary: '#a08e67', secondary: '#ccb492' },
  { primary: '#967c6e', secondary: '#e5ccc1' },
  { primary: '#696D7B', secondary: '#C1C9D9' },
  { primary: '#91949d', secondary: '#cfd2d9' },
  { primary: '#b6b6b6', secondary: '#dedede' },
  { primary: '#BF7B3F', secondary: '#F2BC8D' },
  { primary: '#b87f6f', secondary: '#dcb8ac' },
  { primary: '#A36881', secondary: '#EBC3D4' },
  { primary: '#b65439', secondary: '#e17f5e' },
  { primary: '#5A776B', secondary: '#A2B9B0' },
  { primary: '#347dd5', secondary: '#71cae7' },
  { primary: '#8d69d5', secondary: '#a9a0c8' },
  { primary: '#ceab1f', secondary: '#e6ec99' },
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
