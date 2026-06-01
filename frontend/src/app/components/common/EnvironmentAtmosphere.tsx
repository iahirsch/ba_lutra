import { Color } from 'three';

type EnvironmentVariant = 'hub' | 'interaction';
const DEFAULT_ATMOSPHERE_PRESET = {
  background: '#cfe3ef',
  fog: '#e9f1f6',
  near: 28,
  far: 860,
};

const ATMOSPHERE_PRESETS: Record<
  EnvironmentVariant,
  {
    background: string;
    fog: string;
    near: number;
    far: number;
  }
> = {
  hub: DEFAULT_ATMOSPHERE_PRESET,
  interaction: DEFAULT_ATMOSPHERE_PRESET,
};

interface EnvironmentAtmosphereProps {
  variant?: EnvironmentVariant;
}

export function EnvironmentAtmosphere({
  variant = 'hub',
}: EnvironmentAtmosphereProps) {
  const preset = ATMOSPHERE_PRESETS[variant];

  return (
    <>
      <color attach="background" args={[new Color(preset.background)]} />
      <fog attach="fog" args={[preset.fog, preset.near, preset.far]} />
    </>
  );
}
