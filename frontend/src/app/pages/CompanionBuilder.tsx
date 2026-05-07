import { Component, type ReactNode } from 'react';
import { CompanionScene } from '../components/companion/CompanionScene';
import { CompanionPart } from '../components/companion/CompanionPart';
import { CustomizationPanel } from '../components/companion/ui/CustomizationPanel';
import { useCompanionStore } from '../store/companion.store';
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
  const { fur, eyes, nose, clothing } = useCompanionStore();
  return (
    <>
      {fur && <CompanionPart category="fur" variantId={fur} />}
      {eyes && <CompanionPart category="eyes" variantId={eyes} />}
      {nose && <CompanionPart category="nose" variantId={nose} />}
      {clothing && <CompanionPart category="clothing" variantId={clothing} />}
      {/* TODO: ears, tail, backpack: reserved — add when GLB assets are ready */}
    </>
  );
}

export function CompanionBuilder() {
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
