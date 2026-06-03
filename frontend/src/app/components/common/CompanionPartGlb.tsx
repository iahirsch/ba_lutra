import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import type { Object3D } from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { COMPANION_GLB_BASE } from '@ba-praktisch/shared-types';
import { useCompanionBodyScene } from './companionBodySceneContext';
import type { PartCategory } from '../../store/companionStore';
import { applyCelShading, setConduitGlow } from '../../utils/celShading';
import { applyBodyMorphsToObject } from '../../utils/applyBodyMorphs';
import {
  mergePartIntoBody,
  removeMergedParts,
} from '../../utils/mergePartIntoBody';

const CONDUIT_FLASH_PEAK = 5.0;

interface GlowAnim {
  elapsed: number;
  flashDuration: number;
  lerpDuration: number;
  startIntensity: number;
  targetIntensity: number;
}

export interface CompanionPartGlbProps {
  category: PartCategory;
  variantId: string;
  bodyMorphs: Record<string, number>;
  conduitGlow?: number;
  conduitFlashTrigger?: number;
  conduitGlowTarget?: number;
  conduitLerpDuration?: number;
}

function applyMorphsToMerged(
  merged: Object3D[],
  bodyMorphs: Record<string, number>,
): void {
  for (const part of merged) {
    applyBodyMorphsToObject(part, bodyMorphs);
  }
}

/** Loads a part GLB and merges its skinned meshes into the active body rig. */
export function CompanionPartGlb({
  category,
  variantId,
  bodyMorphs,
  conduitGlow,
  conduitFlashTrigger,
  conduitGlowTarget,
  conduitLerpDuration = 1.0,
}: CompanionPartGlbProps) {
  const url = `${COMPANION_GLB_BASE}/${category}/${variantId}.glb`;
  const gltf = useGLTF(url);
  const bodyScene = useCompanionBodyScene();
  const mergedRef = useRef<Object3D[]>([]);
  const bodyMorphsRef = useRef(bodyMorphs);
  bodyMorphsRef.current = bodyMorphs;

  const glowAnimRef = useRef<GlowAnim | null>(null);
  const prevFlashTriggerRef = useRef<number | undefined>(undefined);

  const partScene = useMemo(() => {
    const cloned = cloneSkinned(gltf.scene);
    applyCelShading(cloned);
    return cloned;
  }, [gltf.scene]);

  useLayoutEffect(() => {
    if (!bodyScene) return;

    removeMergedParts(mergedRef.current);
    mergedRef.current = mergePartIntoBody(bodyScene, partScene);
    applyMorphsToMerged(mergedRef.current, bodyMorphsRef.current);

    return () => {
      removeMergedParts(mergedRef.current);
      mergedRef.current = [];
    };
  }, [bodyScene, partScene]);

  useLayoutEffect(() => {
    applyMorphsToMerged(mergedRef.current, bodyMorphs);
  }, [bodyMorphs]);

  useLayoutEffect(() => {
    if (!bodyScene || category !== 'backpack') return;
    // Static glow — only apply when no flash animation is running.
    if (glowAnimRef.current) return;
    setConduitGlow(bodyScene, conduitGlow ?? 0.1);
  }, [bodyScene, category, conduitGlow]);

  // Kick off flash animation when trigger increments.
  useEffect(() => {
    if (category !== 'backpack') return;
    if (conduitFlashTrigger === undefined) return;
    if (conduitFlashTrigger === prevFlashTriggerRef.current) return;
    prevFlashTriggerRef.current = conduitFlashTrigger;

    const target = conduitGlowTarget ?? conduitGlow ?? 0.1;
    glowAnimRef.current = {
      elapsed: 0,
      flashDuration: 0.08,
      lerpDuration: conduitLerpDuration,
      startIntensity: CONDUIT_FLASH_PEAK,
      targetIntensity: target,
    };
    if (bodyScene) setConduitGlow(bodyScene, CONDUIT_FLASH_PEAK);
  }, [
    category,
    conduitFlashTrigger,
    conduitGlowTarget,
    conduitGlow,
    conduitLerpDuration,
    bodyScene,
  ]);

  useFrame((_state, delta) => {
    const anim = glowAnimRef.current;
    if (!anim || !bodyScene || category !== 'backpack') return;

    anim.elapsed += delta;

    let intensity: number;
    if (anim.elapsed < anim.flashDuration) {
      intensity = anim.startIntensity;
    } else {
      const t = Math.min(
        (anim.elapsed - anim.flashDuration) / anim.lerpDuration,
        1,
      );
      const eased = 1 - Math.pow(1 - t, 3);
      intensity =
        anim.startIntensity +
        (anim.targetIntensity - anim.startIntensity) * eased;
    }

    setConduitGlow(bodyScene, intensity);

    if (anim.elapsed >= anim.flashDuration + anim.lerpDuration) {
      glowAnimRef.current = null;
    }
  });

  return null;
}
