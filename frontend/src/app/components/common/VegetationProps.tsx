import { useEffect, useMemo, useRef } from 'react';
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
  setTreeLeavesMaterialTextures,
  updateTreeLeavesMaterialTime,
} from '../../utils/leavesMaterial';
import { useEnvironmentTerrainWorldWidth } from '../../utils/vegetationGrow';
import { VegetationProp } from './VegetationProp';

useGLTF.preload(HUB_GLTF_URL);
useGLTF.preload(veg.TREE_DEFAULT_GLB);
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
  const texturesReadyRef = useRef(false);

  useEffect(() => {
    if (texturesReadyRef.current) return;
    setTreeLeavesMaterialTextures(
      treeMaterialState,
      leavesAlphaTexture,
      noiseTexture,
    );
    setTreeLeavesMaterialTextures(
      bushMaterialState,
      bushLeavesAlphaTexture,
      noiseTexture,
    );
    texturesReadyRef.current = true;
  }, [
    treeMaterialState,
    bushMaterialState,
    leavesAlphaTexture,
    bushLeavesAlphaTexture,
    noiseTexture,
  ]);

  useFrame((state) => {
    updateTreeLeavesMaterialTime(treeMaterialState, state.clock.elapsedTime);
    updateTreeLeavesMaterialTime(bushMaterialState, state.clock.elapsedTime);
  });

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
        glbUrl: override?.glbUrl ?? veg.TREE_DEFAULT_GLB,
        position: [marker.position.x, marker.position.y, marker.position.z] as [
          number,
          number,
          number,
        ],
        scale: override?.scale ?? 1,
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
        scale: override?.scale ?? 1,
      };
    });
  }, [scene, applyEnvironmentTransform]);

  if (treePlacements.length === 0 && bushPlacements.length === 0) return null;

  return (
    <>
      {treePlacements.map((entry) => (
        <VegetationProp
          key={entry.id}
          glbUrl={entry.glbUrl}
          position={entry.position}
          scale={entry.scale}
          applyEnvironmentTransform={applyEnvironmentTransform}
          totalEffortScore={totalEffortScore}
          terrainWorldWidth={terrainWorldWidth}
          leavesMaterialState={treeMaterialState}
        />
      ))}
      {bushPlacements.map((entry) => (
        <VegetationProp
          key={entry.id}
          glbUrl={entry.glbUrl}
          position={entry.position}
          scale={entry.scale}
          applyEnvironmentTransform={applyEnvironmentTransform}
          totalEffortScore={totalEffortScore}
          terrainWorldWidth={terrainWorldWidth}
          leavesMaterialState={bushMaterialState}
        />
      ))}
    </>
  );
}
