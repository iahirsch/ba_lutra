import {
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Group } from 'three';
import type {
  CompanionConfig,
  RenderedCompanionPart,
} from '@ba-praktisch/shared-types';
import { RENDERED_COMPANION_PARTS } from '@ba-praktisch/shared-types';
import { ENVIRONMENT_SPAWN, INTERACTION_CAMERA } from '../constants/hub-scene';
import { useEnvironmentSpawnTransform } from '../utils/environmentSpawn';
import { useFlowSocket, SCREENS } from '../hooks/useFlowSocket';
import { useTotalEffortScore } from '../hooks/useTotalEffortScore';
import { useCompanionAudio, preloadSpeech } from '../hooks/useCompanionAudio';
import { HubBackground } from '../components/hub/HubBackground';
import { EnvironmentVegetation } from '../components/common/EnvironmentVegetation';
import { HubLights } from '../components/hub/HubLights';
import { EnvironmentAtmosphere } from '../components/common/EnvironmentAtmosphere';
import { EnvironmentComposer } from '../components/common/EnvironmentComposer';
import { CompanionBody } from '../components/common/CompanionBodyGlb';
import { CompanionPartGlb } from '../components/common/CompanionPartGlb';
import { CompanionParticleReform } from '../components/common/CompanionParticleReform';
import { CompanionParticleDissolve } from '../components/common/CompanionParticleDissolve';
import { ConduitEnergyBurst } from '../components/common/ConduitEnergyBurst';
import { effortToConduitGlow } from '../utils/celShading';
import {
  isInteractionExitStep,
  resolveInteractionBodyClip,
} from '../constants/companion-flow-body-clips';
import styles from './Interaction.module.scss';

const EXIT_ANIMATION_FALLBACK_MS = 8_000;

const BACKPACK_HEIGHT_OFFSET = 1.3;

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

/** Rotation speed in radians per second — covers 180° in ~0.6 s. */
const TURN_SPEED = 5.0;

interface CompanionTurnGroupProps {
  position: [number, number, number];
  baseRotationY: number;
  showBackpack: boolean;
  visible?: boolean;
  children: ReactNode;
  onTurningChange?: (turning: boolean) => void;
  onTurnComplete?: () => void;
}

function CompanionTurnGroup({
  position,
  baseRotationY,
  showBackpack,
  visible = true,
  children,
  onTurningChange,
  onTurnComplete,
}: CompanionTurnGroupProps) {
  const groupRef = useRef<Group>(null);
  const turnOffsetRef = useRef(0);
  const isTurningRef = useRef(false);
  const onTurningChangeRef = useRef(onTurningChange);
  const onTurnCompleteRef = useRef(onTurnComplete);
  onTurningChangeRef.current = onTurningChange;
  onTurnCompleteRef.current = onTurnComplete;

  useFrame((_state, delta) => {
    const target = showBackpack ? Math.PI : 0;
    const diff = target - turnOffsetRef.current;
    const nowTurning = Math.abs(diff) >= 0.001;

    if (nowTurning !== isTurningRef.current) {
      isTurningRef.current = nowTurning;
      onTurningChangeRef.current?.(nowTurning);
      if (!nowTurning) onTurnCompleteRef.current?.();
    }

    if (!nowTurning) return;
    turnOffsetRef.current +=
      Math.sign(diff) * Math.min(Math.abs(diff), TURN_SPEED * delta);
    if (groupRef.current) {
      groupRef.current.rotation.y = baseRotationY + turnOffsetRef.current;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, baseRotationY, 0]}
      visible={visible}
    >
      {children}
    </group>
  );
}

interface InteractionSceneProps {
  companionConfig: CompanionConfig | null;
  stepId: string;
  activityEffortScore?: number | null;
  totalEffortScore?: number;
  onExitAnimationComplete?: () => void;
  showReform?: boolean;
  showDissolve?: boolean;
  showCompanion?: boolean;
  companionVisible?: boolean;
  onReformComplete?: () => void;
  onDissolveComplete?: () => void;
  conduitFlashTrigger?: number;
}

function InteractionScene({
  companionConfig,
  stepId,
  activityEffortScore,
  totalEffortScore,
  onExitAnimationComplete,
  showReform = false,
  showDissolve = false,
  showCompanion = true,
  companionVisible = true,
  onReformComplete,
  onDissolveComplete,
  conduitFlashTrigger,
}: InteractionSceneProps) {
  const { position: interactSpawn, rotationY: interactRotationY } =
    useEnvironmentSpawnTransform(ENVIRONMENT_SPAWN.interact);

  const showConduitGlow =
    activityEffortScore != null && activityEffortScore > 0;

  const isStoreEnergyStep = STORE_ENERGY_STEP_IDS.has(stepId);

  const [showBackpack, setShowBackpack] = useState(false);
  const [isTurning, setIsTurning] = useState(false);
  const [playWin, setPlayWin] = useState(false);

  useEffect(() => {
    if (stepId === 'store_energy_3') {
      setShowBackpack(false);
      setPlayWin(false);
    } else {
      setShowBackpack(isStoreEnergyStep);
    }
  }, [stepId, isStoreEnergyStep]);

  const winTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (winTimerRef.current) clearTimeout(winTimerRef.current);
    };
  }, [stepId]);

  const handleTurningChange = useCallback((turning: boolean) => {
    setIsTurning(turning);
  }, []);

  const handleTurnComplete = useCallback(() => {
    if (stepId === 'store_energy_3') {
      winTimerRef.current = setTimeout(() => setPlayWin(true), 600);
    }
  }, [stepId]);

  const activeClip = isTurning
    ? 'walking'
    : playWin
      ? 'win'
      : resolveInteractionBodyClip(stepId);

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
      <Suspense fallback={null}>
        <HubBackground totalEffortScore={totalEffortScore} />
        <EnvironmentVegetation totalEffortScore={totalEffortScore} />
        <ConduitEnergyBurst
          position={[
            interactSpawn[0],
            interactSpawn[1] + BACKPACK_HEIGHT_OFFSET,
            interactSpawn[2],
          ]}
          trigger={conduitFlashTrigger ?? 0}
          stepId={stepId}
        />
        {showReform && onReformComplete && (
          <CompanionParticleReform onComplete={onReformComplete} />
        )}
        {showDissolve && onDissolveComplete && (
          <CompanionParticleDissolve
            onComplete={onDissolveComplete}
            parentWorldPosition={interactSpawn}
          />
        )}
        {showCompanion && companionConfig && (
          <CompanionTurnGroup
            position={interactSpawn}
            baseRotationY={interactRotationY}
            showBackpack={showBackpack}
            visible={companionVisible}
            onTurningChange={handleTurningChange}
            onTurnComplete={handleTurnComplete}
          >
            <CompanionBody
              bodyMorphs={companionConfig.bodyMorphs ?? {}}
              furColor={companionConfig.furColor}
              eyeColor={companionConfig.eyeColor}
              noseColor={companionConfig.noseColor}
              activeClip={activeClip}
              activeClipKey={companionVisible ? stepId : `${stepId}-hidden`}
              onRestoredToIdle={
                isInteractionExitStep(stepId)
                  ? onExitAnimationComplete
                  : stepId === 'store_energy_3'
                    ? () => setPlayWin(false)
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
                        ? {
                            ...(companionConfig.bodyMorphs ?? {}),
                            cloth_on: companionConfig.clothingTop ? 1 : 0,
                          }
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
          </CompanionTurnGroup>
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
  const { flowState, notifyExitComplete, activityRefreshToken } = useFlowSocket(
    SCREENS.INTERACTION,
  );
  const liveEffort = useTotalEffortScore(activityRefreshToken);

  const prevStepRef = useRef<string | null>(null);
  const [reformState, setReformState] = useState<'idle' | 'reforming' | 'done'>(
    'idle',
  );
  const [dissolveActive, setDissolveActive] = useState(false);

  // For firstLook, the companion reforms after a delay and the wave animation
  // plays only once reform is done — hold audio back until that point.
  const isFirstLookPending =
    flowState?.stepId === 'firstLook' && reformState !== 'done';
  useCompanionAudio(
    isFirstLookPending ? undefined : flowState?.stepId,
    flowState?.companionDialogue ?? undefined,
  );

  useEffect(() => {
    if (!flowState || flowState.creatorView.type !== 'transition') return;
    if (!isInteractionExitStep(flowState.stepId)) return;
    const timer = setTimeout(notifyExitComplete, EXIT_ANIMATION_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [flowState, notifyExitComplete]);

  const [flashTrigger, setFlashTrigger] = useState(0);
  const prevStepForFlashRef = useRef('');

  useEffect(() => {
    const prev = prevStepRef.current;
    const curr = flowState?.stepId ?? null;
    prevStepRef.current = curr;

    if (prev === 'nameInput' && curr === 'firstLook') {
      // Kick off TTS fetch+decode now — we have ≥3.5 s before audio must play.
      if (flowState?.companionDialogue) {
        preloadSpeech(flowState.companionDialogue);
      }
      const timer = setTimeout(
        () => setReformState('reforming'),
        REFORM_DELAY_MS,
      );
      return () => clearTimeout(timer);
    }

    if (curr === null) {
      setReformState('idle');
      setDissolveActive(false);
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
  const startDissolve = useCallback(() => setDissolveActive(true), []);
  const handleDissolveComplete = useCallback(() => {
    notifyExitComplete();
  }, [notifyExitComplete]);

  const isFirstLook = flowState?.stepId === 'firstLook';
  const isNameInput = flowState?.stepId === 'nameInput';
  const showReform = isFirstLook && reformState === 'reforming';
  const showCompanion = !isNameInput;
  const companionVisible =
    (!isFirstLook || reformState === 'done') && !dissolveActive;
  const showDialogue =
    !!flowState?.companionDialogue && (!isFirstLook || reformState === 'done');

  return (
    <div className={styles.page}>
      <div className={styles.canvas}>
        <InteractionScene
          companionConfig={flowState?.companionConfig ?? null}
          stepId={flowState?.stepId ?? ''}
          activityEffortScore={flowState?.activityEffortScore}
          totalEffortScore={liveEffort}
          onExitAnimationComplete={startDissolve}
          showReform={showReform}
          showDissolve={dissolveActive}
          showCompanion={showCompanion}
          companionVisible={companionVisible}
          onReformComplete={handleReformComplete}
          onDissolveComplete={handleDissolveComplete}
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
