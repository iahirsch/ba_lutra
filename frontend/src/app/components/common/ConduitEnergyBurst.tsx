import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  PointsMaterial,
} from 'three';

const CONDUIT_COLOR = '#7cfdfd';
const DURATION = 1.2;
const MAX_COUNT = 300;

const BURST_COUNTS: Partial<Record<string, number>> = {
  store_energy_1: 100,
  store_energy_2: 200,
  store_energy_3: 300,
};

function easeOut(t: number): number {
  return 1 - (1 - t) ** 2;
}

interface ConduitEnergyBurstProps {
  position: [number, number, number];
  /** Increments each time a burst should fire. */
  trigger: number;
  stepId: string;
}

export function ConduitEnergyBurst({
  position,
  trigger,
  stepId,
}: ConduitEnergyBurstProps) {
  const velocities = useMemo(() => {
    const v = new Float32Array(MAX_COUNT * 3);
    for (let i = 0; i < MAX_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const elev = Math.random() * Math.PI * 0.6;
      const speed = 0.8 + Math.random() * 1.2;
      v[i * 3] = Math.cos(angle) * Math.cos(elev) * speed;
      v[i * 3 + 1] = Math.sin(elev) * speed + 0.3;
      v[i * 3 + 2] = Math.sin(angle) * Math.cos(elev) * speed;
    }
    return v;
  }, []);

  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(MAX_COUNT * 3), 3),
    );
    return g;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const elapsedRef = useRef(-1);
  const prevTriggerRef = useRef(trigger);
  const activeCountRef = useRef(0);
  const materialRef = useRef<PointsMaterial>(null);

  useFrame((_s, dt) => {
    if (trigger !== prevTriggerRef.current) {
      prevTriggerRef.current = trigger;
      elapsedRef.current = 0;
      activeCountRef.current = BURST_COUNTS[stepId] ?? 100;
    }

    const mat = materialRef.current;
    if (!mat) return;

    if (elapsedRef.current < 0) {
      mat.opacity = 0;
      return;
    }

    elapsedRef.current += dt;
    const t = Math.min(elapsedRef.current / DURATION, 1);

    if (t >= 1) {
      elapsedRef.current = -1;
      mat.opacity = 0;
      return;
    }

    const posAttr = geometry.attributes['position'] as BufferAttribute;
    const pos = posAttr.array as Float32Array;
    const count = activeCountRef.current;
    const dist = easeOut(t);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = velocities[i * 3] * dist;
      pos[i * 3 + 1] = velocities[i * 3 + 1] * dist;
      pos[i * 3 + 2] = velocities[i * 3 + 2] * dist;
    }
    for (let i = count; i < MAX_COUNT; i++) {
      pos[i * 3] = pos[i * 3 + 1] = pos[i * 3 + 2] = 0;
    }
    posAttr.needsUpdate = true;

    mat.opacity = (1 - t) * 0.9;
  });

  return (
    <group position={position}>
      <points geometry={geometry}>
        <pointsMaterial
          ref={materialRef}
          color={CONDUIT_COLOR}
          size={0.08}
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
