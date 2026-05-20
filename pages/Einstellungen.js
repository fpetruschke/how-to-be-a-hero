window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};
var HTBAH_REFACTOR_UTILS =
  (window.HTBAH_SHARED && window.HTBAH_SHARED.RefactorUtils) || null;
var HTBAH_BOOTSTRAP_MODAL =
  (window.HTBAH_SHARED && window.HTBAH_SHARED.BootstrapModalHelper) || null;
var HTBAH_EXPORT_IMPORT_BAUM =
  (window.HTBAH_SHARED && window.HTBAH_SHARED.ExportImportBaum) || null;

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
  kampagnenLabels: {
    key: 'htbah_kampagnen_labels_katalog',
    titel: 'Kampagnen-Label-Katalog löschen?',
    beschreibung:
      'Der globale Label-Katalog (Setting- und Inhaltshinweise) wird zurückgesetzt. Bereits auf Kampagnen kopierte Labels bleiben dort erhalten.',
    erfolg: 'Kampagnen-Label-Katalog wurde zurückgesetzt.',
    buttonSymbol: '🏷️',
    buttonLabel: 'Kampagnen-Label-Katalog löschen',
  },
  spielleiter: {
    key: 'htbah_spielleiter_kampagnen',
    titel: 'Spielleiter-Kampagnen löschen?',
    beschreibung:
      'Alle gespeicherten Kampagnen und Charaktere in der Spielleiter-Ansicht werden entfernt — inklusive Label-Kopien, Abenteuerbücher, Wetter/Tageszeit-Daten und Badge-Positionen.',
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
      'htbah_kampagnen_labels_katalog',
      'htbah_zufallstabellen',
      'htbah_weltenbau',
      'htbah_wuerfel_audio',
      'htbah_wuerfel_sound',
      'htbah_zeitmessung_einstellungen',
      'htbah_zeitmessung_badge_pos',
      'htbah_dice_colors',
      'htbah_wuerfel_beutel_fenster',
      'htbah_wuerfelbecher_bundle',
      'htbah_orientation_mode',
      'htbah_orientation_anchor_angle',
      'htbah_interaktive_welt_stats_anzeigen',
    ],
    titel: 'Alle lokalen Daten löschen?',
    beschreibung:
      'Es werden Charakterdaten, Charakterbild, gespeicherte Fähigkeiten-Presets, Spielleiter-Kampagnen (inkl. Abenteuerbücher, Wetter/Tageszeit und Badge-Position), Zufallstabellen und Weltenbau-Daten je Kampagne, deine Theme-Auswahl, die Würfel- und Zeitmessungs-Einstellungen, 3D-Würfel-Farben sowie Größe und Position des Würfelbeutel-Fensters entfernt. Die App entspricht danach einem frischen Start.',
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
  'htbah_zeitmessung_einstellungen',
  'htbah_zeitmessung_badge_pos',
];

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

function parseLsExportKeyMeta(key) {
  return HTBAH_EXPORT_IMPORT_BAUM
    ? HTBAH_EXPORT_IMPORT_BAUM.parseLsExportKeyMeta(key)
    : null;
}

function neueBereichsAuswahl(wurzel) {
  return HTBAH_EXPORT_IMPORT_BAUM
    ? HTBAH_EXPORT_IMPORT_BAUM.neueAuswahlFuerBaum(wurzel, true)
    : {};
}

function keineBereichsAuswahl(wurzel) {
  return HTBAH_EXPORT_IMPORT_BAUM
    ? HTBAH_EXPORT_IMPORT_BAUM.neueAuswahlFuerBaum(wurzel, false)
    : {};
}

function kampagneNameAusLsPaket(pak) {
  if (!pak || typeof pak !== 'object') {
    return '';
  }
  const k =
    (pak.kampagne && typeof pak.kampagne.name === 'string' && pak.kampagne.name) ||
    (pak.spielleiterTeil &&
      pak.spielleiterTeil.kampagne &&
      typeof pak.spielleiterTeil.kampagne.name === 'string' &&
      pak.spielleiterTeil.kampagne.name) ||
    '';
  return typeof k === 'string' ? k.trim() : '';
}

function kampagneNamenAusImportEintraegen(eintraege) {
  const namen = new Map();
  eintraege.forEach((e) => {
    if (!e || typeof e !== 'object') {
      return;
    }
    if (e.key === 'htbah_spielleiter_kampagnen' && e.vorhanden && typeof e.wert === 'string') {
      try {
        const p = JSON.parse(e.wert);
        (Array.isArray(p.kampagnen) ? p.kampagnen : []).forEach((k) => {
          if (k && k.id) {
            const n = typeof k.name === 'string' ? k.name.trim() : '';
            namen.set(String(k.id), n || String(k.id));
          }
        });
      } catch {
        /* ignorieren */
      }
    }
    if (e.key.startsWith('htbah_export_ls:') && e.vorhanden && typeof e.wert === 'string') {
      try {
        const p = JSON.parse(e.wert);
        const kid = typeof p.kampagneId === 'string' ? p.kampagneId.trim() : '';
        if (!kid) {
          return;
        }
        const n = kampagneNameAusLsPaket(p);
        if (n) {
          namen.set(kid, n);
        } else if (!namen.has(kid)) {
          namen.set(kid, kid);
        }
      } catch {
        /* ignorieren */
      }
    }
  });
  return namen;
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
      exportAuswahl: {},
      importAuswahl: {},
      importBaumWurzel: [],
      importDateiEintraege: [],
      importDateiname: '',
      exportModalInstanz: null,
      importModalInstanz: null,
      wuerfel3dAktiv: true,
      wuerfelFarbe: '#509b4a',
      wuerfelFarbeZehner: '#3b7a36',
      wuerfelAudioStumm: false,
      wuerfelAudioLautstaerke: 0.88,
      zeitmessungKlickAktiv: true,
      zeitmessungKlickLautstaerke: 0.65,
      zeitmessungStoppuhrMitKlick: false,
      zeitmessungCountdownAbSekunde: 10,
      orientierungModus: 'frei',
      /** Erzwingt Neu-Laden der Kampagnenliste aus dem Speicher (nicht reaktiv). */
      kampagnenCacheTick: 0,
      /** @type {null | { typ: string, kampagneId: string, kampagneName: string, katSchluessel?: string, wbBereich?: string }} */
      kampagneLoeschPayload: null,
      /** Pro Kampagnen-ID: detaillierte Lösch-Buttons sichtbar (Standard: aus = eingeklappt). */
      kampagnenLoeschDetailsSichtbar: {},
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
    /** Typisches localStorage-Limit pro Origin (~5 MiB), nur für die Fortschrittsanzeige. */
    localStorageReferenzQuotaBytes() {
      return 5 * 1024 * 1024;
    },
    appSpeicherNutzungText() {
      return this.localStorageHtbahText;
    },
    appSpeicherQuotaText() {
      if (!HTBAH_REFACTOR_UTILS) {
        return '';
      }
      return HTBAH_REFACTOR_UTILS.formatBytesDecimal(this.localStorageReferenzQuotaBytes);
    },
    appSpeicherProzent() {
      const s = this.localStorageStatistik;
      if (!s || !s.ok) {
        return 0;
      }
      const u = typeof s.htbahBytes === 'number' && Number.isFinite(s.htbahBytes) ? s.htbahBytes : 0;
      const q = this.localStorageReferenzQuotaBytes;
      if (q <= 0) {
        return 0;
      }
      return Math.min(100, Math.round((100 * u) / q));
    },
    appSpeicherProgressBarKlasse() {
      const p = this.appSpeicherProzent;
      if (p >= 95) {
        return 'bg-danger';
      }
      if (p >= 80) {
        return 'bg-warning text-dark';
      }
      return 'bg-success';
    },
    wuerfelAudioLautProzent() {
      return Math.round(Math.min(1, Math.max(0, Number(this.wuerfelAudioLautstaerke) || 0)) * 100);
    },
    zeitmessungKlickLautProzent() {
      return Math.round(Math.min(1, Math.max(0, Number(this.zeitmessungKlickLautstaerke) || 0)) * 100);
    },
    exportBaumOpts() {
      return {
        appRolle: this.appRolle,
        charakterEintraege: this.charakterEintraege,
        spielleiterKampagnen: this.spielleiterKampagnen,
        charakterNameFn: (e) => this.charakterName(e),
        kampagneNameFn: (k) => this.kampagneAnzeigeName(k),
        mitgliedNameFn: (m) => this.mitgliedName(m),
      };
    },
    exportBaumWurzel() {
      if (!HTBAH_EXPORT_IMPORT_BAUM) {
        return [];
      }
      return HTBAH_EXPORT_IMPORT_BAUM.baueExportBaumWurzel(this.exportBaumOpts);
    },
    exportBaumFlacheListe() {
      if (!HTBAH_EXPORT_IMPORT_BAUM) {
        return [];
      }
      return HTBAH_EXPORT_IMPORT_BAUM.baumZuFlacherListe(this.exportBaumWurzel);
    },
    importBaumFlacheListe() {
      if (!HTBAH_EXPORT_IMPORT_BAUM) {
        return [];
      }
      return HTBAH_EXPORT_IMPORT_BAUM.baumZuFlacherListe(this.importBaumWurzel);
    },
    hatExportAuswahl() {
      if (!HTBAH_EXPORT_IMPORT_BAUM) {
        return false;
      }
      return HTBAH_EXPORT_IMPORT_BAUM.ausgewaehlteBlaetter(this.exportBaumWurzel, this.exportAuswahl).length > 0;
    },
    hatImportAuswahl() {
      if (!HTBAH_EXPORT_IMPORT_BAUM) {
        return false;
      }
      return HTBAH_EXPORT_IMPORT_BAUM.ausgewaehlteBlaetter(this.importBaumWurzel, this.importAuswahl).length > 0;
    },
    exportAlleBereicheAusgewaehlt() {
      if (!HTBAH_EXPORT_IMPORT_BAUM) {
        return false;
      }
      return HTBAH_EXPORT_IMPORT_BAUM.alleBlaetterAusgewaehlt(this.exportBaumWurzel, this.exportAuswahl);
    },
    importAlleBereicheAusgewaehlt() {
      if (!HTBAH_EXPORT_IMPORT_BAUM) {
        return false;
      }
      return HTBAH_EXPORT_IMPORT_BAUM.alleBlaetterAusgewaehlt(this.importBaumWurzel, this.importAuswahl);
    },
    charakterEintraege() {
      return window.HTBAH.listeCharaktere();
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
    charakterBild(eintrag) {
      const bild =
        eintrag && typeof eintrag.charakterBild === 'string' ? eintrag.charakterBild.trim() : '';
      return bild || '';
    },
    mitgliedName(mitglied) {
      const name =
        mitglied &&
        mitglied.charakter &&
        typeof mitglied.charakter.name === 'string'
          ? mitglied.charakter.name.trim()
          : '';
      return name || 'Unbenannter Charakter';
    },
    exportBaumOptsFuerImport(dateiEintraege) {
      const kampagneNamen = kampagneNamenAusImportEintraegen(dateiEintraege || []);
      return {
        ...this.exportBaumOpts,
        dateiEintraege: dateiEintraege || [],
        kampagneNamen,
      };
    },
    exportGruppeIstAn(gruppenId) {
      if (!HTBAH_EXPORT_IMPORT_BAUM) {
        return false;
      }
      return HTBAH_EXPORT_IMPORT_BAUM.gruppenToggleWert(
        this.exportBaumWurzel,
        this.exportAuswahl,
        gruppenId,
      );
    },
    importGruppeIstAn(gruppenId) {
      if (!HTBAH_EXPORT_IMPORT_BAUM) {
        return false;
      }
      return HTBAH_EXPORT_IMPORT_BAUM.gruppenToggleWert(
        this.importBaumWurzel,
        this.importAuswahl,
        gruppenId,
      );
    },
    exportGruppeToggle(gruppenId, event) {
      if (!HTBAH_EXPORT_IMPORT_BAUM) {
        return;
      }
      const aktiv = Boolean(event && event.target && event.target.checked);
      this.exportAuswahl = HTBAH_EXPORT_IMPORT_BAUM.setzeGruppeUndNachfahren(
        this.exportBaumWurzel,
        this.exportAuswahl,
        gruppenId,
        aktiv,
      );
    },
    importGruppeToggle(gruppenId, event) {
      if (!HTBAH_EXPORT_IMPORT_BAUM) {
        return;
      }
      const aktiv = Boolean(event && event.target && event.target.checked);
      this.importAuswahl = HTBAH_EXPORT_IMPORT_BAUM.setzeGruppeUndNachfahren(
        this.importBaumWurzel,
        this.importAuswahl,
        gruppenId,
        aktiv,
      );
    },
    baumEinrueckKlasse(tiefe) {
      const t = Math.max(0, Math.min(4, Number(tiefe) || 0));
      return t ? `ms-${t * 3}` : '';
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
        case 'wb_interaktive_welt_einstellungen':
          return {
            titel: 'Interaktive-Welt-Einstellungen löschen?',
            beschreibung: `Zu „${name}“ werden Canvas-Einstellungen (Zoom, Item-Größe, Linien, Sichtbarkeitsfilter, Kampfwerte-Anzeige) und Element-Verankerungen zurückgesetzt. Karteninhalte und Hintergründe bleiben erhalten.`,
            erfolg: `Interaktive-Welt-Einstellungen zu „${name}“ wurden zurückgesetzt.`,
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
        case 'wb_interaktive_welt_einstellungen':
          if (
            !window.HTBAH.loescheWeltenbauBereichFuerKampagne(
              p.kampagneId,
              'interaktive_welt_einstellungen',
            )
          ) {
            ok = false;
            this.statusAnzeigen('Die Interaktive-Welt-Einstellungen konnten nicht zurückgesetzt werden.', 'danger');
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
      const zeit =
        window.HTBAH && typeof window.HTBAH.ladeZeitmessungProfil === 'function'
          ? window.HTBAH.ladeZeitmessungProfil()
          : null;
      this.wuerfel3dAktiv = anzeige.enabled;
      this.wuerfelFarbe = anzeige.themeOnes || anzeige.theme;
      this.wuerfelFarbeZehner = anzeige.themeTens || '#3b7a36';
      this.wuerfelAudioStumm = audio.stumm;
      this.wuerfelAudioLautstaerke = audio.lautstaerke;
      if (zeit) {
        this.zeitmessungKlickAktiv = zeit.klickAktiv;
        this.zeitmessungKlickLautstaerke = zeit.klickLautstaerke;
        this.zeitmessungStoppuhrMitKlick = zeit.stoppuhrMitKlick;
        this.zeitmessungCountdownAbSekunde = zeit.countdownAbSekunde;
      }
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
    zeitmessungEinstellungenPersistiere() {
      if (!window.HTBAH || typeof window.HTBAH.setzeZeitmessungProfil !== 'function') {
        return;
      }
      window.HTBAH.setzeZeitmessungProfil({
        klickAktiv: this.zeitmessungKlickAktiv,
        klickLautstaerke: this.zeitmessungKlickLautstaerke,
        stoppuhrMitKlick: this.zeitmessungStoppuhrMitKlick,
        countdownAbSekunde: this.zeitmessungCountdownAbSekunde,
      });
    },
    zeitmessungKlickAktivToggle() {
      this.zeitmessungKlickAktiv = !this.zeitmessungKlickAktiv;
      this.zeitmessungEinstellungenPersistiere();
    },
    zeitmessungKlickSetzeLautstaerkeProzent(roh) {
      const n = Math.max(0, Math.min(100, Math.round(Number(roh) || 0)));
      this.zeitmessungKlickLautstaerke = n / 100;
      this.zeitmessungEinstellungenPersistiere();
    },
    zeitmessungKlickVorschau() {
      if (!this.zeitmessungKlickAktiv) {
        return;
      }
      window.HTBAH?.spieleZeitmessungKlick?.(this.zeitmessungKlickLautstaerke);
    },
    zeitmessungAbgelaufenVorschau() {
      if (!this.zeitmessungKlickAktiv) {
        return;
      }
      window.HTBAH?.spieleZeitmessungAbgelaufen?.(this.zeitmessungKlickLautstaerke);
    },
    zeitmessungCountdownAbGeaendert() {
      const n = Math.max(0, Math.min(35999, Math.round(Number(this.zeitmessungCountdownAbSekunde) || 0)));
      this.zeitmessungCountdownAbSekunde = n;
      this.zeitmessungEinstellungenPersistiere();
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
      this.exportAuswahl = keineBereichsAuswahl(this.exportBaumWurzel);
      this.modalAnzeigen('exportModalElement', 'exportModalInstanz');
    },
    exportPaketAusAuswahl(auswahl) {
      if (!HTBAH_EXPORT_IMPORT_BAUM) {
        return null;
      }
      const ausgewaehlteBlaetter = HTBAH_EXPORT_IMPORT_BAUM.ausgewaehlteBlaetter(
        this.exportBaumWurzel,
        auswahl,
      );
      if (!ausgewaehlteBlaetter.length) {
        return null;
      }
      const daten = ausgewaehlteBlaetter.map((blatt) => {
        const bereich = blatt.slot;
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
          } else if (bereich.lsTyp === 'sl_mitglied') {
            pak = window.HTBAH.erstelleSpielleiterMitgliedExportPaket(kid, bereich.mitgliedId);
          } else if (bereich.lsTyp === 'sl_abenteuerbuch') {
            pak = window.HTBAH.erstelleSpielleiterAbenteuerbuchExportPaket(kid);
          } else if (bereich.lsTyp === 'sl_atmosphaere') {
            pak = window.HTBAH.erstelleSpielleiterAtmosphaereExportPaket(kid);
          } else if (bereich.lsTyp === 'sl_zeitmessung') {
            pak = window.HTBAH.erstelleSpielleiterZeitmessungExportPaket(kid);
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
            id: blatt.id,
            key: bereich.key,
            label: blatt.label || bereich.label,
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
            id: blatt.id,
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
            id: blatt.id,
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
            id: blatt.id,
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
            id: blatt.id,
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
            id: blatt.id,
            key: bereich.key,
            label: bereich.label,
            vorhanden: Boolean(wert),
            wert,
          };
        }
        const wert = window.HTBAH.speicher.leseText(bereich.key, null);
        const vorhanden = typeof wert === 'string';
        return {
          id: blatt.id,
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
      this.importBaumWurzel = [];
      this.importDateiEintraege = [];
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
      if (!HTBAH_EXPORT_IMPORT_BAUM) {
        this.statusAnzeigen('Import ist derzeit nicht verfügbar.', 'danger');
        return false;
      }
      if (!roh || typeof roh !== 'object' || roh.typ !== 'lokaler-speicher' || !Array.isArray(roh.daten)) {
        this.statusAnzeigen(
          'Unbekanntes Importformat. Bitte wähle eine Datei aus dem Daten-Export der Einstellungen.',
          'danger',
        );
        return false;
      }
      const normalisierteDaten = htbahNormalisiereLokalerSpeicherImportDaten(roh.daten);
      const flatEintraege = normalisierteDaten.filter(
        (eintrag) => eintrag && typeof eintrag === 'object' && typeof eintrag.key === 'string',
      );
      if (!flatEintraege.length) {
        this.statusAnzeigen('Die JSON-Datei enthält keine importierbaren Speicherbereiche.', 'danger');
        return false;
      }
      const opts = this.exportBaumOptsFuerImport(flatEintraege);
      const wurzel = HTBAH_EXPORT_IMPORT_BAUM.baueImportBaumWurzel(opts);
      const importBaum = HTBAH_EXPORT_IMPORT_BAUM.importBaumMitDateiWerten(wurzel, flatEintraege);
      const importierbare = HTBAH_EXPORT_IMPORT_BAUM.sammleBlattKnoten({
        typ: 'gruppe',
        kinder: importBaum,
      });
      if (!importierbare.length) {
        this.statusAnzeigen('Die JSON-Datei enthält keine importierbaren Speicherbereiche.', 'danger');
        return false;
      }
      this.importDateiname = dateiname;
      this.importDateiEintraege = flatEintraege;
      this.importBaumWurzel = importBaum;
      this.importAuswahl = neueBereichsAuswahl(importBaum);
      this.modalAnzeigen('importModalElement', 'importModalInstanz');
      return true;
    },
    importBlattAlsBereich(blatt) {
      return {
        ...(blatt.slot || {}),
        id: blatt.id,
        label: blatt.label,
        key: blatt.slot && blatt.slot.key ? blatt.slot.key : '',
        vorhanden: Boolean(blatt.vorhanden),
        wert: typeof blatt.wert === 'string' ? blatt.wert : null,
      };
    },
    importBlattVorhanden(blattId) {
      if (!HTBAH_EXPORT_IMPORT_BAUM) {
        return true;
      }
      const blatt = HTBAH_EXPORT_IMPORT_BAUM.sammleBlattKnoten({
        typ: 'gruppe',
        kinder: this.importBaumWurzel,
      }).find((b) => b.id === blattId);
      return blatt ? Boolean(blatt.vorhanden) : true;
    },
    bereicheAuswahlAlleToggle(ziel) {
      if (ziel === 'export') {
        const wurzel = this.exportBaumWurzel;
        this.exportAuswahl = this.exportAlleBereicheAusgewaehlt
          ? keineBereichsAuswahl(wurzel)
          : neueBereichsAuswahl(wurzel);
        return;
      }
      if (ziel === 'import') {
        const wurzel = this.importBaumWurzel;
        this.importAuswahl = this.importAlleBereicheAusgewaehlt
          ? keineBereichsAuswahl(wurzel)
          : neueBereichsAuswahl(wurzel);
      }
    },
    importStarten() {
      if (!HTBAH_EXPORT_IMPORT_BAUM) {
        return;
      }
      const ausgewaehlteBlaetter = HTBAH_EXPORT_IMPORT_BAUM.ausgewaehlteBlaetter(
        this.importBaumWurzel,
        this.importAuswahl,
      );
      if (!ausgewaehlteBlaetter.length) {
        this.statusAnzeigen('Bitte wähle mindestens einen Speicherbereich für den Import aus.', 'danger');
        return;
      }
      const ausgewaehlteBereiche = ausgewaehlteBlaetter.map((b) => this.importBlattAlsBereich(b));
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
          } else if (tail.startsWith('sl_mitglied:')) {
            const rest = tail.slice('sl_mitglied:'.length);
            const li = rest.lastIndexOf(':');
            const kid = li > 0 ? rest.slice(0, li) : rest;
            r = kid ? window.HTBAH.importiereSpielleiterMitgliedPaket(kid, p) : { ok: false, fehler: 'Keine Kampagne.' };
          } else if (tail.startsWith('sl_abenteuerbuch:')) {
            const kid = tail.slice('sl_abenteuerbuch:'.length);
            r = window.HTBAH.importiereSpielleiterAbenteuerbuchPaket(kid, p);
          } else if (tail.startsWith('sl_atmosphaere:')) {
            const kid = tail.slice('sl_atmosphaere:'.length);
            r = window.HTBAH.importiereSpielleiterAtmosphaerePaket(kid, p);
          } else if (tail.startsWith('sl_zeitmessung:')) {
            const kid = tail.slice('sl_zeitmessung:'.length);
            r = window.HTBAH.importiereSpielleiterZeitmessungPaket(kid, p);
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
            b.key === 'htbah_weltenbau' ||
            b.lsTyp === 'sl_mitglied' ||
            b.lsTyp === 'sl_abenteuerbuch' ||
            b.lsTyp === 'sl_atmosphaere' ||
            b.lsTyp === 'sl_zeitmessung',
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
          Lege fest, ob die Ansicht frei drehbar bleibt oder in der aktuellen Lage (Quer- bzw. Hochformat) fixiert wird – auch bei Drehen oder Wenden des Geräts.
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

      <template v-if="appRolle === 'spielleitung'">
        <h5 class="text-start mb-2">Labels</h5>
        <div class="card p-3 mb-3 text-start">
          <kampagnen-labels-verwaltung />
        </div>
      </template>

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

      <h5 class="text-start mb-2">Zeitmessung (Würfelbeutel)</h5>
      <div class="card p-3 mb-3 text-start">
        <p class="small text-body-secondary mb-3">
          Klick-Töne für Timer und Stoppuhr im Würfelbeutel. Der Ton wird per Web Audio erzeugt — kein
          zusätzliches Audio-Asset nötig.
        </p>
        <div class="form-check form-switch mb-3">
          <input
            id="settings-zeitmessung-klick"
            class="form-check-input"
            type="checkbox"
            role="switch"
            v-model="zeitmessungKlickAktiv"
            @change="zeitmessungEinstellungenPersistiere" />
          <label class="form-check-label" for="settings-zeitmessung-klick">
            Countdown-Klick aktiv
          </label>
        </div>
        <div class="d-flex align-items-center gap-2 flex-wrap mb-3">
          <span class="small text-body-secondary text-nowrap">Klick-Lautstärke</span>
          <input
            type="range"
            class="form-range flex-grow-1 m-0 htbah-wuerfel-audio-range"
            min="0"
            max="100"
            step="1"
            :disabled="!zeitmessungKlickAktiv"
            :value="zeitmessungKlickLautProzent"
            @input="zeitmessungKlickSetzeLautstaerkeProzent($event.target.value)"
            aria-label="Zeitmessung Klick Lautstärke" />
          <span class="small text-body-secondary tabular-nums text-nowrap" style="min-width: 2.5rem">
            {{ zeitmessungKlickLautProzent }}%
          </span>
          <button
            type="button"
            class="btn btn-outline-secondary btn-sm"
            :disabled="!zeitmessungKlickAktiv"
            @click="zeitmessungKlickVorschau">
            Klick
          </button>
          <button
            type="button"
            class="btn btn-outline-secondary btn-sm"
            :disabled="!zeitmessungKlickAktiv"
            @click="zeitmessungAbgelaufenVorschau">
            Ende
          </button>
        </div>
        <div class="form-check form-switch mb-3">
          <input
            id="settings-zeitmessung-stoppuhr-klick"
            class="form-check-input"
            type="checkbox"
            role="switch"
            v-model="zeitmessungStoppuhrMitKlick"
            @change="zeitmessungEinstellungenPersistiere" />
          <label class="form-check-label" for="settings-zeitmessung-stoppuhr-klick">
            Stoppuhr: jede volle Sekunde mit Klick
          </label>
        </div>
        <div class="mb-0">
          <label class="form-label small text-body-secondary mb-1" for="settings-zeitmessung-countdown-ab">
            Timer: Klick ab verbleibenden Sekunden
          </label>
          <input
            id="settings-zeitmessung-countdown-ab"
            type="number"
            class="form-control"
            min="0"
            max="35999"
            v-model.number="zeitmessungCountdownAbSekunde"
            :disabled="!zeitmessungKlickAktiv"
            @change="zeitmessungCountdownAbGeaendert" />
          <div class="form-text">
            Bei 10 ertönt ab 00:00:10 bis 00:00:01 je ein Klick pro Sekunde. Bei 0 eine kurze Melodie
            (Ende-Test).
          </div>
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
          <template v-if="localStorageStatistik && localStorageStatistik.ok">
            <div class="d-flex justify-content-between align-items-baseline flex-wrap gap-2 mb-2">
              <span class="small"><strong>{{ appSpeicherNutzungText }}</strong> belegt</span>
              <span class="small text-body-secondary">Referenz: {{ appSpeicherQuotaText }} (typisches localStorage-Limit)</span>
            </div>
            <div
              class="progress"
              style="height: 1.1rem"
              role="progressbar"
              :aria-valuenow="appSpeicherProzent"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-label="'App-Speicher: ' + appSpeicherProzent + ' Prozent'">
              <div
                class="progress-bar"
                :class="appSpeicherProgressBarKlasse"
                :style="{ width: appSpeicherProzent + '%' }"></div>
            </div>
            <div class="small text-body-secondary mt-1 text-end">
              {{ appSpeicherProzent }} %
            </div>
          </template>
          <p v-if="browserSpeicher" class="small text-body-secondary mb-1 mt-3">Geschätzter Browser-Speicher (Origin, inkl. IndexedDB &amp; Cache):</p>
          <template v-if="browserSpeicher">
            <div class="d-flex justify-content-between align-items-baseline flex-wrap gap-2 mb-0">
              <span class="small">{{ browserSpeicherNutzungText }} belegt</span>
              <span class="small text-body-secondary" v-if="browserSpeicherQuotaEndlich">
                von {{ browserSpeicherQuotaText }}
              </span>
              <span class="small text-body-secondary" v-else>ohne gemeldetes Obergrenzen-Limit</span>
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
      </div>

      <h5 class="text-start mb-2">Daten löschen</h5>
      <div class="card p-3">
        <div class="mb-3">
          <h6 class="mb-2">Einzelne Charaktere</h6>
          <p v-if="!charakterEintraege.length" class="small text-body-secondary mb-2">
            Keine gespeicherten Charaktere vorhanden.
          </p>
          <div v-else class="d-flex flex-column gap-2">
            <button
              v-for="eintrag in charakterEintraege"
              :key="'del-char-' + eintrag.id"
              type="button"
              class="btn btn-outline-danger btn-sm btn-labeled w-100 text-start"
              :aria-label="charakterName(eintrag) + ' löschen'"
              @click="loescheEinzelCharakter(eintrag)">
              <span class="btn-label">
                <img
                  v-if="charakterBild(eintrag)"
                  :src="charakterBild(eintrag)"
                  alt=""
                  class="htbah-btn-labeled-avatar"
                  aria-hidden="true" />
                <span v-else class="btn-labeled-emoji" aria-hidden="true">🧙</span>
              </span>
              <span class="btn-labeled-text">{{ charakterName(eintrag) }} löschen</span>
            </button>
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
                    <span class="small">Details</span>
                  </button>
                  <div
                    v-show="kampagneLoeschDetailsIstOffen(k)"
                    :id="'htbah-loesch-details-body-' + kampagneLoeschDetailsKid(k)"
                    class="pt-1">
                    <div class="d-flex flex-column gap-2">
                    <div class="small text-body-secondary pt-1">Zufallstabellen</div>
                    <icon-text-button
                      class="btn btn-outline-danger btn-sm w-100 text-start"
                      type="button"
                      :symbol="speicherBereiche.zufallstabellen.buttonSymbol"
                      @click="oeffneKampagneLoeschDialog('ztf_alle', k)">
                      Alle Tabellen-Einträge löschen (alle Kategorien, inkl. Medien)
                    </icon-text-button>
                    <div class="d-flex flex-column gap-1 ps-2 border-start border-secondary border-opacity-25 ms-1">
                      <button
                        v-for="kat in ztfKampagneKategorien"
                        :key="'ztf-del-' + k.id + '-' + kat.schluessel"
                        type="button"
                        class="btn btn-outline-danger btn-sm text-start w-100"
                        @click="oeffneKampagneLoeschDialog('ztf_kategorie', k, { katSchluessel: kat.schluessel })">
                        Nur {{ kat.label }} löschen
                      </button>
                    </div>
                    <div class="small text-body-secondary pt-1">Weltenbau</div>
                    <icon-text-button
                      class="btn btn-outline-danger btn-sm w-100 text-start"
                      type="button"
                      :symbol="speicherBereiche.weltenbau.buttonSymbol"
                      @click="oeffneKampagneLoeschDialog('wb_alles', k)">
                      Gesamten Weltenbau dieser Kampagne löschen
                    </icon-text-button>
                    <div class="d-flex flex-column gap-1 ps-2 border-start border-secondary border-opacity-25 ms-1">
                      <button
                        type="button"
                        class="btn btn-outline-danger btn-sm text-start w-100"
                        @click="oeffneKampagneLoeschDialog('wb_galerie', k)">
                        Nur Galerie-Bilder löschen
                      </button>
                      <button
                        type="button"
                        class="btn btn-outline-danger btn-sm text-start w-100"
                        @click="oeffneKampagneLoeschDialog('wb_interaktive_welt', k)">
                        Nur interaktive Welt / Karten löschen
                      </button>
                      <button
                        type="button"
                        class="btn btn-outline-danger btn-sm text-start w-100"
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
          <hr class="border-secondary border-opacity-25 my-3" />
          <div class="rounded border border-secondary border-opacity-25 p-2 ps-3 text-start">
            <div class="fw-semibold mb-2">Alle Kampagnen / global</div>
            <div class="d-flex flex-column gap-2 ps-2 border-start border-secondary border-opacity-50 ms-1">
              <icon-text-button
                class="btn btn-danger btn-sm w-100 text-start"
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
                    :symbol="speicherBereiche.kampagnenLabels.buttonSymbol"
                    @click="oeffneLoeschDialog('kampagnenLabels')">
                    {{ speicherBereiche.kampagnenLabels.buttonLabel }}
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
                In die JSON-Datei kommen nur die Bereiche, die Du aktivierst. Gruppen schalten alle
                Unterpunkte gemeinsam an oder aus; einzelne Unterpunkte kannst Du danach abwählen.
              </p>
              <div class="d-flex flex-wrap justify-content-end align-items-center gap-2 mb-2">
                <button
                  type="button"
                  class="btn btn-sm btn-link px-0"
                  @click="bereicheAuswahlAlleToggle('export')">
                  {{ exportAlleBereicheAusgewaehlt ? 'Alle abwählen' : 'Alle auswählen' }}
                </button>
              </div>
              <template v-for="zeile in exportBaumFlacheListe" :key="'export-' + zeile.id">
                <div
                  v-if="zeile.typ === 'gruppe'"
                  class="form-check form-switch mb-2"
                  :style="{ marginLeft: (zeile.tiefe * 1.25) + 'rem' }">
                  <input
                    :id="'export-switch-' + zeile.id"
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    :checked="exportGruppeIstAn(zeile.id)"
                    @change="exportGruppeToggle(zeile.id, $event)" />
                  <label class="form-check-label fw-semibold" :for="'export-switch-' + zeile.id">
                    {{ zeile.label }}
                  </label>
                </div>
                <div
                  v-else
                  class="form-check form-switch mb-2"
                  :style="{ marginLeft: (zeile.tiefe * 1.25) + 'rem' }">
                  <input
                    :id="'export-switch-' + zeile.id"
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    v-model="exportAuswahl[zeile.id]" />
                  <label class="form-check-label" :for="'export-switch-' + zeile.id">
                    <span
                      v-if="zeile.slot && zeile.slot.importLegacy"
                      class="badge text-bg-secondary me-1">
                      Legacy
                    </span>
                    {{ zeile.label }}
                  </label>
                </div>
              </template>
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
                Es werden nur die Bereiche aus der Datei angezeigt und übernommen, die Du aktivierst.
                Gruppen schalten alle Unterpunkte gemeinsam an oder aus.
              </p>
              <div class="d-flex flex-wrap justify-content-end align-items-center gap-2 mb-2">
                <button
                  type="button"
                  class="btn btn-sm btn-link px-0"
                  @click="bereicheAuswahlAlleToggle('import')">
                  {{ importAlleBereicheAusgewaehlt ? 'Alle abwählen' : 'Alle auswählen' }}
                </button>
              </div>
              <template v-for="zeile in importBaumFlacheListe" :key="'import-' + zeile.id">
                <div
                  v-if="zeile.typ === 'gruppe'"
                  class="form-check form-switch mb-2"
                  :style="{ marginLeft: (zeile.tiefe * 1.25) + 'rem' }">
                  <input
                    :id="'import-switch-' + zeile.id"
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    :checked="importGruppeIstAn(zeile.id)"
                    @change="importGruppeToggle(zeile.id, $event)" />
                  <label class="form-check-label fw-semibold" :for="'import-switch-' + zeile.id">
                    {{ zeile.label }}
                  </label>
                </div>
                <div
                  v-else
                  class="form-check form-switch mb-2"
                  :style="{ marginLeft: (zeile.tiefe * 1.25) + 'rem' }">
                  <input
                    :id="'import-switch-' + zeile.id"
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    v-model="importAuswahl[zeile.id]" />
                  <label
                    class="form-check-label d-flex align-items-center flex-wrap gap-2"
                    :for="'import-switch-' + zeile.id">
                    <span
                      v-if="zeile.slot && zeile.slot.importLegacy"
                      class="badge text-bg-secondary">
                      Legacy
                    </span>
                    <span>{{ zeile.label }}</span>
                    <span v-if="!importBlattVorhanden(zeile.id)" class="badge text-bg-secondary">
                      Wird gelöscht
                    </span>
                  </label>
                </div>
              </template>
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
