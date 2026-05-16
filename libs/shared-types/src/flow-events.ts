import type { CompanionConfig } from './companion.types';

// Screen Identifiers
export const SCREENS = {
  EDITOR: 'SCREEN_EDITOR',
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

export type EditorViewType =
  | 'idle'
  | 'name-input'
  | 'choices'
  | 'confirm'
  | 'transition';

export interface EditorViewConfig {
  type: EditorViewType;
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
  creatorView: EditorViewConfig;
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
