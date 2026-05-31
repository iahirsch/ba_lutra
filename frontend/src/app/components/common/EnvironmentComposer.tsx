import {
  Bloom,
  EffectComposer,
  ToneMapping,
} from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

type EnvironmentVariant = 'hub' | 'interaction';
const DEFAULT_COMPOSER_PRESET = {
  bloomThreshold: 0.5,
  bloomSmoothing: 0.5,
  bloomIntensity: 1.25,
};

const COMPOSER_PRESETS: Record<
  EnvironmentVariant,
  {
    bloomThreshold: number;
    bloomSmoothing: number;
    bloomIntensity: number;
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
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
