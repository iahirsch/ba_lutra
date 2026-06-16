export const NOSE_COLOR_PRESETS = [
  '#212121',
  '#303030',
  '#59362E',
  '#FAB6AF',
  '#8f6482',
  '#F5F0E8',
  '#f6f67d',
  '#a1693f',
  '#4F3E33',
  '#2E5C4A',
  '#7598C9',
] as const;

export const DEFAULT_NOSE_COLOR = NOSE_COLOR_PRESETS[0];

export function resolveNoseColor(noseColor: string | null | undefined): string {
  if (
    !noseColor ||
    !NOSE_COLOR_PRESETS.includes(
      noseColor as (typeof NOSE_COLOR_PRESETS)[number],
    )
  ) {
    return DEFAULT_NOSE_COLOR;
  }
  return noseColor;
}
