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
    companionDialogue: 'Huhu! Da bin ich.✨ Ich brenne darauf, mit dir das Ödland wieder zum Blühen zu bringen! Aber sag mal... wie soll ich eigentlich heissen?',
    creatorView: {
      type: 'name-input',
      prompt: 'Gib deinem Buddy einen Namen',
    },
    transitions: {
      [FLOW_EVENTS.NAME_SUBMITTED]: 'activity_question',
    },
  },

  {
    id: 'activity_question',
    companionDialogue: '[name]!? Oh, das klingt fantastisch! Wollen wir direkt loslegen und die erste Stelle auf der Karte durch physische Aktivität vom Ödland befreien und wieder zum Blühen bringen?',
    creatorView: {
      type: 'choices',
      prompt: '',
      choices: [
        { id: 'active', label: 'Jaaa, packen wir es an! 🌿' },
        { id: 'passive', label: 'Vielleicht später...' },
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
    companionDialogue: "Otter-stark! ⚡️ Ich halte hier die Stellung und bereite alles vor, während du Energie durch deine reale physische Aktivität sammelst.",
    creatorView: {
      type: 'confirm',
      prompt: "Mach 10 Hampelmänner und tippe auf 'Fertig', wenn du dein Training beendet hast.",
      confirmLabel: 'Fertig!',
    },
    transitions: {
      [FLOW_EVENTS.ACTION_CONFIRMED]: 'active_exit',
    },
  },
  {
    id: 'active_exit',
    companionDialogue: 'Wow, was für eine Power! 😍 Das wird dem Ödland guttun. Ich flitze schon mal vor ins Zeltlager. Bis gleich!',
    creatorView: {
      type: 'transition',
      prompt: 'Dein Buddy flitzt zum Hub…',
    },
    transitions: {
      [FLOW_EVENTS.EXIT_COMPLETE]: null,
    },
  },

  {
    id: 'passive_reaction',
    companionDialogue: 'Alles klar, kein Stress! 🔋 Auch ein Otter braucht mal eine Pause. Melde dich einfach, wenn du bereit bist.',
    creatorView: {
      type: 'confirm',
      prompt: '',
      confirmLabel: 'Okay, ich komme wieder auf dich zu!',
    },
    transitions: {
      [FLOW_EVENTS.ACTION_CONFIRMED]: 'passive_exit',
    },
  },
  {
    id: 'passive_exit',
    companionDialogue: 'Ich mach es mir im Zeltlager gemütlich. Wir sehen uns später! Adeeee! ✨',
    creatorView: {
      type: 'transition',
      prompt: 'Dein Buddy zieht sich ins Zeltlager zurück…',
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
