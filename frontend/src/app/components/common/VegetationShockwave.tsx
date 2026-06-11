import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  PointsMaterial,
} from 'three';
import { HUB_GLTF_URL } from '../../constants/hub-scene';
import { ANCHOR_CONDUIT_MESH_NAME } from '../../utils/celShading';
import { resolveHubScenePosition } from '../../utils/environmentSpawn';
import { useTotalEffortScore } from '../../hooks/useTotalEffortScore';

const CONDUIT_COLOR = '#7cfdfd';

function easeOut(t: number): number {
  return 1 - (1 - t) ** 3;
}

interface VegetationShockwaveProps {
  applyEnvironmentTransform?: boolean;
  totalEffortScore?: number;
  /** Number of particles in the ring. Default: 2000 */
  particleCount?: number;
  /** Rendered point size in world units. Default: 0.07 */
  particleSize?: number;
  /** Maximum ring radius at the end of the animation. Default: 12 */
  maxRadius?: number;
  /** ± radial spread around the ring front, controls ring thickness. Default: 0.8 */
  ringHalfWidth?: number;
  /** Animation duration in seconds. Default: 2 */
  duration?: number;
  /** Maximum upward Y scatter per particle. Default: 0.3 */
  ySpread?: number;
}

export function VegetationShockwave({
  applyEnvironmentTransform = true,
  totalEffortScore: prop,
  particleCount = 3000,
  particleSize = 0.5,
  maxRadius = 20,
  ringHalfWidth = 2,
  duration = 3,
  ySpread = 0.5,
}: VegetationShockwaveProps) {
  const liveEffort = useTotalEffortScore();
  const totalEffortScore = prop ?? liveEffort;

  const { scene } = useGLTF(HUB_GLTF_URL);
  const conduitPosition = useMemo(
    () =>
      resolveHubScenePosition(
        scene,
        ANCHOR_CONDUIT_MESH_NAME,
        applyEnvironmentTransform,
      ),
    [scene, applyEnvironmentTransform],
  );

  const { angles, radialOffsets, yOffsets } = useMemo(() => {
    const angles = new Float32Array(particleCount);
    const radialOffsets = new Float32Array(particleCount);
    const yOffsets = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      angles[i] = Math.random() * Math.PI * 2;
      radialOffsets[i] = (Math.random() * 2 - 1) * ringHalfWidth;
      yOffsets[i] = Math.random() * ySpread;
    }
    return { angles, radialOffsets, yOffsets };
  }, [particleCount, ringHalfWidth, ySpread]);

  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(particleCount * 3), 3),
    );
    return g;
  }, [particleCount]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const elapsedRef = useRef(-1);
  const prevScoreRef = useRef(totalEffortScore);
  const materialRef = useRef<PointsMaterial>(null);

  useFrame((_s, dt) => {
    if (totalEffortScore > prevScoreRef.current) {
      elapsedRef.current = 0;
    }
    prevScoreRef.current = totalEffortScore;

    const mat = materialRef.current;
    if (!mat) return;

    if (elapsedRef.current < 0) {
      mat.opacity = 0;
      return;
    }

    elapsedRef.current += dt;
    const t = Math.min(elapsedRef.current / duration, 1);

    if (t >= 1) {
      elapsedRef.current = -1;
      mat.opacity = 0;
      return;
    }

    const baseRadius = easeOut(t) * maxRadius;
    mat.opacity = 1 - t;

    const posAttr = geometry.attributes['position'] as BufferAttribute;
    const pos = posAttr.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const r = Math.max(0, baseRadius + radialOffsets[i]);
      pos[i * 3] = Math.cos(angles[i]) * r;
      pos[i * 3 + 1] = yOffsets[i];
      pos[i * 3 + 2] = Math.sin(angles[i]) * r;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <group position={conduitPosition}>
      <points geometry={geometry}>
        <pointsMaterial
          ref={materialRef}
          color={CONDUIT_COLOR}
          size={particleSize}
          sizeAttenuation
          transparent
          opacity={0}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
