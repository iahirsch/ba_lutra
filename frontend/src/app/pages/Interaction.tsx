import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import type {
  CompanionConfig,
  RenderedCompanionPart,
} from '@ba-praktisch/shared-types';
import {
  HUB_CAMERA,
  RENDERED_COMPANION_PARTS,
} from '@ba-praktisch/shared-types';
import { useFlowSocket, SCREENS } from '../hooks/useFlowSocket';
import { HubBackground } from '../components/hub/HubBackground';
import { HubLights } from '../components/hub/HubLights';
import { CompanionBody } from '../components/common/CompanionBodyGlb';
import { CompanionPartGlb } from '../components/common/CompanionPartGlb';
import styles from './Interaction.module.scss';

// TODO: Replace with a real animation callback once 3D exit animations exist
const EXIT_HOLD_MS = 3_500;

interface InteractionSceneProps {
  companionConfig: CompanionConfig | null;
}

const INTERACTION_CANVAS_CAMERA = {
  position: [...HUB_CAMERA.position] as [number, number, number],
  fov: HUB_CAMERA.fov,
  near: HUB_CAMERA.near,
  far: HUB_CAMERA.far,
};

function InteractionScene({ companionConfig }: InteractionSceneProps) {
  return (
    <Canvas
      camera={INTERACTION_CANVAS_CAMERA}
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
            />
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
    if (flowState?.creatorView.type !== 'transition') return;
    const timer = setTimeout(notifyExitComplete, EXIT_HOLD_MS);
    return () => clearTimeout(timer);
  }, [flowState?.stepId, flowState?.creatorView.type, notifyExitComplete]);

  return (
    <div className={styles.page}>
      <div className={styles.canvas}>
        <InteractionScene
          companionConfig={flowState?.companionConfig ?? null}
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
