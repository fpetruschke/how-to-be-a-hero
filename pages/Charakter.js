window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};

const KATEGORIE_INFOS = {
  handeln: {
    erklaerung:
      'Handeln umfasst körperliche, praktische und unmittelbare Aktionen in der Spielwelt.',
    beispiele: ['Klettern', 'Schleichen', 'Kampf', 'Schlösser knacken', 'Fahren'],
  },
  wissen: {
    erklaerung:
      'Wissen umfasst gelerntes, logisches und analytisches Können rund um Fakten und Zusammenhänge.',
    beispiele: ['Heilkunde', 'Geschichte', 'Magiekunde', 'Sprachen', 'Technik'],
  },
  soziales: {
    erklaerung:
      'Soziales umfasst alle Fähigkeiten im Umgang mit anderen Personen, Gruppen und Beziehungen.',
    beispiele: ['Überreden', 'Lügen', 'Menschenkenntnis', 'Verhandeln', 'Auftreten'],
  },
};

/** Kurzinfo zu Regelwerk 2.3 (Anzeige in der Oberfläche) */
const GEISTESBLITZ_INFO_ZEILEN = [
  'Maximalwert pro Begabung: Begabungswert geteilt durch 10, kaufmännisch runden (wie im Regelwerk).',
  'Nur für dieselbe Begabung: Ein Punkt aus „Wissen“ gilt nicht für eine Handeln-Probe (und umgekehrt).',
  'Einsatz am Tisch: noch einmal würfeln, wenn die erste Probe misslungen ist — nicht bei kritischem Misserfolg.',
  'Verbrauchte Punkte bleiben weg, bis du die Konten wieder auffüllst (z. B. nach Abenteuerende).',
  'Gültigkeit: ein Abend bzw. ein Abenteuer; ungenutzte Punkte sind nicht übertragbar; neues Abenteuer startet mit vollem Konto. Wird ein Abenteuer auf mehrere Abende verteilt, regenerieren die Punkte bis zum nächsten Abend.',
];

const M = window.HTBAH_CHARAKTER_MODEL;

/** Fähigkeiten-Preset-JSON (Export aus Fähigkeiten-Presets / Editor) für Fähigkeiten übernehmen */
function normalisiereFaehigkeitenPreset(roh) {
  if (!roh || typeof roh !== 'object') return null;
  const kategorien = ['handeln', 'wissen', 'soziales'];
  const out = { name: typeof roh.name === 'string' ? roh.name.trim() : '' };
  for (const k of kategorien) {
    if (!Array.isArray(roh[k])) return null;
    const arr = [];
    for (const eintrag of roh[k]) {
      if (!eintrag || typeof eintrag !== 'object') continue;
      const name = typeof eintrag.name === 'string' ? eintrag.name.trim() : '';
      if (!name) continue;
      const rohWert = eintrag.value;
      if (rohWert === null || rohWert === undefined || rohWert === '') {
        arr.push({ name, value: null });
        continue;
      }
      const value = Number(rohWert);
      if (Number.isNaN(value) || value < 1 || value > 100) continue;
      arr.push({ name, value });
    }
    out[k] = arr;
  }
  return out;
}

window.HTBAH_SEITEN.Charakter = {
  components: {
    CharakterBildModal: window.HTBAH_KOMPONENTEN.CharakterBildModal,
    InventarModal: window.HTBAH_KOMPONENTEN.InventarModal,
    VorNachteileModal: window.HTBAH_KOMPONENTEN.VorNachteileModal,
    NotizenModal: window.HTBAH_KOMPONENTEN.NotizenModal,
    FaehigkeitFormular: window.HTBAH_KOMPONENTEN.FaehigkeitFormular,
    InitiativeModal: window.HTBAH_KOMPONENTEN.InitiativeModal,
    ProbeWurfModal: window.HTBAH_KOMPONENTEN.ProbeWurfModal,
    CharakterPdfModal: window.HTBAH_KOMPONENTEN.CharakterPdfModal,
  },
  props: {
    spielleiterMitglied: { type: Object, default: null },
    onSpielleiterPersist: { type: Function, default: null },
  },
  data() {
    return {
      presets: window.HTBAH.ladePresets(),
      ausgewaehltesPreset: '',
      charakterLokal: M.charakterMitDefaults(M.leererCharakter()),
      charakterBildLokal: '',
      charakterId: null,
      aktiveInfo: null,
      aktiveKategorieInfo: null,
      zeigePresetAktionen: true,
      neueFaehigkeit: { name: '', value: 0, type: 'handeln' },
      bearbeitungEntwurf: { name: '', value: 0, type: 'handeln' },
      bearbeitungReferenz: null,
      bearbeitungKategorie: '',
      geistesblitzAusgebenModus: false,
      aktiveGeistesblitzInfo: null,
      _prevLpSnapshot: null,
      _lpEingabeAktiv: false,
      _lpSnapshotVorEingabe: null,
      _lpAenderungWaehrenEingabe: false,
      pdfExportLaedt: false,
      pdfExportStil: 'fantasy-mittelalter',
      charakterPdfModalOffen: false,
      charakterPdfBlobUrl: null,
      charakterPdfDateiname: '',
      importKandidaten: [],
      importAuswahlIndex: '',
      importDateiname: '',
      importAuswahlModalInstanz: null,
      importHinweis: '',
      fraktionInfoOffen: false,
      autosaveHinweis: '',
      autosaveTimeoutId: null,
      autosaveWartezeitMs: 900,
      _autosaveSnapshot: '',
      _autosaveInitialisiert: false,
      _autosaveTemporarAussetzen: false,
    };
  },
  computed: {
    summen() {
      const sum = (liste) =>
        liste.reduce((summe, eintrag) => summe + (Number(eintrag.value) || 0), 0);
      return {
        handeln: sum(this.charakter.handeln),
        wissen: sum(this.charakter.wissen),
        soziales: sum(this.charakter.soziales),
      };
    },
    begabungen() {
      return {
        handeln: Math.round(this.summen.handeln / 10),
        wissen: Math.round(this.summen.wissen / 10),
        soziales: Math.round(this.summen.soziales / 10),
      };
    },
    /** Maximal pro Begabung: Begabungswert / 10, kaufmännisch (Regelwerk 2.3 / 3.x) */
    geistesblitzWerte() {
      return {
        handeln: Math.round(this.begabungen.handeln / 10),
        wissen: Math.round(this.begabungen.wissen / 10),
        soziales: Math.round(this.begabungen.soziales / 10),
      };
    },
    punkte() {
      return this.summen.handeln + this.summen.wissen + this.summen.soziales;
    },
    kategorieInfos() {
      return KATEGORIE_INFOS;
    },
    geistesblitzInfoZeilen() {
      return GEISTESBLITZ_INFO_ZEILEN;
    },
    charakter() {
      return this.spielleiterMitglied ? this.spielleiterMitglied.charakter : this.charakterLokal;
    },
    /** Namen aus der Pantheon-Tabelle (Zufallstabellen) für das Glaube-Feld */
    pantheonGlaubeNamen() {
      try {
        const z = window.HTBAH.ladeZufallstabellenZustand();
        const p = (z && z.pantheon) || [];
        return p
          .map((row) => (row && row.name ? String(row.name).trim() : ''))
          .filter(Boolean);
      } catch {
        return [];
      }
    },
    charakterBild() {
      return this.spielleiterMitglied
        ? this.spielleiterMitglied.charakterBild
        : this.charakterBildLokal;
    },
    istNeuModus() {
      return !this.spielleiterMitglied && this.charakterId === null;
    },
    istEditModus() {
      return !this.spielleiterMitglied && this.charakterId !== null;
    },
    speicherButtonText() {
      return this.istEditModus ? 'Änderungen speichern' : 'Charakter speichern';
    },
    aktiveCharakterTab() {
      const pfad = this.$route && this.$route.path ? this.$route.path : '';
      if (pfad.endsWith('/aktives-spiel')) {
        return 'spiel';
      }
      if (pfad.endsWith('/nachbereitung')) {
        return 'verwaltung';
      }
      return 'setup';
    },
    istSetupTabAktiv() {
      return !this.istEditModus || this.aktiveCharakterTab === 'setup';
    },
    istSpielTabAktiv() {
      return !this.istEditModus || this.aktiveCharakterTab === 'spiel';
    },
    istVerwaltungTabAktiv() {
      return !this.istEditModus || this.aktiveCharakterTab === 'verwaltung';
    },
    importAuswahlHatMehrere() {
      return this.importKandidaten.length > 1;
    },
    kannImportAuswahlUebernehmen() {
      if (!this.importAuswahlHatMehrere) {
        return this.importKandidaten.length === 1;
      }
      return this.importAuswahlIndex !== '';
    },
    charakterLebenspunkteStatus() {
      const berechne =
        window.HTBAH && typeof window.HTBAH.berechneLebenspunkteStatus === 'function'
          ? window.HTBAH.berechneLebenspunkteStatus
          : null;
      if (!berechne) {
        return { tot: false, bewusstlos: false };
      }
      return berechne(this.charakter);
    },
    charakterZustandEmoji() {
      if (this.charakterLebenspunkteStatus.tot) {
        return '💀';
      }
      if (this.charakterLebenspunkteStatus.bewusstlos) {
        return '😵';
      }
      return '';
    },
    charakterZustandLabel() {
      if (this.charakterLebenspunkteStatus.tot) {
        return 'Charakter ist tot';
      }
      if (this.charakterLebenspunkteStatus.bewusstlos) {
        return 'Charakter ist bewusstlos';
      }
      return '';
    },
  },
  created() {
    this.initialisiereCharakterAusRoute();
    this.initialisiereGeistesblitzVerbleibend();
    this._prevGeistesblitzMax = { ...this.geistesblitzWerte };
    this._prevLpSnapshot = this.normalisiereLp(this.charakter.lebenspunkte);
    this.charakter.lpStatusTot = this._prevLpSnapshot === 0;
    window.HTBAH.syncLebenspunkteStatusFromCharakter(this.charakter);
  },
  mounted() {
    this.aktualisiereAktivenCharakterKontext();
  },
  beforeUnmount() {
    if (window.HTBAH._aktiverCharakterKontextQuelle === this) {
      window.HTBAH._aktiverCharakterKontext = null;
      window.HTBAH._aktiverCharakterKontextQuelle = null;
    }
    if (this.charakterPdfBlobUrl) {
      URL.revokeObjectURL(this.charakterPdfBlobUrl);
    }
    if (this.autosaveTimeoutId) {
      window.clearTimeout(this.autosaveTimeoutId);
      this.autosaveTimeoutId = null;
    }
  },
  watch: {
    '$route.fullPath'() {
      if (!this.spielleiterMitglied) {
        this.initialisiereCharakterAusRoute();
      }
      this.zeigePresetAktionen = !this.spielleiterMitglied && this.istSetupTabAktiv;
    },
    charakter: {
      deep: true,
      handler() {
        const lp = this.normalisiereLp(this.charakter.lebenspunkte);
        if (lp !== this._prevLpSnapshot) {
          if (this._lpEingabeAktiv) {
            this._lpAenderungWaehrenEingabe = true;
          } else {
            this.verarbeiteLebenspunkteAenderung(this._prevLpSnapshot, lp);
            this._prevLpSnapshot = this.normalisiereLp(this.charakter.lebenspunkte);
          }
        }
        if (this.spielleiterMitglied) {
          this.onSpielleiterPersist?.();
        }
        if (!this.spielleiterMitglied && this.istEditModus) {
          this.autosaveEinplanen();
        }
        if (!this._lpEingabeAktiv) {
          window.HTBAH.syncLebenspunkteStatusFromCharakter(this.charakter);
        }
      },
    },
    geistesblitzWerte: {
      deep: true,
      handler(neu) {
        const alt = this._prevGeistesblitzMax;
        const v = this.charakter.geistesblitzVerbleibend;
        if (!alt || !v) {
          this._prevGeistesblitzMax = { ...neu };
          return;
        }
        for (const k of ['handeln', 'wissen', 'soziales']) {
          const delta = neu[k] - alt[k];
          if (delta !== 0) {
            const r = v[k] + delta;
            v[k] = Math.max(0, Math.min(r, neu[k]));
          }
        }
        this._prevGeistesblitzMax = { ...neu };
      },
    },
    charakterId() {
      if (!this.spielleiterMitglied) {
        this.aktualisiereAktivenCharakterKontext();
      }
    },
  },
  methods: {
    hatMindestensEineFaehigkeit(charakter) {
      const c = charakter && typeof charakter === 'object' ? charakter : {};
      return ['handeln', 'wissen', 'soziales'].some((kategorie) => {
        const liste = Array.isArray(c[kategorie]) ? c[kategorie] : [];
        return liste.some((eintrag) => {
          if (!eintrag || typeof eintrag !== 'object') {
            return false;
          }
          const name = typeof eintrag.name === 'string' ? eintrag.name.trim() : '';
          const wert = Number(eintrag.value);
          return !!name || Number.isFinite(wert);
        });
      });
    },
    hatImportierteSicherheitsmechanismen(charakter) {
      const sicher = charakter && charakter.sicherheitsmechanismen && typeof charakter.sicherheitsmechanismen === 'object'
        ? charakter.sicherheitsmechanismen
        : {};
      const tabu = typeof sicher.tabuHtml === 'string' ? sicher.tabuHtml.replace(/<[^>]*>/g, '').trim() : '';
      const schleier =
        typeof sicher.schleierHtml === 'string' ? sicher.schleierHtml.replace(/<[^>]*>/g, '').trim() : '';
      const emoji = typeof sicher.buttonEmoji === 'string' ? sicher.buttonEmoji.trim() : '';
      return !!tabu || !!schleier || (emoji && emoji !== '🚩');
    },
    hatMindestensEinAusgefuelltesCharakterfeld(charakter) {
      const c = charakter && typeof charakter === 'object' ? charakter : {};
      const textFelder = [
        'name',
        'geschlecht',
        'initiative',
        'aufenthaltsort',
        'fraktion',
        'statur',
        'glaube',
        'beruf',
        'familienstand',
      ];
      if (textFelder.some((feld) => typeof c[feld] === 'string' && c[feld].trim())) {
        return true;
      }
      if (Number.isFinite(Number(c.alter)) && c.alter !== null && c.alter !== '') {
        return true;
      }
      if (Array.isArray(c.fraktionen) && c.fraktionen.some((eintrag) => typeof eintrag === 'string' && eintrag.trim())) {
        return true;
      }
      return false;
    },
    sollMitAktivemSpielStarten(charakter) {
      const hatBasisdaten = this.hatMindestensEinAusgefuelltesCharakterfeld(charakter);
      if (!hatBasisdaten) {
        return false;
      }
      return this.hatImportierteSicherheitsmechanismen(charakter) || this.hatMindestensEineFaehigkeit(charakter);
    },
    initialisiereCharakterAusRoute() {
      if (this.spielleiterMitglied) {
        return;
      }
      this._autosaveTemporarAussetzen = true;
      this.autosaveHinweis = '';
      if (this.autosaveTimeoutId) {
        window.clearTimeout(this.autosaveTimeoutId);
        this.autosaveTimeoutId = null;
      }
      const pfad = this.$route.path || '';
      if (pfad.startsWith('/charakter/neu')) {
        this.charakterId = null;
        this.charakterLokal = M.charakterMitDefaults(M.leererCharakter());
        this.charakterBildLokal = '';
        this.zeigePresetAktionen = true;
        this.initialisiereGeistesblitzVerbleibend();
        this._prevGeistesblitzMax = { ...this.geistesblitzWerte };
        this._prevLpSnapshot = this.normalisiereLp(this.charakterLokal.lebenspunkte);
        window.HTBAH.syncLebenspunkteStatusFromCharakter(this.charakterLokal);
        this.autosaveSnapshotAktualisieren();
        this._autosaveTemporarAussetzen = false;
        return;
      }
      const routeId = this.$route.params && typeof this.$route.params.id === 'string'
        ? this.$route.params.id
        : '';
      if (!routeId || routeId === 'neu') {
        this._autosaveTemporarAussetzen = false;
        this.$router.replace('/charakter/neu/session-zero');
        return;
      }
      const eintrag = window.HTBAH.ladeCharakterEintrag(routeId);
      if (!eintrag) {
        this._autosaveTemporarAussetzen = false;
        this.$router.replace('/charakter/neu/session-zero');
        return;
      }
      this.charakterId = eintrag.id;
      this.charakterLokal = M.charakterMitDefaults(eintrag.charakter);
      this.charakterBildLokal = eintrag.charakterBild || '';
      this.zeigePresetAktionen = pfad.endsWith('/session-zero');
      window.HTBAH.setzeAktivenCharakterId(eintrag.id);
      this.initialisiereGeistesblitzVerbleibend();
      this._prevGeistesblitzMax = { ...this.geistesblitzWerte };
      this._prevLpSnapshot = this.normalisiereLp(this.charakterLokal.lebenspunkte);
      window.HTBAH.syncLebenspunkteStatusFromCharakter(this.charakterLokal);
      this.autosaveSnapshotAktualisieren();
      this._autosaveTemporarAussetzen = false;
      if (pfad.endsWith('/session-zero') && this.sollMitAktivemSpielStarten(this.charakterLokal)) {
        this.$router.replace(`/charakter/${eintrag.id}/aktives-spiel`);
      }
    },
    wechsleCharakterTab(tab) {
      const map = {
        setup: 'session-zero',
        spiel: 'aktives-spiel',
        verwaltung: 'nachbereitung',
      };
      const suffix = map[tab] || 'session-zero';
      const basis = this.istNeuModus ? '/charakter/neu' : `/charakter/${this.charakterId}`;
      const ziel = `${basis}/${suffix}`;
      if (ziel !== this.$route.path) {
        this.$router.push(ziel);
      }
    },
    autosaveSnapshotAktualisieren() {
      this._autosaveSnapshot = JSON.stringify({
        charakter: this.charakterLokal,
        charakterBild: this.charakterBildLokal,
      });
      this._autosaveInitialisiert = true;
    },
    autosaveEinplanen() {
      if (
        this.spielleiterMitglied ||
        !this.istEditModus ||
        !this.charakterId ||
        this._autosaveTemporarAussetzen
      ) {
        return;
      }
      if (!this._autosaveInitialisiert) {
        this.autosaveSnapshotAktualisieren();
      }
      if (this.autosaveTimeoutId) {
        window.clearTimeout(this.autosaveTimeoutId);
      }
      this.autosaveTimeoutId = window.setTimeout(() => {
        this.autosaveAusfuehren();
      }, this.autosaveWartezeitMs);
    },
    autosaveAusfuehren() {
      this.autosaveTimeoutId = null;
      if (
        this.spielleiterMitglied ||
        !this.istEditModus ||
        !this.charakterId ||
        this._autosaveTemporarAussetzen
      ) {
        return;
      }
      const snapshot = JSON.stringify({
        charakter: this.charakterLokal,
        charakterBild: this.charakterBildLokal,
      });
      if (snapshot === this._autosaveSnapshot) {
        return;
      }
      const gespeichert = window.HTBAH.speichereCharakterEintrag({
        id: this.charakterId,
        charakter: this.charakterLokal,
        charakterBild: this.charakterBildLokal,
      });
      this.charakterId = gespeichert.id;
      window.HTBAH.setzeAktivenCharakterId(gespeichert.id);
      this._autosaveSnapshot = snapshot;
      this.autosaveHinweis = `Automatisch gespeichert (${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })})`;
    },
    aktualisiereAktivenCharakterKontext() {
      if (this.spielleiterMitglied) {
        window.HTBAH._aktiverCharakterKontext = {
          typ: 'spielleiter',
          getCharakter: () => this.charakter,
          speichern: () => this.onSpielleiterPersist?.(),
        };
        window.HTBAH._aktiverCharakterKontextQuelle = this;
        return;
      }
      window.HTBAH._aktiverCharakterKontext = {
        typ: 'charakter',
        charakterId: this.charakterId,
        getCharakter: () => this.charakter,
        speichern: () => {
          if (this.charakterId) {
            window.HTBAH.speichereCharakterEintrag({
              id: this.charakterId,
              charakter: this.charakter,
              charakterBild: this.charakterBild,
            });
          }
        },
      };
      window.HTBAH._aktiverCharakterKontextQuelle = this;
    },
    speichereCharakterFormular() {
      if (this.spielleiterMitglied) {
        this.onSpielleiterPersist?.();
        return;
      }
      const warEditModus = this.istEditModus;
      const gespeichert = window.HTBAH.speichereCharakterEintrag({
        id: this.charakterId,
        charakter: this.charakter,
        charakterBild: this.charakterBild,
      });
      this.charakterId = gespeichert.id;
      window.HTBAH.setzeAktivenCharakterId(gespeichert.id);
      this.autosaveSnapshotAktualisieren();
      const nachSpeichern = () => {
        this.importHinweis = warEditModus ? 'Änderungen gespeichert.' : 'Charakter gespeichert.';
        if (!warEditModus) {
          this.$nextTick(() => {
            window.requestAnimationFrame(() => {
              window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            });
          });
        }
      };
      const nav = this.$router.replace(`/charakter/${gespeichert.id}/session-zero`);
      if (nav && typeof nav.then === 'function') {
        nav.then(nachSpeichern).catch(nachSpeichern);
      } else {
        nachSpeichern();
      }
    },
    importDateiAusgewaehlt(event) {
      const input = event && event.target ? event.target : null;
      const datei = input && input.files ? input.files[0] : null;
      if (!datei) {
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const json = JSON.parse(String(reader.result || ''));
          const kandidaten = window.HTBAH.parseCharakterImportKandidaten(json);
          if (!kandidaten.length) {
            await window.HTBAH.ui.alert({
              titel: 'Import nicht möglich',
              beschreibung: 'Die Datei enthält keinen importierbaren Charakter.',
            });
            return;
          }
          this.importDateiname = datei.name || 'Import-Datei';
          this.importKandidaten = kandidaten;
          this.importAuswahlIndex = kandidaten.length > 1 ? '' : '0';
          if (kandidaten.length === 1) {
            this.importAuswahlUebernehmen();
          } else {
            this.oeffneImportAuswahlModal();
          }
        } catch {
          await window.HTBAH.ui.alert({
            titel: 'Ungültige Datei',
            beschreibung: 'Datei konnte nicht gelesen werden (kein gültiges JSON).',
          });
        } finally {
          input.value = '';
        }
      };
      reader.onerror = async () => {
        await window.HTBAH.ui.alert({
          titel: 'Import fehlgeschlagen',
          beschreibung: 'Datei konnte nicht gelesen werden.',
        });
        input.value = '';
      };
      reader.readAsText(datei);
    },
    importAuswahlText(kandidat, index) {
      const name = kandidat && kandidat.charakter && typeof kandidat.charakter.name === 'string'
        ? kandidat.charakter.name.trim()
        : '';
      const titel = name || `Charakter ${index + 1}`;
      return `${titel} (${kandidat.quelle || 'Import'})`;
    },
    oeffneImportAuswahlModal() {
      this.$nextTick(() => {
        const el = this.$refs.importAuswahlModalElement;
        if (!el || !window.bootstrap) {
          return;
        }
        this.importAuswahlModalInstanz = window.bootstrap.Modal.getOrCreateInstance(el);
        this.importAuswahlModalInstanz.show();
      });
    },
    importAuswahlUebernehmen() {
      if (!this.importKandidaten.length) {
        return;
      }
      const index = this.importAuswahlHatMehrere ? Number(this.importAuswahlIndex) : 0;
      const kandidat = this.importKandidaten[index];
      if (!kandidat) {
        return;
      }
      this.charakterLokal = M.charakterMitDefaults(kandidat.charakter);
      this.charakterBildLokal = typeof kandidat.charakterBild === 'string' ? kandidat.charakterBild : '';
      this.charakterId = null;
      this.initialisiereGeistesblitzVerbleibend();
      this._prevGeistesblitzMax = { ...this.geistesblitzWerte };
      this._prevLpSnapshot = this.normalisiereLp(this.charakterLokal.lebenspunkte);
      window.HTBAH.syncLebenspunkteStatusFromCharakter(this.charakterLokal);
      this.importHinweis =
        this.importKandidaten.length > 1
          ? 'Charakter aus Auswahl übernommen. Zum Abschließen speichern.'
          : 'Charakter importiert. Zum Abschließen speichern.';
      if (this.importAuswahlModalInstanz) {
        this.importAuswahlModalInstanz.hide();
      }
      this.importKandidaten = [];
      this.importAuswahlIndex = '';
    },
    pantheonImportDialogOeffnen() {
      this.$refs.pantheonImportInput?.click();
    },
    async pantheonDateiAusgewaehlt(event) {
      const input = event && event.target ? event.target : null;
      const datei = input && input.files ? input.files[0] : null;
      if (!datei) {
        return;
      }
      let text = '';
      try {
        text = await datei.text();
      } catch {
        await window.HTBAH.ui.alert({
          titel: 'Import fehlgeschlagen',
          beschreibung: 'Die Datei konnte nicht gelesen werden.',
        });
        if (input) input.value = '';
        return;
      }
      let roh;
      try {
        roh = JSON.parse(text);
      } catch {
        await window.HTBAH.ui.alert({
          titel: 'Ungültige Datei',
          beschreibung: 'Kein gültiges JSON.',
        });
        if (input) input.value = '';
        return;
      }
      const ergebnis = window.HTBAH.pantheonImportAusPaket(roh);
      if (!ergebnis.ok) {
        await window.HTBAH.ui.alert({
          titel: 'Import fehlgeschlagen',
          beschreibung: ergebnis.fehler,
        });
        if (input) input.value = '';
        return;
      }
      const bestaetigt = await window.HTBAH.ui.confirm({
        titel: 'Pantheon ersetzen?',
        beschreibung:
          'Das Pantheon wird vollständig durch die Importdatei ersetzt. Fortfahren?',
        bestaetigenText: 'Ersetzen',
        bestaetigenButtonClass: 'btn-danger',
        warnhinweisAnzeigen: true,
      });
      if (!bestaetigt) {
        if (input) input.value = '';
        return;
      }
      const zustand = window.HTBAH.ladeZufallstabellenZustand();
      zustand.pantheon = ergebnis.pantheon;
      window.HTBAH.speichereZufallstabellenZustand(zustand);
      this.importHinweis = 'Pantheon importiert. Die Glaube-Auswahl wurde aktualisiert.';
      if (input) input.value = '';
    },
    normalisiereLp(roh) {
      const n = Math.round(Number(roh));
      if (Number.isNaN(n) || n < 0) {
        return 0;
      }
      return n;
    },
    lebenspunkteEingabeFokus() {
      this._lpEingabeAktiv = true;
      this._lpAenderungWaehrenEingabe = false;
      this._lpSnapshotVorEingabe = this._prevLpSnapshot;
    },
    lebenspunkteEingabeBlur() {
      if (!this._lpEingabeAktiv) {
        return;
      }
      this._lpEingabeAktiv = false;
      this.finalisiereLebenspunkteEingabe();
    },
    finalisiereLebenspunkteEingabe() {
      const lpFinal = this.normalisiereLp(this.charakter.lebenspunkte);
      if (lpFinal !== this.charakter.lebenspunkte) {
        this.charakter.lebenspunkte = lpFinal;
      }

      const hatteLpAenderung = this._lpAenderungWaehrenEingabe || lpFinal !== this._prevLpSnapshot;
      if (hatteLpAenderung) {
        const vorher =
          this._lpAenderungWaehrenEingabe && this._lpSnapshotVorEingabe != null
            ? this.normalisiereLp(this._lpSnapshotVorEingabe)
            : this._prevLpSnapshot;
        this.verarbeiteLebenspunkteAenderung(vorher, lpFinal);
        this._prevLpSnapshot = this.normalisiereLp(this.charakter.lebenspunkte);
      }

      this._lpSnapshotVorEingabe = null;
      this._lpAenderungWaehrenEingabe = false;
      window.HTBAH.syncLebenspunkteStatusFromCharakter(this.charakter);
    },
    verarbeiteLebenspunkteAenderung(vorher, nach) {
      let n = this.normalisiereLp(nach);
      const v = this.normalisiereLp(vorher);

      if (n !== this.charakter.lebenspunkte) {
        this.charakter.lebenspunkte = n;
      }

      if (n === 0) {
        this.charakter.lpStatusTot = true;
        return;
      }

      this.charakter.lpStatusTot = false;

      const verlust = v - n;
      if (verlust >= 60) {
        this.charakter.lpMassenschadenBewusstlos = true;
      }

      if (v > 10 && n >= 1 && n <= 10) {
        this.charakter.lpBewusstlosAusgeblendet = false;
      }
      if (verlust >= 60) {
        this.charakter.lpBewusstlosAusgeblendet = false;
      }
      if (n < v && n >= 1 && n <= 10 && v >= 1 && v <= 10) {
        this.charakter.lpBewusstlosAusgeblendet = false;
      }
    },
    initialisiereGeistesblitzVerbleibend() {
      const m = this.geistesblitzWerte;
      let v = this.charakter.geistesblitzVerbleibend;
      if (!v) {
        this.charakter.geistesblitzVerbleibend = {
          handeln: m.handeln,
          wissen: m.wissen,
          soziales: m.soziales,
        };
        return;
      }
      for (const k of ['handeln', 'wissen', 'soziales']) {
        v[k] = Math.max(0, Math.min(v[k], m[k]));
      }
    },
    geistesblitzInfoUmschalten(kategorie) {
      this.aktiveGeistesblitzInfo =
        this.aktiveGeistesblitzInfo === kategorie ? null : kategorie;
    },
    geistesblitzAusgebenModusUmschalten() {
      this.geistesblitzAusgebenModus = !this.geistesblitzAusgebenModus;
    },
    geistesblitzPunktAusgeben(kategorie) {
      if (!this.geistesblitzAusgebenModus) return;
      const v = this.charakter.geistesblitzVerbleibend;
      const max = this.geistesblitzWerte[kategorie];
      if (!v || v[kategorie] <= 0) return;
      v[kategorie] = Math.max(0, Math.min(v[kategorie] - 1, max));
    },
    async geistesblitzKontenAuffuellen() {
      const bestaetigt = await window.HTBAH.ui.confirm({
        titel: 'Geistesblitz auffüllen?',
        beschreibung:
          'Alle Geistesblitzkonten auf den aktuellen Maximalwert setzen? (Typisch nach Abenteuerende / neuem Abenteuer.)',
        bestaetigenText: 'Auffüllen',
        bestaetigenButtonClass: 'btn-warning',
        warnhinweisAnzeigen: false,
      });
      if (!bestaetigt) {
        return;
      }
      const m = this.geistesblitzWerte;
      this.charakter.geistesblitzVerbleibend = {
        handeln: m.handeln,
        wissen: m.wissen,
        soziales: m.soziales,
      };
      this._prevGeistesblitzMax = { ...m };
    },
    faehigkeitenPresetAufCharakterAnwenden(preset) {
      this.charakter.handeln = JSON.parse(JSON.stringify(preset.handeln));
      this.charakter.wissen = JSON.parse(JSON.stringify(preset.wissen));
      this.charakter.soziales = JSON.parse(JSON.stringify(preset.soziales));
    },
    async presetAnwenden() {
      const preset = this.presets.find((eintrag) => eintrag.name === this.ausgewaehltesPreset);
      if (!preset) return;

      const bestaetigt = await window.HTBAH.ui.confirm({
        titel: 'Fähigkeiten ersetzen?',
        beschreibung: 'Nur die Fähigkeiten (Handeln, Wissen, Soziales) werden ersetzt. Alle anderen Charakterdaten bleiben erhalten.',
        bestaetigenText: 'Fähigkeiten ersetzen',
        bestaetigenButtonClass: 'btn-danger',
        warnhinweisAnzeigen: false,
      });
      if (!bestaetigt) return;

      this.faehigkeitenPresetAufCharakterAnwenden(preset);
    },
    presetAusDateiAnwenden(event) {
      const input = event.target;
      const datei = input.files && input.files[0];
      if (!datei) return;

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const json = JSON.parse(reader.result);
          const preset = normalisiereFaehigkeitenPreset(json);
          if (!preset) {
            await window.HTBAH.ui.alert({
              titel: 'Ungültiges Preset',
              beschreibung:
                'Ungültige Fähigkeiten-Preset-Datei (erwartet: handeln, wissen, soziales als Listen).',
            });
            return;
          }
          const titel = preset.name ? `„${preset.name}“` : 'dieses Fähigkeiten-Preset';
          const bestaetigt = await window.HTBAH.ui.confirm({
            titel: 'Fähigkeiten ersetzen?',
            beschreibung:
              `Mit ${titel} aus der Datei nur die Fähigkeiten ersetzen? Alle anderen Charakterdaten bleiben erhalten.`,
            bestaetigenText: 'Fähigkeiten ersetzen',
            bestaetigenButtonClass: 'btn-danger',
            warnhinweisAnzeigen: false,
          });
          if (!bestaetigt) {
            return;
          }
          this.faehigkeitenPresetAufCharakterAnwenden(preset);
        } catch {
          await window.HTBAH.ui.alert({
            titel: 'Ungültige Datei',
            beschreibung: 'Datei konnte nicht gelesen werden (kein gültiges JSON).',
          });
        } finally {
          input.value = '';
        }
      };
      reader.onerror = async () => {
        await window.HTBAH.ui.alert({
          titel: 'Import fehlgeschlagen',
          beschreibung: 'Datei konnte nicht gelesen werden.',
        });
        input.value = '';
      };
      reader.readAsText(datei);
    },
    infoUmschalten(kategorie) {
      this.aktiveInfo = this.aktiveInfo === kategorie ? null : kategorie;
    },
    kategorieInfoUmschalten(kategorie) {
      this.aktiveKategorieInfo = this.aktiveKategorieInfo === kategorie ? null : kategorie;
    },
    presetAktionenUmschalten() {
      this.zeigePresetAktionen = !this.zeigePresetAktionen;
    },
    sortierteFaehigkeiten(kategorie) {
      return [...this.charakter[kategorie]].sort((a, b) =>
        a.name.localeCompare(b.name, 'de'),
      );
    },
    bearbeitungModalOeffnen(kategorie, faehigkeit) {
      this.bearbeitungReferenz = faehigkeit;
      this.bearbeitungKategorie = kategorie;
      this.bearbeitungEntwurf = {
        name: faehigkeit.name,
        value: faehigkeit.value,
        type: kategorie,
      };

      this.$nextTick(() => {
        const el = this.$refs.faehigkeitBearbeitenModalElement;
        if (!el || !window.bootstrap) {
          return;
        }

        window.bootstrap.Modal.getOrCreateInstance(el).show();
      });
    },
    bearbeitungModalGeschlossen() {
      this.bearbeitungReferenz = null;
      this.bearbeitungKategorie = '';
    },
    bearbeitungModalSchliessen() {
      const el = this.$refs.faehigkeitBearbeitenModalElement;
      if (el && window.bootstrap) {
        const instanz = window.bootstrap.Modal.getInstance(el);
        if (instanz) {
          instanz.hide();
        }
      }
    },
    async bearbeitungSpeichern() {
      const { name, value, type } = this.bearbeitungEntwurf;
      const ref = this.bearbeitungReferenz;
      const altKat = this.bearbeitungKategorie;

      if (!ref || !altKat) {
        return;
      }

      const nameTrim = typeof name === 'string' ? name.trim() : '';
      if (!nameTrim) {
        await window.HTBAH.ui.alert({
          titel: 'Eingabe unvollständig',
          beschreibung: 'Gib einen Namen an.',
        });
        return;
      }

      const wert = Number(value);

      if (wert <= 0) {
        await window.HTBAH.ui.alert({
          titel: 'Ungültiger Wert',
          beschreibung: 'Wert muss größer als 0 sein.',
        });
        return;
      }

      if (wert > 100) {
        await window.HTBAH.ui.alert({
          titel: 'Ungültiger Wert',
          beschreibung: 'Maximalwert ist 100.',
        });
        return;
      }

      const punkteOhne = this.punkte - ref.value;
      if (punkteOhne + wert > 400) {
        await window.HTBAH.ui.alert({
          titel: 'Zu wenig Punkte',
          beschreibung: 'Du hast nicht genug Punkte übrig.',
        });
        return;
      }

      if (type !== altKat) {
        const idx = this.charakter[altKat].indexOf(ref);
        if (idx !== -1) {
          this.charakter[altKat].splice(idx, 1);
        }

        ref.name = nameTrim;
        ref.value = wert;
        this.charakter[type].push(ref);
      } else {
        ref.name = nameTrim;
        ref.value = wert;
      }

      this.bearbeitungModalSchliessen();
    },
    faehigkeitLoeschenAnfragen(kategorie, faehigkeit) {
      this.$refs.faehigkeitLoeschenModal.oeffnen({
        titel: 'Fähigkeit löschen?',
        beschreibung: `Die Fähigkeit „${faehigkeit.name}“ wird entfernt.`,
        onBestaetigen: () => {
          const index = this.charakter[kategorie].indexOf(faehigkeit);
          if (index !== -1) {
            this.charakter[kategorie].splice(index, 1);
          }
        },
      });
    },
    async faehigkeitHinzufuegen() {
      const nameTrim = String(this.neueFaehigkeit.name || '').trim();
      if (!nameTrim) {
        await window.HTBAH.ui.alert({
          titel: 'Eingabe unvollständig',
          beschreibung: 'Gib einen Namen an.',
        });
        return;
      }

      const wert = Number(this.neueFaehigkeit.value);

      if (wert <= 0) {
        await window.HTBAH.ui.alert({
          titel: 'Ungültiger Wert',
          beschreibung: 'Wert muss größer als 0 sein.',
        });
        return;
      }

      if (wert > 100) {
        await window.HTBAH.ui.alert({
          titel: 'Ungültiger Wert',
          beschreibung: 'Maximalwert ist 100.',
        });
        return;
      }

      if (this.punkte + wert > 400) {
        await window.HTBAH.ui.alert({
          titel: 'Zu wenig Punkte',
          beschreibung: 'Du hast nicht genug Punkte übrig.',
        });
        return;
      }

      this.charakter[this.neueFaehigkeit.type].push({
        name: nameTrim,
        value: wert,
      });

      this.neueFaehigkeit.name = '';
      this.neueFaehigkeit.value = 0;
    },
    bildVerwaltungOeffnen() {
      this.$refs.charakterBildModal.oeffnen();
    },
    setzeCharakterBild(url) {
      const dataUrl = typeof url === 'string' ? url : '';
      if (this.spielleiterMitglied) {
        this.spielleiterMitglied.charakterBild = dataUrl;
      } else {
        this.charakterBildLokal = dataUrl;
      }
      this.onSpielleiterPersist?.();
    },
    charakterJsonExportieren() {
      const paket = window.HTBAH.erstelleCharakterExportPaket(this.charakter, this.charakterBild);
      const rohName = typeof this.charakter.name === 'string' ? this.charakter.name : '';
      const sicher =
        rohName.replace(/[\\/:*?"<>|]+/g, '').trim().slice(0, 64) || 'charakter';
      window.HTBAH.dateiHerunterladenJson(paket, `htbah-charakter-${sicher}.json`);
    },
    async sicherheitsmechanismenImportieren(event) {
      const input = event?.target;
      const datei = input?.files?.[0];
      if (!datei) {
        return;
      }
      try {
        const text = await datei.text();
        const roh = JSON.parse(text);
        const daten = roh?.typ === 'sicherheitsmechanismen' ? roh.sicherheitsmechanismen : roh;
        this.charakter.sicherheitsmechanismen = {
          tabuHtml: typeof daten?.tabuHtml === 'string' ? daten.tabuHtml : '',
          schleierHtml: typeof daten?.schleierHtml === 'string' ? daten.schleierHtml : '',
          buttonEmoji:
            typeof daten?.buttonEmoji === 'string' && daten.buttonEmoji.trim()
              ? daten.buttonEmoji.trim()
              : '🚩',
        };
        this.importHinweis = 'Sicherheitsmechanismen importiert.';
      } catch {
        await window.HTBAH.ui.alert({
          titel: 'Import fehlgeschlagen',
          beschreibung: 'Die Datei enthält keine gültigen Sicherheitsmechanismen.',
        });
      } finally {
        if (input) {
          input.value = '';
        }
      }
    },
    charakterPdfModalSchliessen() {
      this.charakterPdfModalOffen = false;
      if (this.charakterPdfBlobUrl) {
        URL.revokeObjectURL(this.charakterPdfBlobUrl);
        this.charakterPdfBlobUrl = null;
      }
      this.charakterPdfDateiname = '';
    },
    async charakterPdfExportieren() {
      if (this.pdfExportLaedt) {
        return;
      }
      const fn =
        window.HTBAH && typeof window.HTBAH.erzeugeCharakterPdfBlob === 'function'
          ? window.HTBAH.erzeugeCharakterPdfBlob
          : null;
      if (!fn) {
        await window.HTBAH.ui.alert({
          titel: 'PDF-Funktion nicht verfügbar',
          beschreibung: 'PDF-Funktion nicht geladen. Seite neu laden und erneut versuchen.',
        });
        return;
      }
      this.pdfExportLaedt = true;
      try {
        if (this.charakterPdfBlobUrl) {
          URL.revokeObjectURL(this.charakterPdfBlobUrl);
          this.charakterPdfBlobUrl = null;
        }
        const { blob, dateiname } = await fn(this.charakter, this.charakterBild, {
          stil: this.pdfExportStil,
        });
        this.charakterPdfBlobUrl = URL.createObjectURL(blob);
        this.charakterPdfDateiname = dateiname;
        this.charakterPdfModalOffen = true;
      } catch (e) {
        console.error(e);
        await window.HTBAH.ui.alert({
          titel: 'PDF-Erstellung fehlgeschlagen',
          beschreibung: e && e.message ? e.message : 'PDF konnte nicht erzeugt werden.',
        });
      } finally {
        this.pdfExportLaedt = false;
      }
    },
    inventarDialogOeffnen() {
      this.$refs.inventarModal.oeffnen();
    },
    vorNachteileDialogOeffnen() {
      this.$refs.vorNachteileModal.oeffnen();
    },
    initiativeModalOeffnen() {
      this.$refs.initiativeModal.oeffnen();
    },
    kategorieAnzeige(kategorie) {
      const namen = { handeln: 'Handeln', wissen: 'Wissen', soziales: 'Soziales' };
      return namen[kategorie] || kategorie;
    },
    effektiverFaehigkeitswertProbe(kategorie, faehigkeit) {
      const basis = Number(faehigkeit.value) || 0;
      return Math.min(100, basis + this.begabungen[kategorie]);
    },
    probeModalOeffnenBegabung(kategorie) {
      this.$refs.probeWurfModal.oeffnen({
        modus: 'begabung',
        zielwert: this.begabungen[kategorie],
        titel: 'Probe: Begabung ' + this.kategorieAnzeige(kategorie),
        untertitel:
          'Nur der Begabungswert — ohne einzelne Fähigkeit. Keine kritischen Erfolge (Regelwerk).',
      });
    },
    probeModalOeffnenFaehigkeit(kategorie, faehigkeit) {
      const b = this.begabungen[kategorie];
      const fWert = Number(faehigkeit.value) || 0;
      const roh = fWert + b;
      const z = this.effektiverFaehigkeitswertProbe(kategorie, faehigkeit);
      let untertitel =
        'Effektivwert ' +
        z +
        ' (' +
        fWert +
        ' + ' +
        b +
        ' Begabung, ' +
        this.kategorieAnzeige(kategorie) +
        ')';
      if (roh > 100) {
        untertitel += '. Überzählige Punkte zählen für die Probe nicht (Regelwerk 3.4, Ziel 100).';
      }
      this.$refs.probeWurfModal.oeffnen({
        modus: 'faehigkeit',
        zielwert: z,
        titel: 'Probe: ' + faehigkeit.name,
        untertitel,
      });
    },
    notizenDialogOeffnen() {
      this.$refs.notizenModal.oeffnen();
    },
    fraktionInfoUmschalten() {
      this.fraktionInfoOffen = !this.fraktionInfoOffen;
    },
  },
  template: `
    <div :class="spielleiterMitglied ? 'content py-3' : 'container content py-3'">
      <h4 v-if="!spielleiterMitglied" class="text-center mb-3 htbah-page-title">
        <span class="htbah-page-title-emoji" aria-hidden="true">🧙</span>
        <span>{{ istEditModus ? 'Charakter bearbeiten' : 'Neuen Charakter erstellen' }}</span>
      </h4>
      <p v-if="!spielleiterMitglied && istEditModus" class="small text-body-secondary text-center mt-n2 mb-2">
        Session Zero, aktives Spiel und Nachbereitung in einem durchgehenden Flow.
      </p>
      <div
        v-if="spielleiterMitglied && (charakterLebenspunkteStatus.tot || charakterLebenspunkteStatus.bewusstlos)"
        class="htbah-sl-charakter-lp-status-sticky mb-3"
        :class="charakterLebenspunkteStatus.tot ? 'htbah-lp-status-tot' : 'htbah-lp-status-bewusstlos'"
        role="status"
        aria-live="polite">
        <div class="htbah-sl-charakter-lp-status-sticky__inner">
          <template v-if="charakterLebenspunkteStatus.tot">
            <span class="htbah-sl-charakter-lp-status-sticky__text">
              <strong>Tot</strong>
              — 0 Lebenspunkte. Dieser Zustand kann nicht rückgängig gemacht werden.
            </span>
          </template>
          <template v-else>
            <span class="htbah-sl-charakter-lp-status-sticky__text">
              <strong>Bewusstlos</strong>
              — Lebenspunkte 1–10, oder über 10 LP, falls auf einen Schlag mindestens 60 LP verloren gingen.
            </span>
          </template>
        </div>
      </div>

      <div
        v-if="!spielleiterMitglied && istNeuModus"
        class="alert alert-info mb-2">
        <p class="small mb-2">
          Bestehenden Charakter importieren (Einzel-Export oder Komplett-Export).
          Bei mehreren enthaltenen Charakteren kannst du danach einen auswählen.
        </p>
        <div class="row g-2">
          <div class="col-12 col-md-6">
            <div class="form-floating">
              <input
                id="ce-char-import"
                type="file"
                accept="application/json,.json"
                class="form-control"
                @change="importDateiAusgewaehlt" />
              <label for="ce-char-import">Charakter aus Datei importieren</label>
            </div>
          </div>
          <div v-if="importDateiname" class="col-12">
            <p class="small text-body-secondary mb-0">
              Datei: {{ importDateiname }}
            </p>
          </div>
        </div>
      </div>

      <div v-if="importHinweis && !spielleiterMitglied" class="alert alert-secondary py-2 mb-2">
        {{ importHinweis }}
      </div>
      <ul
        v-if="!spielleiterMitglied && istEditModus"
        class="nav htbah-weltenbau-pill-tabs mb-2"
        role="tablist"
        aria-label="Charakter Bereiche">
        <li class="nav-item" role="presentation">
          <button
            type="button"
            class="nav-link htbah-weltenbau-pill-tab"
            :class="{ active: aktiveCharakterTab === 'setup' }"
            @click="wechsleCharakterTab('setup')">
            <span aria-hidden="true">🧭</span>
            <span>Session Zero</span>
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button
            type="button"
            class="nav-link htbah-weltenbau-pill-tab"
            :class="{ active: aktiveCharakterTab === 'spiel' }"
            @click="wechsleCharakterTab('spiel')">
            <span aria-hidden="true">🎲</span>
            <span>Aktives Spiel</span>
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button
            type="button"
            class="nav-link htbah-weltenbau-pill-tab"
            :class="{ active: aktiveCharakterTab === 'verwaltung' }"
            @click="wechsleCharakterTab('verwaltung')">
            <span aria-hidden="true">🗂️</span>
            <span>Nachbereitung</span>
          </button>
        </li>
      </ul>
      <div v-if="!spielleiterMitglied && istEditModus" class="alert alert-info py-2 px-3 small mb-2" role="note">
        <span v-if="aktiveCharakterTab === 'setup'">
          Session Zero: Stammdaten, Sicherheitsmechanismen sowie Vor- und Nachteile pflegen. PDF-Export ist hier ebenfalls möglich.
        </span>
        <span v-else-if="aktiveCharakterTab === 'spiel'">
          Aktives Spiel: Fähigkeiten, Initiative, Inventar und Notizen laufend aktualisieren (Autosave aktiv).
        </span>
        <span v-else>
          Am besten exportierst Du zum Abschluss jeder Session Deinen Charakter als JSON und als PDF - falls die Kampagne noch weitergeht. Einigt euch in dem Fall am besten mit der Spielleitung, wie ihr die Dateien austauschen könnt, damit die nächste Session nahtlos weitergehen kann.
        </span>
      </div>
      <div
        v-if="!spielleiterMitglied && istEditModus && istSpielTabAktiv"
        class="card p-3 mb-2"
        role="region"
        aria-label="Charakter-Übersicht für aktives Spiel">
        <h6 class="mb-2">Charakter-Übersicht (read-only)</h6>
        <div class="row g-3 htbah-charakter-stammdaten-row">
          <div class="col-12 col-lg-auto order-lg-1 htbah-charakterbild-spalte">
            <div class="htbah-charakterbild-einheit">
              <div class="text-center mb-2 htbah-charakterbild-vorschau-wrap">
                <div class="htbah-charakterbild-status-wrap">
                  <img
                    v-if="charakterBild"
                    :src="charakterBild"
                    alt="Charakterbild"
                    class="charakterbild-vorschau-klein" />
                  <div v-else class="charakterbild-platzhalter-klein">
                    <span class="material-symbols-outlined" aria-hidden="true">person</span>
                  </div>
                  <span
                    v-if="charakterZustandEmoji"
                    class="htbah-charakter-zustand-overlay htbah-charakter-zustand-overlay--gross"
                    :aria-label="charakterZustandLabel"
                    role="img">
                    {{ charakterZustandEmoji }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="col-12 col-lg order-lg-2">
            <div class="row g-2">
              <div class="col-12 col-md-6">
                <p class="small text-body-secondary mb-1">Name</p>
                <p class="mb-2 fw-semibold">{{ charakter.name || '—' }}</p>
              </div>
              <div class="col-12 col-md-3">
                <p class="small text-body-secondary mb-1">Alter</p>
                <p class="mb-2">{{ charakter.alter ?? '—' }}</p>
              </div>
              <div class="col-12 col-md-3">
                <label for="ce-ro-lp" class="form-label text-body-secondary small mb-1">Lebenspunkte</label>
                <input
                  id="ce-ro-lp"
                  type="number"
                  class="form-control"
                  v-model.number="charakter.lebenspunkte"
                  min="0"
                  placeholder=" "
                  @focus="lebenspunkteEingabeFokus"
                  @blur="lebenspunkteEingabeBlur">
              </div>
              <div class="col-12 col-md-4">
                <p class="small text-body-secondary mb-1">Geschlecht</p>
                <p class="mb-2">{{ charakter.geschlecht || '—' }}</p>
              </div>
              <div class="col-12 col-md-4">
                <p class="small text-body-secondary mb-1">Beruf</p>
                <p class="mb-2">{{ charakter.beruf || '—' }}</p>
              </div>
              <div class="col-12 col-md-4">
                <p class="small text-body-secondary mb-1">Fraktion</p>
                <p class="mb-2">{{ charakter.fraktion || '—' }}</p>
              </div>
              <div class="col-12">
                <p class="small text-body-secondary mb-1">Glaube</p>
                <p class="mb-0">{{ charakter.glaube || '—' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!spielleiterMitglied && istSetupTabAktiv && !istNeuModus" class="card p-3 mb-2">
        <h5 class="mb-2">Sicherheitsmechanismen</h5>
        <p class="small text-body-secondary mb-2">
          Legt gemeinsam mit der Spielleitung in der Session Zero Grenzen, Schleier und die Nutzung der X-Karte fest.
          Importiere hier anschließend die gemeinsam vereinbarten Sicherheitsmechanismen.
          Du kannst den Text dann jederzeit über den Floating-Button mit dem Flaggen-Icon anzeigen lassen.
          Im exportierbaren PDF stehen die Daten ebenfalls. Dort findest Du auch eine X-Karte zum Ausdrucken und Ausschneiden.
        </p>
        <label class="btn btn-outline-secondary w-100 mb-0">
          Sicherheitsmechanismen importieren
          <input
            type="file"
            class="d-none"
            accept=".json,application/json"
            @change="sicherheitsmechanismenImportieren" />
        </label>
      </div>

      <div v-if="spielleiterMitglied || istSetupTabAktiv" class="card p-3 mb-2">
        <div class="row g-3 htbah-charakter-stammdaten-row">
          <div class="col-12 col-lg order-lg-2">
            <div class="mb-3">
              <label for="ce-char-name" class="form-label text-body-secondary small mb-1">Name</label>
              <input
                id="ce-char-name"
                type="text"
                class="form-control htbah-charakter-name-input"
                v-model="charakter.name"
                placeholder="Name deines Helden"
                autocomplete="name" />
            </div>

            <div class="row g-2 mb-2">
              <div :class="istNeuModus ? 'col-12 col-md-6' : 'col-12 col-md-4'">
                <div class="form-floating">
                  <input id="ce-char-geschlecht" class="form-control" v-model="charakter.geschlecht" placeholder=" ">
                  <label for="ce-char-geschlecht">Geschlecht</label>
                </div>
              </div>
              <div :class="istNeuModus ? 'col-12 col-md-6' : 'col-12 col-md-4'">
                <div class="form-floating">
                  <input id="ce-char-alter" type="number" class="form-control" v-model.number="charakter.alter" min="0" placeholder=" ">
                  <label for="ce-char-alter">Alter</label>
                </div>
              </div>
              <div v-if="!istNeuModus" class="col-12 col-md-4">
                <div class="form-floating">
                  <input
                    id="ce-char-lp"
                    type="number"
                    class="form-control"
                    v-model.number="charakter.lebenspunkte"
                    min="0"
                    placeholder=" "
                    @focus="lebenspunkteEingabeFokus"
                    @blur="lebenspunkteEingabeBlur">
                  <label for="ce-char-lp">Lebenspunkte</label>
                </div>
              </div>
            </div>

            <div class="row g-2 mb-2">
              <div class="col-12 col-md-6">
                <div class="form-floating">
                  <input id="ce-char-statur" class="form-control" v-model="charakter.statur" placeholder=" ">
                  <label for="ce-char-statur">Statur</label>
                </div>
              </div>
              <div class="col-12 col-md-6">
                <div class="form-floating">
                  <input id="ce-char-beruf" class="form-control" v-model="charakter.beruf" placeholder=" ">
                  <label for="ce-char-beruf">Beruf</label>
                </div>
              </div>
            </div>

            <div class="row g-2">
              <div :class="istNeuModus ? 'col-12' : 'col-12 col-md-6'">
                <div class="form-floating">
                  <input id="ce-char-famstand" class="form-control" v-model="charakter.familienstand" placeholder=" ">
                  <label for="ce-char-famstand">Familienstand</label>
                </div>
              </div>
              <div v-if="!istNeuModus" class="col-12 col-md-6">
                <div class="form-floating">
                  <input
                    id="ce-char-glaube"
                    class="form-control"
                    v-model="charakter.glaube"
                    :list="pantheonGlaubeNamen.length ? 'ce-char-glaube-datalist' : undefined"
                    placeholder=" "
                    autocomplete="off" />
                  <label for="ce-char-glaube">Glaube</label>
                </div>
                <datalist v-if="pantheonGlaubeNamen.length" id="ce-char-glaube-datalist">
                  <option v-for="n in pantheonGlaubeNamen" :key="'pgl-' + n" :value="n"></option>
                </datalist>
                <div v-if="!spielleiterMitglied" class="d-flex justify-content-end mt-2">
                  <input
                    ref="pantheonImportInput"
                    type="file"
                    accept="application/json,.json"
                    class="d-none"
                    @change="pantheonDateiAusgewaehlt" />
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-secondary"
                    @click="pantheonImportDialogOeffnen">
                    Pantheon von der Spielleitung importieren
                  </button>
                </div>
              </div>
            </div>
            <div v-if="!istNeuModus" class="row g-2 mt-0">
              <div class="col-12">
                <label for="ce-char-fraktion" class="form-label text-body-secondary small mb-1">Fraktion</label>
                <div class="input-group">
                  <input
                    id="ce-char-fraktion"
                    class="form-control"
                    v-model="charakter.fraktion"
                    placeholder="Fraktion" />
                  <button
                    type="button"
                    class="btn btn-outline-secondary d-flex align-items-center justify-content-center"
                    @click="fraktionInfoUmschalten"
                    :aria-expanded="fraktionInfoOffen ? 'true' : 'false'"
                    aria-controls="ce-char-fraktion-info"
                    aria-label="Info zu Fraktion ein- oder ausblenden">
                    <span class="material-symbols-outlined" aria-hidden="true">info</span>
                  </button>
                </div>
                <div id="ce-char-fraktion-info" class="collapse mt-2" :class="{ show: fraktionInfoOffen }">
                  <div class="small text-body-secondary">
                    Sofern Du Interesse an einer Fraktion hast, stimme Dich bitte mit der Spielleitung ab, damit die Fraktion zur Welt und Kampagne passt. Es kann sein, dass es in der aktuellen Kampagne nicht möglich ist, einer Fraktion anzugehören.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-lg-auto order-lg-1 htbah-charakterbild-spalte">
            <div class="htbah-charakterbild-einheit">
              <div class="text-center mb-2 htbah-charakterbild-vorschau-wrap">
                <div class="htbah-charakterbild-status-wrap">
                  <img
                    v-if="charakterBild"
                    :src="charakterBild"
                    alt="Charakterbild"
                    class="charakterbild-vorschau-klein" />
                  <div v-else class="charakterbild-platzhalter-klein">
                    <span class="material-symbols-outlined" aria-hidden="true">person</span>
                  </div>
                  <span
                    v-if="charakterZustandEmoji"
                    class="htbah-charakter-zustand-overlay htbah-charakter-zustand-overlay--gross"
                    :aria-label="charakterZustandLabel"
                    role="img">
                    {{ charakterZustandEmoji }}
                  </span>
                </div>
              </div>

              <button
                class="btn btn-outline-primary w-100 mt-2"
                @click="bildVerwaltungOeffnen">
                Bild verwalten
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="(spielleiterMitglied || istSetupTabAktiv) && !istNeuModus" class="card p-3 mb-2">
        <h5 class="mb-2">Vor- &amp; Nachteile</h5>
        <p class="small text-body-secondary mb-3 mb-md-2">
          Jedes Paar besteht aus einem Vorteil (kostet Fähigkeitspunkte) und einem Nachteil
          (gewährt Fähigkeitspunkte); die Punkte eines Paares müssen sich ausgleichen.
          Du kannst beliebig viele Paare anlegen — derzeit nur als Freitext mit Formatierung.
        </p>
        <icon-text-button
          type="button"
          class="btn btn-outline-primary w-100"
          symbol="⚖️"
          @click="vorNachteileDialogOeffnen">
          Vor- &amp; Nachteile bearbeiten
        </icon-text-button>

        <div
          v-if="charakter.vorNachteilePaare.length"
          class="table-responsive rounded border border-secondary border-opacity-25 mt-3 vor-nachteile-karte-wrap">
          <table class="table table-sm mb-0 inventar-tabelle vor-nachteile-tabelle vor-nachteile-karte-tabelle">
            <thead>
              <tr>
                <th scope="col" class="vn-col-vorteil">Vorteil</th>
                <th scope="col" class="vn-col-nachteil">Nachteil</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="paar in charakter.vorNachteilePaare" :key="paar.id">
                <td class="vn-col-vorteil">
                  <div
                    class="inventar-beschreibung-vorschau small vor-nachteile-karte-vorschau"
                    v-html="paar.vorteilHtml"></div>
                </td>
                <td class="vn-col-nachteil">
                  <div
                    class="inventar-beschreibung-vorschau small vor-nachteile-karte-vorschau"
                    v-html="paar.nachteilHtml"></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="small text-body-secondary mb-0 mt-3">
          Noch keine Paare — über den Button bearbeiten.
        </p>
      </div>

      <div v-if="spielleiterMitglied || (!istNeuModus && (istSpielTabAktiv || istSetupTabAktiv))" class="card p-2 mb-2">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <h5 class="mb-0">Fähigkeiten</h5>
          <div class="d-flex align-items-center gap-2">
            <button
              v-if="!spielleiterMitglied"
              type="button"
              class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
              @click="presetAktionenUmschalten"
              :aria-expanded="zeigePresetAktionen ? 'true' : 'false'"
              aria-controls="ce-preset-karte"
              aria-label="Fähigkeiten-Preset-Bereich ein- oder ausklappen">
              <span>Presets</span>
              <span class="material-symbols-outlined" aria-hidden="true">
                {{ zeigePresetAktionen ? 'expand_less' : 'expand_more' }}
              </span>
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center"
              data-bs-toggle="modal"
              data-bs-target="#faehigkeitenHilfeModal"
              aria-label="Hilfe zu Fähigkeiten">
              <span class="material-symbols-outlined" aria-hidden="true">help</span>
            </button>
          </div>
        </div>

        <div v-if="zeigePresetAktionen && !spielleiterMitglied" id="ce-preset-karte" class="card p-2 mb-2">
          <h6 class="mb-1">Fähigkeiten-Presets importieren</h6>
          <p class="small text-body-secondary mb-2">
            Die Spielleitung kann Dir ein Fähigkeiten-Preset als .json-Datei zukommen lassen.
            Dieses kannst Du dann hier importieren, um es als Basis zu nutzen.
          </p>
          <div class="form-floating mb-2">
            <select id="ce-preset-wahl" class="form-select" v-model="ausgewaehltesPreset">
              <option value="">Fähigkeiten-Preset wählen …</option>
              <option v-for="preset in presets" :value="preset.name">
                {{preset.name}}
              </option>
            </select>
            <label for="ce-preset-wahl">Fähigkeiten-Preset (lokal gespeichert)</label>
          </div>
          <button class="btn btn-primary w-100 mb-2" @click="presetAnwenden">
            Fähigkeiten-Preset anwenden
          </button>
          <div class="form-floating mb-0">
            <input
              id="ce-preset-import"
              type="file"
              accept="application/json,.json"
              class="form-control"
              @change="presetAusDateiAnwenden" />
            <label for="ce-preset-import">Fähigkeiten-Preset aus Datei laden</label>
          </div>
        </div>

        <div class="htbah-faehigkeiten-sticky-scope">
          <div class="htbah-faehigkeiten-punkte-sticky">
            <p
              v-if="!( !spielleiterMitglied && istEditModus && istSpielTabAktiv )"
              class="mb-2">
              Punkte: <strong>{{punkte}}</strong> / 400
              <span class="text-warning">({{400 - punkte}} übrig)</span>
            </p>

            <div
              v-if="!( !spielleiterMitglied && istEditModus && istSpielTabAktiv )"
              class="progress"
              style="height:10px;">
              <div class="progress-bar" :style="{width: (punkte/400*100) + '%'}"></div>
            </div>
          </div>

          <div
            v-if="!( !spielleiterMitglied && istEditModus && istSetupTabAktiv )"
            class="mb-2">
            <div class="d-flex flex-wrap align-items-center gap-2 mt-2">
              <button
                type="button"
                class="btn btn-sm"
                :class="geistesblitzAusgebenModus ? 'btn-warning' : 'btn-outline-secondary'"
                @click="geistesblitzAusgebenModusUmschalten">
                {{ geistesblitzAusgebenModus ? 'Geistesblitzpunkte ausgeben: an' : 'Geistesblitzpunkte ausgeben' }}
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline-primary"
                @click="geistesblitzKontenAuffuellen">
                Geistesblitz-Konto auffüllen
              </button>
            </div>
            <p v-if="geistesblitzAusgebenModus" class="small text-warning mb-0 mt-1">
              Pro Kategorie einen Punkt abziehen, wenn du ihn am Tisch verbraucht hast.
            </p>
          </div>

          <div class="row g-2 mb-2">
          <div
            v-for="kategorie in ['handeln','wissen','soziales']"
            class="col-12 col-md-4">
            <div class="card p-2 h-100">
              <h5 class="text-uppercase fw-bold d-flex align-items-center gap-1">
                <span>{{kategorie}}</span>
                <span
                  class="material-symbols-outlined"
                  @click="kategorieInfoUmschalten(kategorie)"
                  style="cursor:pointer;"
                  aria-label="Kategorie-Info">
                  info
                </span>
              </h5>
              <div
                v-if="aktiveKategorieInfo === kategorie"
                class="faehigkeiten-stat-info-panel mb-2 mt-0">
                <small class="d-block">
                  {{ kategorieInfos[kategorie].erklaerung }}
                </small>
                <ul class="mt-2 mb-0 small">
                  <li v-for="beispiel in kategorieInfos[kategorie].beispiele">
                    {{ beispiel }}
                  </li>
                </ul>
              </div>

              <div class="mb-2">
                <div class="faehigkeiten-stat-badges-row" role="group" :aria-label="'Werte ' + kategorie">
                  <div class="faehigkeiten-stat-gruppe">
                    <span class="badge rounded-pill faehigkeiten-stat-badge faehigkeiten-stat-badge-summe">
                      Summe {{ summen[kategorie] }}
                    </span>
                  </div>
                  <div class="faehigkeiten-stat-gruppe">
                    <span class="badge rounded-pill faehigkeiten-stat-badge faehigkeiten-stat-badge-begabung">
                      Begabung {{ begabungen[kategorie] }}
                    </span>
                    <button
                      type="button"
                      class="faehigkeiten-stat-info-btn faehigkeiten-probe-wuerfel-btn"
                      :aria-label="'W100-Probe auf Begabung ' + kategorieAnzeige(kategorie)"
                      @click="probeModalOeffnenBegabung(kategorie)">
                      <span class="faehigkeiten-wuerfel-emoji" aria-hidden="true">🎲</span>
                    </button>
                    <button
                      type="button"
                      class="faehigkeiten-stat-info-btn"
                      :aria-label="'Info Begabung (' + kategorie + ')'"
                      :aria-expanded="aktiveInfo === kategorie"
                      @click="infoUmschalten(kategorie)">
                      <span class="material-symbols-outlined" aria-hidden="true">info</span>
                    </button>
                  </div>
                  <div class="faehigkeiten-stat-gruppe">
                    <span
                      class="badge rounded-pill faehigkeiten-stat-badge faehigkeiten-stat-badge-geistesblitz">
                      Geistesblitz {{ charakter.geistesblitzVerbleibend[kategorie] }} / {{ geistesblitzWerte[kategorie] }}
                    </span>
                    <button
                      type="button"
                      class="faehigkeiten-stat-info-btn"
                      :aria-label="'Info Geistesblitzpunkte (' + kategorie + ')'"
                      :aria-expanded="aktiveGeistesblitzInfo === kategorie"
                      @click="geistesblitzInfoUmschalten(kategorie)">
                      <span class="material-symbols-outlined" aria-hidden="true">info</span>
                    </button>
                    <button
                      v-if="geistesblitzAusgebenModus"
                      type="button"
                      class="btn btn-sm btn-outline-warning py-0 px-2"
                      :disabled="!charakter.geistesblitzVerbleibend[kategorie]"
                      @click="geistesblitzPunktAusgeben(kategorie)">
                      −1
                    </button>
                  </div>
                </div>

                <div
                  v-if="aktiveInfo === kategorie"
                  class="faehigkeiten-stat-info-panel faehigkeiten-stat-info-panel--begabung">
                  <small>
                    Begabung = Summe der Fähigkeiten / 10 (kaufmännisch runden).<br>
                    Sie wird auf alle Fähigkeiten dieser Kategorie addiert.
                  </small>
                </div>
                <div
                  v-if="aktiveGeistesblitzInfo === kategorie"
                  class="faehigkeiten-stat-info-panel faehigkeiten-stat-info-panel--geistesblitz">
                  <ul class="mb-0 ps-3 small">
                    <li v-for="(zeile, ix) in geistesblitzInfoZeilen" :key="ix">
                      {{ zeile }}
                    </li>
                  </ul>
                </div>
              </div>

              <div class="table-responsive rounded border border-secondary border-opacity-25">
                <table class="table table-sm mb-0 faehigkeiten-tabelle">
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col" class="text-end">Wert</th>
                      <th scope="col" class="text-end">Effektiv</th>
                      <th scope="col" class="text-end text-nowrap ps-2">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!sortierteFaehigkeiten(kategorie).length">
                      <td colspan="4" class="text-muted small py-2">Keine Fähigkeiten</td>
                    </tr>
                    <tr
                      v-for="faehigkeit in sortierteFaehigkeiten(kategorie)"
                      :key="faehigkeit">
                      <td class="align-middle">{{ faehigkeit.name }}</td>
                      <td class="align-middle text-end text-muted">
                        {{ faehigkeit.value == null ? '—' : faehigkeit.value }}
                      </td>
                      <td class="align-middle text-end">
                        {{ (Number(faehigkeit.value) || 0) + begabungen[kategorie] }}
                      </td>
                      <td class="align-middle text-end ps-2">
                        <div class="btn-group btn-group-sm" role="group" :aria-label="'Aktionen für ' + faehigkeit.name">
                          <button
                            type="button"
                            class="btn btn-outline-primary d-flex align-items-center justify-content-center"
                            :aria-label="'W100-Probe: ' + faehigkeit.name"
                            @click="probeModalOeffnenFaehigkeit(kategorie, faehigkeit)">
                            <span class="faehigkeiten-wuerfel-emoji" aria-hidden="true">🎲</span>
                          </button>
                          <button
                            type="button"
                            class="btn btn-outline-secondary d-flex align-items-center justify-content-center"
                            :aria-label="'Bearbeiten: ' + faehigkeit.name"
                            @click="bearbeitungModalOeffnen(kategorie, faehigkeit)">
                            <span class="material-symbols-outlined" aria-hidden="true">edit</span>
                          </button>
                          <button
                            type="button"
                            class="btn btn-outline-danger d-flex align-items-center justify-content-center"
                            :aria-label="'Löschen: ' + faehigkeit.name"
                            @click="faehigkeitLoeschenAnfragen(kategorie, faehigkeit)">
                            <span class="material-symbols-outlined" aria-hidden="true">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          </div>
        </div>

        <div v-if="!( !spielleiterMitglied && istEditModus && istSpielTabAktiv )" class="card p-2">
          <h5>Neue Fähigkeit</h5>
          <faehigkeit-formular v-model="neueFaehigkeit" id-prefix="ce-neu" />
          <button class="btn btn-primary w-100 mt-2" @click="faehigkeitHinzufuegen">Hinzufügen</button>
        </div>
      </div>

      <div v-if="!spielleiterMitglied && istEditModus && istSetupTabAktiv" class="card p-3 mb-2">
        <h6 class="mb-2">PDF-Export</h6>
        <p class="small text-body-secondary mb-2">
          Für analoge Runden kannst du den Bogen direkt in der Session Zero als PDF ausgeben.
        </p>
        <div class="htbah-pdf-export-gruppe mb-0">
          <icon-text-button
            type="button"
            class="btn btn-outline-primary htbah-pdf-export-gruppe-btn"
            icon="picture_as_pdf"
            :disabled="pdfExportLaedt"
            @click="charakterPdfExportieren">
            {{ pdfExportLaedt ? 'PDF wird erzeugt …' : 'PDF generieren' }}
          </icon-text-button>
          <div class="htbah-pdf-export-gruppe-theme-wrap">
            <label for="ce-pdf-stil-setup" class="form-label small text-body-secondary mb-1 d-md-none">Theme</label>
            <select
              id="ce-pdf-stil-setup"
              class="form-select htbah-pdf-export-gruppe-select"
              v-model="pdfExportStil"
              aria-label="PDF-Stilrichtung auswählen">
              <option value="fantasy-mittelalter">Fantasy / Mittelalter</option>
              <option value="gegenwart">Gegenwart</option>
              <option value="modern-futuristisch">Modern / Futuristisch</option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="spielleiterMitglied || istSpielTabAktiv || istNeuModus" class="card p-3 mb-2">
        <div class="row g-2">
          <div v-if="spielleiterMitglied || istSpielTabAktiv" class="col-12">
            <icon-text-button
              v-if="spielleiterMitglied || (istSpielTabAktiv && !istNeuModus)"
              type="button"
              class="btn btn-outline-primary btn-lg w-100"
              symbol="🎲"
              @click="initiativeModalOeffnen">
              Initiative würfeln
            </icon-text-button>
          </div>
          <div class="col-12 col-md-6">
            <icon-text-button
              class="btn btn-outline-primary btn-lg w-100"
              type="button"
              symbol="🎒"
              @click="inventarDialogOeffnen">
              Inventar
            </icon-text-button>
          </div>
          <div class="col-12 col-md-6">
            <icon-text-button
              class="btn btn-outline-primary btn-lg w-100"
              type="button"
              symbol="📝"
              @click="notizenDialogOeffnen">
              Notizen
            </icon-text-button>
          </div>
        </div>
      </div>

      <div v-if="!spielleiterMitglied && istNeuModus" class="card p-3 mb-2">
        <p class="small text-body-secondary mb-3 mb-md-0">
          Speichere hier Deinen Charakter als Vorbereitung auf die Session Zero. In dieser wirst Du Deinen Charakter
          weiter ausbauen und dann für Dich und die Spielleitung exportieren können. Beachte, dass die Daten nur in
          diesem Browser auf diesem Gerät gespeichert sind. Du kannst sie über die Seite ‚Einstellungen‘ exportieren
          und dann auf den von Dir bevorzugten Weg auch auf andere Geräte übertragen.
        </p>
        <icon-text-button
          type="button"
          class="btn btn-primary w-100 mt-md-3"
          icon="save"
          @click="speichereCharakterFormular">
          {{ speicherButtonText }}
        </icon-text-button>
      </div>

      <div v-if="istEditModus && istVerwaltungTabAktiv" class="card p-3 mb-2">
        <h5 class="mb-2">Verwaltung</h5>
        <p v-if="!spielleiterMitglied && istEditModus" class="small text-body-secondary mb-2">
          Im Bearbeiten-Modus speichert das Formular automatisch nach Änderungen.
        </p>
        <p v-else class="small text-body-secondary mb-3 mb-md-2">
          PDF: kompletter Charakterbogen auf einer DIN-A4-Seite (bei viel Text wird der Inhalt
          zum Ausdrucken verkleinert).
        </p>
        <p v-if="!spielleiterMitglied && istEditModus && autosaveHinweis" class="small text-success mb-2">
          {{ autosaveHinweis }}
        </p>
        <hr v-if="spielleiterMitglied || istEditModus" class="border-secondary border-opacity-25 my-2" />
        <h6 v-if="!spielleiterMitglied && istEditModus" class="small text-uppercase text-body-secondary mb-2">
          Exporte
        </h6>
        <div v-if="spielleiterMitglied || istEditModus" class="htbah-pdf-export-gruppe mb-2">
          <icon-text-button
            type="button"
            class="btn btn-outline-primary htbah-pdf-export-gruppe-btn"
            icon="picture_as_pdf"
            :disabled="pdfExportLaedt"
            @click="charakterPdfExportieren"
            >
            {{ pdfExportLaedt ? 'PDF wird erzeugt …' : 'PDF generieren' }}
          </icon-text-button>
          <div class="htbah-pdf-export-gruppe-theme-wrap">
            <label for="ce-pdf-stil" class="form-label small text-body-secondary mb-1 d-md-none">Theme</label>
            <select
              id="ce-pdf-stil"
              class="form-select htbah-pdf-export-gruppe-select"
              v-model="pdfExportStil"
              aria-label="PDF-Stilrichtung auswählen">
              <option value="fantasy-mittelalter">Fantasy / Mittelalter</option>
              <option value="gegenwart">Gegenwart</option>
              <option value="modern-futuristisch">Modern / Futuristisch</option>
            </select>
          </div>
        </div>
        <hr
          v-if="(spielleiterMitglied || istEditModus) && !istEditModus"
          class="border-secondary border-opacity-25 my-2" />
        <icon-text-button
          v-if="istEditModus"
          type="button"
          class="btn btn-outline-secondary w-100 mb-2"
          icon="download"
          @click="charakterJsonExportieren">
          JSON exportieren
        </icon-text-button>
      </div>

      <div
        ref="importAuswahlModalElement"
        class="modal fade"
        id="charakterImportAuswahlModal"
        tabindex="-1"
        aria-labelledby="charakterImportAuswahlLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content shadow">
            <div class="modal-header">
              <h5 class="modal-title" id="charakterImportAuswahlLabel">
                Import-Inhalt auswählen
              </h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Schließen"></button>
            </div>
            <div class="modal-body">
              <p class="small text-body-secondary mb-2">
                Die Datei enthält mehrere importierbare Inhalte. Wähle aus, was übernommen werden soll.
              </p>
              <div class="form-floating">
                <select id="ce-char-import-auswahl" class="form-select" v-model="importAuswahlIndex">
                  <option value="">Inhalt auswählen …</option>
                  <option v-for="(kandidat, index) in importKandidaten" :key="'imp-' + index" :value="String(index)">
                    {{ importAuswahlText(kandidat, index) }}
                  </option>
                </select>
                <label for="ce-char-import-auswahl">Importauswahl</label>
              </div>
              <p v-if="importDateiname" class="small text-body-secondary mb-0 mt-2">
                Datei: {{ importDateiname }}
              </p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                Abbrechen
              </button>
              <button
                type="button"
                class="btn btn-primary"
                :disabled="!kannImportAuswahlUebernehmen"
                @click="importAuswahlUebernehmen">
                Auswahl importieren
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        class="modal fade"
        id="faehigkeitenHilfeModal"
        tabindex="-1"
        aria-labelledby="faehigkeitenHilfeLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content shadow">
            <div class="modal-header">
              <h5 class="modal-title" id="faehigkeitenHilfeLabel">
                Hilfe zu Fähigkeiten
              </h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Schließen"></button>
            </div>
            <div class="modal-body">
              <p v-if="!spielleiterMitglied && istEditModus && istSpielTabAktiv">
                <strong>Du hast in der Session Zero 400 Punkte auf die Fähigkeiten verteilt.</strong>
              </p>
              <p v-else><strong>Du hast 400 Punkte.</strong> Diese verteilst du auf Fähigkeiten.</p>
              <p><strong>Fähigkeiten</strong> sind konkrete Dinge (z.B. Klettern, Lügen).</p>
              <p><strong>Kategorien:</strong></p>
              <ul>
                <li><strong>Handeln</strong> → körperlich / aktiv</li>
                <li><strong>Wissen</strong> → logisch / gelernt</li>
                <li><strong>Soziales</strong> → Interaktion</li>
              </ul>
              <p><strong>Begabung</strong> entsteht automatisch aus deinen Punkten und verbessert alle Fähigkeiten.</p>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                data-bs-dismiss="modal">
                Schließen
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        class="modal fade"
        id="faehigkeitBearbeitenModal"
        ref="faehigkeitBearbeitenModalElement"
        tabindex="-1"
        aria-labelledby="faehigkeitBearbeitenLabel"
        aria-hidden="true"
        v-on="{ 'hidden.bs.modal': bearbeitungModalGeschlossen }">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content shadow">
            <div class="modal-header">
              <h5 class="modal-title" id="faehigkeitBearbeitenLabel">
                Fähigkeit bearbeiten
              </h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Schließen"></button>
            </div>
            <div class="modal-body">
              <faehigkeit-formular
                v-model="bearbeitungEntwurf"
                id-prefix="ce-bearb"
              />
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                Abbrechen
              </button>
              <button type="button" class="btn btn-primary" @click="bearbeitungSpeichern">
                Speichern
              </button>
            </div>
          </div>
        </div>
      </div>

      <bestaetigen-modal ref="faehigkeitLoeschenModal" />

      <charakter-bild-modal
        ref="charakterBildModal"
        :charakter-bild="charakterBild"
        @update:charakter-bild="setzeCharakterBild($event)"
      />
      <vor-nachteile-modal ref="vorNachteileModal" :charakter="charakter" />
      <initiative-modal ref="initiativeModal" :charakter="charakter" />
      <probe-wurf-modal ref="probeWurfModal" />
      <inventar-modal ref="inventarModal" :charakter="charakter" />
      <notizen-modal
        ref="notizenModal"
        :journal-html="charakter.journalHtml"
        @update:journal-html="charakter.journalHtml = $event"
      />
      <charakter-pdf-modal
        :offen="charakterPdfModalOffen"
        :pdf-url="charakterPdfBlobUrl || ''"
        :dateiname="charakterPdfDateiname"
        @schliessen="charakterPdfModalSchliessen"
      />
      <div class="abstandshalter" aria-hidden="true"></div>
    </div>
  `,
};
