import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Group } from 'three';
import {
  prepareVegetationPropModel,
  type TreeLeavesMaterialState,
} from '../../utils/treeLeavesMaterial';
import {
  computeGrowReveal,
  computeHorizontalFootprintRadius,
  distanceFromGrowAnchorXZ,
  useVegetationGrow,
} from '../../utils/vegetationGrow';

interface VegetationPropProps {
  glbUrl: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  applyEnvironmentTransform?: boolean;
  totalEffortScore: number;
  terrainWorldWidth: number;
  leavesMaterialState: TreeLeavesMaterialState;
}

/** Whole-object vegetation that scales in when the grow ring reaches it. */
export function VegetationProp({
  glbUrl,
  position,
  rotation,
  scale = 1,
  applyEnvironmentTransform = true,
  totalEffortScore,
  terrainWorldWidth,
  leavesMaterialState,
}: VegetationPropProps) {
  const { scene } = useGLTF(glbUrl);
  const groupRef = useRef<Group>(null);
  const { anchorX, anchorZ, growRadiusRef, fadeWidth } = useVegetationGrow({
    applyEnvironmentTransform,
    totalEffortScore,
    terrainWorldWidth,
  });

  const model = useMemo(() => {
    const cloned = scene.clone(true);
    prepareVegetationPropModel(cloned, leavesMaterialState);
    return cloned;
  }, [scene, leavesMaterialState]);

  const footprintRadius = useMemo(
    () => computeHorizontalFootprintRadius(model),
    [model],
  );

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    const growRadius = growRadiusRef.current;
    const dist = distanceFromGrowAnchorXZ(
      position[0],
      position[2],
      anchorX,
      anchorZ,
    );
    const revealRadius = Math.max(0, growRadius - footprintRadius);
    const reveal = computeGrowReveal(dist, revealRadius, fadeWidth);

    group.visible = reveal > 0.001;
    const revealScale = Math.max(0.001, reveal) * scale;
    group.scale.set(revealScale, revealScale, revealScale);
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <primitive object={model} />
    </group>
  );
}
