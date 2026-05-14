window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};
var HTBAH_REFACTOR_UTILS =
  (window.HTBAH_SHARED && window.HTBAH_SHARED.RefactorUtils) || null;
var HTBAH_BOOTSTRAP_MODAL =
  (window.HTBAH_SHARED && window.HTBAH_SHARED.BootstrapModalHelper) || null;

const SPEICHER_BEREICHE = {
  charakter: {
    keys: ['htbah_characters', 'htbah_active_character_id', 'htbah_character', 'htbah_character_image'],
    titel: 'Alle Charakterdaten löschen?',
    beschreibung:
      'Alle gespeicherten Charaktere mit ihren Bildern werden entfernt.',
    erfolg: 'Alle Charakterdaten wurden gelöscht.',
    buttonSymbol: '🧙',
    buttonLabel: 'Alle Charakterdaten löschen',
  },
  charakterbild: {
    key: 'htbah_character_image',
    titel: 'Charakterbild löschen?',
    beschreibung:
      'Dein ausgewähltes Charakterbild wird entfernt. Deine übrigen Charakterdaten bleiben erhalten.',
    erfolg: 'Charakterbild wurde gelöscht.',
    buttonSymbol: '🖼️',
    buttonLabel: 'Charakterbild löschen',
  },
  presets: {
    key: 'htbah_presets',
    titel: 'Fähigkeiten-Presets löschen?',
    beschreibung:
      'Alle gespeicherten Fähigkeiten-Presets für schnelle Charakter-Erstellung werden entfernt.',
    erfolg: 'Fähigkeiten-Presets wurden gelöscht.',
    buttonSymbol: '📦',
    buttonLabel: 'Fähigkeiten-Presets löschen',
  },
  theme: {
    key: 'htbah_theme',
    titel: 'Darstellung zurücksetzen?',
    beschreibung:
      'Deine gespeicherte Theme-Auswahl wird entfernt und die App nutzt wieder das helle Standard-Theme.',
    erfolg: 'Darstellung wurde auf das Standard-Theme zurückgesetzt.',
    buttonSymbol: '🎨',
    buttonLabel: 'Theme-Einstellung löschen',
  },
  zufallstabellen: {
    key: 'htbah_zufallstabellen',
    titel: 'Zufallstabellen löschen?',
    beschreibung:
      'Alle gespeicherten Einträge in den Zufallstabellen je Kampagne (NPCs, Orte, Fraktionen, Pantheon, Gegenstände, Rätsel, Bestarium) werden entfernt.',
    erfolg: 'Zufallstabellen wurden gelöscht.',
    buttonSymbol: '📚',
    buttonLabel: 'Zufallstabellen löschen',
  },
  weltenbau: {
    key: 'htbah_weltenbau',
    titel: 'Weltenbau-Bilder löschen?',
    beschreibung:
      'Alle unter „Weltenbau“ und in der interaktiven Welt je Kampagne gespeicherten Daten (Bilder, Karten, Generatoren) werden aus dem lokalen Speicher entfernt.',
    erfolg: 'Weltenbau-Bilder wurden gelöscht.',
    buttonSymbol: '🗺️',
    buttonLabel: 'Weltenbau-Bilder löschen',
  },
  wuerfelbeutelLayout: {
    keys: [
      'htbah_dice_colors',
      'htbah_wuerfel_beutel_fenster',
    ],
    titel: 'Würfelbeutel-Layout löschen?',
    beschreibung:
      '3D-Würfel (Aktivierung und Farbe) sowie gespeicherte Größe und Position des Würfelbeutel-Fensters werden entfernt. Wetter/Tageszeit ist Teil der jeweiligen Kampagne und bleibt unter „Spielleiter-Kampagnen“ gespeichert.',
    erfolg: 'Würfelbeutel-Layout wurde gelöscht.',
    buttonSymbol: '🎲',
    buttonLabel: 'Würfelbecher-Einstellungen löschen',
  },
  sicherheitsmechanismen: {
    titel: 'Sicherheitsmechanismen löschen?',
    beschreibung:
      'Die Session-Zero-Sicherheitsmechanismen (Grenzen, Schleier) werden bei allen Charakteren entfernt.',
    erfolg: 'Sicherheitsmechanismen wurden für alle Charaktere entfernt.',
    buttonSymbol: '🛑',
    buttonLabel: 'Sicherheitsmechanismen löschen',
  },
  spielleiter: {
    key: 'htbah_spielleiter_kampagnen',
    titel: 'Spielleiter-Kampagnen löschen?',
    beschreibung:
      'Alle gespeicherten Kampagnen und Charaktere in der Spielleiter-Ansicht werden entfernt — inklusive der jeweils zugehörigen Abenteuerbücher, Wetter/Tageszeit-Daten und Badge-Positionen.',
    erfolg: 'Spielleiter-Kampagnen wurden gelöscht.',
    buttonSymbol: '👥',
    buttonLabel: 'Spielleiter-Kampagnen löschen',
  },
  alles: {
    keys: [
      'htbah_app_rolle',
      'htbah_active_character_id',
      'htbah_characters',
      'htbah_character',
      'htbah_character_image',
      'htbah_presets',
      'htbah_theme',
      'htbah_spielleiter_kampagnen',
      'htbah_zufallstabellen',
      'htbah_weltenbau',
      'htbah_wuerfel_audio',
      'htbah_wuerfel_sound',
      'htbah_dice_colors',
      'htbah_wuerfel_beutel_fenster',
      'htbah_wuerfelbecher_bundle',
      'htbah_orientation_mode',
      'htbah_interaktive_welt_stats_anzeigen',
    ],
    titel: 'Alle lokalen Daten löschen?',
    beschreibung:
      'Es werden Charakterdaten, Charakterbild, gespeicherte Fähigkeiten-Presets, Spielleiter-Kampagnen (inkl. Abenteuerbücher, Wetter/Tageszeit und Badge-Position), Zufallstabellen und Weltenbau-Daten je Kampagne, deine Theme-Auswahl, die Würfel-Audio-Einstellungen, 3D-Würfel-Farben sowie Größe und Position des Würfelbeutel-Fensters entfernt. Die App entspricht danach einem frischen Start.',
    erfolg: 'Alle gespeicherten Daten wurden gelöscht.',
    buttonSymbol: '🗑️',
    buttonLabel: 'Alles löschen',
  },
};

/** Kategorien der Zufallstabellen (Listen-Schlüssel im Speicher), Reihenfolge für die Lösch-UI. */
const ZTF_KAMPAGNE_KATEGORIEN = [
  { schluessel: 'orte', label: 'Orte' },
  { schluessel: 'fraktionen', label: 'Fraktionen' },
  { schluessel: 'npcs', label: 'NPCs' },
  { schluessel: 'bestien', label: 'Bestiarium' },
  { schluessel: 'gegenstaende', label: 'Gegenstände' },
  { schluessel: 'raetsel', label: 'Rätsel' },
  { schluessel: 'pantheon', label: 'Pantheon' },
];

const WUERFELBECHER_KEYS = [
  'htbah_dice_colors',
  'htbah_wuerfel_beutel_fenster',
  'htbah_wuerfel_audio',
  'htbah_wuerfel_sound',
];
const WUERFELBECHER_BUNDLE_KEY = 'htbah_wuerfelbecher_bundle';

const IMPORT_IGNORIERE_KEYS = new Set(['htbah_app_rolle', 'htbah_active_character_id']);

function htbahNormalisiereLokalerSpeicherImportDaten(rohDaten) {
  if (!Array.isArray(rohDaten)) {
    return [];
  }
  const arr = rohDaten.filter((e) => e && typeof e === 'object' && typeof e.key === 'string');
  const gefiltert = arr.filter((e) => !IMPORT_IGNORIERE_KEYS.has(e.key));

  const bundleSrc = gefiltert.find((e) => e.key === WUERFELBECHER_BUNDLE_KEY);
  const legacy = gefiltert.filter((e) => WUERFELBECHER_KEYS.includes(e.key));
  const ohneWuerfel = gefiltert.filter(
    (e) => e.key !== WUERFELBECHER_BUNDLE_KEY && !WUERFELBECHER_KEYS.includes(e.key),
  );

  if (!bundleSrc && !legacy.length) {
    return ohneWuerfel;
  }

  const eintraege = {};
  if (bundleSrc && bundleSrc.vorhanden && typeof bundleSrc.wert === 'string') {
    try {
      const p = JSON.parse(bundleSrc.wert);
      if (p && p.typ === 'wuerfelbecher-bundle' && p.eintraege && typeof p.eintraege === 'object') {
        Object.assign(eintraege, p.eintraege);
      }
    } catch {
      /* ignorieren */
    }
  }
  legacy.forEach((e) => {
    if (e.vorhanden && typeof e.wert === 'string') {
      eintraege[e.key] = e.wert;
    }
  });

  const bundleVorhanden = Object.keys(eintraege).length > 0;
  return [
    ...ohneWuerfel,
    {
      id: 'wuerfelbecher',
      key: WUERFELBECHER_BUNDLE_KEY,
      label: 'Würfelbecher',
      vorhanden: bundleVorhanden,
      wert: bundleVorhanden
        ? JSON.stringify({ typ: 'wuerfelbecher-bundle', version: 1, eintraege })
        : null,
    },
  ];
}

const DATEN_EXPORT_BEREICHE_GLOBAL = [
  {
    id: 'sicherheitsmechanismen',
    key: 'htbah_sicherheitsmechanismen_bundle',
    label: 'Sicherheitsmechanismen (Grenzen, Schleier)',
  },
  {
    id: 'presets',
    key: 'htbah_presets',
    label: 'Fähigkeiten-Presets',
  },
  {
    id: 'charakterbildLegacy',
    key: 'htbah_character_image',
    label: 'Charakterbild (Legacy)',
  },
  {
    id: 'theme',
    key: 'htbah_theme',
    label: 'Theme-Einstellung',
  },
  {
    id: 'wuerfelbecher',
    key: WUERFELBECHER_BUNDLE_KEY,
    label: 'Würfelbecher',
  },
];

/** Alte Sammel-Export-IDs (Import-Label-Fallback, weiterhin in importStarten unterstützt). */
const DATEN_EXPORT_LEGACY_META = [
  {
    id: 'kampagnen',
    key: 'htbah_spielleiter_kampagnen',
    label: 'Kampagnen: alle Spielleiter-Kampagnen (Sammel-Export, wie früher)',
  },
  {
    id: 'zufallstabellen',
    key: 'htbah_zufallstabellen',
    label: 'Zufallstabellen: alle Kampagnen (Sammel-Export, wie früher)',
  },
  {
    id: 'weltenbau',
    key: 'htbah_weltenbau',
    label: 'Weltenbau: alle Kampagnen (Sammel-Export, wie früher)',
  },
];

function neueBereichsAuswahl(alleBereiche) {
  const auswahl = {};
  alleBereiche.forEach((b) => {
    auswahl[b.id] = true;
  });
  return auswahl;
}

function keineBereichsAuswahl(alleBereiche) {
  const auswahl = {};
  alleBereiche.forEach((b) => {
    auswahl[b.id] = false;
  });
  return auswahl;
}

window.HTBAH_SEITEN.Einstellungen = {
  data() {
    return {
      istHellesTheme: window.HTBAH.ladeTheme() === 'light',
      zuLoeschenderBereich: 'charakter',
      speicherBereiche: SPEICHER_BEREICHE,
      browserSpeicher: null,
      browserSpeicherFehler: '',
      browserSpeicherLaden: false,
      browserSpeicherInitialErmittelt: false,
      /** @type {null | { ok: boolean, htbahBytes: number, gesamtBytes: number, htbahSchluesselAnzahl: number, originLocalStorageSchluesselAnzahl: number }} */
      localStorageStatistik: null,
      datenExportBereiche: DATEN_EXPORT_BEREICHE_GLOBAL,
      exportAuswahl: {},
      importAuswahl: {},
      importBereicheAusDatei: [],
      importDateiname: '',
      exportModalInstanz: null,
      importModalInstanz: null,
      wuerfel3dAktiv: true,
      wuerfelFarbe: '#509b4a',
      wuerfelFarbeZehner: '#3b7a36',
      wuerfelAudioStumm: false,
      wuerfelAudioLautstaerke: 0.88,
      orientierungModus: 'frei',
      /** Erzwingt Neu-Laden der Kampagnenliste aus dem Speicher (nicht reaktiv). */
      kampagnenCacheTick: 0,
      /** @type {null | { typ: string, kampagneId: string, kampagneName: string, katSchluessel?: string, wbBereich?: string }} */
      kampagneLoeschPayload: null,
      /** Pro Kampagnen-ID: detaillierte Lösch-Buttons sichtbar (Standard: aus = eingeklappt). */
      kampagnenLoeschDetailsSichtbar: {},
      /** Kontext für kampagnenbezogenen JSON-Import (Dateiauswahl). */
      kampagneImportKontext: null,
      /** Bereich „Alle Kampagnen / global“: detaillierte Lösch-Buttons (Standard: eingeklappt). */
      alleKampagnenLoeschDetailsAusgeklappt: false,
    };
  },
  computed: {
    themeTitel() {
      return this.istHellesTheme ? 'Helles Theme' : 'Dunkles Theme';
    },
    themeSymbol() {
      return this.istHellesTheme ? 'light_mode' : 'dark_mode';
    },
    orientierungGruppe() {
      const m = this.orientierungModus;
      if (typeof m !== 'string') {
        return 'frei';
      }
      if (m.indexOf('landscape') === 0) {
        return 'landscape';
      }
      if (m.indexOf('portrait') === 0) {
        return 'portrait';
      }
      return 'frei';
    },
    appRolle() {
      void this.$route.fullPath;
      return window.HTBAH.ladeAppRolle();
    },
    browserSpeicherQuotaEndlich() {
      const b = this.browserSpeicher;
      if (!b || typeof b.quota !== 'number') {
        return false;
      }
      return Number.isFinite(b.quota) && b.quota > 0;
    },
    browserSpeicherProzent() {
      const b = this.browserSpeicher;
      if (!b || !this.browserSpeicherQuotaEndlich) {
        return 0;
      }
      const u = typeof b.usage === 'number' && Number.isFinite(b.usage) ? b.usage : 0;
      const q = b.quota;
      if (q <= 0) {
        return 0;
      }
      return Math.min(100, Math.round((100 * u) / q));
    },
    browserSpeicherNutzungText() {
      if (!this.browserSpeicher) {
        return '';
      }
      const u = this.browserSpeicher.usage;
      if (!HTBAH_REFACTOR_UTILS) {
        return '';
      }
      return HTBAH_REFACTOR_UTILS.formatBytesDecimal(
        typeof u === 'number' && Number.isFinite(u) ? u : 0,
      );
    },
    browserSpeicherQuotaText() {
      const b = this.browserSpeicher;
      if (!b || !this.browserSpeicherQuotaEndlich) {
        return '';
      }
      return HTBAH_REFACTOR_UTILS ? HTBAH_REFACTOR_UTILS.formatBytesDecimal(b.quota) : '';
    },
    browserSpeicherProgressBarKlasse() {
      const p = this.browserSpeicherProzent;
      if (p >= 95) {
        return 'bg-danger';
      }
      if (p >= 80) {
        return 'bg-warning text-dark';
      }
      return 'bg-success';
    },
    localStorageHtbahText() {
      const s = this.localStorageStatistik;
      if (!s || !s.ok || !HTBAH_REFACTOR_UTILS) {
        return '';
      }
      return HTBAH_REFACTOR_UTILS.formatBytesDecimal(s.htbahBytes);
    },
    localStorageGesamtText() {
      const s = this.localStorageStatistik;
      if (!s || !s.ok || !HTBAH_REFACTOR_UTILS) {
        return '';
      }
      return HTBAH_REFACTOR_UTILS.formatBytesDecimal(s.gesamtBytes);
    },
    wuerfelAudioLautProzent() {
      return Math.round(Math.min(1, Math.max(0, Number(this.wuerfelAudioLautstaerke) || 0)) * 100);
    },
    hatExportAuswahl() {
      return this.exportBereicheMitCharakteren.some((b) => this.exportAuswahl[b.id]);
    },
    hatImportAuswahl() {
      return this.importBereicheAusDatei.some((b) => this.importAuswahl[b.id]);
    },
    exportAlleBereicheAusgewaehlt() {
      const bereiche = this.exportBereicheMitCharakteren;
      if (!bereiche.length) {
        return false;
      }
      return bereiche.every((b) => this.exportAuswahl[b.id]);
    },
    importAlleBereicheAusgewaehlt() {
      const bereiche = this.importBereicheAusDatei;
      if (!bereiche.length) {
        return false;
      }
      return bereiche.every((b) => this.importAuswahl[b.id]);
    },
    charakterEintraege() {
      return window.HTBAH.listeCharaktere();
    },
    exportBereicheMitCharakteren() {
      const zeilen = [];
      this.charakterEintraege.forEach((eintrag) => {
        zeilen.push({
          id: `charakter:${eintrag.id}`,
          key: `htbah_character_entry:${eintrag.id}`,
          label: `Charakter: ${this.charakterName(eintrag)}`,
        });
      });
      DATEN_EXPORT_BEREICHE_GLOBAL.forEach((b) => {
        zeilen.push({ ...b });
      });
      if (this.appRolle === 'spielleitung') {
        this.spielleiterKampagnen.forEach((k) => {
          const name = this.kampagneAnzeigeName(k);
          const kid = k.id;
          zeilen.push({
            id: `exls:${kid}:komplett`,
            key: `htbah_export_ls:kampagne_komplett:${kid}`,
            label: `Kampagne „${name}“: komplett (Spielleiter + Zufallstabellen + Weltenbau)`,
            exportEinruecken: false,
            lsTyp: 'kampagne_komplett',
            kampagneId: kid,
          });
          zeilen.push({
            id: `exls:${kid}:komplett_og`,
            key: `htbah_export_ls:kampagne_komplett_ohne_gruppe:${kid}`,
            label: `Kampagne „${name}“: komplett ohne importierte Charaktere (Welt & Tabellen + Abenteuerbuch/Wetter)`,
            exportEinruecken: false,
            lsTyp: 'kampagne_komplett_ohne_gruppe',
            kampagneId: kid,
          });
          zeilen.push({
            id: `exls:${kid}:sl`,
            key: `htbah_export_ls:spielleiter_teil:${kid}`,
            label: `  … nur Spielleiter-Daten (Gruppe, Abenteuerbuch, Wetter)`,
            exportEinruecken: true,
            lsTyp: 'spielleiter_teil',
            kampagneId: kid,
          });
          zeilen.push({
            id: `exls:${kid}:slog`,
            key: `htbah_export_ls:spielleiter_ohne_gruppe:${kid}`,
            label: `  … nur Abenteuerbuch & Wetter (importierte Spielergruppe wird geleert)`,
            exportEinruecken: true,
            lsTyp: 'spielleiter_ohne_gruppe',
            kampagneId: kid,
          });
          zeilen.push({
            id: `exls:${kid}:ztf`,
            key: `htbah_export_ls:ztf_kampagne:${kid}`,
            label: `  … nur Zufallstabellen (alle Kategorien)`,
            exportEinruecken: true,
            lsTyp: 'ztf_kampagne',
            kampagneId: kid,
          });
          zeilen.push({
            id: `exls:${kid}:pantheon`,
            key: `htbah_export_ls:ztf_pantheon:${kid}`,
            label: `  … nur Pantheon (Zufallstabellen)`,
            exportEinruecken: true,
            lsTyp: 'ztf_pantheon',
            kampagneId: kid,
          });
          ZTF_KAMPAGNE_KATEGORIEN.forEach((kat) => {
            zeilen.push({
              id: `exls:${kid}:ztf:${kat.schluessel}`,
              key: `htbah_export_ls:ztf_kategorie:${kid}:${kat.schluessel}`,
              label: `  … Zufallstabellen: ${kat.label}`,
              exportEinruecken: true,
              lsTyp: 'ztf_kategorie',
              kampagneId: kid,
              kategorie: kat.schluessel,
            });
          });
          zeilen.push({
            id: `exls:${kid}:wb`,
            key: `htbah_export_ls:wb_kampagne:${kid}`,
            label: `  … nur Weltenbau (gesamt)`,
            exportEinruecken: true,
            lsTyp: 'wb_kampagne',
            kampagneId: kid,
          });
          zeilen.push({
            id: `exls:${kid}:wb:galerie`,
            key: `htbah_export_ls:wb_bereich:${kid}:galerie`,
            label: `  … Weltenbau: Galerie`,
            exportEinruecken: true,
            lsTyp: 'wb_bereich',
            kampagneId: kid,
            weltenbauBereich: 'galerie',
          });
          zeilen.push({
            id: `exls:${kid}:wb:iw`,
            key: `htbah_export_ls:wb_bereich:${kid}:interaktive_welt`,
            label: `  … Weltenbau: interaktive Welt / Karten`,
            exportEinruecken: true,
            lsTyp: 'wb_bereich',
            kampagneId: kid,
            weltenbauBereich: 'interaktive_welt',
          });
          zeilen.push({
            id: `exls:${kid}:wb:gen`,
            key: `htbah_export_ls:wb_bereich:${kid}:generatoren`,
            label: `  … Weltenbau: Generatoren`,
            exportEinruecken: true,
            lsTyp: 'wb_bereich',
            kampagneId: kid,
            weltenbauBereich: 'generatoren',
          });
        });
        DATEN_EXPORT_LEGACY_META.forEach((b) => {
          zeilen.push({
            ...b,
            exportEinruecken: false,
            exportLegacySammel: true,
          });
        });
      }
      return zeilen;
    },
    spielleiterKampagnen() {
      void this.kampagnenCacheTick;
      const z = window.HTBAH.ladeSpielleiterZustand();
      return Array.isArray(z.kampagnen) ? z.kampagnen.filter((k) => k && k.id) : [];
    },
    ztfKampagneKategorien() {
      return ZTF_KAMPAGNE_KATEGORIEN;
    },
  },
  methods: {
    charakterName(eintrag) {
      const name =
        eintrag && eintrag.charakter && typeof eintrag.charakter.name === 'string'
          ? eintrag.charakter.name.trim()
          : '';
      return name || 'Unbenannter Charakter';
    },
    kampagneAnzeigeName(k) {
      const n = k && typeof k.name === 'string' ? k.name.trim() : '';
      return n || 'Unbenannte Kampagne';
    },
    kampagneLoeschDetailsKid(k) {
      if (!k || k.id == null || k.id === '') {
        return '';
      }
      return String(k.id);
    },
    kampagneLoeschDetailsIstOffen(k) {
      const kid = this.kampagneLoeschDetailsKid(k);
      if (!kid) {
        return false;
      }
      return Boolean(this.kampagnenLoeschDetailsSichtbar[kid]);
    },
    kampagneLoeschDetailsEinAus(k) {
      const kid = this.kampagneLoeschDetailsKid(k);
      if (!kid) {
        return;
      }
      const next = !this.kampagneLoeschDetailsIstOffen(k);
      this.kampagnenLoeschDetailsSichtbar = {
        ...this.kampagnenLoeschDetailsSichtbar,
        [kid]: next,
      };
    },
    alleKampagnenLoeschDetailsIstOffen() {
      return Boolean(this.alleKampagnenLoeschDetailsAusgeklappt);
    },
    alleKampagnenLoeschDetailsEinAus() {
      this.alleKampagnenLoeschDetailsAusgeklappt = !this.alleKampagnenLoeschDetailsAusgeklappt;
    },
    kampagneLoeschdialogTexte(payload) {
      const name = this.kampagneAnzeigeName({ name: payload.kampagneName });
      switch (payload.typ) {
        case 'kampagne_komplett':
          return {
            titel: 'Kampagne löschen?',
            beschreibung: `Kampagne „${name}“ mit allen importierten Charakteren, Abenteuerbuch, Wetter- und Badge-Daten sowie allen Zufallstabellen- und Weltenbau-Daten dieser Kampagne endgültig entfernen?`,
            erfolg: `Kampagne „${name}“ wurde entfernt.`,
          };
        case 'ztf_alle':
          return {
            titel: 'Alle Zufallstabellen dieser Kampagne löschen?',
            beschreibung: `Zu „${name}“ werden alle Tabellen (NPCs, Orte, Fraktionen, Pantheon, Gegenstände, Rätsel, Bestiarium) geleert — inklusive eingebetteter Bilder und Anhänge in den Einträgen. Die Kampagne selbst bleibt erhalten.`,
            erfolg: `Alle Zufallstabellen zu „${name}“ wurden gelöscht.`,
          };
        case 'ztf_kategorie': {
          const kat =
            ZTF_KAMPAGNE_KATEGORIEN.find((x) => x.schluessel === payload.katSchluessel) ||
            null;
          const katLabel = kat ? kat.label : 'Einträge';
          return {
            titel: `${katLabel} löschen?`,
            beschreibung: `In „${name}“ werden alle Einträge der Kategorie „${katLabel}“ entfernt (inklusive eingebetteter Medien in diesen Zeilen).`,
            erfolg: `„${katLabel}“ in „${name}“ wurden gelöscht.`,
          };
        }
        case 'wb_alles':
          return {
            titel: 'Weltenbau dieser Kampagne löschen?',
            beschreibung: `Zu „${name}“ werden alle Weltenbau- und interaktiven-Welt-Daten entfernt (Galerie, Karten, Generatoren).`,
            erfolg: `Weltenbau zu „${name}“ wurde vollständig gelöscht.`,
          };
        case 'wb_galerie':
          return {
            titel: 'Weltenbau-Galerie löschen?',
            beschreibung: `Zu „${name}“ werden nur die unter „Weltenbau“ gespeicherten Galerie-Bilder (data-URLs) entfernt. Karten und Generator-Einstellungen bleiben erhalten.`,
            erfolg: `Weltenbau-Galerie zu „${name}“ wurde gelöscht.`,
          };
        case 'wb_interaktive_welt':
          return {
            titel: 'Interaktive Welt / Karten löschen?',
            beschreibung: `Zu „${name}“ werden Kartenlayouts, Hintergründe, freie Bilder, Notizen, Pfeile und Karten-Einstellungen entfernt. Die Galerie unter „Weltenbau“ und Generator-Links bleiben erhalten.`,
            erfolg: `Interaktive Welt zu „${name}“ wurde geleert.`,
          };
        case 'wb_generatoren':
          return {
            titel: 'Weltenbau-Generatoren zurücksetzen?',
            beschreibung: `Zu „${name}“ werden gespeicherte Generator-URLs und Aufrufzähler entfernt.`,
            erfolg: `Generator-Daten zu „${name}“ wurden gelöscht.`,
          };
        default:
          return {
            titel: 'Daten löschen?',
            beschreibung: 'Ausgewählte Daten wirklich löschen?',
            erfolg: 'Daten wurden gelöscht.',
          };
      }
    },
    oeffneKampagneLoeschDialog(typ, kampagne, extras = {}) {
      if (!kampagne || !kampagne.id) {
        return;
      }
      const payload = {
        typ,
        kampagneId: kampagne.id,
        kampagneName: typeof kampagne.name === 'string' ? kampagne.name : '',
        katSchluessel: extras.katSchluessel,
        wbBereich: extras.wbBereich,
      };
      this.kampagneLoeschPayload = payload;
      const tx = this.kampagneLoeschdialogTexte(payload);
      this.$refs.bestaetigenModal.oeffnen({
        titel: tx.titel,
        beschreibung: tx.beschreibung,
        onBestaetigen: () => this.fuehreKampagneLoeschAus(),
      });
    },
    fuehreKampagneLoeschAus() {
      const p = this.kampagneLoeschPayload;
      if (!p || !p.kampagneId) {
        return;
      }
      const tx = this.kampagneLoeschdialogTexte(p);
      let ok = true;
      switch (p.typ) {
        case 'kampagne_komplett': {
          const r = window.HTBAH.loescheSpielleiterKampagneKomplett(p.kampagneId);
          if (!r || !r.ok) {
            ok = false;
            this.statusAnzeigen('Die Kampagne konnte nicht gelöscht werden.', 'danger');
          }
          break;
        }
        case 'ztf_alle':
          window.HTBAH.loescheZufallstabellenListeFuerKampagne(p.kampagneId, null);
          break;
        case 'ztf_kategorie':
          if (
            !window.HTBAH.loescheZufallstabellenListeFuerKampagne(
              p.kampagneId,
              p.katSchluessel || '',
            )
          ) {
            ok = false;
            this.statusAnzeigen('Die Kategorie konnte nicht gelöscht werden.', 'danger');
          }
          break;
        case 'wb_alles':
          if (!window.HTBAH.loescheWeltenbauBereichFuerKampagne(p.kampagneId, 'alles')) {
            ok = false;
            this.statusAnzeigen('Weltenbau konnte nicht gelöscht werden.', 'danger');
          }
          break;
        case 'wb_galerie':
          if (!window.HTBAH.loescheWeltenbauBereichFuerKampagne(p.kampagneId, 'galerie')) {
            ok = false;
            this.statusAnzeigen('Weltenbau-Galerie konnte nicht geleert werden.', 'danger');
          }
          break;
        case 'wb_interaktive_welt':
          if (!window.HTBAH.loescheWeltenbauBereichFuerKampagne(p.kampagneId, 'interaktive_welt')) {
            ok = false;
            this.statusAnzeigen('Die interaktive Welt konnte nicht geleert werden.', 'danger');
          }
          break;
        case 'wb_generatoren':
          if (!window.HTBAH.loescheWeltenbauBereichFuerKampagne(p.kampagneId, 'generatoren')) {
            ok = false;
            this.statusAnzeigen('Generator-Daten konnten nicht gelöscht werden.', 'danger');
          }
          break;
        default:
          ok = false;
          this.statusAnzeigen('Unbekannte Löschaktion.', 'danger');
      }
      this.kampagneLoeschPayload = null;
      if (ok) {
        this.kampagnenCacheTick += 1;
        this.statusAnzeigen(tx.erfolg, 'success');
      }
      if (this.browserSpeicherInitialErmittelt) {
        this.speicherSchaetzungLaden();
      }
    },
    async loescheEinzelCharakter(eintrag) {
      if (!eintrag || !eintrag.id) {
        return;
      }
      const name = this.charakterName(eintrag);
      const bestaetigt = await window.HTBAH.ui.confirm({
        titel: 'Charakter löschen?',
        beschreibung: `„${name}“ wirklich löschen?`,
        bestaetigenText: 'Löschen',
        bestaetigenButtonClass: 'btn-danger',
        warnhinweisAnzeigen: true,
      });
      if (!bestaetigt) {
        return;
      }
      const result = window.HTBAH.loescheCharakterById(eintrag.id);
      if (!result.geloescht) {
        this.statusAnzeigen('Charakter konnte nicht gelöscht werden.', 'danger');
        return;
      }
      // In den Einstellungen keinen LP-Statusbanner anzeigen.
      if (window.HTBAH && typeof window.HTBAH.syncLebenspunkteStatusFromCharakter === 'function') {
        window.HTBAH.syncLebenspunkteStatusFromCharakter(null);
      }
      this.statusAnzeigen(`„${name}“ wurde gelöscht.`);
    },
    charakterBearbeiten(eintrag) {
      if (!eintrag || !eintrag.id) {
        return;
      }
      this.$router.push(`/charakter/${eintrag.id}`);
    },
    themeUmschalten() {
      const neuesTheme = this.istHellesTheme ? 'light' : 'dark';
      window.HTBAH.setzeTheme(neuesTheme);
    },
    setzeOrientierungModus(modus) {
      if (!window.HTBAH || typeof window.HTBAH.speichereOrientierungModus !== 'function') {
        return;
      }
      this.orientierungModus = window.HTBAH.speichereOrientierungModus(modus);
    },
    wuerfelEinstellungenLaden() {
      const anzeige = window.HTBAH.ladeWuerfelAnzeigeProfil();
      const audio = window.HTBAH.ladeWuerfelAudioProfil();
      this.wuerfel3dAktiv = anzeige.enabled;
      this.wuerfelFarbe = anzeige.themeOnes || anzeige.theme;
      this.wuerfelFarbeZehner = anzeige.themeTens || '#3b7a36';
      this.wuerfelAudioStumm = audio.stumm;
      this.wuerfelAudioLautstaerke = audio.lautstaerke;
    },
    speichereWuerfelAnzeigeEinstellungen() {
      window.HTBAH.setzeWuerfelAnzeigeProfil({
        enabled: this.wuerfel3dAktiv,
        theme: this.wuerfelFarbe,
        themeOnes: this.wuerfelFarbe,
        themeTens: this.wuerfelFarbeZehner,
      });
      window.dispatchEvent(new CustomEvent('htbah:wuerfel-einstellungen-geaendert'));
    },
    wuerfelAudioPersistiere() {
      window.HTBAH.setzeWuerfelAudioProfil({
        stumm: this.wuerfelAudioStumm,
        lautstaerke: this.wuerfelAudioLautstaerke,
      });
      window.dispatchEvent(new CustomEvent('htbah:wuerfel-einstellungen-geaendert'));
    },
    wuerfelAudioStummToggle() {
      this.wuerfelAudioStumm = !this.wuerfelAudioStumm;
      this.wuerfelAudioPersistiere();
    },
    wuerfelAudioSetzeLautstaerkeProzent(roh) {
      const n = Math.max(0, Math.min(100, Math.round(Number(roh) || 0)));
      this.wuerfelAudioLautstaerke = n / 100;
      this.wuerfelAudioPersistiere();
    },
    async speicherSchaetzungLaden() {
      this.browserSpeicherFehler = '';
      this.browserSpeicherLaden = true;
      this.browserSpeicherInitialErmittelt = true;
      const lsMessen =
        window.HTBAH &&
        window.HTBAH.speicher &&
        typeof window.HTBAH.speicher.messeLocalStorageByteStatistik === 'function'
          ? window.HTBAH.speicher.messeLocalStorageByteStatistik()
          : null;
      this.localStorageStatistik = lsMessen;
      if (!navigator.storage || typeof navigator.storage.estimate !== 'function') {
        this.browserSpeicher = null;
        this.browserSpeicherFehler =
          'Geschätztes Browser-Kontingent ist nicht verfügbar (z. B. unsichere Verbindung oder älterer Browser). Gemessene localStorage-Werte siehst Du trotzdem unten.';
        this.browserSpeicherLaden = false;
        return;
      }
      try {
        const est = await navigator.storage.estimate();
        const usage = typeof est.usage === 'number' && Number.isFinite(est.usage) ? est.usage : 0;
        const quotaRaw = typeof est.quota === 'number' ? est.quota : 0;
        const quota = Number.isFinite(quotaRaw) && quotaRaw > 0 ? quotaRaw : 0;
        this.browserSpeicher = { usage, quota };
      } catch {
        this.browserSpeicher = null;
        this.browserSpeicherFehler =
          'Die geschätzten Speicherwerte des Browsers konnten nicht gelesen werden. Gemessene localStorage-Werte siehst Du trotzdem unten.';
      }
      this.browserSpeicherLaden = false;
    },
    oeffneLoeschDialog(bereich) {
      const eintrag = SPEICHER_BEREICHE[bereich];
      if (!eintrag) {
        return;
      }

      this.zuLoeschenderBereich = bereich;

      this.$refs.bestaetigenModal.oeffnen({
        titel: eintrag.titel,
        beschreibung: eintrag.beschreibung,
        onBestaetigen: () => this.speicherBereichLoeschen(),
      });
    },
    speicherBereichLoeschen() {
      const bereich = SPEICHER_BEREICHE[this.zuLoeschenderBereich];

      if (!bereich) {
        return;
      }

      if (this.zuLoeschenderBereich === 'sicherheitsmechanismen') {
        const sammlung = window.HTBAH.ladeCharakterSammlung();
        const aktiveIdVorher = window.HTBAH.ladeAktivenCharakterId();
        (sammlung.charaktere || []).forEach((eintrag) => {
          window.HTBAH.importiereOderAktualisiereCharakterEintrag({
            ...eintrag,
            charakter: {
              ...(eintrag.charakter || {}),
              sicherheitsmechanismen: {
                tabuHtml: '',
                schleierHtml: '',
              },
            },
          });
        });
        window.HTBAH.setzeAktivenCharakterId(aktiveIdVorher);
      } else if (Array.isArray(bereich.keys)) {
        window.HTBAH.speicher.loescheKeys(bereich.keys);
        if (this.zuLoeschenderBereich === 'alles') {
          window.HTBAH.speicher.loescheKeysMitPraefix(
            window.HTBAH.speicherKeys.zufallstabellenProKampagnePraefix,
          );
          window.HTBAH.speicher.loescheKeysMitPraefix(
            window.HTBAH.speicherKeys.weltenbauProKampagnePraefix,
          );
        }
      } else if (this.zuLoeschenderBereich === 'zufallstabellen') {
        window.HTBAH.speicher.loescheKeysMitPraefix(
          window.HTBAH.speicherKeys.zufallstabellenProKampagnePraefix,
        );
        window.HTBAH.speicher.loescheKey(bereich.key);
      } else if (this.zuLoeschenderBereich === 'weltenbau') {
        window.HTBAH.speicher.loescheKeysMitPraefix(
          window.HTBAH.speicherKeys.weltenbauProKampagnePraefix,
        );
        window.HTBAH.speicher.loescheKey(bereich.key);
      } else {
        window.HTBAH.speicher.loescheKey(bereich.key);
      }

      if (this.zuLoeschenderBereich === 'theme' || this.zuLoeschenderBereich === 'alles') {
        this.istHellesTheme = true;
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.setAttribute('data-bs-theme', 'light');
      }
      this.statusAnzeigen(bereich.erfolg, 'success');

      if (this.zuLoeschenderBereich === 'alles') {
        this.$router.push('/');
      }

      if (this.browserSpeicherInitialErmittelt) {
        this.speicherSchaetzungLaden();
      }
      if (this.zuLoeschenderBereich === 'spielleiter' || this.zuLoeschenderBereich === 'alles') {
        this.kampagnenCacheTick += 1;
      }
    },
    statusAnzeigen(text, typ = 'success') {
      window.HTBAH.ui.notify({ text, typ: typ === 'danger' ? 'danger' : 'success' });
    },
    modalAnzeigen(modalRefName, instanzName) {
      if (!HTBAH_BOOTSTRAP_MODAL) {
        return;
      }
      this.$nextTick(() => {
        const el = this.$refs[modalRefName];
        this[instanzName] = HTBAH_BOOTSTRAP_MODAL.ensureModalInstance(el);
        if (this[instanzName]) {
          this[instanzName].show();
        }
      });
    },
    exportModalOeffnen() {
      this.exportAuswahl = neueBereichsAuswahl(this.exportBereicheMitCharakteren);
      this.modalAnzeigen('exportModalElement', 'exportModalInstanz');
    },
    exportCharaktereAlleToggle() {
      const liste = this.charakterEintraege;
      if (!liste.length) {
        return;
      }
      const alleAn = liste.every((e) => this.exportAuswahl[`charakter:${e.id}`]);
      const next = !alleAn;
      const nextAuswahl = { ...this.exportAuswahl };
      liste.forEach((e) => {
        nextAuswahl[`charakter:${e.id}`] = next;
      });
      this.exportAuswahl = nextAuswahl;
    },
    beiExportKampagneKomplettToggle(bereich, event) {
      if (
        (bereich.lsTyp !== 'kampagne_komplett' && bereich.lsTyp !== 'kampagne_komplett_ohne_gruppe') ||
        !bereich.kampagneId
      ) {
        return;
      }
      const kid = bereich.kampagneId;
      const prefix = `exls:${kid}:`;
      const next = { ...this.exportAuswahl };
      const einschalten = Boolean(event.target.checked);
      this.exportBereicheMitCharakteren.forEach((b) => {
        if (typeof b.id === 'string' && b.id.startsWith(prefix)) {
          next[b.id] = einschalten;
        }
      });
      this.exportAuswahl = next;
    },
    exportPaketAusAuswahl(auswahl) {
      const kidMitKomplettExport = new Set();
      const kidMitKomplettOhneGruppeExport = new Set();
      this.exportBereicheMitCharakteren.forEach((b) => {
        if (b.lsTyp === 'kampagne_komplett' && b.kampagneId && auswahl[b.id]) {
          kidMitKomplettExport.add(b.kampagneId);
        }
        if (b.lsTyp === 'kampagne_komplett_ohne_gruppe' && b.kampagneId && auswahl[b.id]) {
          kidMitKomplettOhneGruppeExport.add(b.kampagneId);
        }
      });
      const ausgewaehlteBereiche = this.exportBereicheMitCharakteren.filter((b) => {
        if (!auswahl[b.id]) {
          return false;
        }
        if (b.lsTyp === 'kampagne_komplett_ohne_gruppe' && kidMitKomplettExport.has(b.kampagneId)) {
          return false;
        }
        if (
          b.kampagneId &&
          (kidMitKomplettExport.has(b.kampagneId) || kidMitKomplettOhneGruppeExport.has(b.kampagneId)) &&
          b.lsTyp &&
          b.lsTyp !== 'kampagne_komplett' &&
          b.lsTyp !== 'kampagne_komplett_ohne_gruppe'
        ) {
          return false;
        }
        return true;
      });
      if (!ausgewaehlteBereiche.length) {
        return null;
      }
      const daten = ausgewaehlteBereiche.map((bereich) => {
        if (bereich.lsTyp) {
          const kid = bereich.kampagneId;
          let pak = null;
          if (bereich.lsTyp === 'kampagne_komplett') {
            pak = window.HTBAH.erstelleKampagneKomplettBackupBundle(kid);
          } else if (bereich.lsTyp === 'kampagne_komplett_ohne_gruppe') {
            pak = window.HTBAH.erstelleKampagneKomplettOhneGruppeBackupBundle(kid);
          } else if (bereich.lsTyp === 'spielleiter_teil') {
            pak = window.HTBAH.erstelleSpielleiterKampagneTeilExportPaket(kid);
          } else if (bereich.lsTyp === 'spielleiter_ohne_gruppe') {
            pak = window.HTBAH.erstelleSpielleiterKampagneTeilOhneMitgliederExportPaket(kid);
          } else if (bereich.lsTyp === 'ztf_kampagne') {
            pak = window.HTBAH.erstelleZufallstabellenKampagneExportPaket(kid);
          } else if (bereich.lsTyp === 'ztf_pantheon') {
            pak = window.HTBAH.erstellePantheonExportPaket(kid);
          } else if (bereich.lsTyp === 'ztf_kategorie') {
            pak = window.HTBAH.erstelleZufallstabellenKategorieExportPaket(kid, bereich.kategorie);
          } else if (bereich.lsTyp === 'wb_kampagne') {
            pak = window.HTBAH.erstelleWeltenbauKampagneExportPaket(kid);
          } else if (bereich.lsTyp === 'wb_bereich') {
            pak = window.HTBAH.erstelleWeltenbauBereichExportPaket(kid, bereich.weltenbauBereich);
          }
          const wert = pak ? JSON.stringify(pak) : null;
          return {
            id: bereich.id,
            key: bereich.key,
            label: bereich.label,
            vorhanden: Boolean(wert),
            wert,
          };
        }
        if (bereich.key === 'htbah_sicherheitsmechanismen_bundle') {
          const sammlung = window.HTBAH.ladeCharakterSammlung();
          const map = {};
          (sammlung.charaktere || []).forEach((eintrag) => {
            if (!eintrag || !eintrag.id) {
              return;
            }
            const sicher = eintrag.charakter && eintrag.charakter.sicherheitsmechanismen
              ? eintrag.charakter.sicherheitsmechanismen
              : {};
            map[eintrag.id] = {
              tabuHtml: typeof sicher.tabuHtml === 'string' ? sicher.tabuHtml : '',
              schleierHtml: typeof sicher.schleierHtml === 'string' ? sicher.schleierHtml : '',
            };
          });
          return {
            id: bereich.id,
            key: bereich.key,
            label: bereich.label,
            vorhanden: true,
            wert: JSON.stringify({
              typ: 'sicherheitsmechanismen-bundle',
              version: 1,
              eintraege: map,
            }),
          };
        }
        if (bereich.key.startsWith('htbah_character_entry:')) {
          const charakterId = bereich.key.slice('htbah_character_entry:'.length);
          const eintrag = window.HTBAH.ladeCharakterEintrag(charakterId);
          const vorhanden = Boolean(eintrag);
          return {
            id: bereich.id,
            key: bereich.key,
            label: bereich.label,
            vorhanden,
            wert: vorhanden ? JSON.stringify(eintrag) : null,
          };
        }
        if (bereich.key === WUERFELBECHER_BUNDLE_KEY) {
          const eintraege = {};
          WUERFELBECHER_KEYS.forEach((k) => {
            const v = window.HTBAH.speicher.leseText(k, null);
            if (typeof v === 'string') {
              eintraege[k] = v;
            }
          });
          return {
            id: bereich.id,
            key: bereich.key,
            label: bereich.label,
            vorhanden: Object.keys(eintraege).length > 0,
            wert:
              Object.keys(eintraege).length > 0
                ? JSON.stringify({ typ: 'wuerfelbecher-bundle', version: 1, eintraege })
                : null,
          };
        }
        if (bereich.id === 'zufallstabellen') {
          const sl = window.HTBAH.ladeSpielleiterZustand();
          const kampagnen = Array.isArray(sl.kampagnen) ? sl.kampagnen : [];
          const proKampagne = {};
          kampagnen.forEach((k) => {
            if (k && typeof k.id === 'string' && k.id) {
              proKampagne[k.id] = window.HTBAH.ladeZufallstabellenZustand(k.id);
            }
          });
          const wert =
            Object.keys(proKampagne).length > 0
              ? JSON.stringify({
                  typ: 'htbah-zufallstabellen-pro-kampagne',
                  version: 1,
                  proKampagne,
                })
              : null;
          return {
            id: bereich.id,
            key: bereich.key,
            label: bereich.label,
            vorhanden: Boolean(wert),
            wert,
          };
        }
        if (bereich.id === 'weltenbau') {
          const sl = window.HTBAH.ladeSpielleiterZustand();
          const kampagnen = Array.isArray(sl.kampagnen) ? sl.kampagnen : [];
          const proKampagne = {};
          kampagnen.forEach((k) => {
            if (k && typeof k.id === 'string' && k.id) {
              proKampagne[k.id] = window.HTBAH.ladeWeltenbauZustand(k.id);
            }
          });
          const wert =
            Object.keys(proKampagne).length > 0
              ? JSON.stringify({
                  typ: 'htbah-weltenbau-pro-kampagne',
                  version: 1,
                  proKampagne,
                })
              : null;
          return {
            id: bereich.id,
            key: bereich.key,
            label: bereich.label,
            vorhanden: Boolean(wert),
            wert,
          };
        }
        const wert = window.HTBAH.speicher.leseText(bereich.key, null);
        const vorhanden = typeof wert === 'string';
        return {
          id: bereich.id,
          key: bereich.key,
          label: bereich.label,
          vorhanden,
          wert: vorhanden ? wert : null,
        };
      });
      const paket = {
        htbahExportVersion: 1,
        typ: 'lokaler-speicher',
        exportiertAm: new Date().toISOString(),
        daten,
      };
      const datum = new Date();
      const yyyy = String(datum.getFullYear());
      const mm = String(datum.getMonth() + 1).padStart(2, '0');
      const dd = String(datum.getDate()).padStart(2, '0');
      return {
        paket,
        dateiname: `htbah-backup-${yyyy}-${mm}-${dd}.json`,
      };
    },
    exportStarten() {
      const exportPaket = this.exportPaketAusAuswahl(this.exportAuswahl);
      if (!exportPaket) {
        this.statusAnzeigen('Bitte wähle mindestens einen Speicherbereich für den Export aus.', 'danger');
        return;
      }
      window.HTBAH.dateiHerunterladenJson(exportPaket.paket, exportPaket.dateiname);

      if (this.exportModalInstanz) {
        this.exportModalInstanz.hide();
      }
      this.statusAnzeigen('Export gestartet: Deine JSON-Datei wird heruntergeladen.');
    },
    importDateiWaehlen() {
      this.importDateiname = '';
      this.importBereicheAusDatei = [];
      this.importAuswahl = {};
      const input = this.$refs.importDateiInput;
      if (!input) {
        this.statusAnzeigen('Dateiauswahl ist derzeit nicht verfügbar.', 'danger');
        return;
      }
      input.value = '';
      input.click();
    },
    async importDateiAusgewaehlt(event) {
      const input = event?.target;
      const datei = input?.files?.[0];
      if (!datei) {
        return;
      }

      let text = '';
      try {
        text = await datei.text();
      } catch {
        this.statusAnzeigen('Die ausgewählte Datei konnte nicht gelesen werden.', 'danger');
        return;
      }

      let roh;
      try {
        roh = JSON.parse(text);
      } catch {
        this.statusAnzeigen('Die ausgewählte Datei ist kein gültiges JSON.', 'danger');
        return;
      }
      this.importPaketVorbereiten(roh, datei.name || 'Import-Datei');
    },
    importPaketVorbereiten(roh, dateiname = 'Import-Datei') {
      if (!roh || typeof roh !== 'object' || roh.typ !== 'lokaler-speicher' || !Array.isArray(roh.daten)) {
        this.statusAnzeigen(
          'Unbekanntes Importformat. Bitte wähle eine Datei aus dem Daten-Export der Einstellungen.',
          'danger',
        );
        return false;
      }
      const bekannteBereiche = new Map([
        ...this.exportBereicheMitCharakteren.map((b) => [b.id, b]),
        ...DATEN_EXPORT_LEGACY_META.map((b) => [b.id, b]),
      ]);
      const normalisierteDaten = htbahNormalisiereLokalerSpeicherImportDaten(roh.daten);
      const importBereiche = normalisierteDaten
        .filter((eintrag) => eintrag && typeof eintrag === 'object' && typeof eintrag.key === 'string')
        .map((eintrag, index) => {
          const id =
            typeof eintrag.id === 'string' && eintrag.id
              ? eintrag.id
              : `import_${index}_${eintrag.key}`;
          const bekannterBereich = bekannteBereiche.get(id);
          return {
            id,
            key: eintrag.key,
            label:
              typeof eintrag.label === 'string' && eintrag.label.trim()
                ? eintrag.label.trim()
                : bekannterBereich?.label || eintrag.key,
            vorhanden: Boolean(eintrag.vorhanden),
            wert: typeof eintrag.wert === 'string' ? eintrag.wert : null,
          };
        });
      if (!importBereiche.length) {
        this.statusAnzeigen('Die JSON-Datei enthält keine importierbaren Speicherbereiche.', 'danger');
        return false;
      }
      this.importDateiname = dateiname;
      this.importBereicheAusDatei = importBereiche;
      this.importAuswahl = neueBereichsAuswahl(importBereiche);
      this.modalAnzeigen('importModalElement', 'importModalInstanz');
      return true;
    },
    bereicheAuswahlAlleToggle(ziel) {
      if (ziel === 'export') {
        const bereiche = this.exportBereicheMitCharakteren;
        this.exportAuswahl = this.exportAlleBereicheAusgewaehlt
          ? keineBereichsAuswahl(bereiche)
          : neueBereichsAuswahl(bereiche);
        return;
      }
      if (ziel === 'import') {
        const bereiche = this.importBereicheAusDatei;
        this.importAuswahl = this.importAlleBereicheAusgewaehlt
          ? keineBereichsAuswahl(bereiche)
          : neueBereichsAuswahl(bereiche);
        return;
      }
    },
    importStarten() {
      const ausgewaehlteBereiche = this.importBereicheAusDatei.filter((b) => this.importAuswahl[b.id]);
      if (!ausgewaehlteBereiche.length) {
        this.statusAnzeigen('Bitte wähle mindestens einen Speicherbereich für den Import aus.', 'danger');
        return;
      }
      const aktiveCharakterIdVorImport = window.HTBAH.ladeAktivenCharakterId();
      const fehlerBereiche = [];
      const keyHandler = {
        htbah_sicherheitsmechanismen_bundle: (bereich) => this.importiereSicherheitsmechanismenBundle(bereich),
        [WUERFELBECHER_BUNDLE_KEY]: (bereich) => this.importiereWuerfelbecherBundle(bereich),
      };

      ausgewaehlteBereiche.forEach((bereich) => {
        try {
          if (typeof keyHandler[bereich.key] === 'function') {
            keyHandler[bereich.key](bereich);
            return;
          }
        if (bereich.key.startsWith('htbah_character_entry:')) {
          const charakterId = bereich.key.slice('htbah_character_entry:'.length);
          if (bereich.vorhanden && typeof bereich.wert === 'string') {
            try {
              const payload = JSON.parse(bereich.wert);
              window.HTBAH.importiereOderAktualisiereCharakterEintrag({
                ...payload,
                id: payload && payload.id ? payload.id : charakterId,
              });
            } catch {
              // defekten Eintrag ignorieren
            }
          } else {
            window.HTBAH.loescheCharakterById(charakterId);
          }
          return;
        }
        if (bereich.key.startsWith('htbah_export_ls:')) {
          if (!bereich.vorhanden || typeof bereich.wert !== 'string') {
            return;
          }
          let p;
          try {
            p = JSON.parse(bereich.wert);
          } catch {
            fehlerBereiche.push(bereich.label || bereich.key);
            return;
          }
          const pr = 'htbah_export_ls:';
          const tail = bereich.key.slice(pr.length);
          let r = { ok: false, fehler: 'Unbekannter Export-Slot.' };
          if (tail.startsWith('kampagne_komplett_ohne_gruppe:')) {
            const kid = tail.slice('kampagne_komplett_ohne_gruppe:'.length);
            r = window.HTBAH.importiereKampagneKomplettBackupBundle(kid, p);
          } else if (tail.startsWith('kampagne_komplett:')) {
            const kid = tail.slice('kampagne_komplett:'.length);
            r = window.HTBAH.importiereKampagneKomplettBackupBundle(kid, p);
          } else if (tail.startsWith('spielleiter_ohne_gruppe:')) {
            const kid = tail.slice('spielleiter_ohne_gruppe:'.length);
            r = window.HTBAH.importiereSpielleiterKampagneTeilPaket(kid, p);
          } else if (tail.startsWith('spielleiter_teil:')) {
            const kid = tail.slice('spielleiter_teil:'.length);
            r = window.HTBAH.importiereSpielleiterKampagneTeilPaket(kid, p);
          } else if (tail.startsWith('ztf_kampagne:')) {
            const kid = tail.slice('ztf_kampagne:'.length);
            r = window.HTBAH.importiereZufallstabellenKampagnePaket(kid, p);
          } else if (tail.startsWith('ztf_pantheon:')) {
            const kid = tail.slice('ztf_pantheon:'.length);
            r = window.HTBAH.importierePantheonPaketInKampagne(kid, p);
          } else if (tail.startsWith('ztf_kategorie:')) {
            const rest = tail.slice('ztf_kategorie:'.length);
            const li = rest.lastIndexOf(':');
            const kid = li > 0 ? rest.slice(0, li) : rest;
            r = kid ? window.HTBAH.importiereZufallstabellenKategoriePaket(kid, p) : { ok: false, fehler: 'Keine Kampagne.' };
          } else if (tail.startsWith('wb_kampagne:')) {
            const kid = tail.slice('wb_kampagne:'.length);
            r = window.HTBAH.importiereWeltenbauKampagnePaket(kid, p);
          } else if (tail.startsWith('wb_bereich:')) {
            const rest = tail.slice('wb_bereich:'.length);
            const li = rest.lastIndexOf(':');
            const kid = li > 0 ? rest.slice(0, li) : rest;
            r = kid ? window.HTBAH.importiereWeltenbauBereichPaket(kid, p) : { ok: false, fehler: 'Keine Kampagne.' };
          }
          if (!r.ok) {
            fehlerBereiche.push(bereich.label || bereich.key);
          }
          return;
        }
        if (bereich.key === 'htbah_zufallstabellen') {
          if (bereich.vorhanden && typeof bereich.wert === 'string') {
            try {
              const p = JSON.parse(bereich.wert);
              if (
                p &&
                p.typ === 'htbah-zufallstabellen-pro-kampagne' &&
                p.proKampagne &&
                typeof p.proKampagne === 'object'
              ) {
                Object.keys(p.proKampagne).forEach((kid) => {
                  window.HTBAH.speichereZufallstabellenZustand(p.proKampagne[kid], kid);
                });
              }
            } catch {
              fehlerBereiche.push(bereich.label || bereich.key);
            }
          } else {
            window.HTBAH.speicher.loescheKeysMitPraefix(
              window.HTBAH.speicherKeys.zufallstabellenProKampagnePraefix,
            );
            window.HTBAH.speicher.loescheKey('htbah_zufallstabellen');
          }
          return;
        }
        if (bereich.key === 'htbah_weltenbau') {
          if (bereich.vorhanden && typeof bereich.wert === 'string') {
            try {
              const p = JSON.parse(bereich.wert);
              if (
                p &&
                p.typ === 'htbah-weltenbau-pro-kampagne' &&
                p.proKampagne &&
                typeof p.proKampagne === 'object'
              ) {
                Object.keys(p.proKampagne).forEach((kid) => {
                  window.HTBAH.speichereWeltenbauZustand(p.proKampagne[kid], kid);
                });
              }
            } catch {
              fehlerBereiche.push(bereich.label || bereich.key);
            }
          } else {
            window.HTBAH.speicher.loescheKeysMitPraefix(
              window.HTBAH.speicherKeys.weltenbauProKampagnePraefix,
            );
            window.HTBAH.speicher.loescheKey('htbah_weltenbau');
          }
          return;
        }
        if (bereich.vorhanden && typeof bereich.wert === 'string') {
          window.HTBAH.speicher.schreibeText(bereich.key, bereich.wert);
        } else {
          window.HTBAH.speicher.loescheKey(bereich.key);
        }
        } catch {
          fehlerBereiche.push(bereich.label || bereich.key);
        }
      });
      window.HTBAH.migriereLegacyCharakterSpeicherWennNoetig();
      if (
        this.appRolle === 'spielleitung' &&
        ausgewaehlteBereiche.some(
          (b) =>
            b.key.startsWith('htbah_export_ls:') ||
            b.key === 'htbah_spielleiter_kampagnen' ||
            b.key === 'htbah_zufallstabellen' ||
            b.key === 'htbah_weltenbau',
        )
      ) {
        this.kampagnenCacheTick += 1;
      }
      // Charakter-Teilimporte sollen nicht stillschweigend den aktiven Charakter wechseln.
      const aktiveIdNochVorhanden = aktiveCharakterIdVorImport
        ? window.HTBAH.ladeCharakterEintrag(aktiveCharakterIdVorImport)
        : null;
      if (aktiveIdNochVorhanden) {
        window.HTBAH.setzeAktivenCharakterId(aktiveCharakterIdVorImport);
      }

      if (ausgewaehlteBereiche.some((b) => b.key === 'htbah_theme')) {
        window.HTBAH.setzeTheme(window.HTBAH.ladeTheme());
        this.istHellesTheme = window.HTBAH.ladeTheme() === 'light';
      }
      if (this.importModalInstanz) {
        this.importModalInstanz.hide();
      }
      if (fehlerBereiche.length) {
        this.statusAnzeigen(
          `Import teilweise abgeschlossen. Fehler in: ${fehlerBereiche.join(', ')}`,
          'danger',
        );
      } else {
        this.statusAnzeigen('Import abgeschlossen. Ausgewählte Speicherbereiche wurden übernommen.');
      }
      if (this.browserSpeicherInitialErmittelt) {
        this.speicherSchaetzungLaden();
      }
    },
    importiereSicherheitsmechanismenBundle(bereich) {
      let eintraege = {};
      if (bereich.vorhanden && typeof bereich.wert === 'string') {
        try {
          const payload = JSON.parse(bereich.wert);
          eintraege =
            payload && payload.typ === 'sicherheitsmechanismen-bundle' && payload.eintraege
              ? payload.eintraege
              : {};
        } catch {
          eintraege = {};
        }
      }
      const sammlung = window.HTBAH.ladeCharakterSammlung();
      const aktiveIdVorher = window.HTBAH.ladeAktivenCharakterId();
      (sammlung.charaktere || []).forEach((eintrag) => {
        const imported = eintraege[eintrag.id] || {};
        window.HTBAH.importiereOderAktualisiereCharakterEintrag({
          ...eintrag,
          charakter: {
            ...(eintrag.charakter || {}),
            sicherheitsmechanismen: {
              tabuHtml: typeof imported.tabuHtml === 'string' ? imported.tabuHtml : '',
              schleierHtml: typeof imported.schleierHtml === 'string' ? imported.schleierHtml : '',
            },
          },
        });
      });
      window.HTBAH.setzeAktivenCharakterId(aktiveIdVorher);
    },
    importiereWuerfelbecherBundle(bereich) {
      let eintraege = {};
      if (bereich.vorhanden && typeof bereich.wert === 'string') {
        try {
          const payload = JSON.parse(bereich.wert);
          eintraege =
            payload && payload.typ === 'wuerfelbecher-bundle' && payload.eintraege
              ? payload.eintraege
              : {};
        } catch {
          eintraege = {};
        }
      }
      WUERFELBECHER_KEYS.forEach((k) => {
        if (Object.prototype.hasOwnProperty.call(eintraege, k) && typeof eintraege[k] === 'string') {
          window.HTBAH.speicher.schreibeText(k, eintraege[k]);
        } else {
          window.HTBAH.speicher.loescheKey(k);
        }
      });
      window.dispatchEvent(new CustomEvent('htbah:wuerfel-einstellungen-geaendert'));
    },
    kampagneExportDateiname(stamm, k, extraSuffix = '') {
      const slug = window.HTBAH.kampagnenSlugAusName(this.kampagneAnzeigeName(k));
      const datum = new Date();
      const yyyy = String(datum.getFullYear());
      const mm = String(datum.getMonth() + 1).padStart(2, '0');
      const dd = String(datum.getDate()).padStart(2, '0');
      const suf = extraSuffix ? `-${extraSuffix}` : '';
      return `htbah-${stamm}-${slug}${suf}-${yyyy}-${mm}-${dd}.json`;
    },
    exportSpielleiterKampagneTeil(k) {
      if (!k || !k.id) {
        return;
      }
      const paket = window.HTBAH.erstelleSpielleiterKampagneTeilExportPaket(k.id);
      if (!paket) {
        this.statusAnzeigen('Export nicht möglich: Kampagne nicht gefunden.', 'danger');
        return;
      }
      window.HTBAH.dateiHerunterladenJson(paket, this.kampagneExportDateiname('spielleiter-kampagne', k));
      this.statusAnzeigen('Spielleiter-Daten wurden als JSON heruntergeladen.');
    },
    exportSpielleiterKampagneTeilOhneMitglieder(k) {
      if (!k || !k.id) {
        return;
      }
      const paket = window.HTBAH.erstelleSpielleiterKampagneTeilOhneMitgliederExportPaket(k.id);
      if (!paket) {
        this.statusAnzeigen('Export nicht möglich: Kampagne nicht gefunden.', 'danger');
        return;
      }
      window.HTBAH.dateiHerunterladenJson(
        paket,
        this.kampagneExportDateiname('spielleiter-ohne-gruppe', k),
      );
      this.statusAnzeigen('Spielleiter-Daten ohne importierte Charaktere wurden exportiert.');
    },
    exportKampagneKomplettOhneGruppe(k) {
      if (!k || !k.id) {
        return;
      }
      const paket = window.HTBAH.erstelleKampagneKomplettOhneGruppeBackupBundle(k.id);
      if (!paket) {
        this.statusAnzeigen('Export nicht möglich.', 'danger');
        return;
      }
      window.HTBAH.dateiHerunterladenJson(
        paket,
        this.kampagneExportDateiname('kampagne-komplett-ohne-gruppe', k),
      );
      this.statusAnzeigen('Komplett-Export ohne importierte Charaktere wurde heruntergeladen.');
    },
    exportZufallstabellenKampagne(k) {
      if (!k || !k.id) {
        return;
      }
      const paket = window.HTBAH.erstelleZufallstabellenKampagneExportPaket(k.id);
      if (!paket) {
        this.statusAnzeigen('Export nicht möglich.', 'danger');
        return;
      }
      window.HTBAH.dateiHerunterladenJson(paket, this.kampagneExportDateiname('zufallstabellen', k));
      this.statusAnzeigen('Zufallstabellen dieser Kampagne wurden exportiert.');
    },
    exportZufallstabellenKategorie(k, kat) {
      if (!k || !k.id || !kat || !kat.schluessel) {
        return;
      }
      const paket = window.HTBAH.erstelleZufallstabellenKategorieExportPaket(k.id, kat.schluessel);
      if (!paket) {
        this.statusAnzeigen('Export nicht möglich.', 'danger');
        return;
      }
      window.HTBAH.dateiHerunterladenJson(
        paket,
        this.kampagneExportDateiname('zufallstabellen', k, kat.schluessel),
      );
      this.statusAnzeigen(`Kategorie „${kat.label}“ wurde exportiert.`);
    },
    exportWeltenbauKampagne(k) {
      if (!k || !k.id) {
        return;
      }
      const paket = window.HTBAH.erstelleWeltenbauKampagneExportPaket(k.id);
      if (!paket) {
        this.statusAnzeigen('Export nicht möglich.', 'danger');
        return;
      }
      window.HTBAH.dateiHerunterladenJson(paket, this.kampagneExportDateiname('weltenbau', k));
      this.statusAnzeigen('Weltenbau dieser Kampagne wurde exportiert.');
    },
    exportWeltenbauBereich(k, bereich, labelKurz) {
      if (!k || !k.id) {
        return;
      }
      const paket = window.HTBAH.erstelleWeltenbauBereichExportPaket(k.id, bereich);
      if (!paket) {
        this.statusAnzeigen('Export nicht möglich.', 'danger');
        return;
      }
      window.HTBAH.dateiHerunterladenJson(
        paket,
        this.kampagneExportDateiname('weltenbau', k, bereich),
      );
      this.statusAnzeigen(`Weltenbau: ${labelKurz} exportiert.`);
    },
    oeffneKampagneImport(ctx) {
      if (!ctx || !ctx.kampagneId) {
        return;
      }
      this.kampagneImportKontext = ctx;
      const input = this.$refs.kampagneEinzelImportInput;
      if (!input) {
        this.kampagneImportKontext = null;
        this.statusAnzeigen('Dateiauswahl ist derzeit nicht verfügbar.', 'danger');
        return;
      }
      input.value = '';
      input.click();
    },
    async kampagneImportDateiAusgewaehlt(event) {
      const ctx = this.kampagneImportKontext;
      this.kampagneImportKontext = null;
      const input = event?.target;
      const datei = input?.files?.[0];
      if (input) {
        input.value = '';
      }
      if (!datei || !ctx) {
        return;
      }
      let text = '';
      try {
        text = await datei.text();
      } catch {
        this.statusAnzeigen('Die ausgewählte Datei konnte nicht gelesen werden.', 'danger');
        return;
      }
      let roh;
      try {
        roh = JSON.parse(text);
      } catch {
        this.statusAnzeigen('Die ausgewählte Datei ist kein gültiges JSON.', 'danger');
        return;
      }
      const v = window.HTBAH.validiereKampagneDatenImportDatei(ctx.art, roh, {
        kategorie: ctx.kategorie,
        wbBereich: ctx.wbBereich,
      });
      if (!v.ok) {
        this.statusAnzeigen(v.fehler || 'Ungültige Datei.', 'danger');
        return;
      }
      const name = this.kampagneAnzeigeName({ name: ctx.kampagneName });
      let bestaetigt = false;
      let r = { ok: false, fehler: 'Unbekannte Import-Aktion.' };
      if (ctx.art === 'spielleiter') {
        bestaetigt = await window.HTBAH.ui.confirm({
          titel: 'Spielleiter-Daten importieren?',
          beschreibung: `Die gespeicherte Gruppe, importierten Charaktere, das Abenteuerbuch sowie Wetter- und Badge-Daten der Kampagne „${name}“ werden durch die Datei ersetzt (gleiche Kampagne, neue Inhalte).`,
          bestaetigenText: 'Importieren',
          bestaetigenButtonClass: 'btn-danger',
          warnhinweisAnzeigen: true,
        });
        if (bestaetigt) {
          r = window.HTBAH.importiereSpielleiterKampagneTeilPaket(ctx.kampagneId, roh);
        }
      } else if (ctx.art === 'spielleiter_ohne_gruppe') {
        bestaetigt = await window.HTBAH.ui.confirm({
          titel: 'Abenteuerbuch & Wetter importieren?',
          beschreibung: `Abenteuerbuch sowie Wetter- und Badge-Daten der Kampagne „${name}“ werden aus der Datei übernommen. Die importierte Spielergruppe (Charaktere in der Spielleiter-Ansicht) wird dabei geleert.`,
          bestaetigenText: 'Importieren',
          bestaetigenButtonClass: 'btn-danger',
          warnhinweisAnzeigen: true,
        });
        if (bestaetigt) {
          r = window.HTBAH.importiereSpielleiterKampagneTeilPaket(ctx.kampagneId, roh);
        }
      } else if (ctx.art === 'komplett_ohne_gruppe') {
        bestaetigt = await window.HTBAH.ui.confirm({
          titel: 'Welt & Tabellen ohne Spielergruppe importieren?',
          beschreibung: `Kampagne „${name}“: Zufallstabellen, Weltenbau sowie Abenteuerbuch und Wetter werden aus der Datei übernommen. Die importierte Spielergruppe wird dabei geleert.`,
          bestaetigenText: 'Importieren',
          bestaetigenButtonClass: 'btn-danger',
          warnhinweisAnzeigen: true,
        });
        if (bestaetigt) {
          r = window.HTBAH.importiereKampagneKomplettBackupBundle(ctx.kampagneId, roh);
        }
      } else if (ctx.art === 'ztf') {
        bestaetigt = await window.HTBAH.ui.confirm({
          titel: 'Zufallstabellen importieren?',
          beschreibung: `Alle Zufallstabellen der Kampagne „${name}“ werden durch die Datei ersetzt.`,
          bestaetigenText: 'Importieren',
          bestaetigenButtonClass: 'btn-danger',
          warnhinweisAnzeigen: true,
        });
        if (bestaetigt) {
          r = window.HTBAH.importiereZufallstabellenKampagnePaket(ctx.kampagneId, roh);
        }
      } else if (ctx.art === 'ztf_kat') {
        const katLabel =
          ZTF_KAMPAGNE_KATEGORIEN.find((x) => x.schluessel === ctx.kategorie)?.label || 'Kategorie';
        bestaetigt = await window.HTBAH.ui.confirm({
          titel: `${katLabel} importieren?`,
          beschreibung: `In „${name}“ werden alle Einträge der Kategorie „${katLabel}“ durch die Datei ersetzt.`,
          bestaetigenText: 'Importieren',
          bestaetigenButtonClass: 'btn-danger',
          warnhinweisAnzeigen: true,
        });
        if (bestaetigt) {
          r = window.HTBAH.importiereZufallstabellenKategoriePaket(ctx.kampagneId, roh);
        }
      } else if (ctx.art === 'wb') {
        bestaetigt = await window.HTBAH.ui.confirm({
          titel: 'Weltenbau importieren?',
          beschreibung: `Der gesamte Weltenbau (Galerie, interaktive Welt, Generatoren) der Kampagne „${name}“ wird durch die Datei ersetzt.`,
          bestaetigenText: 'Importieren',
          bestaetigenButtonClass: 'btn-danger',
          warnhinweisAnzeigen: true,
        });
        if (bestaetigt) {
          r = window.HTBAH.importiereWeltenbauKampagnePaket(ctx.kampagneId, roh);
        }
      } else if (ctx.art === 'wb_bereich') {
        const bereichLabel =
          ctx.wbBereich === 'galerie'
            ? 'Galerie-Bilder'
            : ctx.wbBereich === 'generatoren'
              ? 'Generator-Links'
              : 'interaktive Welt / Karten';
        bestaetigt = await window.HTBAH.ui.confirm({
          titel: `${bereichLabel} importieren?`,
          beschreibung: `In „${name}“ werden nur „${bereichLabel}“ durch die Datei ersetzt; übriger Weltenbau bleibt erhalten.`,
          bestaetigenText: 'Importieren',
          bestaetigenButtonClass: 'btn-danger',
          warnhinweisAnzeigen: true,
        });
        if (bestaetigt) {
          r = window.HTBAH.importiereWeltenbauBereichPaket(ctx.kampagneId, roh);
        }
      }
      if (!bestaetigt) {
        return;
      }
      if (!r.ok) {
        this.statusAnzeigen(r.fehler || 'Import fehlgeschlagen.', 'danger');
        return;
      }
      this.kampagnenCacheTick += 1;
      this.statusAnzeigen('Import abgeschlossen.');
      if (this.browserSpeicherInitialErmittelt) {
        this.speicherSchaetzungLaden();
      }
    },
  },
  mounted() {
    this.wuerfelEinstellungenLaden();
    if (window.HTBAH && typeof window.HTBAH.ladeOrientierungModus === 'function') {
      this.orientierungModus = window.HTBAH.ladeOrientierungModus();
    }
  },
  template: `
    <div class="container content py-3 text-center">
      <h4 class="text-center mb-3 htbah-page-title">
        <span class="htbah-page-title-emoji" aria-hidden="true">⚙️</span>
        <span>Einstellungen</span>
      </h4>

      <h5 class="text-start mb-2">Theme</h5>
      <div class="card p-3 mb-3 text-start">
        <div class="d-flex align-items-center justify-content-between">
          <label class="form-check-label d-flex align-items-center gap-2 mb-0" for="themeToggle">
            <span class="material-symbols-outlined" aria-hidden="true">
              {{ themeSymbol }}
            </span>
            <span>{{ themeTitel }}</span>
          </label>
          <div class="form-check form-switch m-0">
            <input
              id="themeToggle"
              class="form-check-input theme-toggle-input"
              type="checkbox"
              role="switch"
              v-model="istHellesTheme"
              @change="themeUmschalten" />
          </div>
        </div>
      </div>

      <h5 class="text-start mb-2">Ausrichtung</h5>
      <div class="card p-3 mb-3 text-start">
        <p class="small text-body-secondary mb-2">
          Lege fest, ob die Ansicht frei drehbar bleibt oder auf Quer-/Hochformat fixiert wird.
        </p>
        <div
          class="btn-group w-100"
          role="radiogroup"
          aria-label="Ausrichtung wählen">
          <button
            type="button"
            class="btn btn-sm d-inline-flex align-items-center justify-content-center gap-1 flex-fill"
            :class="orientierungGruppe === 'frei' ? 'btn-primary' : 'btn-outline-secondary'"
            role="radio"
            :aria-checked="orientierungGruppe === 'frei' ? 'true' : 'false'"
            @click="setzeOrientierungModus('frei')">
            <span class="material-symbols-outlined" aria-hidden="true">screen_rotation</span>
            <span>frei</span>
          </button>
          <button
            type="button"
            class="btn btn-sm d-inline-flex align-items-center justify-content-center gap-1 flex-fill"
            :class="orientierungGruppe === 'landscape' ? 'btn-primary' : 'btn-outline-secondary'"
            role="radio"
            :aria-checked="orientierungGruppe === 'landscape' ? 'true' : 'false'"
            @click="setzeOrientierungModus('landscape')">
            <span class="material-symbols-outlined" aria-hidden="true">stay_current_landscape</span>
            <span>Landscape</span>
          </button>
          <button
            type="button"
            class="btn btn-sm d-inline-flex align-items-center justify-content-center gap-1 flex-fill"
            :class="orientierungGruppe === 'portrait' ? 'btn-primary' : 'btn-outline-secondary'"
            role="radio"
            :aria-checked="orientierungGruppe === 'portrait' ? 'true' : 'false'"
            @click="setzeOrientierungModus('portrait')">
            <span class="material-symbols-outlined" aria-hidden="true">stay_current_portrait</span>
            <span>Portrait</span>
          </button>
        </div>
      </div>

      <h5 class="text-start mb-2">Würfel</h5>
      <div class="card p-3 mb-3 text-start">
        <div class="form-check form-switch mb-3">
          <input
            id="settings-wuerfel-3d"
            class="form-check-input"
            type="checkbox"
            role="switch"
            v-model="wuerfel3dAktiv"
            @change="speichereWuerfelAnzeigeEinstellungen" />
          <label class="form-check-label" for="settings-wuerfel-3d">
            Anzeige 3D-Würfel
          </label>
        </div>
        <div class="mb-3">
          <label class="form-label small text-body-secondary mb-2">Würfelfarbe</label>
          <div class="row g-2">
            <div class="col-12 col-md-6">
              <label class="form-label small text-body-secondary mb-1" for="settings-wuerfel-farbe">
                Einerstelle (W10)
              </label>
              <input
                id="settings-wuerfel-farbe"
                type="color"
                class="form-control form-control-color w-100 htbah-dice-color-input"
                v-model="wuerfelFarbe"
                @change="speichereWuerfelAnzeigeEinstellungen" />
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label small text-body-secondary mb-1" for="settings-wuerfel-farbe-zehner">
                Zehnerstelle (W100)
              </label>
              <input
                id="settings-wuerfel-farbe-zehner"
                type="color"
                class="form-control form-control-color w-100 htbah-dice-color-input"
                v-model="wuerfelFarbeZehner"
                @change="speichereWuerfelAnzeigeEinstellungen" />
            </div>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2 flex-wrap pt-2 border-top border-secondary border-opacity-25">
          <span class="small text-body-secondary text-nowrap">Würfelsound</span>
          <input
            type="range"
            class="form-range flex-grow-1 m-0 htbah-wuerfel-audio-range"
            min="0"
            max="100"
            step="1"
            :disabled="wuerfelAudioStumm"
            :value="wuerfelAudioLautProzent"
            @input="wuerfelAudioSetzeLautstaerkeProzent($event.target.value)"
            :aria-valuenow="wuerfelAudioLautProzent"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Würfelklang Lautstärke" />
          <span class="small text-body-secondary tabular-nums text-nowrap" style="min-width: 2.5rem">
            {{ wuerfelAudioLautProzent }}%
          </span>
          <button
            type="button"
            class="btn btn-outline-secondary btn-sm px-2 py-0 flex-shrink-0"
            :title="wuerfelAudioStumm ? 'Ton an' : 'Stumm'"
            :aria-pressed="wuerfelAudioStumm ? 'true' : 'false'"
            :aria-label="wuerfelAudioStumm ? 'Ton einschalten' : 'Stumm schalten'"
            @click="wuerfelAudioStummToggle">
            <span
              class="material-symbols-outlined htbah-wuerfel-audio-mute-ico"
              aria-hidden="true">
              {{ wuerfelAudioStumm ? 'volume_off' : 'volume_up' }}
            </span>
          </button>
        </div>
      </div>

      <h5 class="text-start mb-2">Speicherstatus</h5>
      <div class="card p-3 mb-3 text-start">
        <p class="small text-body-secondary mb-2">
          <strong>localStorage</strong> wird beim Ermitteln direkt anhand aller Schlüssel summiert (Keys und Werte als UTF-16, ohne Browser-interne Zusatzstrukturen).
          <strong>Browser gesamt</strong> ist eine grobe Schätzung über das Kontingent dieser Website (u. a. localStorage, IndexedDB, Service-Worker-Caches); sie kann von der localStorage-Summe abweichen.
        </p>
        <div v-if="!browserSpeicherInitialErmittelt" class="small text-body-secondary mb-2">
          Werte werden erst auf Anfrage geladen.
        </div>
        <div v-else-if="browserSpeicherLaden" class="small text-body-secondary">Wird geladen …</div>
        <template v-else>
          <div
            v-if="localStorageStatistik && localStorageStatistik.ok"
            class="small mb-2 pb-2 border-bottom border-secondary border-opacity-25">
            <span class="d-block mb-1">
              <strong>App (localStorage):</strong>
              <strong>{{ localStorageHtbahText }}</strong>
              <span class="text-body-secondary">
                ({{ localStorageStatistik.htbahSchluesselAnzahl }} Schlüssel: Präfix htbah_ sowie gespeicherte Hinweis-Zustände)
              </span>
            </span>
            <span class="d-block text-body-secondary">
              Gesamtes localStorage dieser Website: {{ localStorageGesamtText }}
              ({{ localStorageStatistik.originLocalStorageSchluesselAnzahl }} Schlüssel; z. B. eingebettete PDF-Ansicht zählt mit)
            </span>
          </div>
          <div v-else-if="localStorageStatistik && !localStorageStatistik.ok" class="alert alert-warning py-2 mb-2 small">
            Die Summe des localStorage konnte nicht ermittelt werden.
          </div>
          <div v-if="browserSpeicherFehler" class="alert alert-warning py-2 mb-2 small">
            {{ browserSpeicherFehler }}
          </div>
          <p v-if="browserSpeicher" class="small text-body-secondary mb-1">Geschätzter Browser-Speicher (Origin):</p>
          <template v-if="browserSpeicher">
            <div class="d-flex justify-content-between align-items-baseline flex-wrap gap-2 mb-2">
              <span class="small"><strong>{{ browserSpeicherNutzungText }}</strong> belegt</span>
              <span class="small text-body-secondary" v-if="browserSpeicherQuotaEndlich">
                von {{ browserSpeicherQuotaText }}
              </span>
              <span class="small text-body-secondary" v-else>ohne gemeldetes Obergrenzen-Limit</span>
            </div>
            <div
              v-if="browserSpeicherQuotaEndlich"
              class="progress"
              style="height: 1.1rem"
              role="progressbar"
              :aria-valuenow="browserSpeicherProzent"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-label="'Speicher: ' + browserSpeicherProzent + ' Prozent'">
              <div
                class="progress-bar"
                :class="browserSpeicherProgressBarKlasse"
                :style="{ width: browserSpeicherProzent + '%' }"></div>
            </div>
            <div v-if="browserSpeicherQuotaEndlich" class="small text-body-secondary mt-1 text-end">
              {{ browserSpeicherProzent }} %
            </div>
          </template>
        </template>
        <icon-text-button
          type="button"
          class="btn btn-outline-secondary btn-sm mt-2"
          icon="refresh"
          :disabled="browserSpeicherLaden"
          @click="speicherSchaetzungLaden">
          {{ browserSpeicherInitialErmittelt ? 'Aktualisieren' : 'Speicherbedarf ermitteln' }}
        </icon-text-button>
      </div>

      <h5 class="text-start mb-2">Daten</h5>
      <div class="card p-3 mb-3 text-start">
        <p class="small text-body-secondary mb-2">
          Exportiere und importiere Deine lokalen Daten als JSON-Datei, um Backups zu erstellen
          oder Daten über Deine eigene Cloud zwischen Geräten zu synchronisieren.
          Unter „Daten löschen“ kannst Du bei Spielleitung pro Kampagne dieselben Bereiche wie beim Löschen
          auch gezielt als JSON sichern oder aus einer Datei wiederherstellen (Ziel ist immer die gewählte Kampagne).
        </p>
        <div class="d-flex flex-wrap gap-2">
          <icon-text-button
            class="btn btn-outline-primary flex-grow-1"
            type="button"
            icon="download"
            @click="exportModalOeffnen">
            Daten exportieren
          </icon-text-button>
          <icon-text-button
            class="btn btn-outline-primary flex-grow-1"
            type="button"
            icon="upload_file"
            @click="importDateiWaehlen">
            Daten importieren
          </icon-text-button>
        </div>
        <input
          ref="importDateiInput"
          class="d-none"
          type="file"
          accept=".json,application/json"
          @change="importDateiAusgewaehlt" />
        <input
          ref="kampagneEinzelImportInput"
          class="d-none"
          type="file"
          accept=".json,application/json"
          @change="kampagneImportDateiAusgewaehlt" />
      </div>

      <h5 class="text-start mb-2">Daten löschen</h5>
      <div class="card p-3">
        <div class="mb-3">
          <h6 class="mb-2">Einzelne Charaktere</h6>
          <p v-if="!charakterEintraege.length" class="small text-body-secondary mb-2">
            Keine gespeicherten Charaktere vorhanden.
          </p>
          <div v-else class="d-flex flex-column gap-2">
            <div
              v-for="eintrag in charakterEintraege"
              :key="'del-char-' + eintrag.id"
              class="d-flex flex-wrap gap-2">
              <button
                type="button"
                class="btn btn-outline-secondary btn-sm text-start flex-grow-1"
                @click="charakterBearbeiten(eintrag)">
                {{ charakterName(eintrag) }} bearbeiten
              </button>
              <button
                type="button"
                class="btn btn-outline-danger btn-sm text-start flex-grow-1"
                @click="loescheEinzelCharakter(eintrag)">
                {{ charakterName(eintrag) }} löschen
              </button>
            </div>
          </div>
        </div>
        <hr class="border-secondary border-opacity-25 my-3" />
        <template v-if="appRolle === 'charakter'">
          <icon-text-button
            class="btn btn-outline-danger w-100 mb-2"
            type="button"
            :symbol="speicherBereiche.charakter.buttonSymbol"
            @click="oeffneLoeschDialog('charakter')">
            {{ speicherBereiche.charakter.buttonLabel }}
          </icon-text-button>
          <icon-text-button
            class="btn btn-outline-danger w-100 mb-2"
            type="button"
            :symbol="speicherBereiche.wuerfelbeutelLayout.buttonSymbol"
            @click="oeffneLoeschDialog('wuerfelbeutelLayout')">
            {{ speicherBereiche.wuerfelbeutelLayout.buttonLabel }}
          </icon-text-button>
          <icon-text-button
            class="btn btn-outline-danger w-100 mb-2"
            type="button"
            :symbol="speicherBereiche.sicherheitsmechanismen.buttonSymbol"
            @click="oeffneLoeschDialog('sicherheitsmechanismen')">
            {{ speicherBereiche.sicherheitsmechanismen.buttonLabel }}
          </icon-text-button>
          <icon-text-button
            class="btn btn-outline-danger w-100 mb-2"
            type="button"
            :symbol="speicherBereiche.theme.buttonSymbol"
            @click="oeffneLoeschDialog('theme')">
            {{ speicherBereiche.theme.buttonLabel }}
          </icon-text-button>
          <icon-text-button
            class="btn btn-danger w-100"
            type="button"
            :symbol="speicherBereiche.alles.buttonSymbol"
            @click="oeffneLoeschDialog('alles')">
            {{ speicherBereiche.alles.buttonLabel }}
          </icon-text-button>
        </template>
        <template v-else-if="appRolle === 'spielleitung'">
          <div class="mb-3">
            <h6 class="mb-2">Nach Kampagne</h6>
            <p v-if="!spielleiterKampagnen.length" class="small text-body-secondary mb-0">
              Keine Kampagnen vorhanden — lege zuerst unter „Spielleiter“ eine Kampagne an.
            </p>
            <div v-else class="d-flex flex-column gap-3">
              <div
                v-for="k in spielleiterKampagnen"
                :key="'del-kamp-' + k.id"
                class="rounded border border-secondary border-opacity-25 p-2 ps-3 text-start">
                <div class="fw-semibold mb-2">{{ kampagneAnzeigeName(k) }}</div>
                <div class="d-flex flex-wrap gap-2 mb-2">
                  <icon-text-button
                    class="btn btn-outline-primary btn-sm flex-grow-1 text-start"
                    type="button"
                    icon="download"
                    @click="exportSpielleiterKampagneTeil(k)">
                    Spielleiter-Daten exportieren
                  </icon-text-button>
                  <icon-text-button
                    class="btn btn-outline-secondary btn-sm flex-grow-1 text-start"
                    type="button"
                    icon="upload_file"
                    @click="oeffneKampagneImport({ art: 'spielleiter', kampagneId: k.id, kampagneName: k.name })">
                    Spielleiter-Daten importieren
                  </icon-text-button>
                </div>
                <div class="d-flex flex-wrap gap-2 mb-2">
                  <icon-text-button
                    class="btn btn-outline-primary btn-sm flex-grow-1 text-start"
                    type="button"
                    icon="download"
                    @click="exportSpielleiterKampagneTeilOhneMitglieder(k)">
                    Ohne Spielergruppe exportieren
                  </icon-text-button>
                  <icon-text-button
                    class="btn btn-outline-secondary btn-sm flex-grow-1 text-start"
                    type="button"
                    icon="upload_file"
                    @click="oeffneKampagneImport({ art: 'spielleiter_ohne_gruppe', kampagneId: k.id, kampagneName: k.name })">
                    Ohne Spielergruppe importieren
                  </icon-text-button>
                  <icon-text-button
                    class="btn btn-outline-primary btn-sm flex-grow-1 text-start"
                    type="button"
                    icon="download"
                    @click="exportKampagneKomplettOhneGruppe(k)">
                    Komplett ohne Spielergruppe exportieren
                  </icon-text-button>
                  <icon-text-button
                    class="btn btn-outline-secondary btn-sm flex-grow-1 text-start"
                    type="button"
                    icon="upload_file"
                    @click="oeffneKampagneImport({ art: 'komplett_ohne_gruppe', kampagneId: k.id, kampagneName: k.name })">
                    Komplett ohne Spielergruppe importieren
                  </icon-text-button>
                </div>
                <div class="d-flex flex-column gap-2 ps-2 border-start border-secondary border-opacity-50 ms-1">
                  <icon-text-button
                    class="btn btn-outline-danger btn-sm w-100 text-start"
                    type="button"
                    symbol="🗂️"
                    @click="oeffneKampagneLoeschDialog('kampagne_komplett', k)">
                    Kampagne komplett löschen
                  </icon-text-button>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2 w-100 text-start"
                    :aria-expanded="kampagneLoeschDetailsIstOffen(k) ? 'true' : 'false'"
                    :aria-controls="'htbah-loesch-details-body-' + kampagneLoeschDetailsKid(k)"
                    :aria-label="kampagneLoeschDetailsIstOffen(k) ? 'Details einklappen' : 'Details ausklappen'"
                    @click="kampagneLoeschDetailsEinAus(k)">
                    <span class="material-symbols-outlined fs-5" aria-hidden="true">
                      {{ kampagneLoeschDetailsIstOffen(k) ? 'expand_less' : 'expand_more' }}
                    </span>
                    <span class="small">Löschen &amp; Sicherung (Details)</span>
                  </button>
                  <div
                    v-show="kampagneLoeschDetailsIstOffen(k)"
                    :id="'htbah-loesch-details-body-' + kampagneLoeschDetailsKid(k)"
                    class="pt-1">
                    <div class="d-flex flex-column gap-2">
                    <div class="small text-body-secondary pt-1">Zufallstabellen</div>
                    <div class="d-flex flex-wrap gap-2">
                      <icon-text-button
                        class="btn btn-outline-primary btn-sm flex-grow-1 text-start"
                        type="button"
                        icon="download"
                        @click="exportZufallstabellenKampagne(k)">
                        Alle Tabellen exportieren
                      </icon-text-button>
                      <icon-text-button
                        class="btn btn-outline-secondary btn-sm flex-grow-1 text-start"
                        type="button"
                        icon="upload_file"
                        @click="oeffneKampagneImport({ art: 'ztf', kampagneId: k.id, kampagneName: k.name })">
                        Alle importieren
                      </icon-text-button>
                    </div>
                    <icon-text-button
                      class="btn btn-outline-danger btn-sm w-100 text-start"
                      type="button"
                      :symbol="speicherBereiche.zufallstabellen.buttonSymbol"
                      @click="oeffneKampagneLoeschDialog('ztf_alle', k)">
                      Alle Tabellen-Einträge löschen (alle Kategorien, inkl. Medien)
                    </icon-text-button>
                    <div class="d-flex flex-column gap-1 ps-2 border-start border-secondary border-opacity-25 ms-1">
                      <div
                        v-for="kat in ztfKampagneKategorien"
                        :key="'ztf-del-' + k.id + '-' + kat.schluessel"
                        class="d-flex flex-wrap gap-2 align-items-stretch">
                        <icon-text-button
                          class="btn btn-outline-primary btn-sm"
                          type="button"
                          icon="download"
                          :title="'Export: ' + kat.label"
                          :aria-label="'Export: ' + kat.label"
                          @click="exportZufallstabellenKategorie(k, kat)" />
                        <icon-text-button
                          class="btn btn-outline-secondary btn-sm"
                          type="button"
                          icon="upload_file"
                          :title="'Import: ' + kat.label"
                          :aria-label="'Import: ' + kat.label"
                          @click="oeffneKampagneImport({ art: 'ztf_kat', kampagneId: k.id, kampagneName: k.name, kategorie: kat.schluessel })" />
                        <button
                          type="button"
                          class="btn btn-outline-danger btn-sm text-start flex-grow-1"
                          @click="oeffneKampagneLoeschDialog('ztf_kategorie', k, { katSchluessel: kat.schluessel })">
                          Nur {{ kat.label }} löschen
                        </button>
                      </div>
                    </div>
                    <div class="small text-body-secondary pt-1">Weltenbau</div>
                    <div class="d-flex flex-wrap gap-2">
                      <icon-text-button
                        class="btn btn-outline-primary btn-sm flex-grow-1 text-start"
                        type="button"
                        icon="download"
                        @click="exportWeltenbauKampagne(k)">
                        Gesamten Weltenbau exportieren
                      </icon-text-button>
                      <icon-text-button
                        class="btn btn-outline-secondary btn-sm flex-grow-1 text-start"
                        type="button"
                        icon="upload_file"
                        @click="oeffneKampagneImport({ art: 'wb', kampagneId: k.id, kampagneName: k.name })">
                        Gesamt importieren
                      </icon-text-button>
                    </div>
                    <icon-text-button
                      class="btn btn-outline-danger btn-sm w-100 text-start"
                      type="button"
                      :symbol="speicherBereiche.weltenbau.buttonSymbol"
                      @click="oeffneKampagneLoeschDialog('wb_alles', k)">
                      Gesamten Weltenbau dieser Kampagne löschen
                    </icon-text-button>
                    <div class="d-flex flex-column gap-1 ps-2 border-start border-secondary border-opacity-25 ms-1">
                      <div class="d-flex flex-wrap gap-2 align-items-stretch">
                        <icon-text-button
                          class="btn btn-outline-primary btn-sm"
                          type="button"
                          icon="download"
                          title="Galerie exportieren"
                          aria-label="Galerie exportieren"
                          @click="exportWeltenbauBereich(k, 'galerie', 'Galerie')" />
                        <icon-text-button
                          class="btn btn-outline-secondary btn-sm"
                          type="button"
                          icon="upload_file"
                          title="Galerie importieren"
                          aria-label="Galerie importieren"
                          @click="oeffneKampagneImport({ art: 'wb_bereich', kampagneId: k.id, kampagneName: k.name, wbBereich: 'galerie' })" />
                        <button
                          type="button"
                          class="btn btn-outline-danger btn-sm text-start flex-grow-1"
                          @click="oeffneKampagneLoeschDialog('wb_galerie', k)">
                          Nur Galerie-Bilder löschen
                        </button>
                      </div>
                      <div class="d-flex flex-wrap gap-2 align-items-stretch">
                        <icon-text-button
                          class="btn btn-outline-primary btn-sm"
                          type="button"
                          icon="download"
                          title="Interaktive Welt exportieren"
                          aria-label="Interaktive Welt exportieren"
                          @click="exportWeltenbauBereich(k, 'interaktive_welt', 'Interaktive Welt')" />
                        <icon-text-button
                          class="btn btn-outline-secondary btn-sm"
                          type="button"
                          icon="upload_file"
                          title="Interaktive Welt importieren"
                          aria-label="Interaktive Welt importieren"
                          @click="oeffneKampagneImport({ art: 'wb_bereich', kampagneId: k.id, kampagneName: k.name, wbBereich: 'interaktive_welt' })" />
                        <button
                          type="button"
                          class="btn btn-outline-danger btn-sm text-start flex-grow-1"
                          @click="oeffneKampagneLoeschDialog('wb_interaktive_welt', k)">
                          Nur interaktive Welt / Karten löschen
                        </button>
                      </div>
                      <div class="d-flex flex-wrap gap-2 align-items-stretch">
                        <icon-text-button
                          class="btn btn-outline-primary btn-sm"
                          type="button"
                          icon="download"
                          title="Generatoren exportieren"
                          aria-label="Generatoren exportieren"
                          @click="exportWeltenbauBereich(k, 'generatoren', 'Generatoren')" />
                        <icon-text-button
                          class="btn btn-outline-secondary btn-sm"
                          type="button"
                          icon="upload_file"
                          title="Generatoren importieren"
                          aria-label="Generatoren importieren"
                          @click="oeffneKampagneImport({ art: 'wb_bereich', kampagneId: k.id, kampagneName: k.name, wbBereich: 'generatoren' })" />
                        <button
                          type="button"
                          class="btn btn-outline-danger btn-sm text-start flex-grow-1"
                          @click="oeffneKampagneLoeschDialog('wb_generatoren', k)">
                          Nur Generator-Links löschen
                        </button>
                      </div>
                    </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <hr class="border-secondary border-opacity-25 my-3" />
          <div class="rounded border border-secondary border-opacity-25 p-2 ps-3 text-start">
            <div class="fw-semibold mb-2">Alle Kampagnen / global</div>
            <div class="d-flex flex-column gap-2 ps-2 border-start border-secondary border-opacity-50 ms-1">
              <icon-text-button
                class="btn btn-outline-danger btn-sm w-100 text-start"
                type="button"
                :symbol="speicherBereiche.alles.buttonSymbol"
                @click="oeffneLoeschDialog('alles')">
                {{ speicherBereiche.alles.buttonLabel }}
              </icon-text-button>
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2 w-100 text-start"
                :aria-expanded="alleKampagnenLoeschDetailsIstOffen() ? 'true' : 'false'"
                aria-controls="htbah-loesch-details-body-global"
                :aria-label="alleKampagnenLoeschDetailsIstOffen() ? 'Detaillierte Lösch-Optionen einklappen' : 'Detaillierte Lösch-Optionen ausklappen'"
                @click="alleKampagnenLoeschDetailsEinAus">
                <span class="material-symbols-outlined fs-5" aria-hidden="true">
                  {{ alleKampagnenLoeschDetailsIstOffen() ? 'expand_less' : 'expand_more' }}
                </span>
                <span class="small">Detaillierte Lösch-Optionen</span>
              </button>
              <div
                v-show="alleKampagnenLoeschDetailsIstOffen()"
                id="htbah-loesch-details-body-global"
                class="pt-1">
                <div class="d-flex flex-column gap-2">
                  <icon-text-button
                    class="btn btn-outline-danger btn-sm w-100 text-start"
                    type="button"
                    :symbol="speicherBereiche.presets.buttonSymbol"
                    @click="oeffneLoeschDialog('presets')">
                    {{ speicherBereiche.presets.buttonLabel }}
                  </icon-text-button>
                  <icon-text-button
                    class="btn btn-outline-danger btn-sm w-100 text-start"
                    type="button"
                    :symbol="speicherBereiche.spielleiter.buttonSymbol"
                    @click="oeffneLoeschDialog('spielleiter')">
                    {{ speicherBereiche.spielleiter.buttonLabel }}
                  </icon-text-button>
                  <icon-text-button
                    class="btn btn-outline-danger btn-sm w-100 text-start"
                    type="button"
                    :symbol="speicherBereiche.zufallstabellen.buttonSymbol"
                    @click="oeffneLoeschDialog('zufallstabellen')">
                    {{ speicherBereiche.zufallstabellen.buttonLabel }} (alle Kampagnen)
                  </icon-text-button>
                  <icon-text-button
                    class="btn btn-outline-danger btn-sm w-100 text-start"
                    type="button"
                    :symbol="speicherBereiche.weltenbau.buttonSymbol"
                    @click="oeffneLoeschDialog('weltenbau')">
                    {{ speicherBereiche.weltenbau.buttonLabel }} (alle Kampagnen)
                  </icon-text-button>
                  <icon-text-button
                    class="btn btn-outline-danger btn-sm w-100 text-start"
                    type="button"
                    :symbol="speicherBereiche.wuerfelbeutelLayout.buttonSymbol"
                    @click="oeffneLoeschDialog('wuerfelbeutelLayout')">
                    {{ speicherBereiche.wuerfelbeutelLayout.buttonLabel }}
                  </icon-text-button>
                  <icon-text-button
                    class="btn btn-outline-danger btn-sm w-100 text-start"
                    type="button"
                    :symbol="speicherBereiche.sicherheitsmechanismen.buttonSymbol"
                    @click="oeffneLoeschDialog('sicherheitsmechanismen')">
                    {{ speicherBereiche.sicherheitsmechanismen.buttonLabel }}
                  </icon-text-button>
                  <icon-text-button
                    class="btn btn-outline-danger btn-sm w-100 text-start"
                    type="button"
                    :symbol="speicherBereiche.theme.buttonSymbol"
                    @click="oeffneLoeschDialog('theme')">
                    {{ speicherBereiche.theme.buttonLabel }}
                  </icon-text-button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <div class="abstandshalter" aria-hidden="true"></div>

      <div
        ref="exportModalElement"
        class="modal fade"
        id="htbahExportModal"
        tabindex="-1"
        aria-labelledby="htbahExportModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content shadow">
            <div class="modal-header">
              <h5 class="modal-title" id="htbahExportModalLabel">Daten exportieren</h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Schließen"></button>
            </div>
            <div class="modal-body text-start">
              <p class="small text-body-secondary mb-2">
                Wähle die Speicherbereiche für den Export aus. Bei Spielleitung kannst Du pro Kampagne
                zwischen Komplett-Export und einzelnen Inhalten wählen; unten stehen weiterhin die
                Sammel-Exporte aller Kampagnen (wie früher).
              </p>
              <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                <button
                  v-if="charakterEintraege.length"
                  type="button"
                  class="btn btn-sm btn-link px-0"
                  @click="exportCharaktereAlleToggle">
                  Alle Charaktere an/ab
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-link px-0 ms-auto"
                  @click="bereicheAuswahlAlleToggle('export')">
                  {{ exportAlleBereicheAusgewaehlt ? 'Alle abwählen' : 'Alle auswählen' }}
                </button>
              </div>
              <div
                v-for="bereich in exportBereicheMitCharakteren"
                :key="'export-' + bereich.id"
                class="form-check form-switch mb-2"
                :class="{ 'ms-3': bereich.exportEinruecken }">
                <input
                  :id="'export-switch-' + bereich.id"
                  class="form-check-input"
                  type="checkbox"
                  role="switch"
                  v-model="exportAuswahl[bereich.id]"
                  @change="beiExportKampagneKomplettToggle(bereich, $event)" />
                <label class="form-check-label" :for="'export-switch-' + bereich.id">
                  <span v-if="bereich.exportLegacySammel" class="badge text-bg-secondary me-1">Sammel</span>
                  {{ bereich.label }}
                </label>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                data-bs-dismiss="modal">
                Abbrechen
              </button>
              <button
                type="button"
                class="btn btn-primary"
                :disabled="!hatExportAuswahl"
                @click="exportStarten">
                Export starten
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        ref="importModalElement"
        class="modal fade"
        id="htbahImportModal"
        tabindex="-1"
        aria-labelledby="htbahImportModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content shadow">
            <div class="modal-header">
              <h5 class="modal-title" id="htbahImportModalLabel">Daten importieren</h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Schließen"></button>
            </div>
            <div class="modal-body text-start">
              <p class="small text-body-secondary mb-2">
                Datei: <strong>{{ importDateiname || 'Unbekannt' }}</strong>
              </p>
              <p class="small text-body-secondary mb-2">
                Wähle die Speicherbereiche aus, die importiert werden sollen.
              </p>
              <div class="d-flex justify-content-end mb-2">
                <button
                  type="button"
                  class="btn btn-sm btn-link"
                  @click="bereicheAuswahlAlleToggle('import')">
                  {{ importAlleBereicheAusgewaehlt ? 'Alle abwählen' : 'Alle auswählen' }}
                </button>
              </div>
              <div
                v-for="bereich in importBereicheAusDatei"
                :key="'import-' + bereich.id"
                class="form-check form-switch mb-2">
                <input
                  :id="'import-switch-' + bereich.id"
                  class="form-check-input"
                  type="checkbox"
                  role="switch"
                  v-model="importAuswahl[bereich.id]" />
                <label class="form-check-label d-flex align-items-center gap-2" :for="'import-switch-' + bereich.id">
                  <span>{{ bereich.label }}</span>
                  <span
                    v-if="!bereich.vorhanden"
                    class="badge text-bg-secondary">
                    Wird gelöscht
                  </span>
                </label>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                data-bs-dismiss="modal">
                Abbrechen
              </button>
              <button
                type="button"
                class="btn btn-primary"
                :disabled="!hatImportAuswahl"
                @click="importStarten">
                Import starten
              </button>
            </div>
          </div>
        </div>
      </div>

      <bestaetigen-modal ref="bestaetigenModal" />
    </div>
  `,
};
