import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import type {
  CompanionConfig,
  RenderedCompanionPart,
} from '@ba-praktisch/shared-types';
import {
  INTERACTION_CAMERA,
  RENDERED_COMPANION_PARTS,
} from '@ba-praktisch/shared-types';
import { useFlowSocket, SCREENS } from '../hooks/useFlowSocket';
import { HubBackground } from '../components/hub/HubBackground';
import { HubLights } from '../components/hub/HubLights';
import { CompanionBody } from '../components/common/CompanionBodyGlb';
import { CompanionPartGlb } from '../components/common/CompanionPartGlb';
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
  onExitAnimationComplete?: () => void;
}

function InteractionScene({
  companionConfig,
  stepId,
  onExitAnimationComplete,
}: InteractionSceneProps) {
  return (
    <Canvas
      camera={INTERACTION_CAMERA}
      gl={{ alpha: false }}
      style={{ width: '100%', height: '100%' }}
    >
      <HubLights />
      <Suspense fallback={null}>
        <HubBackground />
        {companionConfig && (
          <group position={[0, 0.4, 8.5]}>
            <CompanionBody
              bodyMorphs={companionConfig.bodyMorphs ?? {}}
              furColor={companionConfig.furColor}
              eyeColor={companionConfig.eyeColor}
              noseColor={companionConfig.noseColor}
              activeClip={resolveInteractionBodyClip(stepId)}
              activeClipKey={stepId}
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
                  />
                );
              })}
            </CompanionBody>
          </group>
        )}
      </Suspense>
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

export function Interaction() {
  const { flowState, notifyExitComplete } = useFlowSocket(SCREENS.INTERACTION);

  useEffect(() => {
    if (!flowState || flowState.creatorView.type !== 'transition') return;
    if (!isInteractionExitStep(flowState.stepId)) return;
    const timer = setTimeout(notifyExitComplete, EXIT_ANIMATION_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [flowState, notifyExitComplete]);

  return (
    <div className={styles.page}>
      <div className={styles.canvas}>
        <InteractionScene
          companionConfig={flowState?.companionConfig ?? null}
          stepId={flowState?.stepId ?? ''}
          onExitAnimationComplete={notifyExitComplete}
        />
      </div>

      {flowState && (
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
