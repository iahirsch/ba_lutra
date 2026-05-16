import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { AnimationClip, Object3D } from 'three';
import {
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
): void {
  const controllerRef = useRef<CompanionAnimationController | null>(null);

  useEffect(() => {
    if (!scene) return;

    const controller = createCompanionAnimationController(scene, clips);
    controllerRef.current = controller;

    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
  }, [scene, clips]);

  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller) return;

    if (activeClip === DEFAULT_COMPANION_BODY_CLIP) {
      controller.crossFadeTo(DEFAULT_COMPANION_BODY_CLIP);
      return;
    }

    controller.crossFadeTo(activeClip, { once: true });
  }, [activeClip]);

  useFrame((_state, delta) => {
    controllerRef.current?.update(delta);
  });
}
