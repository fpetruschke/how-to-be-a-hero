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

  ART_FAMILIE: {
    wort: {
      mittelalter: 'Worträtsel',
      gegenwart: 'Logikrätsel',
      zukunft: 'Kryptologisches Rätsel',
    },
    rate: {
      mittelalter: 'Ratespiel',
      gegenwart: 'Ratespiel',
      zukunft: 'Deduktionsspiel',
    },
    schloss: {
      mittelalter: 'Schlüssel- & Schlossrätsel',
      gegenwart: 'Schloss, Code & Zugang',
      zukunft: 'Sicherheitsschloss & Schlüsselchip',
    },
    mechanik: {
      mittelalter: 'Mechanismus / Hebel',
      gegenwart: 'Schaltkreis / Technik-Puzzle',
      zukunft: 'Interface- / Energie-Rätsel',
    },
    code: {
      mittelalter: 'Schriftzeichen & Codes',
      gegenwart: 'Zahlen- & Buchstabencode',
      zukunft: 'Datenfragment & Symbolfolge',
    },
    muster: {
      mittelalter: 'Reihenfolge & Muster',
      gegenwart: 'Reihenfolge & Muster',
      zukunft: 'Sequenz synchronisieren',
    },
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

  RATEZIEL_HINWEISE: {
    mittelalter: [
      'Es ist älter als die Möbel im Raum, aber wurde kürzlich bewegt.',
      'Es riecht nach Metall, Wachs oder nassem Stein.',
      'Es ist kleiner als eine Hand, aber zu schwer für den offensichtlichen Zweck.',
      'Es trägt keine Inschrift, aber eine bekannte Form oder ein Wappenmotiv.',
    ],
    gegenwart: [
      'Es wirkt unauffällig, bis man es gegen das Licht hält.',
      'Es ist kürzlich hier abgelegt worden — Staub und Fingerabdrücke sind noch frisch.',
      'Es passt nicht zum Rest des Raums — als wäre es absichtlich platziert.',
      'Es summt, klickt oder vibriert leise, wenn niemand hinsieht.',
    ],
    zukunft: [
      'Es ist warm, obwohl keine Energiequelle sichtbar ist.',
      'Es reagiert auf Nähe mit einem kurzen Lichtimpuls.',
      'Zwei Seriennummern widersprechen sich — eine davon ist die Spur.',
      'Es zeigt nur dann Schrift, wenn die Umgebungsbeleuchtung gedimmt wird.',
    ],
  },

  MECHANIK_SZENE: {
    mittelalter: [
      'Drei kleine Spiegel an Statuen müssen so gedreht werden, dass das Licht eines Schlitzfensters einen markierten Punkt an der Wand trifft.',
      'Drei Hebel an der Wand — nur eine Kombination öffnet die Falltür, ohne eine Falle auszulösen.',
      'Runensteine im Kreis müssen in der richtigen Reihenfolge berührt werden; falsche Steine kühlen sich spürbar ab.',
      'Ein Wasserrad im Nebenraum hebt einen Pegel an — erst bei der richtigen Höhe rutscht der Schlüssel aus einer Nische.',
    ],
    gegenwart: [
      'Glasfaser-Enden müssen gedreht werden, bis ein Laserstrahl den Sensor an der Tür trifft.',
      'Ein Zahlenschloss verlangt drei Ziffern, die sich im Raum finden lassen (Datum, Hausnummer, Kennzeichnung).',
      'Sicherungen müssen in der richtigen Reihenfolge gesetzt werden — sonst fällt die Tür dauerhaft zu.',
      'Auf einem Ausdruck aus Überwachungsfotos fehlt eine Figur — ihre Position ergibt den nächsten Hinweis.',
    ],
    zukunft: [
      'Drei Projektoren müssen synchronisiert werden, bis ein Energiemuster stabil aufleuchtet.',
      'Schwerkraftfelder lassen sich in Stufen drehen — erst im richtigen Verhältnis öffnet sich die Schleuse.',
      'Drei Proben müssen nacheinander an Lesegeräten gehalten werden — die Reihenfolge steht in einem Störsignal als Rhythmus.',
      'Zwei widersprüchliche Messwerte auf der Konsole müssen „eingefroren“ werden, bevor der Zugang stabil bleibt.',
    ],
  },

  SCHLOSS_VARIANTEN: {
    mittelalter: [
      'Ein eiserner Ring mit drei Kerben muss in der richtigen Tiefe gesteckt werden; ein falscher Schlüssel nebenan aktiviert eine Falle.',
      'Die Tür hat kein Schlüsselloch — aber drei Markierungen am Rahmen deuten auf eine verborgene Klinke.',
      'Ein Wappen auf der Truhe zeigt die richtige Reihenfolge, in der vier kleine Hebel gezogen werden müssen.',
    ],
    gegenwart: [
      'Ein elektronisches Schloss verlangt eine PIN — Ziffern stehen auf Post-its, Visitenkarten und einem Kalenderblatt.',
      'Eine Magnetkarte liegt im Raum, aber das Lesegerät braucht zusätzlich einen Code von der Rückseite eines Bildes.',
      'Ein Fingerabdruck-Scanner reagiert nur, wenn vorher der richtige Schalter an der Sicherung gesetzt wurde.',
    ],
    zukunft: [
      'Ein Schlüsselchip muss in drei Lesegeräten nacheinander gehalten werden — die Reihenfolge ist in einem Störsignal kodiert.',
      'Die Schleuse öffnet sich nur, wenn zwei Autorisierungsfragmente gleichzeitig an verschiedenen Terminals bestätigt werden.',
      'Ein Energiefeld blockiert den Gang — die richtige Frequenz steht in einem halb gelöschten Wartungsprotokoll.',
    ],
  },

  CODEFOLGE_REGELN: {
    mittelalter: [
      'Die Inschrift lautet: „Beginne beim Kreis, ende beim Stern.“',
      'Die eingravierten Punkte unter den Symbolen sind unterschiedlich groß — von klein nach groß lesen.',
      'Die Symbole an der Wand sind von links nach rechts zu lesen — die Hebel aber von rechts nach links zu betätigen.',
      'Nur Symbole mit gerader Kantenzahl zählen; die anderen sind Ablenkung.',
    ],
    gegenwart: [
      'Auf einem Zettel steht: „Reverse engineering allowed.“ — die Wandfolge rückwärts eingeben.',
      'Die Symbole leuchten nacheinander kurz auf, wenn niemand sie berührt — das ist die richtige Reihenfolge.',
      'Unter jedem Symbol steht eine Zahl — aufsteigend sortieren.',
      'Zwei Symbole sind Aufkleber und gehören nicht zur Lösung.',
    ],
    zukunft: [
      'Die Konsole zeigt: „Synchronize by wavelength.“ — Reihenfolge nach Farbe des Leuchtfelds (kurz → lang).',
      'Das Muster an der Wand ist Spiegelbild — die Eingabe muss gespiegelt werden.',
      'Nur Symbole mit aktivem Puls im Takt des Relais zählen.',
      'Die richtige Folge entspricht der Startsequenz im Wartungslog (Eintrag #3).',
    ],
  },

  MUSTER_BEISPIELE: {
    mittelalter: [
      'Drei Glocken müssen in der Reihenfolge tief — mittel — hoch — tief geschlagen werden. Welcher Schlag fehlt noch?',
      'Vier Fackeln an der Wand — nur eine Kombination hält die Flamme gleichmäßig, ohne zu verlöschen.',
      'Steinplatten auf dem Boden klingen unterschiedlich — die Gruppe soll die Melodie aus einem alten Lied nachgehen.',
    ],
    gegenwart: [
      'Drei Lichtschalter beeinflussen sich gegenseitig — Start: alle aus. Ziel: nur die mittlere Lampe leuchtet.',
      'Farbcodierte Kabel müssen in der Reihenfolge verbunden werden, die auf dem Schaltplan mit Pfeilen markiert ist.',
      'Auf einem Display blinkt eine Zahlenfolge — die Gruppe muss sie einmal korrekt wiederholen.',
    ],
    zukunft: [
      'Drei Energieknoten müssen den gleichen Phasenwinkel haben — die Konsole zeigt nur relative Werte.',
      'Ein Hologramm zeigt eine Sequenz von Formen — die Gruppe muss sie in derselben Reihenfolge an Touchfeldern nachspielen.',
      'Zwei Systeme laufen im Takt — erst wenn beide im gleichen Intervall schalten, öffnet sich das Tor.',
    ],
  },

  WORT_RAETSEL_WORTE: {
    mittelalter: ['SCHLOSS', 'RUNE', 'FEUER', 'NACHT', 'PFAD', 'TURM', 'WIND', 'HERZ'],
    gegenwart: ['CODE', 'TÜR', 'SPUR', 'ZEIT', 'PLAN', 'RUF', 'TAG', 'ORT'],
    zukunft: ['DATEN', 'STERN', 'FELD', 'NULL', 'PFAD', 'ECHO', 'MODUL', 'LICHT'],
  },

  WORT_RAETSEL_KONTEXT: {
    mittelalter: [
      'Das Wort passt zum Ort, zu einer Inschrift oder zu dem, was die Gruppe hier sucht.',
      'Ein Chronist hat die Buchstaben absichtlich verdreht — es handelt sich um ein bekanntes Schlagwort der Gegend.',
      'Die Buchstaben stehen auf einem Siegel, dessen Motiv einen Hinweis gibt.',
    ],
    gegenwart: [
      'Das Wort steht im Zusammenhang mit dem Zugangscode oder dem Fall, den die Gruppe verfolgt.',
      'Die Buchstaben wurden mit Edding auf einen Spiegel gekritzelt — es ist ein gängiger Begriff im Gebäude.',
      'Auf einem Post-it fehlen die Buchstaben — sie gehören zu einem Ort oder Objekt im Raum.',
    ],
    zukunft: [
      'Das Wort ist ein Systemsbegriff — es taucht auch auf einem defekten Display auf.',
      'Die Buchstaben stammen aus einem Archivfragment; sie bezeichnen ein Modul oder Protokoll.',
      'Ein Translator hat die Silben zerlegt — das Lösungswort ist ein Fachbegriff der Station.',
    ],
  },

  IDEE_BASIS: {
    wort: 'Das Lösungswort sollte zum Ort oder Thema der Szene passen — passe es bei Bedarf an.',
    rate: 'Lasse Vermutungen ausspielen; gib Sinnesdetails erst, wenn die Gruppe gezielt untersucht.',
    schloss: 'Verteile Hinweise auf mehrere Objekte im Raum. Fehlversuche sollen spürbar sein, aber nicht automatisch tödlich enden.',
    mechanik:
      'Jeder Versuch braucht eine sichtbare Reaktion (Klick, Licht, Wasserstand). Bei Erfolg ein deutliches Signal; bei Fehlern optional Aufmerksamkeit im Umkreis.',
    code: 'Die Regel sollte im Raum auffindbar sein — nicht nur in diesen Notizen. Lass die Gruppe Symbole zuerst vergleichen.',
    muster: 'Notiere dir vorab die korrekte Reihenfolge oder Endstellung. Optional Zeitdruck oder zählbare Versuche.',
  },

  SL_TIPPS_FAMILIE: {
    wort: [
      'Bei Feststecken einen einzelnen Buchstaben freigeben — oder einen NSC unbewusst eine Silbe murmeln lassen.',
      'Ein Intelligenz- oder Wissenwurf darf zwei Buchstaben enthüllen oder eine falsche Anordnung ausschließen.',
    ],
    rate: [
      'Hinweise schrittweise geben: Form und Material, dann Geruch oder Temperatur, zuletzt Bedeutung.',
      'Ein Wurf auf Wahrnehmen oder Recherchieren darf eine falsche Vermutung ausschließen.',
      'Eine plausible Erklärung reicht zum Vorankommen — die Lösung muss nicht sofort perfekt sein.',
    ],
    schloss: [
      'Wenn der Weg erkannt ist, aber gewürfelt wird schlecht, kann ein NSC oder Werkzeug helfen — gegen einen Preis.',
      'Ein Fehlversuch als Geräusch oder Zeitverlust darstellen reicht meist aus.',
    ],
    mechanik: [
      'Bei „fast richtig“ ein kleines Signal geben — ohne die Lösung zu verraten.',
      'Zeitdruck nur einsetzen, wenn er die Szene wirklich verstärkt.',
    ],
    code: [
      'Ein Wahrnehmungswurf kann den Unterschied zwischen zwei ähnlichen Zeichen offenbaren.',
      'Falsche Symbole oder Ablenkungen markieren, sobald die Gruppe gezielt danach sucht.',
    ],
    muster: [
      'Bei „fast richtig“ ein leises Signal: Ton, kurzes Aufleuchten oder Vibration.',
      'Die entscheidende Regel als Inschrift, Schaltplan oder Melodie im Raum verstecken.',
    ],
  },

  SL_TIPPS_ALLGEMEIN: [
    'Zeitdruck (Fackel, Alarm) erhöht die Spannung — nur wenn es zur Szene passt.',
    'Die Lösung kann manchmal durch Verhandeln oder einen hohen Wurf abgekürzt werden — dann kostet es etwas anderes (Ruf, Ressource).',
  ],

  /** @deprecated Legacy-Fallback */
  SL_TIPPS: [
    'Zeitdruck (Fackel, Alarm) erhöht die Spannung — nur wenn es zur Szene passt.',
    'Die Lösung kann manchmal durch Verhandeln oder einen hohen Wurf abgekürzt werden — dann kostet es etwas anderes (Ruf, Ressource).',
  ],

  ATMOSPHAERE: {
    mittelalter: [
      'Staub und Kerzenrauch liegen in der Luft.',
      'Alte Inschriften flüstern vom Rand des Raumes.',
      'Ein Entwurf zieht durch Ritzen — die Fackel flackert.',
      'Die Stille wirkt absichtlich, fast feierlich.',
      'Gerüche von Wachs, Stein und feuchtem Holz.',
    ],
    gegenwart: [
      'Neonlicht spiegelt sich auf poliertem Boden.',
      'Ein Summen von Lüftung und Elektronik.',
      'Kabel, Klebeband und Post-its markieren Spuren.',
      'Die Klimaanlage kämpft gegen feuchte Luft.',
      'Smartphone-Taschenlampen tanzen über Wände.',
    ],
    zukunft: [
      'Schwache Notbeleuchtung pulsiert im Takt eines Relais.',
      'Kühle, recycelte Luft riecht nach Metall.',
      'Hologramme flackern bei Störungen im Feld.',
      'Schwerkraft fühlt sich leicht falsch an.',
      'Leise Warnsignale aus verborgenen Sensoren.',
    ],
  },
};
