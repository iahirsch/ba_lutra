import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import type { CompanionConfig } from '@ba-praktisch/shared-types';
import type { PartCategory } from '../store/companion.store';
import { useFlowSocket, SCREENS } from '../store/useFlowSocket';
import { WorldCompanionPart } from '../components/hub/WorldCompanionPart';
import styles from './InteractionStage.module.scss';

// Constants
const RENDERED_PARTS: PartCategory[] = ['fur', 'eyes', 'nose', 'clothing'];

// TODO: Replace with a real animation callback once 3D exit animations exist
const EXIT_HOLD_MS = 3_500;

// 3D scene
function InteractionScene({ config }: { config: CompanionConfig }) {
  return (
    <Canvas
      camera={{ position: [0, 0.5, 3.25], fov: 38, near: 0.1, far: 100 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ alpha: true }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 3]} intensity={1.2} />
      <directionalLight position={[-2, 2, -2]} intensity={0.3} />
      <Suspense fallback={null}>
        {/* Lower in world space so the rig sits nearer the vertical center of the view. */}
        <group position={[0, -1.1, 0]}>
          {RENDERED_PARTS.map((part) => {
            const variantId = config[part];
            if (!variantId) return null;
            return (
              <WorldCompanionPart
                key={part}
                category={part}
                variantId={variantId}
                bodyMorphs={config.bodyMorphs}
              />
            );
          })}
        </group>
      </Suspense>
    </Canvas>
  );
}

// Dialogue bubble
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

// Page
export function InteractionStage() {
  const { flowState, notifyExitComplete } = useFlowSocket(SCREENS.INTERACTION);

  useEffect(() => {
    if (flowState?.creatorView.type !== 'transition') return;
    const timer = setTimeout(notifyExitComplete, EXIT_HOLD_MS);
    return () => clearTimeout(timer);
  }, [flowState?.stepId, flowState?.creatorView.type, notifyExitComplete]);

  return (
    <div className={styles.page}>
      {flowState && (
        <>
          <div className={styles.canvas}>
            <InteractionScene config={flowState.companionConfig} />
          </div>

          <div className={styles.dialogueOverlay}>
            <DialogueBubble
              companionName={flowState.companionName}
              text={flowState.companionDialogue}
              stepId={flowState.stepId}
            />
          </div>
        </>
      )}
    </div>
  );
}
