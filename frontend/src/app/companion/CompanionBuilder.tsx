import { Component, type ReactNode } from 'react';
import { CompanionScene } from './scene/CompanionScene';
import { CompanionBody } from './scene/CompanionBody';
import { CompanionPart } from './scene/CompanionPart';
import { CustomizationPanel } from './ui/CustomizationPanel';
import { useCompanionStore } from './store/companion.store';
import styles from './CompanionBuilder.module.scss';

// Error Boundary
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

// Scene Contents
function SceneContents() {
  const { eyes, nose, ears, tail, backpack } = useCompanionStore();

  return (
    <>
      <CompanionBody />
      {eyes && <CompanionPart category="eyes" variantId={eyes} />}
      {nose && <CompanionPart category="nose" variantId={nose} />}
      {ears && <CompanionPart category="ears" variantId={ears} />}
      {tail && <CompanionPart category="tail" variantId={tail} />}
      {backpack && <CompanionPart category="backpack" variantId={backpack} />}
    </>
  );
}

// Page
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
