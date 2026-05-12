import { Component, useEffect, useRef, type ReactNode } from 'react';
import { CompanionScene } from '../components/companion/CompanionScene';
import { CompanionPart } from '../components/companion/CompanionPart';
import { CustomizationPanel } from '../components/companion/ui/CustomizationPanel';
import { FlowPanel } from '../components/interaction/FlowPanel';
import { useCompanionStore, DEFAULT_CONFIG } from '../store/companion.store';
import { useFlowSocket, SCREENS } from '../store/useFlowSocket';
import type { FlowStateUpdate } from '@ba-praktisch/shared-types';
import styles from './CompanionBuilder.module.scss';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class SceneErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorState}>
          <p>Could not load 3D scene.</p>
          <small>{this.state.message}</small>
        </div>
      );
    }
    return this.props.children;
  }
}

function SceneContents() {
  const { fur, eyes, nose, clothing, backpack } = useCompanionStore();
  return (
    <>
      {fur && <CompanionPart category="fur" variantId={fur} />}
      {eyes && <CompanionPart category="eyes" variantId={eyes} />}
      {nose && <CompanionPart category="nose" variantId={nose} />}
      {clothing && <CompanionPart category="clothing" variantId={clothing} />}
      {backpack && <CompanionPart category="backpack" variantId={backpack} />}
      {/* TODO: ears, tail, backpack: reserved — add when GLB assets are ready */}
    </>
  );
}

// Page
export function CompanionBuilder() {
  const { flowState, submitName, selectChoice, confirmAction } = useFlowSocket(
    SCREENS.CREATOR,
  );

  const prevFlowRef = useRef<FlowStateUpdate | null>(null);

  useEffect(() => {
    const wasInFlow = prevFlowRef.current !== null;
    const flowJustEnded = wasInFlow && flowState === null;

    if (flowJustEnded) {
      // Reset the companion builder so the next user starts with a clean slate.
      useCompanionStore.setState({ ...DEFAULT_CONFIG, activeCategory: 'body' });
    }

    prevFlowRef.current = flowState;
  }, [flowState]);

  if (flowState) {
    return (
      <div className={styles.page}>
        <FlowPanel
          flowState={flowState}
          onSubmitName={submitName}
          onSelectChoice={selectChoice}
          onConfirmAction={confirmAction}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.canvasZone}>
        <SceneErrorBoundary>
          <CompanionScene>
            <SceneContents />
          </CompanionScene>
        </SceneErrorBoundary>
      </div>
      <div className={styles.panelZone}>
        <CustomizationPanel />
      </div>
    </div>
  );
}
