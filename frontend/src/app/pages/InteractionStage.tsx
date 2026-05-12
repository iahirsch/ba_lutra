import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import type { CompanionConfig } from '@ba-praktisch/shared-types';
import type { PartCategory } from '../store/companion.store';
import { useFlowSocket, SCREENS } from '../store/useFlowSocket';
import {
  HubEnvironment,
  HubSharedLights,
  HUB_CAMERA,
} from '../components/hub/HubEnvironment';
import { WorldCompanionPart } from '../components/hub/WorldCompanionPart';
import styles from './InteractionStage.module.scss';

const RENDERED_PARTS: PartCategory[] = ['fur', 'eyes', 'nose', 'clothing'];

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
      <HubSharedLights />
      <Suspense fallback={null}>
        <HubEnvironment />
        {companionConfig && (
          <group position={[0, 0.4, 8.5]}>
            {RENDERED_PARTS.map((part) => {
              const variantId = companionConfig[part];
              if (!variantId) return null;
              return (
                <WorldCompanionPart
                  key={part}
                  category={part}
                  variantId={variantId}
                  bodyMorphs={companionConfig.bodyMorphs}
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

export function InteractionStage() {
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
