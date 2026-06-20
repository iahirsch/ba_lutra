export const NOSE_COLOR_PRESETS = [
  '#313131',
  '#444444',
  '#4e4e4e',
  '#64534c',
  '#6e5d53',
  '#8b7062',
  '#966659',
  '#8d745d',
  '#978363',
  '#5a5d69',
  '#72788a',
  '#acacac',
  '#526392',
  '#6f5b99',
  '#9c667d',
  '#526960',
  '#698b80',
  '#8d5c36',
  '#926d73',
  '#806277',
  '#d89d97',
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
