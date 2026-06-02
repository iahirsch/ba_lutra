import { Suspense, useEffect, useMemo, useRef } from 'react';
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
import type { FlowStateUpdate } from '@ba-praktisch/shared-types';
import {
  ENVIRONMENT_SPAWN,
  HUB_GLTF_URL,
  HUB_TERRAIN_MESH_NAME,
} from '../constants/hub-scene';
import { applyHubTerrainMaterial } from '../utils/celShading';
import { useEnvironmentSpawn } from '../utils/environmentSpawn';
import { EnvironmentVegetation } from '../components/common/EnvironmentVegetation';
import styles from './Editor.module.scss';

useGLTF.preload(HUB_GLTF_URL);

function EditorBackgroundMesh() {
  const { scene } = useGLTF(HUB_GLTF_URL);

  const dimmedScene = useMemo(() => {
    const root = scene.clone(true);
    applyHubTerrainMaterial(root);
    root.traverse((node) => {
      if (!(node instanceof Mesh) || !node.material) return;
      if (node.name === HUB_TERRAIN_MESH_NAME) return;

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
  const { clothingTop, clothingBottom, backpack } = useCompanionStore();
  const editorSpawn = useEnvironmentSpawn(ENVIRONMENT_SPAWN.editor, false);

  return (
    <group position={editorSpawn}>
      <EditorBody>
        {clothingTop && (
          <EditorGlbPart category="clothingTop" variantId={clothingTop} />
        )}
        {clothingBottom && (
          <EditorGlbPart category="clothingBottom" variantId={clothingBottom} />
        )}
        {backpack && <EditorGlbPart category="backpack" variantId={backpack} />}
      </EditorBody>
    </group>
  );
}

export function Editor() {
  const {
    flowState,
    submitName,
    selectChoice,
    confirmAction,
    resetFlow,
    notifyExitComplete,
  } = useFlowSocket(SCREENS.EDITOR);

  const prevFlowRef = useRef<FlowStateUpdate | null>(null);

  useEffect(() => {
    const wasInFlow = prevFlowRef.current !== null;
    const flowJustEnded = wasInFlow && flowState === null;

    if (flowJustEnded) {
      useCompanionStore.setState({
        ...DEFAULT_CONFIG,
        activeSection: 'lutra',
        activeCategory: 'body',
      });
    }

    prevFlowRef.current = flowState;
  }, [flowState]);

  return (
    <div className={styles.page}>
      {!flowState && <div className={styles.header}>Lutra erstellen</div>}
      <div className={styles.canvasZone}>
        <EditorCanvas>
          <Suspense fallback={null}>
            <EditorBackgroundMesh />
            <EnvironmentVegetation applyEnvironmentTransform={false} />
          </Suspense>
          {!flowState && <EditorSceneParts />}
        </EditorCanvas>
      </div>
      {!flowState && (
        <div className={styles.panelZone}>
          <EditorPanel />
        </div>
      )}
      {flowState && (
        <EditorFlowPanel
          flowState={flowState}
          onSubmitName={submitName}
          onSelectChoice={selectChoice}
          onConfirmAction={confirmAction}
          onResetFlow={resetFlow}
          onExitComplete={notifyExitComplete}
        />
      )}
    </div>
  );
}
