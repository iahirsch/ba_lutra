import type { CompanionConfig } from './companion.types';

// Screen Identifiers
export const SCREENS = {
  CREATOR: 'SCREEN_CREATOR',
  INTERACTION: 'SCREEN_INTERACTION',
  HUB: 'SCREEN_HUB',
} as const;

export type ScreenId = (typeof SCREENS)[keyof typeof SCREENS];

// WebSocket event names
export const FLOW_EVENTS = {
  // Client → Server
  REGISTER: 'screen:register',
  NAME_SUBMITTED: 'flow:name-submitted',
  CHOICE_SELECTED: 'flow:choice-selected',
  ACTION_CONFIRMED: 'flow:action-confirmed',

  // Server → Client
  STATE_UPDATE: 'flow:state-update',
  COMPANION_ENTERED_HUB: 'companion:entered-hub',

  EXIT_COMPLETE: 'flow:exit-complete',
} as const;

/**
 * Creator view config
 * @param idle        → no active session; SCREEN_CREATOR shows the companion builder
 * @param name-input  → user types the companion's name
 * @param choices     → user taps one of several option buttons
 * @param confirm     → user taps a single action button (Done / Continue)
 * @param transition  → no interaction; shows a status message while animation plays
 */
export type CreatorViewType =
  | 'idle'
  | 'name-input'
  | 'choices'
  | 'confirm'
  | 'transition';

export interface CreatorViewConfig {
  type: CreatorViewType;
  prompt?: string;
  choices?: { id: string; label: string }[];
  confirmLabel?: string;
}

export interface FlowStateUpdate {
  stepId: string;
  companionId: string;
  companionConfig: CompanionConfig;
  companionName: string | null;
  companionDialogue: string;
  creatorView: CreatorViewConfig;
}

export interface RegisterScreenPayload {
  screenId: ScreenId;
}

export interface NameSubmittedPayload {
  name: string;
}

export interface ChoiceSelectedPayload {
  choiceId: string;
}
