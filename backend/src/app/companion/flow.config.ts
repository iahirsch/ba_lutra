import { FLOW_EVENTS, EditorViewConfig } from '@ba-praktisch/shared-types';
import { EMPTY_OBSERVER } from 'rxjs/internal/Subscriber';

export interface FlowStep {
  id: string;
  companionDialogue?: string;
  creatorView: EditorViewConfig;
  transitions: Record<string, string | Record<string, string> | null>;
}

// Presentation flow
export const FLOW_STEPS: FlowStep[] = [
  {
    id: 'nameInput',
    creatorView: {
      type: 'name-input',
      title: ['Name des Lutras', 'Dein Name'],
      prompt: ['Wie soll dein Lutra heissen?', 'Wie lautet dein Spitzname?'],
    },
    transitions: {
      [FLOW_EVENTS.NAME_SUBMITTED]: 'greeting',
    },
  },

  {
    id: 'greeting',
    companionDialogue:
      'Hallo zusammen. Ich bin Lutra und begleite das Team heute durch die Präsentation, sozusagen als Co-Moderator. Schön, dass ihr alle hier seid.',
    creatorView: {
      type: 'choices',
      choices: [{ id: 'team_intro', label: 'Weiter 1/4', variant: 'primary' }],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { team_intro: 'team_intro' },
    },
  },

  {
    id: 'team_intro',
    companionDialogue:
      'Das Team besteht aus Laura, Marco und Marin. Die drei haben dieses Projekt entwickelt und mich dabei auch erschaffen. Ich weiss das zu schätzen. Gemeinsam stellen wir euch heute ihr Bachelorprojekt Lutra vor.',
    creatorView: {
      type: 'choices',
      choices: [
        { id: 'worldbuilding_teaser', label: 'Weiter 2/4', variant: 'primary' },
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
      'Ihr seht hinter mir das Herzland, oder besser gesagt, ein Teil der davon übrig ist. Der grosse Stein dort rechts ist ein Weltenanker, einer der vielen Energiequellen dieser Welt. Gerade ist alles leblos. Das Ziel ist, das zu ändern, und zwar durch Bewegung. Mehr dazu gleich.',
    creatorView: {
      type: 'choices',
      choices: [
        { id: 'handover_vision', label: 'Weiter 3/4', variant: 'primary' },
      ],
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
      choices: [{ id: 'empty_1', label: 'Weiter 4/4', variant: 'primary' }],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { empty_1: 'empty_1' },
    },
  },

  {
    id: 'empty_1',
    companionDialogue: '',
    creatorView: {
      type: 'choices',
      choices: [
        {
          id: 'usp_1',
          label: 'Weiter bei USP',
          variant: 'primary',
        },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { usp_1: 'usp_1' },
    },
  },

  {
    id: 'usp_1',
    companionDialogue: 'Darf ich sagen was uns von anderen unterscheidet?',
    creatorView: {
      type: 'choices',
      choices: [
        {
          id: 'usp_2',
          label: 'Weiter 1/2',
          variant: 'primary',
        },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { usp_2: 'usp_2' },
    },
  },

  {
    id: 'usp_2',
    companionDialogue:
      'Ich möchte Bewegungswilligen, die im Alltag mit fehlender Motivation und fehlenden Verbindung zu anderen kämpfen helfen, indem ihre Aktivität eine spielerisch erlebbare Welt formt und ich sie dabei emotional unterstütze.',
    creatorView: {
      type: 'choices',
      choices: [
        {
          id: 'empty_2',
          label: 'Weiter 2/2',
          variant: 'primary',
        },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { empty_2: 'empty_2' },
    },
  },

  {
    id: 'empty_2',
    companionDialogue: '',
    creatorView: {
      type: 'choices',
      prompt: ['Nach Motivierender Otter folgt lacher von Lutra.'],
      choices: [
        {
          id: 'laura_funny',
          label: 'Weiter bei Folie 11',
          variant: 'primary',
        },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { laura_funny: 'laura_funny' },
    },
  },

  {
    id: 'laura_funny',
    companionDialogue: 'Der war gut Laura!',
    creatorView: {
      type: 'choices',
      choices: [
        {
          id: 'empty_3',
          label: 'Weiter bei Folie 13',
          variant: 'primary',
        },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { empty_3: 'empty_3' },
    },
  },

  {
    id: 'empty_3',
    companionDialogue: '',
    creatorView: {
      type: 'choices',
      choices: [
        {
          id: 'gameplay_remark',
          label: 'Weiter bei Folie 13',
          variant: 'primary',
        },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { gameplay_remark: 'gameplay_remark' },
    },
  },

  {
    id: 'gameplay_remark',
    companionDialogue:
      'Kurze Unterbrechung von mir. Wusstet ihr, dass echte Otter zu den wenigen Tieren gehören, die Werkzeuge benutzen? Wir legen Steine auf den Bauch, um Muscheln aufzuschlagen. Entschuldige die Unterbrechung Marin.',
    creatorView: {
      type: 'choices',
      choices: [{ id: 'empty_4', label: 'Weiter', variant: 'primary' }],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { empty_4: 'empty_4' },
    },
  },

  {
    id: 'empty_4',
    companionDialogue: '',
    creatorView: {
      type: 'choices',
      choices: [
        {
          id: 'world_chapter',
          label: 'Weiter bei Folie 14',
          variant: 'primary',
        },
      ],
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
      choices: [{ id: 'empty_5', label: 'Weiter', variant: 'primary' }],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: {
        empty_5: 'empty_5',
      },
    },
  },

  {
    id: 'empty_5',
    companionDialogue: '',
    creatorView: {
      type: 'choices',
      choices: [
        {
          id: 'world_chapter_conduit',
          label: 'Weiter bei Folie 15',
          variant: 'primary',
        },
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
      'Die leuchtende Kugel auf meinem Rucksack ist übrigens mein Conduit, ein Fragment eines Weltenankers. Er überträgt eure Bewegungsenergie direkt zu mir. Ich bringe dann diese Energie zum Weltenanker um diese permanent zu speichern.',
    creatorView: {
      type: 'choices',
      choices: [{ id: 'empty_6', label: 'Weiter', variant: 'primary' }],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { empty_6: 'empty_6' },
    },
  },

  {
    id: 'empty_6',
    companionDialogue: '',
    creatorView: {
      type: 'choices',
      choices: [
        {
          id: 'companion_thanks',
          label: 'Weiter Ende Folie 26',
          variant: 'primary',
        },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { companion_thanks: 'companion_thanks' },
    },
  },

  {
    id: 'companion_thanks',
    companionDialogue:
      'Danke Marco, dass du mein Aussehen entwickelt hast, vom Designkonzept bis zur 3D-Modellierung. Das war viel Arbeit. Ich bin sehr zufrieden mit mir.',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [{ id: 'empty_7', label: 'Weiter', variant: 'primary' }],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { empty_7: 'empty_7' },
    },
  },

  {
    id: 'empty_7',
    companionDialogue: '',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        {
          id: 'funfact',
          label: 'Weiter bei Folie 42',
          variant: 'primary',
        },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { funfact: 'funfact' },
    },
  },

  {
    id: 'funfact',
    companionDialogue:
      'Noch etwas, das nur wir Lutras wissen. Im Herzland gibt es eine Pflanzengattung, die ausschliesslich in der Nacht und in der Nähe von Lutras wächst. Am Morgen verwelken sie wieder. Niemand weiss warum.',
    creatorView: {
      type: 'choices',
      choices: [{ id: 'funfact', label: 'Weiter', variant: 'primary' }],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: 'empty_75',
    },
  },
  {
    id: 'empty_75',
    companionDialogue: '',
    creatorView: {
      type: 'choices',
      choices: [
        { id: 'empty_75', label: 'Hauptfunktionen', variant: 'primary' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.ACTION_CONFIRMED]: 'app_features',
    },
  },

  {
    id: 'app_features',
    companionDialogue:
      'Die Hauptfunktionen der App habt ihr zu Beginn anhand der Storyboards gesehen. Es gibt noch einige weitere Features, von denen euch Marco und Marin noch zwei weitere zeigen.',
    creatorView: {
      type: 'choices',
      choices: [{ id: 'empty_8', label: 'Weiter', variant: 'primary' }],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { empty_8: 'empty_8' },
    },
  },

  {
    id: 'empty_8',
    companionDialogue: '',
    creatorView: {
      type: 'choices',
      choices: [
        {
          id: 'activity_finished',
          label: 'Weiter nach Marin Laufband',
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
      choices: [{ id: 'farewell_1', label: 'Weiter', variant: 'primary' }],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: { farewell_1: 'farewell_1' },
    },
  },

  {
    id: 'farewell_1',
    companionDialogue:
      'Das war es von mir. Danke an die Jury und das Publikum für eure Aufmerksamkeit. Ich hoffe, ihr habt einen guten Einblick bekommen in das, was wir vorhaben. Leider konnten wir zeitlich nicht auf alle Details eingehen, daher könnt ihr gerne anschliessend das Konzept links genauer durchstöbern.',
    creatorView: {
      type: 'choices',
      choices: [{ id: 'farewell_2', label: 'Weiter', variant: 'primary' }],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: {
        farewell_2: 'farewell_2',
      },
    },
  },
  {
    id: 'farewell_2',
    companionDialogue:
      'Mein Team steht euch nun für Fragen zur Verfügung. Bleibt in Bewegung.',
    creatorView: {
      type: 'choices',
      choices: [{ id: 'hub_transition', label: 'Weiter', variant: 'primary' }],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: {
        hub_transition: 'hub_transition',
      },
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
