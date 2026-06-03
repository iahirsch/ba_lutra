import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, BufferAttribute, AdditiveBlending } from 'three';
import { ENVIRONMENT_SPAWN } from '../../constants/hub-scene';
import { useEnvironmentSpawn } from '../../utils/environmentSpawn';

const PARTICLE_COUNT = 8000;
const CONDUIT_COLOR = '#7cfdfd';
const DISSOLVE_DURATION = 1.8;
const FUNNEL_DURATION = 1.7;
const EXIT_WAIT = 0;
const TOTAL_DURATION = DISSOLVE_DURATION + FUNNEL_DURATION + EXIT_WAIT;

const CONV_START_Y = 0.0;
const CONV_END_Y = 2.2;
const LIFT_SPEED = 1.6;
const BLEND_DURATION = 1;

interface Volume {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  weight: number;
}

const BODY_VOLUMES: Volume[] = [
  { x: 0, y: 0.55, z: 0, rx: 0.2, ry: 0.3, rz: 0.16, weight: 0.35 },
  { x: 0, y: 1.05, z: 0.02, rx: 0.18, ry: 0.18, rz: 0.18, weight: 0.28 },
  { x: -0.12, y: 1.35, z: 0, rx: 0.07, ry: 0.1, rz: 0.06, weight: 0.08 },
  { x: 0.12, y: 1.35, z: 0, rx: 0.07, ry: 0.1, rz: 0.06, weight: 0.08 },
  { x: 0, y: 0.18, z: 0, rx: 0.16, ry: 0.18, rz: 0.14, weight: 0.12 },
  { x: 0.05, y: 0.4, z: -0.18, rx: 0.12, ry: 0.18, rz: 0.12, weight: 0.09 },
];

function sampleEllipsoid(
  rx: number,
  ry: number,
  rz: number,
): [number, number, number] {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = Math.cbrt(Math.random());
  return [
    r * Math.sin(phi) * Math.cos(theta) * rx,
    r * Math.sin(phi) * Math.sin(theta) * ry,
    r * Math.cos(phi) * rz,
  ];
}

function easeOut(t: number): number {
  return 1 - (1 - t) ** 3;
}

function generateParticleData(count: number) {
  const origins = new Float32Array(count * 3);
  const scatter = new Float32Array(count * 3);
  const scatterEnd = new Float32Array(count * 3);

  const cumWeights: number[] = [];
  let wSum = 0;
  for (const v of BODY_VOLUMES) {
    wSum += v.weight;
    cumWeights.push(wSum);
  }

  for (let i = 0; i < count; i++) {
    const rand = Math.random() * wSum;
    const volIdx = cumWeights.findIndex((w) => w >= rand);
    const vol = BODY_VOLUMES[Math.max(0, volIdx)];
    const [dx, dy, dz] = sampleEllipsoid(vol.rx, vol.ry, vol.rz);
    origins[i * 3] = vol.x + dx;
    origins[i * 3 + 1] = vol.y + dy;
    origins[i * 3 + 2] = vol.z + dz;

    const sr = 0.5 + Math.random() * 0.4;
    const sTheta = Math.random() * Math.PI * 2;
    const sPhi = Math.acos(2 * Math.random() - 1);
    scatter[i * 3] = sr * Math.sin(sPhi) * Math.cos(sTheta);
    scatter[i * 3 + 1] = sr * Math.sin(sPhi) * Math.sin(sTheta);
    scatter[i * 3 + 2] = sr * Math.cos(sPhi);

    scatterEnd[i * 3] = origins[i * 3] + scatter[i * 3];
    scatterEnd[i * 3 + 1] = origins[i * 3 + 1] + scatter[i * 3 + 1];
    scatterEnd[i * 3 + 2] = origins[i * 3 + 2] + scatter[i * 3 + 2];
  }

  return { origins, scatter, scatterEnd };
}

interface CompanionParticleDissolveProps {
  onComplete: () => void;
}

export function CompanionParticleDissolve({
  onComplete,
}: CompanionParticleDissolveProps) {
  const spawnPos = useEnvironmentSpawn(ENVIRONMENT_SPAWN.editor, false);
  const elapsedRef = useRef(0);
  const completedRef = useRef(false);

  const { origins, scatter, scatterEnd } = useMemo(
    () => generateParticleData(PARTICLE_COUNT),
    [],
  );

  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(origins), 3),
    );
    return g;
  }, [origins]);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  useFrame((_s, dt) => {
    if (completedRef.current) return;

    elapsedRef.current += dt;
    const t = elapsedRef.current;
    const posAttr = geometry.attributes['position'] as BufferAttribute;
    const pos = posAttr.array as Float32Array;

    if (t < DISSOLVE_DURATION) {
      const progress = easeOut(t / DISSOLVE_DURATION);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        pos[i * 3] = origins[i * 3] + scatter[i * 3] * progress;
        pos[i * 3 + 1] = origins[i * 3 + 1] + scatter[i * 3 + 1] * progress;
        pos[i * 3 + 2] = origins[i * 3 + 2] + scatter[i * 3 + 2] * progress;
      }
      posAttr.needsUpdate = true;
    } else if (t < DISSOLVE_DURATION + FUNNEL_DURATION) {
      const ti = t - DISSOLVE_DURATION;
      const liftY = ti * LIFT_SPEED;

      const blendFactor = Math.min(1.0, ti / BLEND_DURATION);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const currentY = scatterEnd[i * 3 + 1] + liftY;
        const rawConv = Math.max(
          0,
          Math.min(1, (currentY - CONV_START_Y) / (CONV_END_Y - CONV_START_Y)),
        );
        const conv = rawConv * blendFactor;

        pos[i * 3] = scatterEnd[i * 3] * (1.0 - conv);
        pos[i * 3 + 1] = currentY;
        pos[i * 3 + 2] = scatterEnd[i * 3 + 2] * (1.0 - conv);
      }
      posAttr.needsUpdate = true;
    } else if (t >= TOTAL_DURATION) {
      completedRef.current = true;
      onComplete();
    }
  });

  return (
    <group position={spawnPos}>
      <points geometry={geometry}>
        <pointsMaterial
          color={CONDUIT_COLOR}
          size={0.04}
          sizeAttenuation
          transparent
          opacity={0.95}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
