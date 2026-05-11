import { FLOW_EVENTS, CreatorViewConfig } from '@ba-praktisch/shared-types';

export interface FlowStep {
  id: string;
  companionDialogue: string;
  creatorView: CreatorViewConfig;
  transitions: Record<string, string | Record<string, string> | null>;
}

// Flow definition
export const FLOW_STEPS: FlowStep[] = [
  {
    id: 'companion_appeared',
    companionDialogue: 'Hi there! What do you want to call me?',
    creatorView: {
      type: 'name-input',
      prompt: 'Give your companion a name',
    },
    transitions: {
      [FLOW_EVENTS.NAME_SUBMITTED]: 'activity_question',
    },
  },

  {
    id: 'activity_question',
    companionDialogue: '[name]!? I love it. Mach Sport!',
    creatorView: {
      type: 'choices',
      prompt: '',
      choices: [
        { id: 'active', label: 'Denn halt' },
        { id: 'passive', label: 'Sicher nit' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: {
        active: 'active_reaction',
        passive: 'passive_reaction',
      },
    },
  },

  {
    id: 'active_reaction',
    companionDialogue: "Coolio. Let's go!",
    creatorView: {
      type: 'confirm',
      prompt: "Tap 'Done' when you're finished.",
      confirmLabel: 'Done?',
    },
    transitions: {
      [FLOW_EVENTS.ACTION_CONFIRMED]: 'active_exit',
    },
  },
  {
    id: 'active_exit',
    companionDialogue: 'Mega guet. Tschüssi. Ich gang in Hub',
    creatorView: {
      type: 'transition',
      prompt: 'Your companion is heading to the hub…',
    },
    transitions: {
      [FLOW_EVENTS.EXIT_COMPLETE]: null,
    },
  },

  {
    id: 'passive_reaction',
    companionDialogue: 'Schad wies machsch. Tschüss demfall',
    creatorView: {
      type: 'confirm',
      prompt: '',
      confirmLabel: 'Continue',
    },
    transitions: {
      [FLOW_EVENTS.ACTION_CONFIRMED]: 'passive_exit',
    },
  },
  {
    id: 'passive_exit',
    companionDialogue: 'Adeeeeeeeee',
    creatorView: {
      type: 'transition',
      prompt: 'Your companion is heading to the hub…',
    },
    transitions: {
      [FLOW_EVENTS.EXIT_COMPLETE]: null,
    },
  },
];

export const FLOW_STEP_MAP = new Map<string, FlowStep>(
  FLOW_STEPS.map((step) => [step.id, step]),
);

export const FIRST_STEP_ID = FLOW_STEPS[0].id;
