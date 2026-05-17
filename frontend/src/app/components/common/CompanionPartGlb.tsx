import { useLayoutEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { COMPANION_GLB_BASE } from '@ba-praktisch/shared-types';
import { COMPANION_ATTACH_BONES } from '../../constants/companion-attach-bones';
import { useCompanionBodyScene } from './companionBodySceneContext';
import type { PartCategory } from '../../store/companionStore';
import { applyCelShading, setConduitGlow } from '../../utils/celShading';
import { applyBodyMorphsToObject } from '../../utils/applyBodyMorphs';
import { attachPartToBone, detachPart } from '../../utils/attachPartToBone';

export interface CompanionPartGlbProps {
  category: PartCategory;
  variantId: string;
  bodyMorphs: Record<string, number>;
  /** Emissive intensity for the backpack `conduit` mesh (hub effort glow). */
  conduitGlow?: number;
}

/** Single companion body-part GLB: clone, morphs, cel shading. */
export function CompanionPartGlb({
  category,
  variantId,
  bodyMorphs,
  conduitGlow,
}: CompanionPartGlbProps) {
  const url = `${COMPANION_GLB_BASE}/${category}/${variantId}.glb`;
  const gltf = useGLTF(url);
  const bodyScene = useCompanionBodyScene();
  const attachBoneName =
    category === 'backpack' ? COMPANION_ATTACH_BONES.backpack : null;

  const morphKey = JSON.stringify(bodyMorphs);

  const scene = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    applyBodyMorphsToObject(
      cloned,
      JSON.parse(morphKey) as Record<string, number>,
    );
    applyCelShading(cloned);
    return cloned;
  }, [gltf.scene, morphKey]);

  useLayoutEffect(() => {
    if (!attachBoneName || !bodyScene) return;

    attachPartToBone(bodyScene, scene, attachBoneName);

    return () => {
      detachPart(scene);
    };
  }, [attachBoneName, bodyScene, scene]);

  useLayoutEffect(() => {
    if (category !== 'backpack') return;
    setConduitGlow(scene, conduitGlow ?? 0);
  }, [category, scene, conduitGlow]);

  if (attachBoneName) return null;

  return <primitive object={scene} />;
}
