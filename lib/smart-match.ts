/*
 * Shared Smart Match logic for ACCESS+.
 *
 * Used by:
 *  - app/api/smart-match/route.ts   (server-side fallback when AI is unavailable)
 *  - app/page.tsx                   (client-side fallback when the API is unreachable)
 *
 * NOTE: JavaScript's \b word boundary does not work for Malayalam script,
 * so Malayalam keywords are matched with plain substring checks.
 */

export type Need = "vision" | "hearing" | "mobility" | "communication";

export type SupportType =
  | "assistive-device"
  | "government"
  | "provider"
  | "repair";

export const allowedNeeds: Need[] = [
  "vision",
  "hearing",
  "mobility",
  "communication",
];

export const allowedSupportTypes: SupportType[] = [
  "assistive-device",
  "government",
  "provider",
  "repair",
];

/* The exact difficulty labels the UI understands. */
export const difficultyOptions: Record<Need, string[]> = {
  hearing: [
    "Hearing conversations",
    "Hearing alerts",
    "Following group conversations",
    "Listening to media",
  ],
  vision: [
    "Reading",
    "Seeing objects",
    "Moving around safely",
    "Recognizing people",
  ],
  mobility: ["Walking", "Standing", "Moving outdoors", "Moving indoors"],
  communication: [
    "Speaking",
    "Expressing needs",
    "Communicating with others",
    "Using a communication device",
  ],
};

export type SmartMatchResult = {
  need: Need | "";
  supportType: SupportType | "";
  difficulty: string[];
  confidence: number;
  explanation: string;
};

/* ------------------------------------------------------------------ */
/* English rules (checked in priority order)                           */
/* ------------------------------------------------------------------ */

const englishNeedRules: { need: Need; patterns: RegExp[] }[] = [
  // Strong, very specific phrases first so that e.g. "white cane"
  // is not mistaken for a walking cane.
  {
    need: "vision",
    patterns: [
      /\bwhite cane\b/,
      /\bbraille\b/,
      /\bblind(ness)?\b/,
      /\blow vision\b/,
      /\bvisually impaired\b/,
    ],
  },
  {
    need: "hearing",
    patterns: [
      /\bhearing aids?\b/,
      /\bdeaf(ness)?\b/,
      /\bhard of hearing\b/,
      /\bhearing loss\b/,
    ],
  },
  {
    need: "communication",
    patterns: [
      /\bsign language\b/,
      /\bnon[- ]?verbal\b/,
      /\baac\b/,
      /\bspeech\b/,
      /\bspeaking\b/,
    ],
  },
  {
    need: "mobility",
    patterns: [
      /\bwheel ?chairs?\b/,
      /\bwalking\b/,
      /\bwalk\b/,
      /\bmobility\b/,
      /\bmove\b/,
      /\bmoving\b/,
      /\bstanding\b/,
      /\bstand\b/,
      /\bleg\b/,
      /\bcane\b/,
      /\bwalkers?\b/,
      /\bcrutch(es)?\b/,
    ],
  },
  // Weaker / more generic words last.
  {
    need: "hearing",
    patterns: [/\bhearing\b/, /\bhear\b/, /\blistening\b/, /\bsound\b/],
  },
  {
    need: "vision",
    patterns: [/\bvision\b/, /\bvisual\b/, /\bseeing\b/, /\bsee\b/, /\beyesight\b/],
  },
  {
    need: "communication",
    patterns: [/\bcommunication\b/, /\bcommunicate\b/, /\btalk\b/],
  },
];

const englishSupportRules: { supportType: SupportType; patterns: RegExp[] }[] =
  [
    // Repair must have priority over everything else.
    {
      supportType: "repair",
      patterns: [
        /\brepair(s|ed|ing)?\b/,
        /\bbroken\b/,
        /\bdamaged\b/,
        /\bfix\b/,
        /\bservicing\b/,
        /\bnot working\b/,
        /\bstopped working\b/,
        /\bmalfunction/,
      ],
    },
    {
      supportType: "government",
      patterns: [
        /\bgovernment\b/,
        /\bgovt\b/,
        /\bscheme\b/,
        /\bsubsidy\b/,
        /\bbenefits?\b/,
        /\beligibility\b/,
        /\bapply\b/,
        /\bapplication\b/,
        /\badip\b/,
        /\bfinancial assistance\b/,
      ],
    },
    {
      supportType: "assistive-device",
      patterns: [
        /\bwheel ?chairs?\b/,
        /\bhearing aids?\b/,
        /\bdevices?\b/,
        /\bassistive\b/,
        /\bequipment\b/,
        /\bbraille\b/,
        /\bwalkers?\b/,
        /\bcane\b/,
        /\bcrutch(es)?\b/,
      ],
    },
    {
      supportType: "provider",
      patterns: [
        /\bprovider\b/,
        /\btherapist\b/,
        /\btherapy\b/,
        /\borgani[sz]ation\b/,
        /\bservice provider\b/,
        /\bprofessional\b/,
        /\bclinic\b/,
        /\bhospital\b/,
        /\bcent(er|re)\b/,
      ],
    },
  ];

/* ------------------------------------------------------------------ */
/* Malayalam keywords (substring match, generic words like "സഹായം"      */
/* are deliberately excluded because they appear in almost every query) */
/* ------------------------------------------------------------------ */

const malayalamNeedKeywords: { need: Need; words: string[] }[] = [
  {
    need: "mobility",
    words: [
      "വീൽചെയർ",
      "വീൽ ചെയർ",
      "വീൽചെയര്",
      "നടക്കാൻ",
      "നടക്കാന്",
      "നടക്കുന്നതിൽ",
      "നടക്കുന്നതില്",
      "നിൽക്കാൻ",
      "ചലനം",
      "നീങ്ങാൻ",
      "നീങ്ങാന്",
      "ശാരീരിക വൈകല്യം",
    ],
  },
  {
    need: "hearing",
    words: [
      "കേൾവി",
      "കേള്‍വി",
      "കേൾക്കാൻ",
      "കേള്‍ക്കാന്",
      "ഹിയറിംഗ് എയ്ഡ്",
      "ഹിയറിങ് എയ്ഡ്",
      "ബധിര",
      "ശ്രവണ",
    ],
  },
  {
    need: "vision",
    words: [
      "കാഴ്ച",
      "കാണാൻ",
      "കാണാന്",
      "ബ്രെയിൽ",
      "ബ്രെയില്",
      "വൈറ്റ് കെയിൻ",
      "വൈറ്റ് കേൻ",
      "അന്ധ",
    ],
  },
  {
    need: "communication",
    words: [
      "സംസാര",
      "ആശയവിനിമയ",
      "കമ്മ്യൂണിക്കേഷൻ",
      "സൈൻ ലാംഗ്വേജ്",
      "ആംഗ്യഭാഷ",
    ],
  },
];

const malayalamSupportKeywords: { supportType: SupportType; words: string[] }[] =
  [
    {
      supportType: "repair",
      words: [
        "റിപ്പയർ",
        "റിപ്പയര്",
        "കേടായി",
        "കേടായ",
        "തകരാർ",
        "തകരാര്",
        "ശരിയാക്കണം",
        "ശരിയാക്കാൻ",
        "ശരിയാക്കാന്",
        "പ്രവർത്തിക്കുന്നില്ല",
        "പ്രവര്‍ത്തിക്കുന്നില്ല",
      ],
    },
    {
      supportType: "government",
      words: [
        "സർക്കാർ",
        "സര്‍ക്കാര്",
        "പദ്ധതി",
        "സ്കീം",
        "സബ്സിഡി",
        "ആനുകൂല്യം",
        "അപേക്ഷ",
        "അർഹത",
        "അര്‍ഹത",
        "എഡിപ്",
      ],
    },
    {
      supportType: "assistive-device",
      words: [
        "ഉപകരണം",
        "അസിസ്റ്റീവ്",
        "വീൽചെയർ",
        "വീൽ ചെയർ",
        "ഹിയറിംഗ് എയ്ഡ്",
        "ഹിയറിങ് എയ്ഡ്",
        "കേൾവി സഹായി",
        "കേള്‍വി സഹായി",
        "ബ്രെയിൽ",
        "കൈത്തടി",
      ],
    },
    {
      supportType: "provider",
      words: [
        "തെറാപ്പി",
        "തെറാപ്പിസ്റ്റ്",
        "ക്ലിനിക്ക്",
        "ആശുപത്രി",
        "കേന്ദ്രം",
        "സ്ഥാപനം",
        "സേവനദാതാ",
        "വിതരണക്കാര",
      ],
    },
  ];

function matchesAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

/* ------------------------------------------------------------------ */
/* Main classifier                                                     */
/* ------------------------------------------------------------------ */

export function classifyQuery(query: string): SmartMatchResult {
  const text = query.toLowerCase().trim();

  let need: Need | "" = "";
  let supportType: SupportType | "" = "";

  // NEED
  for (const rule of englishNeedRules) {
    if (matchesAny(text, rule.patterns)) {
      need = rule.need;
      break;
    }
  }

  if (!need) {
    for (const rule of malayalamNeedKeywords) {
      if (includesAny(text, rule.words)) {
        need = rule.need;
        break;
      }
    }
  }

  // SUPPORT TYPE
  for (const rule of englishSupportRules) {
    if (matchesAny(text, rule.patterns)) {
      supportType = rule.supportType;
      break;
    }
  }

  if (!supportType) {
    for (const rule of malayalamSupportKeywords) {
      if (includesAny(text, rule.words)) {
        supportType = rule.supportType;
        break;
      }
    }
  }

  // DIFFICULTY (English only, always validated against the UI labels)
  const difficulty: string[] = [];

  if (/\bread\b/.test(text) || /\breading\b/.test(text)) {
    difficulty.push("Reading");
  }

  if (/\bsee\b/.test(text) || /\bseeing\b/.test(text) || /\bvision\b/.test(text)) {
    difficulty.push("Seeing objects");
  }

  if (
    /\b(walk|walking|move|moving)\s+(outside|outdoors)\b/.test(text) ||
    /\bmoving outdoors\b/.test(text) ||
    /\bmove outdoors\b/.test(text)
  ) {
    difficulty.push("Moving outdoors");
  } else if (/\bwalk\b/.test(text) || /\bwalking\b/.test(text)) {
    difficulty.push("Walking");
  }

  if (/\bstand\b/.test(text) || /\bstanding\b/.test(text)) {
    difficulty.push("Standing");
  }

  if (/\bhear\b/.test(text) || /\bhearing\b/.test(text)) {
    difficulty.push("Hearing conversations");
  }

  if (/\bspeak\b/.test(text) || /\bspeaking\b/.test(text)) {
    difficulty.push("Speaking");
  }

  if (/\bcommunicat/.test(text) || /\bsign language\b/.test(text)) {
    difficulty.push("Communicating with others");
  }

  const validDifficulty = need
    ? difficulty.filter((item) => difficultyOptions[need].includes(item))
    : [];

  return {
    need,
    supportType,
    difficulty: validDifficulty,
    confidence: need ? (supportType ? 0.72 : 0.65) : 0.35,
    explanation:
      need && supportType
        ? "The request was matched using the detected need, support type, difficulty, and relevant keywords."
        : need
          ? "The accessibility need was identified from the request. No specific support type was requested, so relevant verified support options can be shown."
          : "The request could not be confidently classified.",
  };
}