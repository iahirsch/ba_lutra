import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
} from '@react-three/postprocessing';

type EnvironmentVariant = 'hub' | 'interaction';
const DEFAULT_COMPOSER_PRESET = {
  bloomThreshold: 0.3,
  bloomSmoothing: 0.85,
  bloomIntensity: 1.25,
  brightness: 0.01,
  contrast: 0.14,
};

const COMPOSER_PRESETS: Record<
  EnvironmentVariant,
  {
    bloomThreshold: number;
    bloomSmoothing: number;
    bloomIntensity: number;
    brightness: number;
    contrast: number;
  }
> = {
  hub: DEFAULT_COMPOSER_PRESET,
  interaction: DEFAULT_COMPOSER_PRESET,
};

interface EnvironmentComposerProps {
  variant?: EnvironmentVariant;
}

export function EnvironmentComposer({
  variant = 'hub',
}: EnvironmentComposerProps) {
  const preset = COMPOSER_PRESETS[variant];

  return (
    <EffectComposer multisampling={4}>
      <Bloom
        luminanceThreshold={preset.bloomThreshold}
        luminanceSmoothing={preset.bloomSmoothing}
        intensity={preset.bloomIntensity}
      />
      <BrightnessContrast
        brightness={preset.brightness}
        contrast={preset.contrast}
      />
    </EffectComposer>
  );
}
