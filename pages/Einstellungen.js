window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};

function htbahFormatBytes(bytes) {
  const n = typeof bytes === 'number' && Number.isFinite(bytes) ? Math.max(0, bytes) : 0;
  if (n === 0) {
    return '0 Bytes';
  }
  const k = 1024;
  const stufen = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(k)), stufen.length - 1);
  const wert = n / k ** i;
  return `${wert.toLocaleString('de-DE', { maximumFractionDigits: i === 0 ? 0 : 2 })} ${stufen[i]}`;
}

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
    buttonLabel: 'Würfelbeutel-Layout & Atmosphäre löschen',
  },
  wuerfelAudioLoeschen: {
    keys: ['htbah_wuerfel_audio', 'htbah_wuerfel_sound'],
    titel: 'Würfel-Audio löschen?',
    beschreibung:
      'Lautstärke und Stummschaltung im Würfelbeutel sowie die ältere Ton-Einstellung werden aus dem lokalen Speicher entfernt.',
    erfolg: 'Würfel-Audio-Einstellungen wurden gelöscht.',
    buttonSymbol: '🔊',
    buttonLabel: 'Würfel-Audio löschen',
  },
  spielleiter: {
    key: 'htbah_spielleiter_gruppen',
    titel: 'Spielleiter-Gruppen löschen?',
    beschreibung:
      'Alle gespeicherten Gruppen und Charaktere in der Spielleiter-Ansicht werden entfernt.',
    erfolg: 'Spielleiter-Gruppen wurden gelöscht.',
    buttonSymbol: '👥',
    buttonLabel: 'Spielleiter-Gruppen löschen',
  },
  alles: {
    keys: [
      'htbah_characters',
      'htbah_active_character_id',
      'htbah_character',
      'htbah_character_image',
      'htbah_presets',
      'htbah_theme',
      'htbah_spielleiter_gruppen',
      'htbah_zufallstabellen',
      'htbah_spielleitung_abenteuerbuch',
      'htbah_weltenbau',
      'htbah_app_rolle',
      'htbah_wuerfel_audio',
      'htbah_wuerfel_sound',
      'htbah_atmosphaere',
      'htbah_atmosphaere_badge_pos',
      'htbah_dice_colors',
      'htbah_wuerfel_beutel_fenster',
    ],
    titel: 'Alle lokalen Daten löschen?',
    beschreibung:
      'Es werden Charakterdaten, Charakterbild, gespeicherte Fähigkeiten-Presets, Spielleiter-Gruppen, Zufallstabellen, das Abenteuerbuch der Spielleitung, unter „Weltenbau“ gespeicherte Bilder, die gewählte Rolle (Charakter/Spielleitung), deine Theme-Auswahl, die Würfel-Audio-Einstellungen, die Atmosphäre im Würfelbeutel, 3D-Würfel-Farben sowie Größe und Position des Würfelbeutel-Fensters entfernt. Die App entspricht danach einem frischen Start.',
    erfolg: 'Alle gespeicherten Daten wurden gelöscht.',
    buttonSymbol: '🗑️',
    buttonLabel: 'Alles löschen',
  },
};

const DATEN_EXPORT_BEREICHE = [
  {
    id: 'appRolle',
    key: 'htbah_app_rolle',
    label: 'App-Rolle (Spieler/Spielleitung)',
  },
  {
    id: 'aktiverCharakter',
    key: 'htbah_active_character_id',
    label: 'Aktiver Charakter',
  },
  {
    id: 'presets',
    key: 'htbah_presets',
    label: 'Fähigkeiten-Presets',
  },
  {
    id: 'spielleiter',
    key: 'htbah_spielleiter_gruppen',
    label: 'Spielleiter-Gruppen',
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
    id: 'wuerfelAudio',
    key: 'htbah_wuerfel_audio',
    label: 'Würfelbeutel-Audio (Lautstärke, Stumm)',
  },
  {
    id: 'wuerfelSoundLegacy',
    key: 'htbah_wuerfel_sound',
    label: 'Würfelton (ältere Einstellung, Migration)',
  },
  {
    id: 'atmosphaere',
    key: 'htbah_atmosphaere',
    label: 'Atmosphäre (Würfelbeutel)',
  },
  {
    id: 'atmosphaereBadge',
    key: 'htbah_atmosphaere_badge_pos',
    label: 'Atmosphären-Badge-Position',
  },
  {
    id: 'diceColors',
    key: 'htbah_dice_colors',
    label: '3D-Würfel (Aktivierung & Farbe)',
  },
  {
    id: 'wuerfelBeutelFenster',
    key: 'htbah_wuerfel_beutel_fenster',
    label: 'Würfelbeutel-Fenster (Größe & Position)',
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
      return htbahFormatBytes(typeof u === 'number' && Number.isFinite(u) ? u : 0);
    },
    browserSpeicherQuotaText() {
      const b = this.browserSpeicher;
      if (!b || !this.browserSpeicherQuotaEndlich) {
        return '';
      }
      return htbahFormatBytes(b.quota);
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
      const basis = this.datenExportBereiche.filter((bereich) => bereich.id !== 'aktiverCharakter');
      const charakterBereiche = this.charakterEintraege.map((eintrag) => ({
        id: `charakter:${eintrag.id}`,
        key: `htbah_character_entry:${eintrag.id}`,
        label: `Charakter: ${this.charakterName(eintrag)}`,
      }));
      const aktiveInfo = {
        id: 'aktiverCharakter',
        key: 'htbah_active_character_id',
        label: 'Aktiver Charakter',
      };
      return [...charakterBereiche, aktiveInfo, ...basis];
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
      this.statusAnzeigen(`„${name}“ wurde gelöscht.`);
    },
    themeUmschalten() {
      const neuesTheme = this.istHellesTheme ? 'light' : 'dark';
      window.HTBAH.setzeTheme(neuesTheme);
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

      if (Array.isArray(bereich.keys)) {
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
      this.$nextTick(() => {
        const el = this.$refs[modalRefName];
        if (!el || !window.bootstrap) {
          return;
        }
        this[instanzName] = window.bootstrap.Modal.getOrCreateInstance(el);
        this[instanzName].show();
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
      const importBereiche = roh.daten
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

      ausgewaehlteBereiche.forEach((bereich) => {
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
      });
      window.HTBAH.migriereLegacyCharakterSpeicherWennNoetig();

      if (ausgewaehlteBereiche.some((b) => b.key === 'htbah_theme')) {
        window.HTBAH.setzeTheme(window.HTBAH.ladeTheme());
        this.istHellesTheme = window.HTBAH.ladeTheme() === 'light';
      }
      if (this.importModalInstanz) {
        this.importModalInstanz.hide();
      }
      this.statusAnzeigen('Import abgeschlossen. Ausgewählte Speicherbereiche wurden übernommen.');
      this.speicherSchaetzungLaden();
    },
  },
  mounted() {
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
            <button
              v-for="eintrag in charakterEintraege"
              :key="'del-char-' + eintrag.id"
              type="button"
              class="btn btn-outline-danger btn-sm text-start"
              @click="loescheEinzelCharakter(eintrag)">
              {{ charakterName(eintrag) }} löschen
            </button>
          </div>
        </div>
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
            :symbol="speicherBereiche.wuerfelAudioLoeschen.buttonSymbol"
            @click="oeffneLoeschDialog('wuerfelAudioLoeschen')">
            {{ speicherBereiche.wuerfelAudioLoeschen.buttonLabel }}
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
            :symbol="speicherBereiche.wuerfelAudioLoeschen.buttonSymbol"
            @click="oeffneLoeschDialog('wuerfelAudioLoeschen')">
            {{ speicherBereiche.wuerfelAudioLoeschen.buttonLabel }}
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
