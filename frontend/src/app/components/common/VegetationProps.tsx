import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { HUB_GLTF_URL } from '../../constants/hub-scene';
import { ENVIRONMENT_VEGETATION } from '../../constants/environment-vegetation';
import { useTotalEffortScore } from '../../hooks/useTotalEffortScore';
import { resolveEnvironmentSpawn } from '../../utils/environmentSpawn';
import { useEnvironmentTerrainWorldWidth } from '../../utils/vegetationGrow';
import { VegetationProp } from './VegetationProp';

useGLTF.preload(HUB_GLTF_URL);

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
  const terrainWorldWidth = useEnvironmentTerrainWorldWidth(
    applyEnvironmentTransform,
  );

  const placements = useMemo(
    () =>
      ENVIRONMENT_VEGETATION.map((entry) => ({
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
        />
      ))}
    </>
  );
}
