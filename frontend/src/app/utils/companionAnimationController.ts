import {
  AnimationAction,
  AnimationClip,
  AnimationMixer,
  LoopOnce,
  LoopRepeat,
  Object3D,
} from 'three';
import type { CompanionBodyClip } from '../constants/companion-body-clips';
import { isCompanionBodyClip } from '../constants/companion-body-clips';

export const DEFAULT_CROSSFADE_DURATION = 0.3;

export type CrossFadeOptions = {
  /** Crossfade length in seconds. Default: 0.3 */
  duration?: number;
  /** Play once, then crossfade back to idle. Default: false */
  once?: boolean;
};

export type CompanionAnimationController = {
  crossFadeTo: (clip: CompanionBodyClip, options?: CrossFadeOptions) => void;
  update: (delta: number) => void;
  dispose: () => void;
};

function setWeight(action: AnimationAction, weight: number): void {
  action.enabled = true;
  action.setEffectiveTimeScale(1);
  action.setEffectiveWeight(weight);
}

function executeCrossFade(
  startAction: AnimationAction,
  endAction: AnimationAction,
  duration: number,
): void {
  setWeight(endAction, 1);
  endAction.time = 0;
  startAction.crossFadeTo(endAction, duration, true);
}

export function createCompanionAnimationController(
  root: Object3D,
  clips: AnimationClip[],
): CompanionAnimationController {
  const mixer = new AnimationMixer(root);
  const actions = new Map<CompanionBodyClip, AnimationAction>();
  let currentClip: CompanionBodyClip = 'idle';

  for (const clip of clips) {
    if (!isCompanionBodyClip(clip.name)) continue;
    actions.set(clip.name, mixer.clipAction(clip));
  }

  const idleAction = actions.get('idle');
  if (idleAction) {
    setWeight(idleAction, 1);
    idleAction.play();
  } else {
    console.warn('[companionAnimation] body.glb is missing an "idle" clip');
  }

  let onFinished: ((event: { action: AnimationAction }) => void) | null = null;

  function clearFinishedListener(): void {
    if (!onFinished) return;
    mixer.removeEventListener('finished', onFinished);
    onFinished = null;
  }

  function crossFadeTo(
    clipName: CompanionBodyClip,
    options: CrossFadeOptions = {},
  ): void {
    const duration = options.duration ?? DEFAULT_CROSSFADE_DURATION;
    const startAction = actions.get(currentClip);
    const endAction = actions.get(clipName);

    if (!endAction) {
      console.warn(
        `[companionAnimation] body.glb is missing "${clipName}" clip`,
      );
      return;
    }
    if (!startAction || startAction === endAction) return;

    clearFinishedListener();

    if (options.once) {
      endAction.setLoop(LoopOnce, 1);
      endAction.clampWhenFinished = true;
    } else {
      endAction.setLoop(LoopRepeat, Infinity);
      endAction.clampWhenFinished = false;
    }

    endAction.play();
    executeCrossFade(startAction, endAction, duration);
    currentClip = clipName;

    if (options.once && clipName !== 'idle') {
      onFinished = (event) => {
        if (event.action !== endAction) return;
        clearFinishedListener();
        crossFadeTo('idle', { duration });
      };
      mixer.addEventListener('finished', onFinished);
    }
  }

  return {
    crossFadeTo,
    update: (delta) => mixer.update(delta),
    dispose: () => {
      clearFinishedListener();
      mixer.stopAllAction();
    },
  };
}
