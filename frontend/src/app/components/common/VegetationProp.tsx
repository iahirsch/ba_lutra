import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { Group, Object3D } from 'three';
import {
  prepareVegetationPropModel,
  type TreeLeavesMaterialState,
} from '../../utils/leavesMaterial';
import { computeHorizontalFootprintRadius } from '../../utils/vegetationGrow';

export interface VegetationPropHandle {
  /** The mounted Three.js group, or null before mount. */
  readonly group: Group | null;
  /** Half the horizontal bounding extent — used for grow-ring reveal offset. */
  readonly footprintRadius: number;
}

interface VegetationPropProps {
  glbUrl: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  leavesMaterialState: TreeLeavesMaterialState;
  prepareModel?: (root: Object3D, state: TreeLeavesMaterialState) => void;
}

/**
 * Vegetation prop that renders a model but performs no per-frame updates itself.
 * Scale and visibility are driven by the parent's batched `useFrame`.
 */
export const VegetationProp = forwardRef<
  VegetationPropHandle,
  VegetationPropProps
>(function VegetationProp(
  {
    glbUrl,
    position,
    rotation,
    leavesMaterialState,
    prepareModel = prepareVegetationPropModel,
  },
  ref,
) {
  const { scene } = useGLTF(glbUrl);
  const groupRef = useRef<Group>(null);

  const model = useMemo(() => {
    const cloned = scene.clone(true);
    prepareModel(cloned, leavesMaterialState);
    return cloned;
  }, [scene, leavesMaterialState, prepareModel]);

  const footprintRadius = useMemo(
    () => computeHorizontalFootprintRadius(model),
    [model],
  );

  useImperativeHandle(
    ref,
    () => ({
      get group() {
        return groupRef.current;
      },
      footprintRadius,
    }),
    [footprintRadius],
  );

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      visible={false}
    >
      <primitive object={model} />
    </group>
  );
});
