import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import {
  COMPANION_BODY_GLB_URL,
  type FurColor,
} from '@ba-praktisch/shared-types';
import { resolveFurColor } from '../../constants/fur-color-presets';
import { resolveNoseColor } from '../../constants/nose-color-presets';
import { applyCelShading } from '../../utils/celShading';
import { applyBodyMorphsToObject } from '../../utils/applyBodyMorphs';
import { applyFurColorsToObject } from '../../utils/applyFurColors';
import { applyNoseColorToObject } from '../../utils/applyNoseColor';
import { cloneMaterialsOnObject } from '../../utils/cloneMaterials';

useGLTF.preload(COMPANION_BODY_GLB_URL);

export interface CompanionBodyProps {
  bodyMorphs: Record<string, number>;
  furColor: FurColor;
  noseColor: string;
}

/** Body mesh: morph targets + runtime fur and nose material colors. */
export function CompanionBody({ bodyMorphs, furColor, noseColor }: CompanionBodyProps) {
  const { scene: source } = useGLTF(COMPANION_BODY_GLB_URL);
  const resolvedFurColor = resolveFurColor(furColor);
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
    applyNoseColorToObject(cloned, resolvedNoseColor);
    applyCelShading(cloned);
    return cloned;
  }, [source, morphKey, resolvedFurColor, resolvedNoseColor]);

  return <primitive object={scene} />;
}
