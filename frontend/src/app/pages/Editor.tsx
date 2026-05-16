import { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import {
  Color,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Material,
} from 'three';
import { EditorCanvas } from '../components/editor/EditorCanvas';
import { EditorBody } from '../components/editor/EditorBody';
import { EditorGlbPart } from '../components/editor/EditorGlbPart';
import { EditorPanel } from '../components/editor/EditorPanel';
import { EditorFlowPanel } from '../components/editor/EditorFlowPanel';
import '../constants/companion-part-variants';
import { useCompanionStore, DEFAULT_CONFIG } from '../store/companionStore';
import { useFlowSocket, SCREENS } from '../hooks/useFlowSocket';
import { HUB_GLTF_URL, type FlowStateUpdate } from '@ba-praktisch/shared-types';
import styles from './Editor.module.scss';

useGLTF.preload(HUB_GLTF_URL);

function EditorBackgroundMesh() {
  const { scene } = useGLTF(HUB_GLTF_URL);

  const dimmedScene = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((node) => {
      if (!(node instanceof Mesh) || !node.material) return;

      const tintMaterial = (mat: Material) => {
        const m = mat.clone();
        const c = (m as { color?: Color }).color;
        if (c instanceof Color) c.multiplyScalar(0.9);
        if (
          m instanceof MeshStandardMaterial ||
          m instanceof MeshPhysicalMaterial
        ) {
          m.roughness = Math.min(1, m.roughness + 0.06);
          m.metalness *= 0.9;
        }
        return m;
      };

      node.material = Array.isArray(node.material)
        ? node.material.map(tintMaterial)
        : tintMaterial(node.material);
    });
    return root;
  }, [scene]);

  return <primitive object={dimmedScene} />;
}

function EditorSceneParts() {
  const { eyes, clothing, backpack } = useCompanionStore();
  return (
    <>
      <EditorBody />
      {eyes && <EditorGlbPart category="eyes" variantId={eyes} />}
      {clothing && <EditorGlbPart category="clothing" variantId={clothing} />}
      {backpack && <EditorGlbPart category="backpack" variantId={backpack} />}
    </>
  );
}

export function Editor() {
  const { flowState, submitName, selectChoice, confirmAction } = useFlowSocket(
    SCREENS.EDITOR,
  );

  const prevFlowRef = useRef<FlowStateUpdate | null>(null);

  useEffect(() => {
    const wasInFlow = prevFlowRef.current !== null;
    const flowJustEnded = wasInFlow && flowState === null;

    if (flowJustEnded) {
      useCompanionStore.setState({ ...DEFAULT_CONFIG, activeCategory: 'body' });
    }

    prevFlowRef.current = flowState;
  }, [flowState]);

  if (flowState) {
    return (
      <div className={styles.page}>
        <EditorFlowPanel
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
        <EditorCanvas>
          <EditorBackgroundMesh />
          <EditorSceneParts />
        </EditorCanvas>
      </div>
      <div className={styles.panelZone}>
        <EditorPanel />
      </div>
    </div>
  );
}
