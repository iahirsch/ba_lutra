import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera as DreiCamera } from '@react-three/drei';
import { Vector3 } from 'three';
import type {
  CompanionConfig,
  RenderedCompanionPart,
} from '@ba-praktisch/shared-types';
import { RENDERED_COMPANION_PARTS } from '@ba-praktisch/shared-types';
import {
  ENVIRONMENT_SPAWN,
  INTERACTION_CAMERA,
  HUB_CAMERA,
} from '../constants/hub-scene';
import { useEnvironmentSpawn } from '../utils/environmentSpawn';
import { useFlowSocket, SCREENS } from '../hooks/useFlowSocket';
import { HubBackground } from '../components/hub/HubBackground';
import { EnvironmentVegetation } from '../components/common/EnvironmentVegetation';
import { HubLights } from '../components/hub/HubLights';
import { EnvironmentAtmosphere } from '../components/common/EnvironmentAtmosphere';
import { EnvironmentComposer } from '../components/common/EnvironmentComposer';
import { CompanionBody } from '../components/common/CompanionBodyGlb';
import { CompanionPartGlb } from '../components/common/CompanionPartGlb';
import { CompanionParticleReform } from '../components/common/CompanionParticleReform';
import { effortToConduitGlow } from '../utils/celShading';
import {
  isInteractionExitStep,
  resolveInteractionBodyClip,
} from '../constants/companion-flow-body-clips';
import styles from './Interaction.module.scss';

const EXIT_ANIMATION_FALLBACK_MS = 8_000;

const BACKPACK_ORBIT_ANGLE = Math.PI;

const BACKPACK_HEIGHT_OFFSET = 1.3;

/** Camera distances from the conduit per step. */
const VIEW_DISTANCES: Record<string, number> = {
  store_energy: 4.2,
  store_energy_1: 3.5,
  store_energy_2: 2.8,
  store_energy_3: 2.1,
};

/** Camera shake config per step. */
const SHAKE_CONFIG: Record<string, { duration: number; strength: number }> = {
  store_energy_1: { duration: 0.5, strength: 0.018 },
  store_energy_2: { duration: 0.7, strength: 0.032 },
  store_energy_3: { duration: 1.0, strength: 0.048 },
};

/** Lerp duration (seconds) for conduit glow after each flash. */
const CONDUIT_LERP_DURATIONS: Record<string, number> = {
  store_energy_1: 1.0,
  store_energy_2: 1.0,
  store_energy_3: 1.5,
};

const STORE_ENERGY_STEP_IDS = new Set([
  'store_energy',
  'store_energy_1',
  'store_energy_2',
  'store_energy_3',
]);

const FLASH_TRIGGER_STEPS = new Set([
  'store_energy_1',
  'store_energy_2',
  'store_energy_3',
]);

function getStoreEnergyGlowTarget(stepId: string, effort: number): number {
  if (stepId === 'store_energy') return 0.1;
  if (stepId === 'store_energy_1') return effortToConduitGlow(effort * (1 / 3));
  if (stepId === 'store_energy_2') return effortToConduitGlow(effort * (2 / 3));
  if (stepId === 'store_energy_3') return effortToConduitGlow(effort);
  return effortToConduitGlow(effort);
}

interface StoreEnergyCameraRigProps {
  stepId: string;
  spawnPos: [number, number, number];
}

function StoreEnergyCameraRig({ stepId, spawnPos }: StoreEnergyCameraRigProps) {
  const { camera } = useThree();

  const backpackPos = useMemo(
    () =>
      new Vector3(
        spawnPos[0],
        spawnPos[1] + BACKPACK_HEIGHT_OFFSET,
        spawnPos[2],
      ),
    [spawnPos],
  );

  const targetPos = useRef(
    new Vector3(...(HUB_CAMERA.position as [number, number, number])),
  );
  const targetLookAt = useRef(
    new Vector3(spawnPos[0], spawnPos[1] + 0.8, spawnPos[2]),
  );
  const currentLookAt = useRef(
    new Vector3(spawnPos[0], spawnPos[1] + 0.8, spawnPos[2]),
  );
  const shakeRef = useRef<{
    elapsed: number;
    duration: number;
    strength: number;
  } | null>(null);
  const swayTimeRef = useRef(0);
  const prevStepRef = useRef(stepId);

  useEffect(() => {
    const prev = prevStepRef.current;
    prevStepRef.current = stepId;
    if (prev === stepId) return;

    if (!STORE_ENERGY_STEP_IDS.has(stepId)) {
      targetPos.current.set(
        ...(HUB_CAMERA.position as [number, number, number]),
      );
      targetLookAt.current.set(spawnPos[0], spawnPos[1] + 0.8, spawnPos[2]);
      return;
    }

    const dist = VIEW_DISTANCES[stepId];
    if (dist !== undefined) {
      targetPos.current.set(
        spawnPos[0] + Math.sin(BACKPACK_ORBIT_ANGLE) * dist,
        spawnPos[1] + BACKPACK_HEIGHT_OFFSET + 0.2,
        spawnPos[2] + Math.cos(BACKPACK_ORBIT_ANGLE) * dist,
      );
    }
    targetLookAt.current.copy(backpackPos);

    const shake = SHAKE_CONFIG[stepId];
    if (shake) {
      shakeRef.current = { elapsed: 0, ...shake };
    }
  }, [stepId, spawnPos, backpackPos]);

  useFrame((_state, delta) => {
    if (!STORE_ENERGY_STEP_IDS.has(stepId)) return;

    const lerpSpeed = 2.5;
    const t = Math.min(delta * lerpSpeed, 1);

    camera.position.lerp(targetPos.current, t);
    currentLookAt.current.lerp(targetLookAt.current, t);

    // Gentle sway while waiting for first tap
    if (stepId === 'store_energy') {
      swayTimeRef.current += delta;
      const sway = Math.sin(swayTimeRef.current * Math.PI * 2 * 0.3) * 0.01;
      camera.position.x += sway;
    } else {
      swayTimeRef.current = 0;
    }

    // Decaying shake on step entry
    const shake = shakeRef.current;
    if (shake) {
      shake.elapsed += delta;
      if (shake.elapsed < shake.duration) {
        const decay = 1 - shake.elapsed / shake.duration;
        camera.position.x += (Math.random() - 0.5) * shake.strength * decay;
        camera.position.y += (Math.random() - 0.5) * shake.strength * decay;
        camera.position.z +=
          (Math.random() - 0.5) * shake.strength * 0.5 * decay;
      } else {
        shakeRef.current = null;
      }
    }

    camera.lookAt(currentLookAt.current);
  });

  return null;
}

interface InteractionSceneProps {
  companionConfig: CompanionConfig | null;
  stepId: string;
  activityEffortScore?: number | null;
  onExitAnimationComplete?: () => void;
  showReform?: boolean;
  showCompanion?: boolean;
  companionVisible?: boolean;
  onReformComplete?: () => void;
  conduitFlashTrigger?: number;
}

function InteractionScene({
  companionConfig,
  stepId,
  activityEffortScore,
  onExitAnimationComplete,
  showReform = false,
  showCompanion = true,
  companionVisible = true,
  onReformComplete,
  conduitFlashTrigger,
}: InteractionSceneProps) {
  const interactSpawn = useEnvironmentSpawn(ENVIRONMENT_SPAWN.interact);

  const showConduitGlow =
    activityEffortScore != null && stepId !== 'activity_finished';

  const isStoreEnergyStep = STORE_ENERGY_STEP_IDS.has(stepId);

  const conduitGlow = showConduitGlow
    ? isStoreEnergyStep
      ? getStoreEnergyGlowTarget(stepId, activityEffortScore ?? 0)
      : effortToConduitGlow(activityEffortScore ?? 0)
    : undefined;

  const conduitGlowTarget = showConduitGlow
    ? getStoreEnergyGlowTarget(stepId, activityEffortScore ?? 0)
    : undefined;

  const conduitLerpDuration = CONDUIT_LERP_DURATIONS[stepId];

  return (
    <Canvas
      camera={INTERACTION_CAMERA}
      gl={{ alpha: false }}
      style={{ width: '100%', height: '100%' }}
    >
      <EnvironmentAtmosphere variant="interaction" />
      <HubLights variant="interaction" />
      {/* Standalone free camera replaces the view-offset INTERACTION_CAMERA during the
          store_energy sequence. Drei restores INTERACTION_CAMERA on unmount, repairing
          the dual-screen panoramic seam automatically. */}
      {isStoreEnergyStep && (
        <DreiCamera
          makeDefault
          fov={HUB_CAMERA.fov}
          near={HUB_CAMERA.near}
          far={HUB_CAMERA.far}
          position={HUB_CAMERA.position}
        />
      )}
      <StoreEnergyCameraRig stepId={stepId} spawnPos={interactSpawn} />
      <Suspense fallback={null}>
        <HubBackground />
        <EnvironmentVegetation />
        {showReform && onReformComplete && (
          <CompanionParticleReform onComplete={onReformComplete} />
        )}
        {showCompanion && companionConfig && (
          <group position={interactSpawn} visible={companionVisible}>
            <CompanionBody
              bodyMorphs={companionConfig.bodyMorphs ?? {}}
              furColor={companionConfig.furColor}
              eyeColor={companionConfig.eyeColor}
              noseColor={companionConfig.noseColor}
              activeClip={resolveInteractionBodyClip(stepId)}
              activeClipKey={companionVisible ? stepId : `${stepId}-hidden`}
              onRestoredToIdle={
                isInteractionExitStep(stepId)
                  ? onExitAnimationComplete
                  : undefined
              }
            >
              {RENDERED_COMPANION_PARTS.map((part: RenderedCompanionPart) => {
                const variantId = companionConfig[part];
                if (!variantId) return null;
                return (
                  <CompanionPartGlb
                    key={part}
                    category={part}
                    variantId={variantId}
                    bodyMorphs={
                      part === 'backpack'
                        ? { ...(companionConfig.bodyMorphs ?? {}), cloth_on: companionConfig.clothingTop ? 1 : 0 }
                        : (companionConfig.bodyMorphs ?? {})
                    }
                    conduitGlow={part === 'backpack' ? conduitGlow : undefined}
                    conduitFlashTrigger={
                      part === 'backpack' ? conduitFlashTrigger : undefined
                    }
                    conduitGlowTarget={
                      part === 'backpack' ? conduitGlowTarget : undefined
                    }
                    conduitLerpDuration={
                      part === 'backpack' ? conduitLerpDuration : undefined
                    }
                  />
                );
              })}
            </CompanionBody>
          </group>
        )}
      </Suspense>
      <EnvironmentComposer variant="interaction" />
    </Canvas>
  );
}

interface DialogueBubbleProps {
  companionName: string | null;
  text: string;
  stepId: string;
}

function DialogueBubble({ companionName, text, stepId }: DialogueBubbleProps) {
  return (
    <div className={styles.bubble}>
      {companionName && (
        <span className={styles.companionName}>{companionName}</span>
      )}
      <p className={styles.text} key={stepId}>
        {text}
      </p>
    </div>
  );
}

const REFORM_DELAY_MS = 3500;

export function Interaction() {
  const { flowState, notifyExitComplete } = useFlowSocket(SCREENS.INTERACTION);

  useEffect(() => {
    if (!flowState || flowState.creatorView.type !== 'transition') return;
    if (!isInteractionExitStep(flowState.stepId)) return;
    const timer = setTimeout(notifyExitComplete, EXIT_ANIMATION_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [flowState, notifyExitComplete]);

  const prevStepRef = useRef<string | null>(null);
  const [reformState, setReformState] = useState<'idle' | 'reforming' | 'done'>(
    'idle',
  );

  const [flashTrigger, setFlashTrigger] = useState(0);
  const prevStepForFlashRef = useRef('');

  useEffect(() => {
    const prev = prevStepRef.current;
    const curr = flowState?.stepId ?? null;
    prevStepRef.current = curr;

    if (prev === 'nameInput' && curr === 'firstLook') {
      const timer = setTimeout(
        () => setReformState('reforming'),
        REFORM_DELAY_MS,
      );
      return () => clearTimeout(timer);
    }

    if (curr === null) {
      setReformState('idle');
    }
  }, [flowState?.stepId]);

  useEffect(() => {
    const curr = flowState?.stepId ?? '';
    if (curr !== prevStepForFlashRef.current && FLASH_TRIGGER_STEPS.has(curr)) {
      setFlashTrigger((n) => n + 1);
    }
    prevStepForFlashRef.current = curr;
  }, [flowState?.stepId]);

  const handleReformComplete = useCallback(() => setReformState('done'), []);

  const isFirstLook = flowState?.stepId === 'firstLook';
  const isNameInput = flowState?.stepId === 'nameInput';
  const showReform = isFirstLook && reformState === 'reforming';
  const showCompanion = !isNameInput;
  const companionVisible = !isFirstLook || reformState === 'done';
  const showDialogue =
    !!flowState?.companionDialogue && (!isFirstLook || reformState === 'done');

  return (
    <div className={styles.page}>
      <div className={styles.canvas}>
        <InteractionScene
          companionConfig={flowState?.companionConfig ?? null}
          stepId={flowState?.stepId ?? ''}
          activityEffortScore={flowState?.activityEffortScore}
          onExitAnimationComplete={notifyExitComplete}
          showReform={showReform}
          showCompanion={showCompanion}
          companionVisible={companionVisible}
          onReformComplete={handleReformComplete}
          conduitFlashTrigger={flashTrigger}
        />
      </div>

      {showDialogue && flowState && (
        <div className={styles.dialogueOverlay}>
          <DialogueBubble
            companionName={flowState.companionName}
            text={flowState.companionDialogue}
            stepId={flowState.stepId}
          />
        </div>
      )}
    </div>
  );
}
