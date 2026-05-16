import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import {
  COMPANION_BODY_GLB_URL,
  type EyeColor,
  type FurColor,
} from '@ba-praktisch/shared-types';
import {
  DEFAULT_COMPANION_BODY_CLIP,
  type CompanionBodyClip,
} from '../../constants/companion-body-clips';
import { resolveEyeColor } from '../../constants/eye-color-presets';
import { resolveFurColor } from '../../constants/fur-color-presets';
import { resolveNoseColor } from '../../constants/nose-color-presets';
import { useCompanionBodyAnimation } from '../../hooks/useCompanionBodyAnimation';
import { applyCelShading } from '../../utils/celShading';
import { applyBodyMorphsToObject } from '../../utils/applyBodyMorphs';
import { applyEyeColorsToObject } from '../../utils/applyEyeColors';
import { applyFurColorsToObject } from '../../utils/applyFurColors';
import { applyNoseColorToObject } from '../../utils/applyNoseColor';
import { cloneMaterialsOnObject } from '../../utils/cloneMaterials';

useGLTF.preload(COMPANION_BODY_GLB_URL);

export interface CompanionBodyProps {
  bodyMorphs: Record<string, number>;
  furColor: FurColor;
  eyeColor: EyeColor;
  noseColor: string;
  activeClip?: CompanionBodyClip;
}

export function CompanionBody({
  bodyMorphs,
  furColor,
  eyeColor,
  noseColor,
  activeClip = DEFAULT_COMPANION_BODY_CLIP,
}: CompanionBodyProps) {
  const { scene: source, animations } = useGLTF(COMPANION_BODY_GLB_URL);
  const resolvedFurColor = resolveFurColor(furColor);
  const resolvedEyeColor = resolveEyeColor(eyeColor);
  const resolvedNoseColor = resolveNoseColor(noseColor);

  const morphKey = JSON.stringify(bodyMorphs);

  const scene = useMemo(() => {
    const cloned = cloneSkinned(source);
    cloneMaterialsOnObject(cloned);
    applyBodyMorphsToObject(
      cloned,
      JSON.parse(morphKey) as Record<string, number>,
    );
    applyFurColorsToObject(cloned, resolvedFurColor);
    applyEyeColorsToObject(cloned, resolvedEyeColor);
    applyNoseColorToObject(cloned, resolvedNoseColor);
    applyCelShading(cloned);
    return cloned;
  }, [source, morphKey, resolvedFurColor, resolvedEyeColor, resolvedNoseColor]);

  useCompanionBodyAnimation(scene, animations, activeClip);

  return <primitive object={scene} />;
}
