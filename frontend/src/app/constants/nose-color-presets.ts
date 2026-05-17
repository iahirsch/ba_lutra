export const NOSE_COLOR_PRESETS = [
  '#212121',
  '#303030',
  '#59362E',
  '#FAB6AF',
  '#8f6482',
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
