import { FLOW_EVENTS, EditorViewConfig } from '@ba-praktisch/shared-types';

export interface FlowStep {
  id: string;
  companionDialogue?: string;
  creatorView: EditorViewConfig;
  transitions: Record<string, string | Record<string, string> | null>;
}

// Presentation flow
export const FLOW_STEPS: FlowStep[] = [
  {
    id: 'greeting',
    companionDialogue:
      'Hallo zusammen. Ich bin Lutra und begleite das Team heute durch die Präsentation, sozusagen als Co-Moderator. Schön, dass ihr alle hier seid.',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [{ id: 'team_intro', label: 'Weiter', variant: 'primary' }],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { team_intro: 'team_intro' },
    },
  },

  {
    id: 'team_intro',
    companionDialogue:
      'Das Team besteht aus Laura, Marco und Marin. Die drei haben dieses Projekt entwickelt und mich dabei auch erschaffen. Ich weiss das zu schätzen. Gemeinsam stellen wir euch heute ihr Bachelorprojekt Lutra vor',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        { id: 'worldbuilding_teaser', label: 'Weiter', variant: 'primary' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: {
        worldbuilding_teaser: 'worldbuilding_teaser',
      },
    },
  },

  {
    id: 'worldbuilding_teaser',
    companionDialogue:
      'Ihr seht hinter mir das Herzland, oder besser gesagt, ein Teil der davon übrig ist. Der grosse Stein dort rechts ist ein Weltenanker, einer der vielen Energiequellen dieser Welt. Gerade ist alles leblos. Das Ziel ist, das zu ändern, und zwar durch Bewegung. Mehr dazu gleich',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [{ id: 'handover_vision', label: 'Weiter', variant: 'primary' }],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { handover_vision: 'handover_vision' },
    },
  },

  {
    id: 'handover_vision',
    companionDialogue: 'Alles klar, dann übergebe ich an mein Team.',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [{ id: 'world_chapter', label: 'Weiter', variant: 'primary' }],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { world_chapter: 'world_chapter' },
    },
  },

  {
    id: 'world_chapter',
    companionDialogue:
      'Das Herzland ist mein Zuhause. Früher war es eine lebendige Gegend voller Leben, mit Wäldern, Flüssen und allem, was dazugehört. Dann wurde das Ankernetz schwächer, bis es irgendwann ganz kollabierte. Der Urzeitanker liegt jetzt tief unter Sand begraben. Genau das soll sich ändern.',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        { id: 'world_chapter_conduit', label: 'Weiter', variant: 'primary' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: {
        world_chapter_conduit: 'world_chapter_conduit',
      },
    },
  },

  {
    id: 'world_chapter_conduit',
    companionDialogue:
      'Die leuchtende Kugel auf meinem Rucksack ist übrigens mein Conduit, ein Fragment eines Weltenankers. Er überträgt eure Bewegungsenergie direkt zu mir. Ich bringe dann diese Energie zum Weltenanker um eure Energie permanent zu speichern',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [{ id: 'gameplay_remark', label: 'Weiter', variant: 'primary' }],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { gameplay_remark: 'gameplay_remark' },
    },
  },

  {
    id: 'gameplay_remark',
    companionDialogue:
      'Kurze Unterbrechung von mir. Wusstet ihr, dass echte Otter zu den wenigen Tieren gehören, die Werkzeuge benutzen? Wir legen Steine auf den Bauch, um Muscheln aufzuschlagen. Entschuldige die Unterbrechung Marco.',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        { id: 'companion_thanks', label: 'Weiter', variant: 'primary' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { companion_thanks: 'companion_thanks' },
    },
  },

  {
    id: 'companion_thanks',
    // TODO: Replace placeholder with the name of the team member who designed the companion
    companionDialogue:
      'Danke Marco, dass du mein Aussehen entwickelt hast, vom Designkonzept bis zur 3D-Modellierung. Das war viel Arbeit. Ich bin sehr zufrieden mit mir',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [{ id: 'app_features', label: 'Weiter', variant: 'primary' }],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { app_features: 'app_features' },
    },
  },

  {
    id: 'app_features',
    companionDialogue:
      'Die Hauptfunktionen der App habt ihr zu Beginn gesehen. Es gibt noch einige weiteren Features, von denen "Person x" euch noch welche zeigt',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [{ id: 'funny_remark', label: 'Weiter', variant: 'primary' }],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { funny_remark: 'funny_remark' },
    },
  },

  {
    id: 'funny_remark',
    companionDialogue: '[Funny remark]',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        { id: 'treadmill', label: 'Weiter zur Demo', variant: 'primary' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { treadmill: 'treadmill' },
    },
  },

  {
    id: 'treadmill',
    companionDialogue: '',
    creatorView: {
      type: 'choices',
      prompt: ['Weitere Schritte'],
      choices: [
        {
          id: 'activity_started',
          label: 'Aktivität starten',
          variant: 'primary',
        },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { activity_started: 'activity_started' },
    },
  },

  {
    id: 'activity_started',
    companionDialogue:
      'Los. Der Conduit reagiert schon. Je mehr ihr euch anstrengt, desto besser für das Herzland.',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        {
          id: 'activity_finished',
          label: 'Aktivität beenden!',
          variant: 'primary',
        },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { activity_finished: 'activity_finished' },
    },
  },

  {
    id: 'activity_finished',
    companionDialogue:
      'Wow, danke Marin für deinen kurzen, eleganten Spaziergang. Du kannst sonst gleich deine gesammelte Energie in meinem Conduit speichern.',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        { id: 'store_energy', label: 'Energie speichern', variant: 'primary' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { store_energy: 'store_energy' },
    },
  },

  {
    id: 'store_energy',
    companionDialogue: '',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        {
          id: 'store_energy_1',
          label: 'Energie speichern!',
          variant: 'primary',
        },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { store_energy_1: 'store_energy_1' },
    },
  },

  {
    id: 'store_energy_1',
    companionDialogue: '',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        { id: 'store_energy_2', label: 'Noch mehr!', variant: 'primary' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { store_energy_2: 'store_energy_2' },
    },
  },

  {
    id: 'store_energy_2',
    companionDialogue: '',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        { id: 'store_energy_3', label: 'Das letzte Mal!', variant: 'primary' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { store_energy_3: 'store_energy_3' },
    },
  },

  {
    id: 'store_energy_3',
    companionDialogue:
      'Jetzt seht ihr rechts, wie die Landschaft erblüht. Ich denke ihr fühlt euch hier auch gleich wohler',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [{ id: 'farewell', label: 'Weiter', variant: 'primary' }],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { farewell: 'farewell' },
    },
  },

  {
    id: 'farewell',
    companionDialogue:
      'Das war es von mir. Danke fürs Zuschauen, an Jury und Publikum gleichermassen. Ich hoffe, ihr habt einen guten Einblick bekommen in das, was wir vorhaben. Ihr könnt gerne das Konzept links genauer durchstöbern. Bleibt in Bewegung',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        {
          id: 'hub_transition',
          label: '',
          variant: 'primary',
        },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { hub_transition: 'hub_transition' },
    },
  },

  {
    id: 'hub_transition',
    creatorView: {
      type: 'transition',
      prompt: [],
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
