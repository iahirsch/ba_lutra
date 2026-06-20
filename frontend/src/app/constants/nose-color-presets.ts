export const NOSE_COLOR_PRESETS = [
  '#212121',
  '#393939',
  'rgb(72, 72, 72)',
  '#4F3E33',
  '#a1693f',
  '#a77d83',
  '#9a748f',
  '#FAB6AF',
  '#c8c3bc',
  '#8aa0c0',
  '#486258',
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
