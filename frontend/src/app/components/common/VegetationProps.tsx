import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { TextureLoader } from 'three';
import { HUB_GLTF_URL } from '../../constants/hub-scene';
import * as veg from '../../constants/environment-vegetation';
import { useTotalEffortScore } from '../../hooks/useTotalEffortScore';
import { resolveEnvironmentSpawn } from '../../utils/environmentSpawn';
import {
  getOrCreateTreeLeavesMaterial,
  setTreeLeavesMaterialTextures,
  updateTreeLeavesMaterialTime,
} from '../../utils/treeLeavesMaterial';
import { useEnvironmentTerrainWorldWidth } from '../../utils/vegetationGrow';
import { VegetationProp } from './VegetationProp';

useGLTF.preload(HUB_GLTF_URL);
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
  const [leavesAlphaTexture, noiseTexture] = useLoader(TextureLoader, [
    veg.TREE_LEAVES_ALPHA_TEXTURE_URL,
    veg.GRASS_NOISE_TEXTURE_URL,
  ]);
  const leavesMaterialState = useMemo(
    () => getOrCreateTreeLeavesMaterial(),
    [],
  );
  const texturesReadyRef = useRef(false);

  useEffect(() => {
    if (texturesReadyRef.current) return;
    setTreeLeavesMaterialTextures(
      leavesMaterialState,
      leavesAlphaTexture,
      noiseTexture,
    );
    texturesReadyRef.current = true;
  }, [leavesMaterialState, leavesAlphaTexture, noiseTexture]);

  useFrame((state) => {
    updateTreeLeavesMaterialTime(leavesMaterialState, state.clock.elapsedTime);
  });

  const terrainWorldWidth = useEnvironmentTerrainWorldWidth(
    applyEnvironmentTransform,
  );

  const placements = useMemo(
    () =>
      veg.ENVIRONMENT_VEGETATION.map((entry) => ({
        ...entry,
        position: resolveEnvironmentSpawn(
          scene,
          entry.spawn,
          applyEnvironmentTransform,
        ),
      })),
    [scene, applyEnvironmentTransform],
  );

  if (placements.length === 0) return null;

  return (
    <>
      {placements.map((entry) => (
        <VegetationProp
          key={entry.id}
          glbUrl={entry.glbUrl}
          position={entry.position}
          scale={entry.scale}
          applyEnvironmentTransform={applyEnvironmentTransform}
          totalEffortScore={totalEffortScore}
          terrainWorldWidth={terrainWorldWidth}
          leavesMaterialState={leavesMaterialState}
        />
      ))}
    </>
  );
}
