import {
  BrightnessContrast,
  DepthOfField,
  EffectComposer,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

const EDITOR_COMPOSER_PRESET = {
  brightness: 0.01,
  contrast: -0.05,
  vignetteOffset: 0.4,
  vignetteDarkness: 0.4,
  depthOfFieldBokehScale: 25,
  depthOfFieldFocusRange: 30,
};

interface EditorComposerProps {
  target: [number, number, number];
  disableDOF?: boolean;
}

export function EditorComposer({ target, disableDOF = false }: EditorComposerProps) {
  return (
    <EffectComposer depthBuffer multisampling={4}>
      <DepthOfField
        target={target}
        bokehScale={disableDOF ? 0 : EDITOR_COMPOSER_PRESET.depthOfFieldBokehScale}
        focusRange={disableDOF ? 0 : EDITOR_COMPOSER_PRESET.depthOfFieldFocusRange}
      />
      <BrightnessContrast
        brightness={EDITOR_COMPOSER_PRESET.brightness}
        contrast={EDITOR_COMPOSER_PRESET.contrast}
      />
      <Vignette
        offset={EDITOR_COMPOSER_PRESET.vignetteOffset}
        darkness={EDITOR_COMPOSER_PRESET.vignetteDarkness}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
