import type { CompanionBodyClip } from './companion-body-clips';

/** Interaction flow steps that play a one-shot wave (re-triggers when `stepId` changes). */
const INTERACTION_WAVE_STEP_IDS = new Set(['greeting']);
const INTERACTION_EXIT_STEP_IDS = new Set(['hub_transition']);
const INTERACTION_WIN_STEP_IDS = new Set(['store_energy_3, companion_thanks']);
const INTERACTION_RUN_STEP_IDS = new Set(['']);

export function resolveInteractionBodyClip(stepId: string): CompanionBodyClip {
  if (
    INTERACTION_WAVE_STEP_IDS.has(stepId) ||
    INTERACTION_EXIT_STEP_IDS.has(stepId)
  ) {
    return 'wave';
  }
  if (INTERACTION_WIN_STEP_IDS.has(stepId)) {
    return 'win';
  }
  if (INTERACTION_RUN_STEP_IDS.has(stepId)) {
    return 'running';
  }

  return 'idle';
}

export function isInteractionExitStep(stepId: string): boolean {
  return INTERACTION_EXIT_STEP_IDS.has(stepId);
}
