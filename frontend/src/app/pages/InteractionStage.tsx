import { Suspense, useEffect, useMemo, useRef, type RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { CompanionConfig } from '@ba-praktisch/shared-types';
import { EffectComposer, DepthOfField } from '@react-three/postprocessing';
import type { DepthOfFieldEffect } from 'postprocessing';
import { Vector3, type Object3D } from 'three';
import type { PartCategory } from '../store/companion.store';
import { useFlowSocket, SCREENS } from '../store/useFlowSocket';
import {
  HubEnvironment,
  HubSharedLights,
  HUB_CAMERA,
} from '../components/hub/HubEnvironment';
import { WorldCompanionPart } from '../components/hub/WorldCompanionPart';
import styles from './InteractionStage.module.scss';

const RENDERED_PARTS: PartCategory[] = [
  'fur',
  'eyes',
  'nose',
  'clothing',
  'backpack',
];

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

/** Local offset from companion root for DOF autofocus (upper body / face). */
const DOF_FOCUS_OFFSET: [number, number, number] = [0, 0.75, 0.15];

function DepthofField({
  focusAnchorRef,
}: {
  focusAnchorRef: RefObject<Object3D | null>;
}) {
  const dofRef = useRef<DepthOfFieldEffect>(null);
  const focusWorld = useMemo(() => new Vector3(), []);

  useFrame(() => {
    const anchor = focusAnchorRef.current;
    const effect = dofRef.current;
    if (!anchor || !effect?.target) return;
    anchor.getWorldPosition(focusWorld);
    effect.target.copy(focusWorld);
  });

  return (
    <EffectComposer enableNormalPass={false}>
      <DepthOfField
        ref={dofRef}
        bokehScale={5}
        height={480}
        target={focusWorld}
      />
    </EffectComposer>
  );
}

function InteractionScene({ companionConfig }: InteractionSceneProps) {
  const dofFocusAnchorRef = useRef<Object3D>(null);

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
            <object3D ref={dofFocusAnchorRef} position={DOF_FOCUS_OFFSET} />
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
      {companionConfig && <DepthofField focusAnchorRef={dofFocusAnchorRef} />}
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
