/* Shared city thresholds and packages for game and review preview. */
window.GameCityLevels=[
  {
    "id": 1,
    "name": "Keimzelle",
    "threshold": "Erstes Gebäude nach dem Kontor",
    "goods": [],
    "buildings": [],
    "message": "Die ersten Fundamente sind gelegt.",
    "portrait": "i_t1"
  },
  {
    "id": 2,
    "name": "Weiler",
    "threshold": "20 Siedler",
    "goods": [
      "getreide",
      "mehl",
      "brot",
      "aepfel",
      "most",
      "erz",
      "eisen",
      "werkzeug",
      "kartoffeln",
      "schnaps"
    ],
    "buildings": [
      "farm",
      "muehle",
      "baeckerei",
      "kapelle",
      "obsthof",
      "mosterei",
      "mine",
      "schmelze",
      "schmiede",
      "kartoffelhof",
      "brennerei"
    ]
  },
  {
    "id": 3,
    "name": "Dorf",
    "threshold": "40 Siedler",
    "goods": [
      "wolle",
      "tuch",
      "honig",
      "wachs",
      "docht",
      "kerzen",
      "haeute",
      "leder",
      "stiefel"
    ],
    "buildings": [
      "schaefer",
      "weberei",
      "imkerei",
      "dochtdreherei",
      "kerzenzieherei",
      "lager",
      "feuer",
      "rinderhof",
      "gerberei",
      "schuster"
    ]
  },
  {
    "id": 4,
    "name": "Hafenstadt",
    "threshold": "Erster Bürger",
    "goods": [
      "schweine",
      "talg",
      "wurst",
      "gewuerz",
      "laternen"
    ],
    "buildings": [
      "schweinehof",
      "talgfabrik",
      "metzger",
      "gewuerzfarm",
      "laternenwerkstatt",
      "werft"
    ]
  },
  {
    "id": 5,
    "name": "Handelsstadt",
    "threshold": "120 Bürger",
    "goods": [
      "hopfen",
      "bier",
      "trauben",
      "wein",
      "sand",
      "kalk",
      "glas",
      "papier"
    ],
    "buildings": [
      "hopfen",
      "brauerei",
      "weingut",
      "kelterei",
      "kirche",
      "sandgrube",
      "kalkbrennerei",
      "glashuette",
      "papiermuehle"
    ]
  },
  {
    "id": 6,
    "name": "Ratsstadt",
    "threshold": "Erster Patrizier",
    "goods": [
      "blueten",
      "farbstoff",
      "feine_kleidung",
      "geschirr",
      "buecher",
      "zement",
      "beton"
    ],
    "buildings": [
      "blumenhof",
      "faerberei",
      "schneiderei",
      "geschirrmanufaktur",
      "druckerei",
      "gemeinschaftshaus",
      "zementwerk",
      "betonwerk"
    ]
  },
  {
    "id": 7,
    "name": "Prachtstadt",
    "threshold": "Erster Aristokrat",
    "goods": [
      "seife",
      "moebel",
      "parfuem",
      "goldstaub",
      "schmuck"
    ],
    "buildings": [
      "seifensiederei",
      "tischlerei",
      "parfuemerie",
      "goldmine",
      "juwelier",
      "garten"
    ],
    "portrait": "i_t4"
  },
  {
    "id": 8,
    "name": "Großstadt",
    "threshold": "1.000 Einwohner und 250 Aristokraten",
    "goods": [],
    "buildings": [
      "deko_bank",
      "deko_blumenbeet",
      "deko_teich",
      "deko_park"
    ],
    "message": "Repräsentative Viertel und öffentliche Grünanlagen.",
    "portrait": "i_t4"
  },
  {
    "id": 9,
    "name": "Metropole",
    "threshold": "2.000 Einwohner und fünf eigene Inseln",
    "goods": [],
    "buildings": [
      "rathaus",
      "deko_garten",
      "deko_brunnen"
    ],
    "message": "Fünf Inseln. Ein blühendes Handelsreich.",
    "portrait": "i_t4",
    "rewards": [
      {
        "name": "+10 % Steuereinnahmen",
        "icon": "gold"
      },
      {
        "name": "−10 % Gebäudeunterhalt",
        "icon": "werkzeug"
      }
    ],
    "projectNote": "Geplantes Großprojekt; Boni nach Fertigstellung."
  },
  {
    "id": 10,
    "name": "Weltstadt",
    "threshold": "3.000 Einwohner und 500 Aristokraten",
    "goods": [],
    "buildings": [
      "ausstellungspalast"
    ],
    "message": "Deine Weltstadt ist weit über ihre Küsten hinaus bekannt.",
    "portrait": "i_t4",
    "rewards": [
      {
        "name": "+20 % Produktion",
        "icon": "werkzeug"
      },
      {
        "name": "+10 % Steuereinnahmen",
        "icon": "gold"
      },
      {
        "name": "−10 % Luxusverbrauch",
        "icon": "schmuck"
      }
    ],
    "projectNote": "Geplantes Großprojekt; Boni nach Fertigstellung."
  }
];
