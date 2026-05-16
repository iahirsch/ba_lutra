import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { AnimationClip, Object3D } from 'three';
import {
  COMPANION_BODY_CLIP_PLAYBACK,
  DEFAULT_COMPANION_BODY_CLIP,
  type CompanionBodyClip,
} from '../constants/companion-body-clips';
import {
  createCompanionAnimationController,
  type CompanionAnimationController,
} from '../utils/companionAnimationController';

export function useCompanionBodyAnimation(
  scene: Object3D | null,
  clips: AnimationClip[],
  activeClip: CompanionBodyClip = DEFAULT_COMPANION_BODY_CLIP,
  activeClipKey?: string,
  onRestoredToIdle?: () => void,
): void {
  const controllerRef = useRef<CompanionAnimationController | null>(null);
  const onRestoredToIdleRef = useRef(onRestoredToIdle);
  onRestoredToIdleRef.current = onRestoredToIdle;

  useEffect(() => {
    if (!scene) return;

    const controller = createCompanionAnimationController(scene, clips, {
      onRestoredToIdle: () => onRestoredToIdleRef.current?.(),
    });
    controllerRef.current = controller;

    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
  }, [scene, clips]);

  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller) return;

    const { once } = COMPANION_BODY_CLIP_PLAYBACK[activeClip];
    controller.crossFadeTo(activeClip, { once });
  }, [activeClip, activeClipKey]);

  useFrame((_state, delta) => {
    controllerRef.current?.update(delta);
  });
}
