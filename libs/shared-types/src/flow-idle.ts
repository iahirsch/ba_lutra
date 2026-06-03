import type { CompanionConfig } from './companion.types';
import type { FlowStateUpdate } from './flow-events';

export const IDLE_COMPANION_CONFIG: CompanionConfig = {
  furColor: { primary: '', secondary: '' },
  eyeColor: { primary: '', secondary: '' },
  noseColor: '',
  clothingTop: '',
  clothingBottom: '',
  ears: '',
  tail: '',
  backpack: '',
  bodyMorphs: {},
};

export function createIdleFlowStateUpdate(): FlowStateUpdate {
  return {
    stepId: 'idle',
    companionId: '',
    companionConfig: { ...IDLE_COMPANION_CONFIG },
    companionName: null,
    companionDialogue: '',
    creatorView: { type: 'idle' },
    activityEffortScore: null,
  };
}
