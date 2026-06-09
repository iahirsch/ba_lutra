import { createRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { TextureLoader } from 'three';
import { HUB_GLTF_URL } from '../../constants/hub-scene';
import * as veg from '../../constants/environment-vegetation';
import { useTotalEffortScore } from '../../hooks/useTotalEffortScore';
import { collectHubSceneMarkers } from '../../utils/environmentSpawn';
import {
  getOrCreateBushLeavesMaterial,
  getOrCreateTreeLeavesMaterial,
  useLeavesMaterial,
} from '../../utils/leavesMaterial';
import {
  computeGrowReveal,
  distanceFromGrowAnchorXZ,
  useEnvironmentTerrainWorldWidth,
  useVegetationGrow,
} from '../../utils/vegetationGrow';
import { VegetationProp, type VegetationPropHandle } from './VegetationProp';

useGLTF.preload(HUB_GLTF_URL);
for (const url of veg.TREE_GLBS) {
  useGLTF.preload(url);
}
useGLTF.preload(veg.BUSH_DEFAULT_GLB);
for (const entry of veg.ENVIRONMENT_VEGETATION) {
  useGLTF.preload(entry.glbUrl);
}

interface VegetationPropsProps {
  applyEnvironmentTransform?: boolean;
  totalEffortScore?: number;
}

/** Discrete environment GLBs (trees, bushes) that share the radial grow ring. */
export function VegetationProps({
  applyEnvironmentTransform = true,
  totalEffortScore: totalEffortProp,
}: VegetationPropsProps) {
  const liveEffort = useTotalEffortScore();
  const totalEffortScore = totalEffortProp ?? liveEffort;
  const { scene } = useGLTF(HUB_GLTF_URL);

  const [leavesAlphaTexture, bushLeavesAlphaTexture, noiseTexture] = useLoader(
    TextureLoader,
    [
      veg.TREE_LEAVES_ALPHA_TEXTURE_URL,
      veg.BUSH_LEAVES_ALPHA_TEXTURE_URL,
      veg.GRASS_NOISE_TEXTURE_URL,
    ],
  );

  const treeMaterialState = useMemo(() => getOrCreateTreeLeavesMaterial(), []);
  const bushMaterialState = useMemo(() => getOrCreateBushLeavesMaterial(), []);

  useLeavesMaterial(treeMaterialState, leavesAlphaTexture, noiseTexture);
  useLeavesMaterial(bushMaterialState, bushLeavesAlphaTexture, noiseTexture);

  const terrainWorldWidth = useEnvironmentTerrainWorldWidth(
    applyEnvironmentTransform,
  );

  const treePlacements = useMemo(() => {
    const markers = collectHubSceneMarkers(
      scene,
      veg.TREE_SPAWN_PREFIX,
      applyEnvironmentTransform,
    );
    return markers.map((marker) => {
      const override = veg.ENVIRONMENT_VEGETATION.find(
        (e) => e.spawn === marker.name,
      );
      return {
        id: marker.name,
        glbUrl:
          override?.glbUrl ??
          veg.TREE_GLBS[Math.floor(Math.random() * veg.TREE_GLBS.length)],
        position: [marker.position.x, marker.position.y, marker.position.z] as [
          number,
          number,
          number,
        ],
        scale: override?.scale ?? 0.6 + Math.random() * 0.6,
        rotation: override
          ? undefined
          : ([0, Math.random() * Math.PI * 2, 0] as [number, number, number]),
      };
    });
  }, [scene, applyEnvironmentTransform]);

  const bushPlacements = useMemo(() => {
    const markers = collectHubSceneMarkers(
      scene,
      veg.BUSH_SPAWN_PREFIX,
      applyEnvironmentTransform,
    );
    return markers.map((marker) => {
      const override = veg.ENVIRONMENT_BUSHES.find(
        (e) => e.spawn === marker.name,
      );
      return {
        id: marker.name,
        glbUrl: override?.glbUrl ?? veg.BUSH_DEFAULT_GLB,
        position: [marker.position.x, marker.position.y, marker.position.z] as [
          number,
          number,
          number,
        ],
        scale: override?.scale ?? 0.75,
      };
    });
  }, [scene, applyEnvironmentTransform]);

  // One stable ref per tree/bush — recreated only when placements change.
  const treePropRefs = useMemo(
    () => treePlacements.map(() => createRef<VegetationPropHandle>()),
    [treePlacements],
  );
  const bushPropRefs = useMemo(
    () => bushPlacements.map(() => createRef<VegetationPropHandle>()),
    [bushPlacements],
  );

  // Grow params computed once for all trees and bushes.
  const { anchorX, anchorZ, growRadiusRef, fadeWidth } = useVegetationGrow({
    applyEnvironmentTransform,
    totalEffortScore,
    terrainWorldWidth,
  });

  // Single useFrame drives all tree + bush scale/visibility updates.
  useFrame(() => {
    const growRadius = growRadiusRef.current;

    for (let i = 0; i < treePropRefs.length; i++) {
      const handle = treePropRefs[i].current;
      const group = handle?.group;
      if (!group) continue;
      const entry = treePlacements[i];
      const dist = distanceFromGrowAnchorXZ(
        entry.position[0],
        entry.position[2],
        anchorX,
        anchorZ,
      );
      const revealRadius = Math.max(0, growRadius - handle.footprintRadius);
      const reveal = computeGrowReveal(dist, revealRadius, fadeWidth);
      group.visible = reveal > 0.001;
      const s = Math.max(0.001, reveal) * entry.scale;
      group.scale.set(s, s, s);
    }

    for (let i = 0; i < bushPropRefs.length; i++) {
      const handle = bushPropRefs[i].current;
      const group = handle?.group;
      if (!group) continue;
      const entry = bushPlacements[i];
      const dist = distanceFromGrowAnchorXZ(
        entry.position[0],
        entry.position[2],
        anchorX,
        anchorZ,
      );
      const revealRadius = Math.max(0, growRadius - handle.footprintRadius);
      const reveal = computeGrowReveal(dist, revealRadius, fadeWidth);
      group.visible = reveal > 0.001;
      const s = Math.max(0.001, reveal) * entry.scale;
      group.scale.set(s, s, s);
    }
  });

  if (treePlacements.length === 0 && bushPlacements.length === 0) return null;

  return (
    <>
      {treePlacements.map((entry, i) => (
        <VegetationProp
          key={entry.id}
          ref={treePropRefs[i]}
          glbUrl={entry.glbUrl}
          position={entry.position}
          rotation={entry.rotation}
          leavesMaterialState={treeMaterialState}
        />
      ))}
      {bushPlacements.map((entry, i) => (
        <VegetationProp
          key={entry.id}
          ref={bushPropRefs[i]}
          glbUrl={entry.glbUrl}
          position={entry.position}
          leavesMaterialState={bushMaterialState}
        />
      ))}
    </>
  );
}
