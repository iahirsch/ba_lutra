import type { CompanionBodyClip } from './companion-body-clips';

/** Interaction flow steps that play a one-shot wave (re-triggers when `stepId` changes). */
const INTERACTION_WAVE_STEP_IDS = new Set(['firstLook']);

const INTERACTION_EXIT_STEP_IDS = new Set(['hub_transition']);

export function resolveInteractionBodyClip(stepId: string): CompanionBodyClip {
  if (
    INTERACTION_WAVE_STEP_IDS.has(stepId) ||
    INTERACTION_EXIT_STEP_IDS.has(stepId)
  ) {
    return 'wave';
  }
  return 'idle';
}

export function isInteractionExitStep(stepId: string): boolean {
  return INTERACTION_EXIT_STEP_IDS.has(stepId);
}
