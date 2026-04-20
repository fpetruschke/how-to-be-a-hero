/**
 * Vorgegebene Fähigkeiten-Presets (How to be a Hero: Fähigkeitsnamen je Begabung).
 * Werte sind bewusst leer — Spieler verteilen die 400 Punkte selbst.
 * @see https://howtobeahero.de/index.php/Fähigkeiten
 */
window.HTBAH_STANDARD_FAEHIGKEITEN_PRESETS = [
  {
    htbahPresetId: 'htbah-mittelalter-fantasy',
    name: 'Mittelalter-Fantasy-Preset',
    handeln: [
      { name: 'Schwertkampf', value: null },
      { name: 'Nahkampf (bewaffnet)', value: null },
      { name: 'Faustkampf', value: null },
      { name: 'Bogenschießen', value: null },
      { name: 'Reiten', value: null },
      { name: 'Schleichen', value: null },
      { name: 'Klettern', value: null },
      { name: 'Athletik', value: null },
      { name: 'Schwimmen', value: null },
    ],
    wissen: [
      { name: 'Magiekunde', value: null },
      { name: 'Geschichte & Legenden', value: null },
      { name: 'Heilkunde', value: null },
      { name: 'Religion', value: null },
      { name: 'Physik & Mechanik', value: null },
      { name: 'Alte Sprachen', value: null },
      { name: 'Tierkunde', value: null },
      { name: 'Geografie', value: null },
      { name: 'Überleben (Wildnis)', value: null },
    ],
    soziales: [
      { name: 'Überreden', value: null },
      { name: 'Einschüchtern', value: null },
      { name: 'Etikette & Anstand', value: null },
      { name: 'Handel & Feilschen', value: null },
      { name: 'Lügen', value: null },
      { name: 'Menschenkenntnis', value: null },
      { name: 'Auftreten', value: null },
      { name: 'Diplomatie', value: null },
      { name: 'Verführen', value: null },
    ],
  },
  {
    htbahPresetId: 'htbah-zombie-apokalypse',
    name: 'Zombie-Apokalypse',
    handeln: [
      { name: 'Schusswaffen', value: null },
      { name: 'Nahkampf', value: null },
      { name: 'Schleichen', value: null },
      { name: 'Athletik', value: null },
      { name: 'Fahren', value: null },
      { name: 'Reparieren', value: null },
      { name: 'Klettern', value: null },
    ],
    wissen: [
      { name: 'Medizin & Erste Hilfe', value: null },
      { name: 'Technik & Elektronik', value: null },
      { name: 'Überleben (urban)', value: null },
      { name: 'Mechanik', value: null },
      { name: 'Chemie (Basis)', value: null },
      { name: 'Orientierung', value: null },
      { name: 'Computer', value: null },
    ],
    soziales: [
      { name: 'Führung', value: null },
      { name: 'Überreden', value: null },
      { name: 'Einschüchtern', value: null },
      { name: 'Lügen', value: null },
      { name: 'Menschenkenntnis', value: null },
      { name: 'Verhandeln', value: null },
      { name: 'Motivation (Gruppe)', value: null },
    ],
  },
];
