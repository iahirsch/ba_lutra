import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useLoader } from '@react-three/fiber';
import {
  Color,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  TextureLoader,
  type Material,
} from 'three';
import { EditorCanvas } from '../components/editor/EditorCanvas';
import { EditorBody } from '../components/editor/EditorBody';
import { EditorGlbPart } from '../components/editor/EditorGlbPart';
import { EditorPanel } from '../components/editor/EditorPanel';
import { EditorFlowPanel } from '../components/editor/EditorFlowPanel';
import { CompanionParticleDissolve } from '../components/common/CompanionParticleDissolve';
import '../constants/companion-part-variants';
import { useCompanionStore, DEFAULT_CONFIG } from '../store/companionStore';
import { useFlowSocket, SCREENS } from '../hooks/useFlowSocket';
import type { FlowStateUpdate } from '@ba-praktisch/shared-types';
import {
  ENVIRONMENT_SPAWN,
  HUB_GLTF_URL,
  HUB_TERRAIN_MESH_NAME,
} from '../constants/hub-scene';
import { applyCelShading, applyHubTerrainMaterial } from '../utils/celShading';
import {
  attachTerrainGrowShader,
  setTerrainGrowReveal,
} from '../utils/terrainMaterial';
import * as veg from '../constants/environment-vegetation';
import { useEnvironmentSpawn } from '../utils/environmentSpawn';
import styles from './Editor.module.scss';

useGLTF.preload(HUB_GLTF_URL);

function EditorBackgroundMesh() {
  const { scene } = useGLTF(HUB_GLTF_URL);
  const [
    sandColor,
    sandNormal,
    sandHeight,
    grassColor,
    grassNormal,
    dirtColor,
    dirtNormal,
  ] = useLoader(TextureLoader, [
    veg.GROUND_SAND_COLOR_URL,
    veg.GROUND_SAND_NORMAL_URL,
    veg.GROUND_SAND_HEIGHT_URL,
    veg.GROUND_GRASS_COLOR_URL,
    veg.GROUND_GRASS_NORMAL_URL,
    veg.GROUND_DIRT_COLOR_URL,
    veg.GROUND_DIRT_NORMAL_URL,
  ]);

  const dimmedScene = useMemo(() => {
    const root = scene.clone(true);
    applyHubTerrainMaterial(root);

    // Convert terrain to MeshToonMaterial so the texture pipeline works
    const terrainNode = root.getObjectByName(HUB_TERRAIN_MESH_NAME);
    if (terrainNode) applyCelShading(terrainNode);

    attachTerrainGrowShader(root, {
      sandColor,
      sandNormal,
      sandHeight,
      grassColor,
      grassNormal,
      dirtColor,
      dirtNormal,
    });

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
  }, [
    scene,
    sandColor,
    sandNormal,
    sandHeight,
    grassColor,
    grassNormal,
    dirtColor,
    dirtNormal,
  ]);

  // No grow animation in Editor — hold terrain at fully revealed state
  useFrame(() => {
    setTerrainGrowReveal(0, 0, 0, 0);
  });

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
  const prevStepRef = useRef<string | null>(null);
  const [showVFX, setShowVFX] = useState(false);

  useEffect(() => {
    const wasInFlow = prevFlowRef.current !== null;
    const flowJustEnded = wasInFlow && flowState === null;

    if (flowJustEnded) {
      useCompanionStore.setState({
        ...DEFAULT_CONFIG,
        activeSection: 'lutra',
        activeCategory: 'body',
      });
      setShowVFX(false);
    }

    prevFlowRef.current = flowState;
  }, [flowState]);

  useEffect(() => {
    const prev = prevStepRef.current;
    const curr = flowState?.stepId ?? null;
    prevStepRef.current = curr;

    if (curr === 'nameInput') {
      // Move camera to a comfortable full-body view for name input
      useCompanionStore.setState({ activeCategory: 'fur' });
    }

    if (prev === 'nameInput' && curr === 'firstLook') {
      setShowVFX(true);
    }
  }, [flowState?.stepId]);

  const handleVFXComplete = useCallback(() => setShowVFX(false), []);

  const isNameInput = flowState?.creatorView.type === 'name-input';
  // Companion stays visible during nameInput (behind the blur panel) and during VFX
  const showCompanion = !flowState || isNameInput;

  return (
    <div className={styles.page}>
      {!flowState && <div className={styles.header}>Lutra erstellen</div>}
      <div className={styles.canvasZone}>
        <EditorCanvas disableDOF={showVFX}>
          <Suspense fallback={null}>
            <EditorBackgroundMesh />
          </Suspense>
          {showCompanion && !showVFX && <EditorSceneParts />}
          {showVFX && <CompanionParticleDissolve onComplete={handleVFXComplete} />}
        </EditorCanvas>
      </div>
      {!flowState && (
        <div className={styles.panelZone}>
          <EditorPanel />
        </div>
      )}
      {flowState && !showVFX && (
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
