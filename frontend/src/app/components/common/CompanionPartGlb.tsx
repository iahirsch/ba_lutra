import { useLayoutEffect, useMemo, useRef } from 'react';
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

export interface CompanionPartGlbProps {
  category: PartCategory;
  variantId: string;
  bodyMorphs: Record<string, number>;
  /** Emissive intensity for the backpack `conduit` mesh */
  conduitGlow?: number;
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
}: CompanionPartGlbProps) {
  const url = `${COMPANION_GLB_BASE}/${category}/${variantId}.glb`;
  const gltf = useGLTF(url);
  const bodyScene = useCompanionBodyScene();
  const mergedRef = useRef<Object3D[]>([]);
  const bodyMorphsRef = useRef(bodyMorphs);
  bodyMorphsRef.current = bodyMorphs;

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
    setConduitGlow(bodyScene, conduitGlow ?? 0);
  }, [bodyScene, category, conduitGlow]);

  return null;
}
