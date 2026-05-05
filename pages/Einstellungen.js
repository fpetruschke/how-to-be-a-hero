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
      'Alle gespeicherten Einträge in den Zufallstabellen (NPCs, Orte, Fraktionen, Pantheon, Gegenstände, Rätsel, Bestarium) werden entfernt.',
    erfolg: 'Zufallstabellen wurden gelöscht.',
    buttonSymbol: '📚',
    buttonLabel: 'Zufallstabellen löschen',
  },
  abenteuerbuch: {
    key: 'htbah_spielleitung_abenteuerbuch',
    titel: 'Abenteuerbuch löschen?',
    beschreibung:
      'Alle formatierten Einträge im Spielleiter-Abenteuerbuch (Text und Formatierung) werden aus dem lokalen Speicher entfernt.',
    erfolg: 'Abenteuerbuch wurde gelöscht.',
    buttonSymbol: '📔',
    buttonLabel: 'Abenteuerbuch löschen',
  },
  weltenbau: {
    key: 'htbah_weltenbau',
    titel: 'Weltenbau-Bilder löschen?',
    beschreibung:
      'Alle unter „Weltenbau“ importierten Karten- und Generator-Bilder werden aus dem lokalen Speicher entfernt.',
    erfolg: 'Weltenbau-Bilder wurden gelöscht.',
    buttonSymbol: '🗺️',
    buttonLabel: 'Weltenbau-Bilder löschen',
  },
  wuerfelbeutelUndAtmosphaere: {
    keys: [
      'htbah_dice_colors',
      'htbah_wuerfel_beutel_fenster',
      'htbah_atmosphaere',
      'htbah_atmosphaere_badge_pos',
    ],
    titel: 'Würfelbeutel-Layout & Atmosphäre löschen?',
    beschreibung:
      '3D-Würfel (Aktivierung und Farbe), gespeicherte Größe und Position des Würfelbeutel-Fensters sowie die im Würfelbeutel gespeicherte Atmosphäre inklusive Badge-Position werden entfernt.',
    erfolg: 'Würfelbeutel-Layout und Atmosphäre wurden gelöscht.',
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
      'Alle gespeicherten Kampagnen und Charaktere in der Spielleiter-Ansicht werden entfernt.',
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
      'htbah_spielleitung_abenteuerbuch',
      'htbah_weltenbau',
      'htbah_wuerfel_audio',
      'htbah_wuerfel_sound',
      'htbah_atmosphaere',
      'htbah_atmosphaere_badge_pos',
      'htbah_dice_colors',
      'htbah_wuerfel_beutel_fenster',
      'htbah_wuerfelbecher_bundle',
    ],
    titel: 'Alle lokalen Daten löschen?',
    beschreibung:
      'Es werden Charakterdaten, Charakterbild, gespeicherte Fähigkeiten-Presets, Spielleiter-Kampagnen, Zufallstabellen, das Abenteuerbuch der Spielleitung, unter „Weltenbau“ gespeicherte Bilder, deine Theme-Auswahl, die Würfel-Audio-Einstellungen, die Atmosphäre im Würfelbeutel, 3D-Würfel-Farben sowie Größe und Position des Würfelbeutel-Fensters entfernt. Die App entspricht danach einem frischen Start.',
    erfolg: 'Alle gespeicherten Daten wurden gelöscht.',
    buttonSymbol: '🗑️',
    buttonLabel: 'Alles löschen',
  },
};

const WUERFELBECHER_KEYS = [
  'htbah_dice_colors',
  'htbah_wuerfel_beutel_fenster',
  'htbah_atmosphaere',
  'htbah_atmosphaere_badge_pos',
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

const DATEN_EXPORT_BEREICHE = [
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
    id: 'kampagnen',
    key: 'htbah_spielleiter_kampagnen',
    label: 'Kampagnen',
  },
  {
    id: 'charakterbildLegacy',
    key: 'htbah_character_image',
    label: 'Charakterbild (Legacy)',
  },
  {
    id: 'zufallstabellen',
    key: 'htbah_zufallstabellen',
    label: 'Zufallstabellen',
  },
  {
    id: 'abenteuerbuch',
    key: 'htbah_spielleitung_abenteuerbuch',
    label: 'Abenteuerbuch',
  },
  {
    id: 'weltenbau',
    key: 'htbah_weltenbau',
    label: 'Weltenbau',
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
      browserSpeicherLaden: true,
      datenExportBereiche: DATEN_EXPORT_BEREICHE,
      exportAuswahl: neueBereichsAuswahl(DATEN_EXPORT_BEREICHE),
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
    };
  },
  computed: {
    themeTitel() {
      return this.istHellesTheme ? 'Helles Theme' : 'Dunkles Theme';
    },
    themeSymbol() {
      return this.istHellesTheme ? 'light_mode' : 'dark_mode';
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
      const basis = this.datenExportBereiche;
      const charakterBereiche = this.charakterEintraege.map((eintrag) => ({
        id: `charakter:${eintrag.id}`,
        key: `htbah_character_entry:${eintrag.id}`,
        label: `Charakter: ${this.charakterName(eintrag)}`,
      }));
      return [...charakterBereiche, ...basis];
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
      if (!navigator.storage || typeof navigator.storage.estimate !== 'function') {
        this.browserSpeicher = null;
        this.browserSpeicherFehler =
          'Speicher-Schätzung ist nicht verfügbar (z. B. unsichere Verbindung oder älterer Browser).';
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
        this.browserSpeicherFehler = 'Die Speicherwerte konnten nicht gelesen werden.';
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

      this.speicherSchaetzungLaden();
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
    exportPaketAusAuswahl(auswahl) {
      const ausgewaehlteBereiche = this.exportBereicheMitCharakteren.filter((b) => auswahl[b.id]);
      if (!ausgewaehlteBereiche.length) {
        return null;
      }
      const daten = ausgewaehlteBereiche.map((bereich) => {
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
      const bekannteBereiche = new Map(this.datenExportBereiche.map((b) => [b.id, b]));
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
      this.speicherSchaetzungLaden();
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
    this.speicherSchaetzungLaden();
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
          Geschätztes Kontingent für diese Website (localStorage, IndexedDB, Service-Worker-Caches u. a.).
          Die Werte sind ungefähr; unter HTTPS ist die Anzeige meist am zuverlässigsten.
        </p>
        <div v-if="browserSpeicherLaden" class="small text-body-secondary">Wird geladen …</div>
        <div v-else-if="browserSpeicherFehler" class="alert alert-warning py-2 mb-0 small">
          {{ browserSpeicherFehler }}
        </div>
        <template v-else-if="browserSpeicher">
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
        <icon-text-button
          type="button"
          class="btn btn-outline-secondary btn-sm mt-2"
          icon="refresh"
          :disabled="browserSpeicherLaden"
          @click="speicherSchaetzungLaden">
          Aktualisieren
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
            :symbol="speicherBereiche.wuerfelbeutelUndAtmosphaere.buttonSymbol"
            @click="oeffneLoeschDialog('wuerfelbeutelUndAtmosphaere')">
            {{ speicherBereiche.wuerfelbeutelUndAtmosphaere.buttonLabel }}
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
          <icon-text-button
            class="btn btn-outline-danger w-100 mb-2"
            type="button"
            :symbol="speicherBereiche.presets.buttonSymbol"
            @click="oeffneLoeschDialog('presets')">
            {{ speicherBereiche.presets.buttonLabel }}
          </icon-text-button>
          <icon-text-button
            class="btn btn-outline-danger w-100 mb-2"
            type="button"
            :symbol="speicherBereiche.spielleiter.buttonSymbol"
            @click="oeffneLoeschDialog('spielleiter')">
            {{ speicherBereiche.spielleiter.buttonLabel }}
          </icon-text-button>
          <icon-text-button
            class="btn btn-outline-danger w-100 mb-2"
            type="button"
            :symbol="speicherBereiche.zufallstabellen.buttonSymbol"
            @click="oeffneLoeschDialog('zufallstabellen')">
            {{ speicherBereiche.zufallstabellen.buttonLabel }}
          </icon-text-button>
          <icon-text-button
            class="btn btn-outline-danger w-100 mb-2"
            type="button"
            :symbol="speicherBereiche.abenteuerbuch.buttonSymbol"
            @click="oeffneLoeschDialog('abenteuerbuch')">
            {{ speicherBereiche.abenteuerbuch.buttonLabel }}
          </icon-text-button>
          <icon-text-button
            class="btn btn-outline-danger w-100 mb-2"
            type="button"
            :symbol="speicherBereiche.weltenbau.buttonSymbol"
            @click="oeffneLoeschDialog('weltenbau')">
            {{ speicherBereiche.weltenbau.buttonLabel }}
          </icon-text-button>
          <icon-text-button
            class="btn btn-outline-danger w-100 mb-2"
            type="button"
            :symbol="speicherBereiche.wuerfelbeutelUndAtmosphaere.buttonSymbol"
            @click="oeffneLoeschDialog('wuerfelbeutelUndAtmosphaere')">
            {{ speicherBereiche.wuerfelbeutelUndAtmosphaere.buttonLabel }}
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
                Wähle die Speicherbereiche für den Export aus.
              </p>
              <div class="d-flex justify-content-end mb-2">
                <button
                  type="button"
                  class="btn btn-sm btn-link"
                  @click="bereicheAuswahlAlleToggle('export')">
                  {{ exportAlleBereicheAusgewaehlt ? 'Alle abwählen' : 'Alle auswählen' }}
                </button>
              </div>
              <div
                v-for="bereich in exportBereicheMitCharakteren"
                :key="'export-' + bereich.id"
                class="form-check form-switch mb-2">
                <input
                  :id="'export-switch-' + bereich.id"
                  class="form-check-input"
                  type="checkbox"
                  role="switch"
                  v-model="exportAuswahl[bereich.id]" />
                <label class="form-check-label" :for="'export-switch-' + bereich.id">
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
