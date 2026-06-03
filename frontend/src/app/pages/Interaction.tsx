import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import type {
  CompanionConfig,
  RenderedCompanionPart,
} from '@ba-praktisch/shared-types';
import { RENDERED_COMPANION_PARTS } from '@ba-praktisch/shared-types';
import { ENVIRONMENT_SPAWN, INTERACTION_CAMERA } from '../constants/hub-scene';
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

/** Safety net if the wave clip is missing or fails to finish. */
const EXIT_ANIMATION_FALLBACK_MS = 8_000;

interface InteractionSceneProps {
  companionConfig: CompanionConfig | null;
  stepId: string;
  activityEffortScore?: number | null;
  onExitAnimationComplete?: () => void;
  showReform?: boolean;
  /** Mount the companion in the scene (allows animation to warm up). */
  showCompanion?: boolean;
  /** Three.js group visibility — false keeps the group ticking but invisible. */
  companionVisible?: boolean;
  onReformComplete?: () => void;
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
}: InteractionSceneProps) {
  const interactSpawn = useEnvironmentSpawn(ENVIRONMENT_SPAWN.interact);
  const showConduitGlow =
    activityEffortScore !== null && activityEffortScore !== undefined;
  const conduitGlow = showConduitGlow
    ? effortToConduitGlow(activityEffortScore)
    : undefined;

  return (
    <Canvas
      camera={INTERACTION_CAMERA}
      gl={{ alpha: false }}
      style={{ width: '100%', height: '100%' }}
    >
      <EnvironmentAtmosphere variant="interaction" />
      <HubLights variant="interaction" />
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
                    bodyMorphs={companionConfig.bodyMorphs ?? {}}
                    conduitGlow={part === 'backpack' ? conduitGlow : undefined}
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

/** Delay before reform particles appear — gives the Editor dissolve+fly time to finish. */
const REFORM_DELAY_MS = 3500;

export function Interaction() {
  const { flowState, notifyExitComplete } = useFlowSocket(SCREENS.INTERACTION);

  useEffect(() => {
    if (!flowState || flowState.creatorView.type !== 'transition') return;
    if (!isInteractionExitStep(flowState.stepId)) return;
    const timer = setTimeout(notifyExitComplete, EXIT_ANIMATION_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [flowState, notifyExitComplete]);

  // Reform state: tracks the particle rebuild animation on first companion appearance
  const prevStepRef = useRef<string | null>(null);
  const [reformState, setReformState] = useState<'idle' | 'reforming' | 'done'>('idle');

  useEffect(() => {
    const prev = prevStepRef.current;
    const curr = flowState?.stepId ?? null;
    prevStepRef.current = curr;

    if (prev === 'nameInput' && curr === 'firstLook') {
      const timer = setTimeout(() => setReformState('reforming'), REFORM_DELAY_MS);
      return () => clearTimeout(timer);
    }

    if (curr === null) {
      setReformState('idle');
    }
  }, [flowState?.stepId]);

  const handleReformComplete = useCallback(() => setReformState('done'), []);

  const isFirstLook = flowState?.stepId === 'firstLook';
  const isNameInput = flowState?.stepId === 'nameInput';
  const showReform = isFirstLook && reformState === 'reforming';
  // Mount companion during reform so the animation mixer warms up (avoids T-pose on reveal).
  // Keep it hidden until reform completes; never mount during nameInput (companion not yet born).
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
        />
      </div>

      {showDialogue && (
        <div className={styles.dialogueOverlay}>
          <DialogueBubble
            companionName={flowState!.companionName}
            text={flowState!.companionDialogue!}
            stepId={flowState!.stepId}
          />
        </div>
      )}
    </div>
  );
}
