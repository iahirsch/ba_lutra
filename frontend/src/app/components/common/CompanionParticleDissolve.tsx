import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import {
  BufferGeometry,
  BufferAttribute,
  AdditiveBlending,
  SkinnedMesh,
  Vector3,
  type Object3D,
} from 'three';
import { COMPANION_BODY_GLB_URL } from '@ba-praktisch/shared-types';
import { ENVIRONMENT_SPAWN } from '../../constants/hub-scene';
import { useEnvironmentSpawn } from '../../utils/environmentSpawn';

const PARTICLE_COUNT = 8000;
const CONDUIT_COLOR = '#7cfdfd';
const DISSOLVE_DURATION = 1.8;
const FUNNEL_DURATION = 1.7;
const TOTAL_DURATION = DISSOLVE_DURATION + FUNNEL_DURATION;
const COMPANION_HEIGHT = 1.5;

const CONV_START_Y = 0.0;
const CONV_END_Y = 2.2;
const LIFT_SPEED = 1.6;
const BLEND_DURATION = 1;

function easeOut(t: number): number {
  return 1 - (1 - t) ** 3;
}

const _tmpVec = new Vector3();

function sampleIdlePoseOrigins(
  scene: Object3D,
  count: number,
  spawnPos: [number, number, number],
): Float32Array | null {
  const meshes: SkinnedMesh[] = [];
  scene.traverse((node: Object3D) => {
    if (node instanceof SkinnedMesh && node.skeleton) meshes.push(node);
  });
  if (meshes.length === 0) return null;

  for (const m of meshes) {
    m.updateWorldMatrix(true, false);
    m.skeleton.update();
  }

  const origins = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const mesh = meshes[Math.floor(Math.random() * meshes.length)];
    const posAttr = mesh.geometry.attributes['position'] as BufferAttribute;
    const vi = Math.floor(Math.random() * posAttr.count);
    _tmpVec.fromBufferAttribute(posAttr, vi);
    mesh.applyBoneTransform(vi, _tmpVec);
    mesh.localToWorld(_tmpVec);
    origins[i * 3] = _tmpVec.x - spawnPos[0];
    origins[i * 3 + 1] = _tmpVec.y - spawnPos[1];
    origins[i * 3 + 2] = _tmpVec.z - spawnPos[2];
  }
  return origins;
}

function buildTposeOrigins(glbScene: Object3D, count: number): Float32Array {
  const raw: number[] = [];
  glbScene.traverse((node: Object3D) => {
    if (!(node instanceof SkinnedMesh)) return;
    const pos = node.geometry.attributes['position'] as BufferAttribute;
    for (let j = 0; j < pos.count; j++) {
      raw.push(pos.getX(j), pos.getY(j), pos.getZ(j));
    }
  });

  const vCount = raw.length / 3;
  const origins = new Float32Array(count * 3);
  if (vCount === 0) return origins;

  let minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let j = 0; j < raw.length; j += 3) {
    const y = raw[j + 1], z = raw[j + 2];
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }

  const useZAsHeight = maxZ - minZ > (maxY - minY) * 1.5;
  const hRange = useZAsHeight ? maxZ - minZ : maxY - minY;
  const hMin = useZAsHeight ? minZ : minY;
  const scale = COMPANION_HEIGHT / Math.max(hRange, 0.01);

  for (let i = 0; i < count; i++) {
    const vi = Math.floor(Math.random() * vCount) * 3;
    const vx = raw[vi], vy = raw[vi + 1], vz = raw[vi + 2];
    if (useZAsHeight) {
      origins[i * 3] = vx * scale;
      origins[i * 3 + 1] = (vz - hMin) * scale;
      origins[i * 3 + 2] = vy * scale;
    } else {
      origins[i * 3] = vx * scale;
      origins[i * 3 + 1] = (vy - hMin) * scale;
      origins[i * 3 + 2] = vz * scale;
    }
  }
  return origins;
}

function computeScatterBuffers(
  origins: Float32Array,
  count: number,
): { scatter: Float32Array; scatterEnd: Float32Array } {
  const scatter = new Float32Array(count * 3);
  const scatterEnd = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
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
  return { scatter, scatterEnd };
}

interface CompanionParticleDissolveProps {
  onComplete: () => void;
  parentWorldPosition?: [number, number, number];
}

export function CompanionParticleDissolve({
  onComplete,
  parentWorldPosition,
}: CompanionParticleDissolveProps) {
  const { scene: threeScene } = useThree();
  const envSpawnPos = useEnvironmentSpawn(ENVIRONMENT_SPAWN.editor, false);
  const spawnPos = parentWorldPosition ?? envSpawnPos;
  const { scene: glbScene } = useGLTF(COMPANION_BODY_GLB_URL);

  const elapsedRef = useRef(0);
  const completedRef = useRef(false);
  const sampledRef = useRef(false);
  const originsRef = useRef(new Float32Array(PARTICLE_COUNT * 3));
  const scatterRef = useRef(new Float32Array(PARTICLE_COUNT * 3));
  const scatterEndRef = useRef(new Float32Array(PARTICLE_COUNT * 3));

  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(PARTICLE_COUNT * 3), 3),
    );
    return g;
  }, []);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  useFrame((_s, dt) => {
    if (completedRef.current) return;

    if (!sampledRef.current) {
      sampledRef.current = true;
      // Prefer live idle pose (found when companion is still mounted+invisible in scene),
      // fall back to GLB T-pose (e.g. Editor where companion unmounts before dissolve).
      const origins =
        sampleIdlePoseOrigins(threeScene, PARTICLE_COUNT, spawnPos) ??
        buildTposeOrigins(glbScene, PARTICLE_COUNT);
      const { scatter, scatterEnd } = computeScatterBuffers(origins, PARTICLE_COUNT);
      originsRef.current = origins;
      scatterRef.current = scatter;
      scatterEndRef.current = scatterEnd;

      const posAttr = geometry.attributes['position'] as BufferAttribute;
      posAttr.array.set(origins);
      posAttr.needsUpdate = true;
      return;
    }

    elapsedRef.current += dt;
    const t = elapsedRef.current;
    const posAttr = geometry.attributes['position'] as BufferAttribute;
    const pos = posAttr.array as Float32Array;
    const origins = originsRef.current;
    const scatter = scatterRef.current;
    const scatterEnd = scatterEndRef.current;

    if (t < DISSOLVE_DURATION) {
      const progress = easeOut(t / DISSOLVE_DURATION);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        pos[i * 3] = origins[i * 3] + scatter[i * 3] * progress;
        pos[i * 3 + 1] = origins[i * 3 + 1] + scatter[i * 3 + 1] * progress;
        pos[i * 3 + 2] = origins[i * 3 + 2] + scatter[i * 3 + 2] * progress;
      }
      posAttr.needsUpdate = true;
    } else if (t < TOTAL_DURATION) {
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
    } else if (!completedRef.current) {
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
          depthTest={false}
        />
      </points>
    </group>
  );
}
