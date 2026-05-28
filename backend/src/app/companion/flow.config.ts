import { FLOW_EVENTS, EditorViewConfig } from '@ba-praktisch/shared-types';

export interface FlowStep {
  id: string;
  companionDialogue?: string;
  creatorView: EditorViewConfig;
  transitions: Record<string, string | Record<string, string> | null>;
}

// Flow definition
export const FLOW_STEPS: FlowStep[] = [

  {
    id: 'nameInput',
    creatorView: {
      type: 'name-input',
      title: ['Name des Lutra`s', 'Dein Name'],
      prompt: ['Wie soll dein Lutra heissen?', 'Wie soll dich dein Lutra nennen ? Was ist dein Spitzname ?'],
    },
    transitions: {
      [FLOW_EVENTS.NAME_SUBMITTED]: 'firstLook',
    },
  },

  {
    id: 'firstLook',
    companionDialogue:
      'Hallo [userName]! Ich bin dein Lutra [companionName]. Schön, dass du da bist! Du kannst ganz einfach über die Buttons auf dem Tablet mit mir kommunizieren.',
    creatorView: {
      type: 'choices',
      prompt: [
        'Dein Lutra ist nun im Herzland auf der Leinwand vor dir sichtbar. Siehst du ihn?',
      ],

      choices: [
        { id: 'iSee', label: 'Ja! Ich sehe ihn', variant: 'primary' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: {
        iSee: 'infoOrSport',
      },
    },
  },

  {
    id: 'infoOrSport',
    companionDialogue:
      'Möchtest du mehr über mich und meine Heimat erfahren? Oder willst du direkt sehen, wie deine Bewegung meine Welt beeinflussen kann?',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        { id: 'more', label: 'Ja, erzähl mir mehr!', variant: 'primary' },
        { id: 'sport', label: 'Wie kann ich die Welt beeinflussen?', variant: 'secondary' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: {
        more: 'moreInfo',
        sport: 'sport',
      },
    },
  },

  {
    id: 'moreInfo',
    companionDialogue:
      'Ich freue mich total, dass du neugierig bist! Es gibt hier so viel zu entdecken. Worüber möchtest du zuerst mehr wissen?',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        { id: 'lutra', label: 'Wieso Lutra?', variant: 'secondary' },
        { id: 'heartland', label: 'Das Herzland', variant: 'secondary' },
        { id: 'worldanchor', label: 'Die Weltenanker', variant: 'secondary' },
        { id: 'conduit', label: 'Die Conduit', variant: 'secondary' },
        { id: 'sport', label: 'Welt Beeinflussen', variant: 'primary' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: {
        lutra: 'lutraInfo1',
        heartland: 'heartlandInfo1',
        worldanchor: 'worldanchorInfo1',
        conduit: 'conduitInfo1',
        sport: 'sport',
      },
    },
  },

  {
    id: 'lutraInfo1',
    companionDialogue:
      'Ich bin ein Lutra – das ist Latein und bedeutet einfach „Otter“. Ich bin dein fester Begleiter und werde dich von jetzt an bei all deinen Aktivitäten unterstützen und anfeuern!',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        { id: 'lutraInfo2', label: 'Weiter', variant: 'primary' },
        { id: 'skip', label: 'Überspringen', variant: 'secondary' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: {
        lutraInfo2: 'lutraInfo2',
        skip: 'moreInfo',
      },
    },
  },

  {
    id: 'lutraInfo2',
    companionDialogue:
      'Wir Lutras haben erstaunlich viel mit euch Menschen gemeinsam. Genau wie ihr sind wir alle ganz verschieden. Und wir lieben es, uns in den unterschiedlichsten Terrains zu bewegen.',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        { id: 'lutraInfo3', label: 'Weiter', variant: 'primary' },
        { id: 'skip', label: 'Überspringen' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: {
        lutraInfo3: 'lutraInfo3',
        skip: 'moreInfo',
      },
    },
  },

  {
    id: 'lutraInfo3',
    companionDialogue:
      'Jeder von uns hat seine ganz eigenen Stärken. Manchmal sind wir gerne allein unterwegs, um den Kopf freizubekommen, und manchmal lieben wir das Leben in der Gruppe. Das kennst du sicher auch von dir, oder?',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        { id: 'lutraInfo4', label: 'Weiter', variant: 'primary' },
        { id: 'skip', label: 'Überspringen', variant: 'secondary' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: {
        lutraInfo4: 'lutraInfo4',
        skip: 'moreInfo',
      },
    },
  },

  {
    id: 'lutraInfo4',
    companionDialogue:
      'Das Wichtigste ist: Wenn du in deiner Welt aktiv bist, hilft mir das, meinen Lebensraum hier zu stabilisieren. Und das Schöne daran ist: Auch in der echten Welt brauchen wir Otter die Hilfe von aktiven Menschen, um geschützt zu werden.',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        { id: 'more', label: 'Weiter', variant: 'primary' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: {
        more: 'moreInfo',
      },
    },
  },

  {
    id: 'conduitInfo1',
    companionDialogue:
      'Siehst du die leuchtende Kristallkugel auf meinem Rucksack? Das ist der „Conduit“. Er ist ein magisches Bruchstück aus einem Weltenanker, das ich immer bei mir trage.',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        { id: 'conduitInfo2', label: 'Weiter', variant: 'primary' },
        { id: 'skip', label: 'Überspringen', variant: 'secondary' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: {
        conduitInfo2: 'conduitInfo2',
        skip: 'moreInfo',
      },
    },
  },

  {
    id: 'conduitInfo2',
    companionDialogue:
      'Der Conduit ist unsere Verbindung: Er speichert deine Bewegungsenergie, wenn du dich auspowerst, und gibt sie an den nächsten Weltenanker weiter. Er ist sozusagen die Brücke zwischen dir und meiner Welt.',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        { id: 'conduitInfo3', label: 'Weiter', variant: 'primary' },
        { id: 'skip', label: 'Überspringen', variant: 'secondary' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: {
        conduitInfo3: 'conduitInfo3',
        skip: 'moreInfo',
      },
    },
  },

  {
    id: 'conduitInfo3',
    companionDialogue:
      'In der echten Welt sind Otter „Schlüsselarten“: Unsere Jagd reguliert die Fischbestände, was den Flüssen, Pflanzen und der Wasserqualität guttut. Wir verbinden das Ökosystem. In unserer Spielwelt übernimmt diese wichtige Aufgabe mein Conduit!',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        { id: 'more', label: 'Weiter', variant: 'primary' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: {
        more: 'moreInfo',
      },
    },
  },


  {
    id: 'worldanchorInfo1',
    companionDialogue:
      'Die Weltenanker sind uralte, geheimnisvolle Steinmonolithe, die unser Ökosystem überhaupt erst am Leben erhalten. Sie sind keine Maschinen und keine Götter. Niemand weiss woher sie kommen.',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        { id: 'worldanchorInfo2', label: 'Weiter', variant: 'primary' },
        { id: 'skip', label: 'Überspringen', variant: 'secondary' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: {
        worldanchorInfo2: 'worldanchorInfo2',
        skip: 'moreInfo',
      },
    },
  },

  {
    id: 'worldanchorInfo2',
    companionDialogue:
      'Jeder Anker verströmt Energie in einem bestimmten Radius. Alles in seiner Nähe erwacht zum Leben! Deshalb leuchten die Anker auch so wunderschön und die Natur um sie herum blüht in den tollsten Farben.',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        { id: 'worldanchorInfo3', label: 'Weiter', variant: 'primary' },
        { id: 'skip', label: 'Überspringen', variant: 'secondary' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: {
        worldanchorInfo3: 'worldanchorInfo3',
        skip: 'moreInfo',
      },
    },
  },

  {
    id: 'worldanchorInfo3',
    companionDialogue:
      'Doch mit der Zeit wurden die Menschen in der realen Welt immer träger. Dem Ankernetz fehlte die nötige Bewegungsenergie. Die Zufuhr sank immer weiter, bis sie schliesslich einen kritischen Punkt erreichte...',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        { id: 'worldanchorInfo4', label: 'Weiter', variant: 'primary' },
        { id: 'skip', label: 'Überspringen', variant: 'secondary' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: {
        worldanchorInfo4: 'worldanchorInfo4',
        skip: 'moreInfo',
      },
    },
  },
  {
    id: 'worldanchorInfo4',
    companionDialogue:
      'Der älteste und mächtigste Anker im Zentrum – der Urzeitanker – versuchte verzweifelt, den Mangel auszugleichen, und zapfte die Nachbaranker an. Das war zu viel. Das gesamte Netz überlastete und kollabierte wie ein riesiger, durchgebrannter Stromkreis.',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        { id: 'more', label: 'Weiter', variant: 'primary' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: {
        more: 'moreInfo',
      },
    },
  },
  {
    id: 'heartlandInfo1',
    companionDialogue:
      'Das Herzland ist mein Zuhause. Früher war es eine paradiesische Kernzone voller Leben: Durchzogen von dichten Wäldern, klaren Flüssen, bunten Wiesen und unzähligen Tieren.',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        { id: 'heartlandInfo2', label: 'Weiter', variant: 'primary' },
        { id: 'skip', label: 'Überspringen', variant: 'secondary' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: {
        heartlandInfo2: 'heartlandInfo2',
        skip: 'moreInfo',
      },
    },
  },

  {
    id: 'heartlandInfo2',
    companionDialogue:
      'Unsere Welt konnte diese Lebensenergie nie von selbst erzeugen. Sie war immer auf die Weltenanker und somit auf eure menschliche Aktivität angewiesen.',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        { id: 'heartlandInfo3', label: 'Weiter', variant: 'primary' },
        { id: 'skip', label: 'Überspringen', variant: 'secondary' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: {
        heartlandInfo3: 'heartlandInfo3',
        skip: 'moreInfo',
      },
    },
  },
  {
    id: 'heartlandInfo3',
    companionDialogue:
      'Als ihr euch weniger bewegt habt, fiel die Energiequelle aus. Nach dem grossen Kollaps hat das triste Ödland mein geliebtes Herzland verschluckt. Fast alles ist grau und leblos... Der Urzeitanker liegt tief unter Sand und Asche begraben.',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        { id: 'heartlandInfo4', label: 'Weiter', variant: 'primary' },
        { id: 'skip', label: 'Überspringen', variant: 'secondary' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: {
        heartlandInfo4: 'heartlandInfo4',
        skip: 'moreInfo',
      },
    },
  },
  {
    id: 'heartlandInfo4',
    companionDialogue:
      'Aber jetzt bist du ja hier! Sobald du aktiv wirst, können wir Schritt für Schritt das Ödland zurückdrängen und meine Heimat wieder zum Blühen bringen. Packen wir es an?',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        { id: 'more', label: 'Weiter', variant: 'primary' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: {
        more: 'moreInfo',
      },
    },
  },

  {
    id: 'sport',
    companionDialogue:
      'Um das Herzland zu retten, brauche ich deine Unterstützung. Mein Conduit wartet sehnsüchtig auf deine Bewegung! Ich zeige dir jetzt genau, wie du uns helfen kannst.',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        { id: 'treadmill', label: 'Weiter', variant: 'primary' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: {
        treadmill: 'treadmill',
      },
    },
  },
  {
    id: 'treadmill',
    companionDialogue:
      'Sobald du bereit bist, lies die Instruktionen auf dem Tablet durch und befolge diese Schritt für Schritt.',
    creatorView: {
      type: 'choices',
      prompt: [
        'So startest du deine Aktivität. Lies zuerst alles durch:',
        'Schritt 1: Starte auf diesem Tablet mittels „Aktivität starten“.',
        'Schritt 2: Geh zum Laufband und lege den Sicherheits-Clip an.',
        'Schritt 3: Starte die Strava-App auf dem vorliegenden Tablet beim Laufband.',
        'Schritt 4: Schalte das Laufband ein. Laufe so schnell und so lange du möchtest!',
        'Schritt 5: Schalte das Laufband danach wieder aus.',
        'Schritt 6: Beende den Lauf in Strava und veröffentliche ihn.',
        'Schritt 7: Komm wieder hierher zurück und drücke „Aktivität beenden“.'
      ],
      choices: [
        { id: 'activity_started', label: 'Aktivität starten', variant: 'primary' },
        { id: 'activity_exit', label: 'Ich mag kein sport machen', variant: 'secondary' }
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: {
        activity_started: 'activity_started',
        activity_exit: 'activity_exit',
      },
    },
  },
  {
    id: 'activity_started',
    companionDialogue:
      'Schau mal! Der Conduit reagiert! Er leuchtet! Das hat er seit dem grossen Kollaps nicht mehr getan. Du bist einfach spitze, danke! Je mehr du dich auspowerst, desto mehr Energie fliesst in meine Welt!',
    creatorView: {
      type: 'choices',
      prompt: [
        'So startest du deine Aktivität. Lies zuerst alles durch:',
        'Schritt 1: Starte auf diesem Tablet mittels „Aktivität starten“.',
        'Schritt 2: Geh zum Laufband und lege den Sicherheits-Clip an.',
        'Schritt 3: Starte die Strava-App auf dem vorliegenden Tablet beim Laufband.',
        'Schritt 4: Schalte das Laufband ein. Laufe so schnell und so lange du möchtest!',
        'Schritt 5: Schalte das Laufband danach wieder aus.',
        'Schritt 6: Beende den Lauf in Strava und veröffentliche ihn.',
        'Schritt 7: Komm wieder hierher zurück und drücke „Aktivität beenden“.'
      ],
      choices: [
        { id: 'activity_finished', label: 'Aktivität beenden!', variant: 'primary' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: {
        activity_finished: 'activity_finished',
      },
    },
  },
  {
    id: 'activity_finished',
    companionDialogue:
      'Wow, du warst einfach der Wahnsinn! Du hast unglaubliche [X] Energie gesammelt. Was für eine tolle Leistung! Schau mal auf die Leinwand, wie sich die Welt durch dich verändert hat. Weiter so, du bist mein Held!',
    creatorView: {
      type: 'choices',
      prompt: [
        'Schau dir das Ergebnis deiner Power auf der Leinwand an!'
      ],
      choices: [
        { id: 'lutra_exit', label: 'Weiter', variant: 'primary' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: {
        lutra_exit: 'lutra_exit',
      },
    },
  },
  {
    id: 'activity_exit',
    companionDialogue:
      'Das macht überhaupt nichts, ich verstehe dich vollkommen! Jeder hat mal einen gemütlichen Tag verdient. Heute ist auch besonders heiss. Aber kein Grund zur Sorge, ich bleibe hier und warte treu auf dich.',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        { id: 'lutra_exit', label: 'Weiter', variant: 'primary' },
      ],
    },
    transitions: {
      [FLOW_EVENTS.CHOICE_SELECTED]: {
        lutra_exit: 'lutra_exit',
      },
    },
  },
  {
    id: 'lutra_exit',
    companionDialogue:
      'Möchtest du noch tiefer in meine Welt eintauchen und sehen, was wir in Zukunft noch alles erreichen können? Dann geh einfach rüber zur Maus auf dem anderen Sockel. Auf dem Monitor dort erfährst du mehr zu unserer App-Vision!',
    creatorView: {
      type: 'choices',
      prompt: [],
      choices: [
        { id: 'hub_transition', label: 'Von [companionName] verabschieden', variant: 'primary' },
      ],
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
      prompt: ['Du findest dein Lutra [companionName] nun im Zeltlager. Danke das du ihn erschaffen hast.'],
    },
    transitions: {
      [FLOW_EVENTS.EXIT_COMPLETE]: null,
    },
  },

  //   {
  //     id: 'activity_question',
  //     companionDialogue:
  //       '[name]!? Oh, das klingt fantastisch! Wollen wir direkt loslegen und die erste Stelle auf der Karte durch physische Aktivität vom Ödland befreien und wieder zum Blühen bringen?',
  //     creatorView: {
  //       type: 'choices',
  //       prompt: [],
  //       choices: [
  //         { id: 'active', label: 'Jaaa, packen wir es an! 🌿' },
  //         { id: 'passive', label: 'Vielleicht später...' },
  //       ],
  //     },
  //     transitions: {
  //       [FLOW_EVENTS.CHOICE_SELECTED]: {
  //         active: 'active_reaction',
  //         passive: 'passive_reaction',
  //       },
  //     },
  //   },

  //   {
  //     id: 'active_reaction',
  //     companionDialogue:
  //       'Otter-stark! ⚡️ Ich halte hier die Stellung und bereite alles vor, während du Energie durch deine reale physische Aktivität sammelst.',
  //     creatorView: {
  //       type: 'confirm',
  //       prompt:
  //         ["Mach 10 Hampelmänner und tippe auf 'Fertig', wenn du dein Training beendet hast."],
  //       confirmLabel: 'Fertig!',
  //     },
  //     transitions: {
  //       [FLOW_EVENTS.ACTION_CONFIRMED]: 'active_exit',
  //     },
  //   },


  //   {
  //     id: 'passive_reaction',
  //     companionDialogue:
  //       'Alles klar, kein Stress! 🔋 Auch ein Otter braucht mal eine Pause. Melde dich einfach, wenn du bereit bist.',
  //     creatorView: {
  //       type: 'confirm',
  //       prompt: [],
  //       confirmLabel: 'Okay, ich komme wieder auf dich zu!',
  //     },
  //     transitions: {
  //       [FLOW_EVENTS.ACTION_CONFIRMED]: 'passive_exit',
  //     },
  //   },
  //   {
  //     id: 'passive_exit',
  //     companionDialogue:
  //       'Ich mach es mir im Zeltlager gemütlich. Wir sehen uns später! Adeeee! ✨',
  //     creatorView: {
  //       type: 'transition',
  //       prompt: ['Dein Buddy zieht sich ins Zeltlager zurück…'],
  //     },
  //     transitions: {
  //       [FLOW_EVENTS.EXIT_COMPLETE]: null,
  //     },
  //   },
  // 
];
export const FLOW_STEP_MAP = new Map<string, FlowStep>(
  FLOW_STEPS.map((step) => [step.id, step]),
);

export const FIRST_STEP_ID = FLOW_STEPS[0].id;
