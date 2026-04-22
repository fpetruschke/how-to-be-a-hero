/**
 * Wortlisten für Rätsel-Zufallsgenerator (epochenabhängige Stimmung).
 */
window.HTBAH = window.HTBAH || {};

window.HTBAH.ZufallsgeneratorRaetselListen = {
  SCHWIERIGKEIT: ['leicht', 'mittel', 'schwer'],

  ARTIKEL: {
    mittelalter: [
      'Worträtsel',
      'Ratespiel',
      'Schlüssel- & Schlossrätsel',
      'Mechanismus / Hebel',
      'Licht- & Spiegelpuzzle',
      'Schriftzeichen & Codes',
      'Reihenfolge & Muster',
      'Gegenstand raten',
    ],
    gegenwart: [
      'Logikrätsel',
      'Ratespiel',
      'Schloss, Code & Zugang',
      'Schaltkreis / Technik-Puzzle',
      'Licht, Reflexion & Sensorik',
      'Zahlen- & Buchstabencode',
      'Reihenfolge & Muster',
      'Objekt / Person einordnen',
    ],
    zukunft: [
      'Kryptologisches Rätsel',
      'Deduktionsspiel',
      'Sicherheitsschloss & Schlüsselchip',
      'Interface- / Energie-Rätsel',
      'Hologramm & Lichtführung',
      'Datenfragment & Symbolfolge',
      'Sequenz synchronisieren',
      'Artefakt / Wesen bestimmen',
    ],
  },

  /** Kurztitel-Bausteine */
  TITEL_HOOK: {
    mittelalter: [
      'Das Siegel des Chronisten',
      'Die dreifache Frage',
      'Worte aus dem Nebel',
      'Das leise Flüstern der Steine',
      'Schlüssel unter der Schwelle',
      'Sieben Kerzen, ein Schatten',
    ],
    gegenwart: [
      'Zugangscode fehlt',
      'Die letzte Nachricht',
      'Kamera tot, Sensor aktiv',
      'Backup auf dem Sticker',
      'Tür öffnet sich nicht',
      'Fingerabdruck auf Glas',
    ],
    zukunft: [
      'Fragmentierte Autorisierung',
      'Nullfeld-Kalibrierung',
      'Echo aus dem Archiv',
      'Subsystem verweigert',
      'Quantensignatur unvollständig',
      'Sternenkarte als Schlüssel',
    ],
  },

  HIMMELSRICHTUNGEN: ['Norden', 'Osten', 'Süden', 'Westen', 'Nordosten', 'Südwesten'],

  TAGESZEITEN: [
    'Morgendämmerung',
    'Mittagssonne',
    'Abenddämmerung',
    'tiefe Nacht',
    'die erste Stunde nach Mitternacht',
    'die „goldene Stunde“ vor Sonnenuntergang',
  ],

  ORTE_ABSTRAKT: {
    mittelalter: [
      'den vergessenen Friedhof hinter der Mauer',
      'die alte Bibliothek im Nordturm',
      'den Brunnen auf dem Marktplatz',
      'die Schmiede am Fluss',
      'die Kapelle auf dem Hügel',
      'das unterirdische Gewölbe',
    ],
    gegenwart: [
      'den stillgelegten U-Bahn-Schacht',
      'das leerstehende Lagerhaus am Kai',
      'die Dachterrasse des Hotels',
      'den Parkplatz C beim Einkaufszentrum',
      'die Technikzentrale im Keller',
      'den alten Sendemast am Stadtrand',
    ],
    zukunft: [
      'Dock 7 der Raumstation',
      'die Recycling-Sektion der Agora',
      'das medizinische Habitat-Modul',
      'die verbotene Wartungsschleuse',
      'den verlassenen Terraform-Trakt',
      'die Kommandokanäle der Orbitalfestung',
    ],
  },

  PERSON_ROLLE: {
    mittelalter: [
      'einen namenlosen Pilger',
      'den Vogt, der zu viel weiß',
      'die Kräuterfrau am Tor',
      'den Waffenschmied mit der Narbe',
      'das Kind, das nur Lieder singt',
    ],
    gegenwart: [
      'einen Zeugen mit verwischter Erinnerung',
      'die Person auf dem Überwachungsfoto',
      'den Techniker der Nachtschicht',
      'die Vermieterin aus dem Erdgeschoss',
      'den Fahrer des weißen Lieferwagens',
    ],
    zukunft: [
      'den KI-Kuratoren mit fehlerhaftem Akzent',
      'die Klon-Kommunikatorin der Linie 4',
      'den desertierten Sicherheitsdroide',
      'den Archivar mit halb gelöschtem Gedächtnis',
      'die Botschafterin ohne offizielle Akte',
    ],
  },

  RATEZIEL_SACHLICH: {
    mittelalter: [
      'ein silberner Dolch mit fehlendem Griff',
      'ein Wachssiegel mit dem falschen Wappen',
      'ein leerer Kelch, der nach Honig riecht',
      'ein zerbrochener Spiegel in einem Rahmen aus Eibe',
    ],
    gegenwart: [
      'ein USB-Stick in einem Energydrink-Kühler',
      'ein Parkticket mit handschriftlichem Zusatz',
      'eine Smartwatch ohne SIM, aber mit GPS-Spur',
      'ein Post-it unter der Tastatur',
    ],
    zukunft: [
      'ein defekter Translator-Chip mit Fremdschrift',
      'ein Energiezelle mit zwei Seriennummern',
      'ein Hologramm-Projektor, der nur Schnee zeigt',
      'ein Datensplitter, der Wärme abgibt',
    ],
  },

  MECHANIK_SZENE: {
    mittelalter: [
      'Statuen mit kleinen Spiegeln in den Händen — das Licht eines Schlitzfensters muss auf einen bestimmten Fleck der Wand fallen.',
      'drei Hebel an der Wand; nur eine Kombination entriegelt die Falltür, ohne eine Falle auszulösen.',
      'ein Kreis aus Runensteinen — sie müssen in der richtigen Reihenfolge berührt werden.',
      'ein Wasserrad im Nebenraum beeinflusst die Höhe eines Pegels, der erst dann den Schlüssel freigibt.',
    ],
    gegenwart: [
      'Lichtreflexion über Glasfasern — die Enden müssen so gedreht werden, dass ein Laserstrahl den Sensor trifft.',
      'ein Zahlenschloss mit drei richtigen Zahlen aus dem Raum (Datum, Hausnummer, Parkplatznummer).',
      'Stromkreise: Sicherungen in der richtigen Reihenfolge setzen, damit die Tür nicht dauerhaft sperrt.',
      'ein Rätsel aus Überwachungskamera-Winkeln — wer steht wo, um den Code zu ergeben?',
    ],
    zukunft: [
      'Gravitationsfelder drehen, bis ein Energiestrahl die Resonanzkammer füllt.',
      'drei Hologramm-Projektoren synchronisieren — das Muster zeigt die nächste Koordinate.',
      'Naniten-Schlösser: biometrische Probe muss in der richtigen Reihenfolge mit drei Proben kombiniert werden.',
      'ein Quantenrätsel: zwei widersprüchliche Messungen müssen „eingefroren“ werden, um den Zugang zu stabilisieren.',
    ],
  },

  WORT_RAETSEL_WORTE: {
    mittelalter: ['SCHLOSS', 'RUNE', 'FEUER', 'NACHT', 'PFAD', 'TURM', 'WIND', 'HERZ'],
    gegenwart: ['CODE', 'TÜR', 'SPUR', 'ZEIT', 'PLAN', 'RUF', 'TAG', 'ORT'],
    zukunft: ['DATEN', 'STERN', 'FELD', 'NULL', 'PFAD', 'ECHO', 'MODUL', 'LICHT'],
  },

  SL_TIPPS: [
    'Wenn die Gruppe feststeckt, lasse eine Figur unbeabsichtigt einen Buchstaben nennen.',
    'Ein erfolgreicher Sinn- oder Wahrnehmungswurf darf eine falsche Spur ausschließen.',
    'Zeitdruck (Fackel, Alarm) erhöht die Spannung — optional.',
    'Die Lösung kann auch durch Verhandeln oder einen hohen Wurf „übersprungen“ werden, dann kostet es etwas anderes (Ruf, Ressource).',
  ],
};
