import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { COMPANION_GLB_BASE } from '@ba-praktisch/shared-types';
import type { PartCategory } from '../../store/companionStore';
import { applyCelShading } from '../../utils/celShading';
import { applyBodyMorphsToObject } from '../../utils/applyBodyMorphs';

export interface CompanionPartGlbProps {
  category: PartCategory;
  variantId: string;
  bodyMorphs: Record<string, number>;
}

/** Single companion body-part GLB: clone, morphs, cel shading. */
export function CompanionPartGlb({
  category,
  variantId,
  bodyMorphs,
}: CompanionPartGlbProps) {
  const url = `${COMPANION_GLB_BASE}/${category}/${variantId}.glb`;
  const gltf = useGLTF(url);

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

  return <primitive object={scene} />;
}
