import type { FurColor } from '@ba-praktisch/shared-types';

export const FUR_COLOR_PRESETS: FurColor[] = [
  { primary: '#897366', secondary: '#D9B6A3' },
  { primary: '#6D6664', secondary: '#BFAFA3' },
  { primary: '#a3887a', secondary: '#e5ccc1' },
  { primary: '#8d7557', secondary: '#dabd85' },
  { primary: '#978869', secondary: '#d4c1a6' },
  { primary: '#b19562', secondary: '#ebd795' },
  { primary: '#af7053', secondary: '#daaa9e' },
  { primary: '#bb7b42', secondary: '#f1be90' },
  { primary: '#c4a461', secondary: '#f0e1b0' },
  { primary: '#696D7B', secondary: '#C1C9D9' },
  { primary: '#91949d', secondary: '#cfd2d9' },
  { primary: '#c4c4c4', secondary: '#f3f3f3' },
  { primary: '#576fb3', secondary: '#a0d9ec' },
  { primary: '#7d64b1', secondary: '#c1b9df' },
  { primary: '#b1728c', secondary: '#eec1d5' },
  { primary: '#b4624b', secondary: '#e0a693' },
  { primary: '#628174', secondary: '#A2B9B0' },
  { primary: '#77a193', secondary: '#b0ebce' },
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
