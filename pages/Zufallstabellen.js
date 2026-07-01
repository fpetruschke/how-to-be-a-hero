window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};
var HTBAH_REFACTOR_UTILS =
  (window.HTBAH_SHARED && window.HTBAH_SHARED.RefactorUtils) || null;
var HTBAH_WELTENBAU_IMPORT =
  (window.HTBAH_SHARED && window.HTBAH_SHARED.WeltenbauImport) || null;

function htbahStandardZufallEpoche() {
  if (window.HTBAH && typeof window.HTBAH.standardZufallEpocheFuerAktivesTheme === 'function') {
    return window.HTBAH.standardZufallEpocheFuerAktivesTheme();
  }
  return 'mittelalter';
}

const TABLE_TYPE_CONFIG = {
  npc: { label: 'NPC', emoji: '👤', detail: '👤 NPC · Übersicht' },
  ort: { label: 'Ort', emoji: '🗺️', detail: '🗺️ Ort · Übersicht' },
  fraktion: { label: 'Fraktion', emoji: '🏛️', detail: '🏛️ Fraktion · Übersicht' },
  pantheon: { label: 'Gottheit', emoji: '✨', detail: '✨ Gottheit · Übersicht' },
  raetsel: { label: 'Rätsel', emoji: '🧩', detail: '🧩 Rätsel · Übersicht' },
  bestie: { label: 'Bestie', emoji: '🦁', detail: '🦁 Bestie · Übersicht' },
  gegenstand: { label: 'Gegenstand', emoji: '📦', detail: '📦 Gegenstand · Übersicht' },
};

function htbahTextVorschau(html, maxLen) {
  const grenze = typeof maxLen === 'number' ? maxLen : 72;
  const t = htbahHtmlText(html);
  if (!t) {
    return '—';
  }
  return t.length > grenze ? `${t.slice(0, grenze)}…` : t;
}

function htbahHtmlText(html) {
  const div = document.createElement('div');
  div.innerHTML = typeof html === 'string' ? html : '';
  return (div.textContent || '').replace(/\s+/g, ' ').trim();
}

const ZUFALLSTABELLEN_MAX_ROH_DATEI_BYTES = 40 * 1024 * 1024;
const DUPLIKAT_ZIEL_NEUE_KAMPAGNE = '__neu__';
const ZUFALLSTABELLEN_SEKTION_SUCHE = {
  orte: { sucheKey: 'sucheOrte', anzeigeKey: 'anzeigeOrte' },
  fraktionen: { sucheKey: 'sucheFraktionen', anzeigeKey: 'anzeigeFraktionen' },
  npcs: { sucheKey: 'sucheNpcs', anzeigeKey: 'anzeigeNpcs' },
  gegenstaende: { sucheKey: 'sucheGegenstaende', anzeigeKey: 'anzeigeGegenstaende' },
  pantheon: { sucheKey: 'suchePantheon', anzeigeKey: 'anzeigePantheon' },
  raetsel: { sucheKey: 'sucheRaetsel', anzeigeKey: 'anzeigeRaetsel' },
  bestien: { sucheKey: 'sucheBestien', anzeigeKey: 'anzeigeBestien' },
};

function zufallstabellenFormatBytes(n) {
  if (!HTBAH_REFACTOR_UTILS || !Number.isFinite(n) || n <= 0) {
    return '';
  }
  return HTBAH_REFACTOR_UTILS.formatBytesBinary(n);
}

function zufallstabellenIstBildDatei(file) {
  if (HTBAH_WELTENBAU_IMPORT && typeof HTBAH_WELTENBAU_IMPORT.istBildDatei === 'function') {
    return HTBAH_WELTENBAU_IMPORT.istBildDatei(file);
  }
  if (!file) {
    return false;
  }
  if (typeof file.type === 'string' && file.type.startsWith('image/')) {
    return true;
  }
  const name = typeof file.name === 'string' ? file.name.toLowerCase() : '';
  return /\.(png|apng|jpe?g|gif|webp|bmp|svg|avif|heic|heif|tiff?)$/i.test(name);
}

function zufallstabellenDateiZuDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'));
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.readAsDataURL(file);
  });
}

window.HTBAH_SEITEN.Zufallstabellen = {
  props: {
    eingebettet: {
      type: Boolean,
      default: false,
    },
    kampagneId: {
      type: String,
      default: '',
    },
  },
  components: {
    WeltenbauBildImportModal: window.HTBAH_KOMPONENTEN.WeltenbauBildImportModal,
    ZufallstabellenReihenfolgeSplit: window.HTBAH_KOMPONENTEN.ZufallstabellenReihenfolgeSplit,
    ZufallstabellenSektion: window.HTBAH_KOMPONENTEN.ZufallstabellenSektion,
    ZufallstabellenZeileModal: window.HTBAH_KOMPONENTEN.ZufallstabellenZeileModal,
    NpcWizardModal: window.HTBAH_KOMPONENTEN.NpcWizardModal,
    BestienWizardModal: window.HTBAH_KOMPONENTEN.BestienWizardModal,
    OrtWizardModal: window.HTBAH_KOMPONENTEN.OrtWizardModal,
    FraktionWizardModal: window.HTBAH_KOMPONENTEN.FraktionWizardModal,
    RaetselWizardModal: window.HTBAH_KOMPONENTEN.RaetselWizardModal,
    PantheonWizardModal: window.HTBAH_KOMPONENTEN.PantheonWizardModal,
    GegenstandWizardModal: window.HTBAH_KOMPONENTEN.GegenstandWizardModal,
    ParadeModal: window.HTBAH_KOMPONENTEN.ParadeModal,
    SchadenModal: window.HTBAH_KOMPONENTEN.SchadenModal,
  },
  data() {
    return {
      zustand: window.HTBAH.ladeZufallstabellenZustand(),
      bearbeitung: null,
      bearbeitungIndex: -1,
      bearbeitungOverlay: null,
      bearbeitungOverlayIndex: -1,
      zeileQuillInstanz: null,
      zeileMentionController: null,
      zeileQuillSelectionHandler: null,
      /** DOM-Knoten des Quill-Hosts (Funktions-Ref feuert bei jedem Re-Render erneut) */
      zeileQuillHostElement: null,
      zeileQuillSession: 0,
      overlayZeileQuillInstanz: null,
      overlayZeileMentionController: null,
      overlayZeileQuillSelectionHandler: null,
      overlayZeileQuillHostElement: null,
      overlayZeileQuillSession: 0,
      zuLoeschendeZeile: null,
      zufallNpcEpoche: htbahStandardZufallEpoche(),
      zufallGegenstandEpoche: htbahStandardZufallEpoche(),
      zufallFraktionEpoche: htbahStandardZufallEpoche(),
      zufallRaetselEpoche: htbahStandardZufallEpoche(),
      zufallOrtEpoche: htbahStandardZufallEpoche(),
      zufallPantheonEpoche: htbahStandardZufallEpoche(),
      zufallBestieEpoche: htbahStandardZufallEpoche(),
      /** Ziel des aktuell geöffneten NPC-Wizards: 'haupt' | 'overlay' | null */
      npcWizardZiel: null,
      bestienWizardZiel: null,
      ortWizardZiel: null,
      fraktionWizardZiel: null,
      raetselWizardZiel: null,
      pantheonWizardZiel: null,
      gegenstandWizardZiel: null,
      /** Stabile Funktion für :ref (wie InventarModal), kein String-ref im Modal */
      zeileQuillHostRefFn: null,
      overlayZeileQuillHostRefFn: null,
      sucheOrte: '',
      sucheFraktionen: '',
      sucheNpcs: '',
      sucheGegenstaende: '',
      suchePantheon: '',
      sucheRaetsel: '',
      sucheBestien: '',
      zeigeBewusstloseNpcs: true,
      zeigeToteNpcs: true,
      zeigeBewusstloseBestien: true,
      zeigeToteBestien: true,
      /** Filtert alle Tabellen gleichzeitig (zusätzlich zu den Feldern pro Kategorie) */
      sucheGlobal: '',
      medienImportWarteschlange: [],
      bildImportTimeoutId: null,
      galerieModalInstanz: null,
      galerieModalZeile: null,
      entitaetenAuswahlModus: false,
      /** Schlüssel `${typ}:${id}` → true */
      entitaetenAuswahl: {},
      duplizierenZielKampagneId: '',
      duplizierenNeueKampagneName: '',
      duplikatZielNeueKampagne: DUPLIKAT_ZIEL_NEUE_KAMPAGNE,
      /** Panel „Inhalte duplizieren“ (Ziel-Kampagne, Auswahlmodus) */
      duplizierenPanelOffen: false,
      /** Kategorie für Zufallseintrag: beliebig | orte | npcs | … */
      zufallKategorie: 'beliebig',
    };
  },
  created() {
    this.zeileQuillHostRefFn = (el) => {
      this.zeileQuillHostRef(el);
    };
    this.overlayZeileQuillHostRefFn = (el) => {
      this.overlayZeileQuillHostRef(el);
    };
  },
  computed: {
    kampagneIdEffektiv() {
      if (typeof this.kampagneId === 'string' && this.kampagneId.trim()) {
        return this.kampagneId.trim();
      }
      const sl = window.HTBAH.ladeSpielleitungZustand();
      return typeof sl.aktiveKampagneId === 'string' && sl.aktiveKampagneId.trim()
        ? sl.aktiveKampagneId.trim()
        : '';
    },
    rootKlassen() {
      return this.eingebettet ? '' : 'container content py-3';
    },
    zeileModalTitel() {
      if (!this.bearbeitung) {
        return '';
      }
      const cfg = TABLE_TYPE_CONFIG[this.bearbeitung.typ] || TABLE_TYPE_CONFIG.gegenstand;
      const label = this.bearbeitung.typ === 'bestie' ? 'Bestarium' : cfg.label;
      const name = this.bearbeitung.zeile
        ? String(
            this.bearbeitung.typ === 'raetsel'
              ? this.bearbeitung.zeile.titel || ''
              : this.bearbeitung.zeile.name || '',
          ).trim()
        : '';
      return name ? `${label}: ${name}` : label;
    },
    zeileModalTitelOverlay() {
      if (!this.bearbeitungOverlay) {
        return '';
      }
      const cfg = TABLE_TYPE_CONFIG[this.bearbeitungOverlay.typ] || TABLE_TYPE_CONFIG.gegenstand;
      const label = this.bearbeitungOverlay.typ === 'bestie' ? 'Bestarium' : cfg.label;
      const name = this.bearbeitungOverlay.zeile
        ? String(
            this.bearbeitungOverlay.typ === 'raetsel'
              ? this.bearbeitungOverlay.zeile.titel || ''
              : this.bearbeitungOverlay.zeile.name || '',
          ).trim()
        : '';
      return name ? `${label}: ${name}` : label;
    },
    zufallsgeneratorBereit() {
      return !!(window.HTBAH && window.HTBAH.Zufallsgenerator);
    },
    spielleitungKampagnenFuerDuplikat() {
      const sl = window.HTBAH.ladeSpielleitungZustand();
      return Array.isArray(sl.kampagnen) ? sl.kampagnen.filter((k) => k && k.id) : [];
    },
    duplizierenNeueKampagneModus() {
      return this.duplizierenZielKampagneId === DUPLIKAT_ZIEL_NEUE_KAMPAGNE;
    },
    entitaetenAuswahlSchluesselListe() {
      return Object.keys(this.entitaetenAuswahl || {}).filter((k) => this.entitaetenAuswahl[k]);
    },
    entitaetenAuswahlAnzahl() {
      return this.entitaetenAuswahlSchluesselListe.length;
    },
    /** Fraktionen mit auswählbarem Namen (NPC-Dropdown) */
    fraktionenMitNamen() {
      return (this.zustand.fraktionen || []).filter((f) => f && String(f.name || '').trim());
    },
    /** Pantheon-Namen für NPC-Glaube (Datalist / Kombinationsfeld) */
    pantheonNamenListe() {
      return (this.zustand.pantheon || [])
        .map((p) => (p && p.name ? String(p.name).trim() : ''))
        .filter(Boolean);
    },
    orteNamenListe() {
      return (this.zustand.orte || [])
        .map((o) => (o && o.name ? String(o.name).trim() : ''))
        .filter(Boolean);
    },
    gefilterteOrte() {
      const q = this.normSucheText(this.sucheOrte);
      if (!q) {
        return this.zustand.orte || [];
      }
      return (this.zustand.orte || []).filter((row) =>
        this.trifftSucheZu(row, ['name', 'groesse', 'lage', 'zustand', 'notizenHtml'], q),
      );
    },
    gefilterteFraktionen() {
      const q = this.normSucheText(this.sucheFraktionen);
      if (!q) {
        return this.zustand.fraktionen || [];
      }
      return (this.zustand.fraktionen || []).filter((row) =>
        this.trifftSucheZu(
          row,
          ['art', 'name', 'ziel', 'gesinnungVerhalten', 'beschreibungHtml', 'orte'],
          q,
          this.fraktionOrteText(row),
        ),
      );
    },
    gefilterteNpcs() {
      const q = this.normSucheText(this.sucheNpcs);
      return (this.zustand.npcs || []).filter((row) => {
        const status = this.lebensstatusFuerZeile(row);
        if (status.tot && !this.zeigeToteNpcs) {
          return false;
        }
        if (status.bewusstlos && !status.tot && !this.zeigeBewusstloseNpcs) {
          return false;
        }
        if (!q) {
          return true;
        }
        const felder = [
          'name',
          'spitzname',
          'geschlecht',
          'alter',
          'familienstand',
          'statur',
          'lebenspunkte',
          'handeln',
          'wissen',
          'soziales',
          'gesinnung',
          'glaube',
          'beruf',
          'fraktion',
          'aufenthaltsort',
          'ziel',
          'geheimnis',
          'stimme',
          'initiative',
          'notizenHtml',
        ];
        return this.trifftSucheZu(row, felder, q, this.npcWaffenWerteText(row));
      });
    },
    gefilterteGegenstaende() {
      const q = this.normSucheText(this.sucheGegenstaende);
      if (!q) {
        return this.zustand.gegenstaende || [];
      }
      return (this.zustand.gegenstaende || []).filter((row) =>
        this.trifftSucheZu(
          row,
          [
            'name',
            'aufenthaltsort',
            'inGegenstandId',
            'initiative',
            'beschreibungHtml',
          ],
          q,
        ),
      );
    },
    gefiltertesPantheon() {
      const q = this.normSucheText(this.suchePantheon);
      if (!q) {
        return this.zustand.pantheon || [];
      }
      return (this.zustand.pantheon || []).filter((row) =>
        this.trifftSucheZu(
          row,
          [
            'name',
            'geschlecht',
            'domaene',
            'charakter',
            'staerke',
            'schwaeche',
            'schutzpatronat',
            'verlangen',
            'mythosGaben',
            'notizenHtml',
          ],
          q,
        ),
      );
    },
    gefilterteRaetsel() {
      const q = this.normSucheText(this.sucheRaetsel);
      if (!q) {
        return this.zustand.raetsel || [];
      }
      return (this.zustand.raetsel || []).filter((row) =>
        this.trifftSucheZu(
          row,
          ['art', 'titel', 'aufenthaltsort', 'gegenstandId', 'aufgabenstellung', 'ergebnis', 'schwierigkeit', 'geloest', 'notizenHtml'],
          q,
        ),
      );
    },
    gefilterteBestien() {
      const q = this.normSucheText(this.sucheBestien);
      return (this.zustand.bestien || []).filter((row) => {
        const status = this.lebensstatusFuerZeile(row);
        if (status.tot && !this.zeigeToteBestien) {
          return false;
        }
        if (status.bewusstlos && !status.tot && !this.zeigeBewusstloseBestien) {
          return false;
        }
        if (!q) {
          return true;
        }
        const kat = this.bestieKategorieLabel(row.kategorie);
        return this.trifftSucheZu(
          row,
          [
            'name',
            'lebenspunkte',
            'handeln',
            'wissen',
            'soziales',
            'aufenthaltsort',
            'initiative',
            'staerke',
            'schwaeche',
            'geheimnis',
            'beschreibungHtml',
          ],
          q,
          `${kat} ${this.entitaetInventarWaffenAnzeigeText(row)}`,
        );
      });
    },
    globaleSucheAktiv() {
      return !!this.normSucheText(this.sucheGlobal);
    },
    zufallKategorienDef() {
      return [
        { id: 'orte', zustandKey: 'orte', bearbeiten: 'ortBearbeiten', label: 'Ort', emoji: '🗺️' },
        { id: 'npcs', zustandKey: 'npcs', bearbeiten: 'npcBearbeiten', label: 'NPC', emoji: '👤' },
        { id: 'fraktionen', zustandKey: 'fraktionen', bearbeiten: 'fraktionBearbeiten', label: 'Fraktion', emoji: '⚔️' },
        { id: 'pantheon', zustandKey: 'pantheon', bearbeiten: 'pantheonBearbeiten', label: 'Pantheon', emoji: '🏛️' },
        { id: 'raetsel', zustandKey: 'raetsel', bearbeiten: 'raetselBearbeiten', label: 'Rätsel', emoji: '❓' },
        { id: 'bestien', zustandKey: 'bestien', bearbeiten: 'bestieBearbeiten', label: 'Bestie', emoji: '🐾' },
        {
          id: 'gegenstaende',
          zustandKey: 'gegenstaende',
          bearbeiten: 'gegenstandBearbeiten',
          label: 'Gegenstand',
          emoji: '🎒',
        },
      ];
    },
    zufallKategorienMitEintraegen() {
      return this.zufallKategorienDef.filter((k) => {
        const liste = this.zustand && Array.isArray(this.zustand[k.zustandKey]) ? this.zustand[k.zustandKey] : [];
        return liste.length > 0;
      });
    },
    kannZufallseintragZiehen() {
      return this.zufallKategorienMitEintraegen.length > 0;
    },
    anzeigeOrte() {
      const gq = this.normSucheText(this.sucheGlobal);
      const base = this.gefilterteOrte;
      if (!gq) {
        return base;
      }
      return base.filter((row) =>
        this.trifftSucheZu(row, ['name', 'groesse', 'lage', 'zustand', 'notizenHtml'], gq),
      );
    },
    anzeigeFraktionen() {
      const gq = this.normSucheText(this.sucheGlobal);
      const base = this.gefilterteFraktionen;
      if (!gq) {
        return base;
      }
      return base.filter((row) =>
        this.trifftSucheZu(row, ['art', 'name', 'ziel', 'gesinnungVerhalten', 'beschreibungHtml'], gq),
      );
    },
    anzeigeNpcs() {
      const gq = this.normSucheText(this.sucheGlobal);
      const base = this.gefilterteNpcs;
      if (!gq) {
        return base;
      }
      return base.filter((row) => {
        const felder = [
          'name',
          'spitzname',
          'geschlecht',
          'alter',
          'familienstand',
          'statur',
          'lebenspunkte',
          'handeln',
          'wissen',
          'soziales',
          'gesinnung',
          'glaube',
          'beruf',
          'fraktion',
          'aufenthaltsort',
          'ziel',
          'geheimnis',
          'stimme',
          'initiative',
          'notizenHtml',
        ];
        return this.trifftSucheZu(row, felder, gq, this.npcWaffenWerteText(row));
      });
    },
    anzeigeGegenstaende() {
      const gq = this.normSucheText(this.sucheGlobal);
      const base = this.gefilterteGegenstaende;
      if (!gq) {
        return base;
      }
      return base.filter((row) =>
        this.trifftSucheZu(
          row,
          [
            'name',
            'aufenthaltsort',
            'initiative',
            'beschreibungHtml',
          ],
          gq,
        ),
      );
    },
    anzeigePantheon() {
      const gq = this.normSucheText(this.sucheGlobal);
      const base = this.gefiltertesPantheon;
      if (!gq) {
        return base;
      }
      return base.filter((row) =>
        this.trifftSucheZu(
          row,
          [
            'name',
            'geschlecht',
            'domaene',
            'charakter',
            'staerke',
            'schwaeche',
            'schutzpatronat',
            'verlangen',
            'mythosGaben',
            'notizenHtml',
          ],
          gq,
        ),
      );
    },
    anzeigeRaetsel() {
      const gq = this.normSucheText(this.sucheGlobal);
      const base = this.gefilterteRaetsel;
      if (!gq) {
        return base;
      }
      return base.filter((row) =>
        this.trifftSucheZu(row, ['art', 'titel', 'aufenthaltsort', 'gegenstandId', 'aufgabenstellung', 'ergebnis', 'schwierigkeit', 'geloest', 'notizenHtml'], gq),
      );
    },
    anzeigeBestien() {
      const gq = this.normSucheText(this.sucheGlobal);
      const base = this.gefilterteBestien;
      if (!gq) {
        return base;
      }
      return base.filter((row) => {
        const kat = this.bestieKategorieLabel(row.kategorie);
        return this.trifftSucheZu(
          row,
          ['name', 'lebenspunkte', 'handeln', 'wissen', 'soziales', 'aufenthaltsort', 'initiative', 'staerke', 'schwaeche', 'geheimnis', 'beschreibungHtml'],
          gq,
          `${kat} ${this.entitaetInventarWaffenAnzeigeText(row)}`,
        );
      });
    },
  },
  watch: {
    kampagneIdEffektiv(neu, alt) {
      if (neu === alt) {
        return;
      }
      this.zustand = window.HTBAH.ladeZufallstabellenZustand(neu);
      this.duplizierenZielKampagneId = neu || '';
      this.entitaetenAuswahl = {};
      this.entitaetenAuswahlModus = false;
      this.zufallKategorie = 'beliebig';
    },
    zufallKategorienMitEintraegen(kategorien) {
      if (
        this.zufallKategorie !== 'beliebig' &&
        !kategorien.some((k) => k.id === this.zufallKategorie)
      ) {
        this.zufallKategorie = 'beliebig';
      }
    },
    duplizierenZielKampagneId(neu) {
      if (neu !== DUPLIKAT_ZIEL_NEUE_KAMPAGNE) {
        this.duplizierenNeueKampagneName = '';
      }
    },
  },
  methods: {
    entitaetTypLabelFuerMentions(typ) {
      const map = {
        charakter: 'Charakter',
        npc: 'NPC',
        ort: 'Ort',
        fraktion: 'Fraktion',
        pantheon: 'Gottheit',
        raetsel: 'Rätsel',
        bestie: 'Bestie',
        gegenstand: 'Gegenstand',
      };
      return map[typ] || 'Entität';
    },
    mentionTypSortIndex(typ) {
      const order = {
        charakter: 0,
        npc: 1,
        ort: 2,
        fraktion: 3,
        gegenstand: 4,
        bestie: 5,
        raetsel: 6,
        pantheon: 7,
      };
      return Number.isInteger(order[typ]) ? order[typ] : 99;
    },
    mentionScore(name, query) {
      const n = String(name || '').trim().toLowerCase();
      const q = String(query || '').trim().toLowerCase();
      if (!q) {
        return 500;
      }
      if (n === q) {
        return 0;
      }
      if (`@${n}` === q || n === q.replace(/^@+/, '')) {
        return 1;
      }
      if (n.startsWith(q)) {
        return 2;
      }
      const wortTreffer = n.split(/\s+/).some((teil) => teil.startsWith(q));
      if (wortTreffer) {
        return 3;
      }
      if (n.includes(q)) {
        return 4;
      }
      return 99;
    },
    mentionItemsFuerQuill(queryText) {
      const mentionApi = window.HTBAH_SHARED && window.HTBAH_SHARED.QuillEntityMentions;
      if (!mentionApi || typeof mentionApi.collectMentionItems !== 'function') {
        return [];
      }
      return mentionApi.collectMentionItems(queryText);
    },
    oeffneEntitaetAusMention({ entityType, entityId }) {
      const typ = String(entityType || '').trim();
      const id = String(entityId || '').trim();
      if (!typ || !id) {
        return;
      }
      const map = {
        npc: ['npcs', 'npcBearbeiten'],
        ort: ['orte', 'ortBearbeiten'],
        fraktion: ['fraktionen', 'fraktionBearbeiten'],
        pantheon: ['pantheon', 'pantheonBearbeiten'],
        raetsel: ['raetsel', 'raetselBearbeiten'],
        bestie: ['bestien', 'bestieBearbeiten'],
        gegenstand: ['gegenstaende', 'gegenstandBearbeiten'],
      };
      const entry = map[typ];
      if (!entry) {
        return false;
      }
      const liste = this.zustand[entry[0]] || [];
      const index = this.indexNachId(liste, id);
      if (index < 0 || typeof this[entry[1]] !== 'function') {
        return false;
      }
      /* Immer Overlay stapeln, solange schon ein Zeilen-Modal offen ist (Haupt oder bereits Overlay).
         Sonst feuert der Overlay-:ref nach $nextTick mit wiederhergestelltem Haupt-Kontext → eine zeileQuillInstanz
         für zwei Modale → Endlosschleife / Einfrieren. */
      if (this.bearbeitung) {
        this.zeileModalOeffnenAlsOverlay(typ, liste[index], index);
        return true;
      }
      this[entry[1]](liste[index], index);
      return true;
    },
    onRichTextLinkClick(event) {
      const anchor =
        event && event.target && typeof event.target.closest === 'function'
          ? event.target.closest('a[href]')
          : null;
      if (!anchor) {
        return;
      }
      const mentionApi = window.HTBAH_SHARED && window.HTBAH_SHARED.QuillEntityMentions;
      if (!mentionApi || typeof mentionApi.parseEntityLink !== 'function') {
        return;
      }
      const target = mentionApi.parseEntityLink(anchor.getAttribute('href') || anchor.href || '');
      if (!target) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      this.oeffneEntitaetAusMention(target);
    },
    withModalKontext(ziel, fn) {
      if (ziel !== 'overlay') {
        return fn();
      }
      if (!this.bearbeitungOverlay) {
        return null;
      }
      const snapshot = {
        bearbeitung: this.bearbeitung,
        bearbeitungIndex: this.bearbeitungIndex,
        zeileQuillInstanz: this.zeileQuillInstanz,
        zeileMentionController: this.zeileMentionController,
        zeileQuillHostElement: this.zeileQuillHostElement,
        zeileQuillSession: this.zeileQuillSession,
      };
      this.bearbeitung = this.bearbeitungOverlay;
      this.bearbeitungIndex = this.bearbeitungOverlayIndex;
      this.zeileQuillInstanz = this.overlayZeileQuillInstanz;
      this.zeileMentionController = this.overlayZeileMentionController;
      this.zeileQuillHostElement = this.overlayZeileQuillHostElement;
      this.zeileQuillSession = this.overlayZeileQuillSession;
      const result = fn();
      this.bearbeitungOverlay = this.bearbeitung;
      this.bearbeitungOverlayIndex = this.bearbeitungIndex;
      this.overlayZeileQuillInstanz = this.zeileQuillInstanz;
      this.overlayZeileMentionController = this.zeileMentionController;
      this.overlayZeileQuillHostElement = this.zeileQuillHostElement;
      this.overlayZeileQuillSession = this.zeileQuillSession;
      this.bearbeitung = snapshot.bearbeitung;
      this.bearbeitungIndex = snapshot.bearbeitungIndex;
      this.zeileQuillInstanz = snapshot.zeileQuillInstanz;
      this.zeileMentionController = snapshot.zeileMentionController;
      this.zeileQuillHostElement = snapshot.zeileQuillHostElement;
      this.zeileQuillSession = snapshot.zeileQuillSession;
      return result;
    },
    zeileModalOeffnenAlsOverlay(typ, zeile, index) {
      this.overlayZeileQuillInstanz = null;
      this.overlayZeileMentionController = null;
      this.overlayZeileQuillHostElement = null;
      this.overlayZeileQuillSession += 1;
      const zeileKopie = JSON.parse(JSON.stringify(zeile));
      if (!Array.isArray(zeileKopie.medien)) {
        zeileKopie.medien = [];
      }
      if (typeof zeileKopie.primaryMediumId !== 'string') {
        zeileKopie.primaryMediumId = '';
      }
      if (typ === 'fraktion') {
        zeileKopie.orte = this.fraktionOrteListe(zeileKopie);
      }
      if ((typ === 'npc' || typ === 'bestie') && !Array.isArray(zeileKopie.inventar)) {
        zeileKopie.inventar = [];
      }
      this.bearbeitungOverlay = { typ, zeile: zeileKopie };
      this.bearbeitungOverlayIndex = index;
    },
    overlaySchliesseZeileModal() {
      this.withModalKontext('overlay', () => this.schliesseZeileModal());
      this.overlayZeileQuillAufraeumen();
      this.bearbeitungOverlay = null;
      this.bearbeitungOverlayIndex = -1;
    },
    zeileQuillAufraeumen({
      quill = this.zeileQuillInstanz,
      hostElement = this.zeileQuillHostElement,
      mentionController = this.zeileMentionController,
      selectionHandler = this.zeileQuillSelectionHandler,
      toolbarContainer = null,
    } = {}) {
      const lifecycle = window.HTBAH_SHARED && window.HTBAH_SHARED.QuillLifecycle;
      const modalBody =
        toolbarContainer ||
        (this.$refs.zeileModalElement && this.$refs.zeileModalElement.querySelector('.modal-body'));
      if (lifecycle && typeof lifecycle.zerstoereQuillInstanz === 'function') {
        lifecycle.zerstoereQuillInstanz({
          quill,
          hostElement,
          mentionController,
          handler: selectionHandler ? [{ event: 'selection-change', fn: selectionHandler }] : [],
          toolbarContainer: modalBody,
        });
      } else if (mentionController && typeof mentionController.destroy === 'function') {
        mentionController.destroy();
      }
    },
    overlayZeileQuillAufraeumen() {
      this.zeileQuillAufraeumen({
        quill: this.overlayZeileQuillInstanz,
        hostElement: this.overlayZeileQuillHostElement,
        mentionController: this.overlayZeileMentionController,
        selectionHandler: this.overlayZeileQuillSelectionHandler,
        toolbarContainer:
          this.$refs.zeileModalElement && this.$refs.zeileModalElement.querySelector('.modal-body'),
      });
      this.overlayZeileMentionController = null;
      this.overlayZeileQuillInstanz = null;
      this.overlayZeileQuillHostElement = null;
      this.overlayZeileQuillSelectionHandler = null;
    },
    overlayZeileSpeichern() {
      this.withModalKontext('overlay', () => this.zeileSpeichernIntern({ schliessenNachSpeichern: true }));
      this.overlaySchliesseZeileModal();
    },
    overlayZeileBearbeitungBeiBlurSpeichern() {
      this.withModalKontext('overlay', () => this.zeileBearbeitungBeiBlurSpeichern());
    },
    overlayZufallsvorschlagUebernehmen(payload) {
      this.withModalKontext('overlay', () => this.zufallsvorschlagUebernehmen(payload));
    },
    overlayMediaUpload(event) {
      this.withModalKontext('overlay', () => this.onBearbeitungsMedienDateienGewaehlt(event));
    },
    overlayMediaRemove(index) {
      this.withModalKontext('overlay', () => this.mediumAusBearbeitungEntfernen(index));
    },
    overlayMediaSetPrimary(mediumId) {
      this.withModalKontext('overlay', () => this.setzeBearbeitungPrimaryMedium(mediumId));
    },
    overlayMediaDownload(medium) {
      this.withModalKontext('overlay', () => this.mediumHerunterladen(medium));
    },
    onGlobalOpenEntityRequest(event) {
      const detail = event && event.detail ? event.detail : null;
      if (!detail || !detail.entityType || !detail.entityId) {
        return;
      }
      if (detail.openMode === 'focus') {
        event.preventDefault();
        return;
      }
      const erfolg = this.oeffneEntitaetAusMention(detail);
      if (erfolg) {
        event.preventDefault();
      }
    },
    persist() {
      window.HTBAH.speichereZufallstabellenZustand(this.zustand, this.kampagneIdEffektiv);
    },
    typSingularAusTabellenTyp(tabellenTyp) {
      const map = {
        npcs: 'npc',
        orte: 'ort',
        gegenstaende: 'gegenstand',
        fraktionen: 'fraktion',
        pantheon: 'pantheon',
        raetsel: 'raetsel',
        bestien: 'bestie',
      };
      return map[tabellenTyp] || '';
    },
    entitaetLayoutKeyPasstZuTypUndId(layoutKey, typ, id) {
      const key = String(layoutKey || '').trim();
      const entitaetId = String(id || '').trim();
      if (!key || !typ || !entitaetId) {
        return false;
      }
      if (typ === 'fraktion') {
        return key === `fraktion:${entitaetId}` || key.startsWith(`fraktion:${entitaetId}:`);
      }
      return key === `${typ}:${entitaetId}`;
    },
    bereinigeWeltenbauMapFeld(weltenbauMap, entitaeten) {
      if (!weltenbauMap || typeof weltenbauMap !== 'object') {
        return { map: {}, geaendert: false };
      }
      let geaendert = false;
      const bereinigt = Object.fromEntries(
        Object.entries(weltenbauMap).map(([gruppeKey, gruppeWert]) => {
          if (!gruppeWert || typeof gruppeWert !== 'object') {
            return [gruppeKey, gruppeWert];
          }
          const altEintraege = Object.entries(gruppeWert);
          const neuEintraege = altEintraege.filter(([layoutKey]) => !entitaeten.some(({ typ, id }) => this.entitaetLayoutKeyPasstZuTypUndId(layoutKey, typ, id)));
          if (neuEintraege.length !== altEintraege.length) {
            geaendert = true;
          }
          return [gruppeKey, Object.fromEntries(neuEintraege)];
        }),
      );
      return { map: bereinigt, geaendert };
    },
    bereinigeWeltenbauLayoutdaten(entitaetenRoh) {
      const entitaeten = (Array.isArray(entitaetenRoh) ? entitaetenRoh : [])
        .map((eintrag) => ({
          typ: String(eintrag && eintrag.typ ? eintrag.typ : '').trim(),
          id: String(eintrag && eintrag.id ? eintrag.id : '').trim(),
        }))
        .filter((eintrag) => !!eintrag.typ && !!eintrag.id);
      if (!entitaeten.length) {
        return;
      }
      const wb = window.HTBAH.ladeWeltenbauZustand(this.kampagneIdEffektiv);
      const layouts = this.bereinigeWeltenbauMapFeld(wb.mapLayouts, entitaeten);
      const bildLayouts = this.bereinigeWeltenbauMapFeld(wb.mapBildLayouts, entitaeten);
      const locks = this.bereinigeWeltenbauMapFeld(wb.mapElementLocks, entitaeten);
      if (!layouts.geaendert && !bildLayouts.geaendert && !locks.geaendert) {
        return;
      }
      wb.mapLayouts = layouts.map;
      wb.mapBildLayouts = bildLayouts.map;
      wb.mapElementLocks = locks.map;
      window.HTBAH.speichereWeltenbauZustand(wb, this.kampagneIdEffektiv);
    },
    entitaetenAuswahlSchluessel(typ, id) {
      return `${typ}:${id}`;
    },
    istEntitaetAusgewaehlt(typ, id) {
      return !!this.entitaetenAuswahl[this.entitaetenAuswahlSchluessel(typ, id)];
    },
    setzeEntitaetAuswahl(typ, id, wert) {
      const k = this.entitaetenAuswahlSchluessel(typ, id);
      const neu = { ...this.entitaetenAuswahl };
      if (wert) {
        neu[k] = true;
      } else {
        delete neu[k];
      }
      this.entitaetenAuswahl = neu;
    },
    toggleEntitaetAuswahl(typ, id) {
      this.setzeEntitaetAuswahl(typ, id, !this.istEntitaetAusgewaehlt(typ, id));
    },
    sichtbareEntitaetenSchluesselFuerAuswahl() {
      const pushListe = (typ, rows) => {
        (rows || []).forEach((row) => {
          if (row && row.id) {
            out.push({ typ, id: row.id });
          }
        });
      };
      const out = [];
      pushListe('ort', this.anzeigeOrte);
      pushListe('fraktion', this.anzeigeFraktionen);
      pushListe('npc', this.anzeigeNpcs);
      pushListe('gegenstand', this.anzeigeGegenstaende);
      pushListe('pantheon', this.anzeigePantheon);
      pushListe('raetsel', this.anzeigeRaetsel);
      pushListe('bestie', this.anzeigeBestien);
      return out;
    },
    alleSichtbarenEntitaetenAuswahlUmschalten() {
      const sichtbar = this.sichtbareEntitaetenSchluesselFuerAuswahl();
      const alleMarkiert =
        sichtbar.length > 0 && sichtbar.every((e) => this.istEntitaetAusgewaehlt(e.typ, e.id));
      const neu = { ...this.entitaetenAuswahl };
      if (alleMarkiert) {
        sichtbar.forEach((e) => {
          delete neu[this.entitaetenAuswahlSchluessel(e.typ, e.id)];
        });
      } else {
        sichtbar.forEach((e) => {
          neu[this.entitaetenAuswahlSchluessel(e.typ, e.id)] = true;
        });
      }
      this.entitaetenAuswahl = neu;
    },
    entitaetenAuswahlModusUmschalten() {
      this.entitaetenAuswahlModus = !this.entitaetenAuswahlModus;
      if (!this.entitaetenAuswahlModus) {
        this.entitaetenAuswahl = {};
      }
    },
    duplizierenNeueKampagneAnlegen() {
      const nameRoh = (this.duplizierenNeueKampagneName || '').trim();
      const api = window.HTBAH && window.HTBAH.erstelleSpielleitungKampagne;
      if (typeof api !== 'function') {
        return;
      }
      const res = api({ name: nameRoh || undefined });
      if (!res || !res.ok) {
        window.HTBAH.ui.notify({
          text:
            res && res.fehler === 'name_exists'
              ? 'Eine Kampagne mit diesem Namen existiert bereits.'
              : 'Kampagne konnte nicht angelegt werden.',
          typ: 'danger',
          dauerMs: 7200,
        });
        return;
      }
      this.duplizierenZielKampagneId = res.id;
      this.duplizierenNeueKampagneName = '';
      window.HTBAH.ui.notify({ text: 'Neue Kampagne angelegt und als Ziel gewählt.', typ: 'success' });
    },
    dupliziereEntitaetenMitZiel(eintraege, opts) {
      const o = opts && typeof opts === 'object' ? opts : {};
      const api = window.HTBAH && window.HTBAH.dupliziereZufallstabellenEntitaeten;
      if (typeof api !== 'function') {
        return;
      }
      const zielRoh = (this.duplizierenZielKampagneId || '').trim();
      if (zielRoh === DUPLIKAT_ZIEL_NEUE_KAMPAGNE) {
        window.HTBAH.ui.notify({
          text: 'Bitte zuerst eine neue Kampagne anlegen oder eine bestehende wählen.',
          typ: 'warning',
        });
        return;
      }
      const ziel = zielRoh || this.kampagneIdEffektiv;
      if (!ziel) {
        window.HTBAH.ui.notify({ text: 'Bitte eine Ziel-Kampagne wählen.', typ: 'warning' });
        return;
      }
      const quelle = this.kampagneIdEffektiv;
      if (!quelle) {
        window.HTBAH.ui.notify({ text: 'Keine aktive Kampagne.', typ: 'warning' });
        return;
      }
      const res = api({
        quelleKampagneId: quelle,
        zielKampagneId: ziel,
        eintraege,
      });
      if (!res || !res.ok) {
        window.HTBAH.ui.notify({
          text: (res && res.fehler) || 'Duplizieren fehlgeschlagen.',
          typ: 'danger',
          dauerMs: 7200,
        });
        return;
      }
      if (o.schliesseModal === 'overlay') {
        this.overlaySchliesseZeileModal();
      } else if (o.schliesseModal) {
        this.schliesseZeileModal();
      }
      if (ziel === this.kampagneIdEffektiv) {
        this.zustand = window.HTBAH.ladeZufallstabellenZustand(this.kampagneIdEffektiv);
      }
      this.entitaetenAuswahl = {};
      const n = res.angelegt != null ? res.angelegt : (res.ergebnisse || []).length;
      window.HTBAH.ui.notify({
        text: n === 1 ? 'Eine Entität wurde dupliziert.' : `${n} Entitäten wurden dupliziert.`,
        typ: 'success',
      });
    },
    onHauptZeileModalDuplicate() {
      if (!this.bearbeitung || !this.bearbeitung.zeile || !this.bearbeitung.zeile.id) {
        return;
      }
      this.dupliziereEntitaetenMitZiel([{ typ: this.bearbeitung.typ, id: this.bearbeitung.zeile.id }], {
        schliesseModal: true,
      });
    },
    onOverlayZeileModalDuplicate() {
      if (!this.bearbeitungOverlay || !this.bearbeitungOverlay.zeile || !this.bearbeitungOverlay.zeile.id) {
        return;
      }
      this.dupliziereEntitaetenMitZiel(
        [{ typ: this.bearbeitungOverlay.typ, id: this.bearbeitungOverlay.zeile.id }],
        { schliesseModal: 'overlay' },
      );
    },
    onAusgewaehlteEntitaetenDuplizieren() {
      const eintraege = this.entitaetenAuswahlSchluesselListe
        .map((k) => {
          const p = k.indexOf(':');
          if (p < 1) {
            return null;
          }
          return { typ: k.slice(0, p), id: k.slice(p + 1) };
        })
        .filter(Boolean);
      if (!eintraege.length) {
        window.HTBAH.ui.notify({ text: 'Keine Einträge ausgewählt.', typ: 'warning' });
        return;
      }
      this.dupliziereEntitaetenMitZiel(eintraege, {});
    },
    textVorschau(html) {
      return htbahTextVorschau(html);
    },
    richTextHtml(html) {
      const inhalt = typeof html === 'string' ? html : '';
      return htbahHtmlText(inhalt) ? inhalt : '';
    },
    bereinigeFraktionBeschreibungHtml(html) {
      const E = window.HTBAH_SHARED && window.HTBAH_SHARED.EntitaetDetailFelder;
      if (E && typeof E.bereinigeFraktionBeschreibungHtml === 'function') {
        return E.bereinigeFraktionBeschreibungHtml(html);
      }
      return typeof html === 'string' ? html : '';
    },
    bereinigeNpcNotizenHtml(html) {
      const E = window.HTBAH_SHARED && window.HTBAH_SHARED.EntitaetDetailFelder;
      if (E && typeof E.bereinigeNpcNotizenHtml === 'function') {
        return E.bereinigeNpcNotizenHtml(html);
      }
      return typeof html === 'string' ? html : '';
    },
    bereinigeRaetselNotizenHtml(html) {
      const E = window.HTBAH_SHARED && window.HTBAH_SHARED.EntitaetDetailFelder;
      if (E && typeof E.bereinigeRaetselNotizenHtml === 'function') {
        return E.bereinigeRaetselNotizenHtml(html);
      }
      return typeof html === 'string' ? html : '';
    },
    normSucheText(wert) {
      return String(wert || '')
        .toLocaleLowerCase('de-DE')
        .trim();
    },
    sektionSucheAktiv(sectionId) {
      const cfg = ZUFALLSTABELLEN_SEKTION_SUCHE[sectionId];
      if (!cfg) {
        return false;
      }
      const gq = this.normSucheText(this.sucheGlobal);
      const lq = this.normSucheText(this[cfg.sucheKey]);
      return !!gq || !!lq;
    },
    sektionSucheHatTreffer(sectionId) {
      const cfg = ZUFALLSTABELLEN_SEKTION_SUCHE[sectionId];
      if (!cfg) {
        return false;
      }
      const liste = this[cfg.anzeigeKey];
      return Array.isArray(liste) && liste.length > 0;
    },
    /** Leer-Zelle in Tabellen: unterscheidet „noch keine Zeilen“ und „Suche ohne Treffer“ */
    zufallstabellenLeerNachricht(anzahlRoh, lokaleSuche) {
      const n = Number(anzahlRoh) || 0;
      if (!n) {
        return 'Noch keine Einträge.';
      }
      const qg = this.normSucheText(this.sucheGlobal);
      const ql = this.normSucheText(lokaleSuche);
      if (qg || ql) {
        return 'Keine Treffer für die aktuelle Suche.';
      }
      return 'Noch keine Einträge.';
    },
    zeilenWertAlsText(wert) {
      if (wert == null) {
        return '';
      }
      if (typeof wert === 'string') {
        const raw = wert.trim();
        if (!raw) {
          return '';
        }
        if (raw.includes('<') && raw.includes('>')) {
          return htbahHtmlText(raw);
        }
        return raw;
      }
      return String(wert).trim();
    },
    trifftSucheZu(row, felder, query, extra) {
      const basis = (Array.isArray(felder) ? felder : [])
        .map((feld) => this.zeilenWertAlsText(row ? row[feld] : ''))
        .filter(Boolean)
        .join(' ');
      const gesamterText = `${basis} ${this.zeilenWertAlsText(extra)}`.trim();
      return this.normSucheText(gesamterText).includes(query);
    },
    karteWert(wert) {
      const text = this.zeilenWertAlsText(wert);
      return text || '—';
    },
    initiativeBadgeText(wert) {
      const text = this.zeilenWertAlsText(wert);
      return text || '';
    },
    raetselGeloest(row) {
      return !!(row && row.geloest);
    },
    normalisiereBegabungswert(roh) {
      const n = Math.round(Number(roh));
      if (Number.isNaN(n) || n < 0) {
        return 0;
      }
      return Math.min(40, n);
    },
    normalisiereInitiativeWert(roh, begabungswertHandeln) {
      const txt = String(roh == null ? '' : roh).trim();
      if (!txt) {
        return '';
      }
      const parsed = Math.round(Number(txt));
      if (Number.isNaN(parsed)) {
        return '';
      }
      const max = Math.max(1, 10 + this.normalisiereBegabungswert(begabungswertHandeln));
      const geklammert = Math.max(1, Math.min(max, parsed));
      return String(geklammert);
    },
    lebensstatusFuerZeile(row) {
      if (!row || typeof window.HTBAH.berechneLebenspunkteStatus !== 'function') {
        return { tot: false, bewusstlos: false };
      }
      return window.HTBAH.berechneLebenspunkteStatus(row);
    },
    statusEmoji(row) {
      const status = this.lebensstatusFuerZeile(row);
      if (status.tot) {
        return '💀';
      }
      if (status.bewusstlos) {
        return '😵';
      }
      return '';
    },
    statusZeilenKlasse(row) {
      const status = this.lebensstatusFuerZeile(row);
      if (status.tot) {
        return 'table-error';
      }
      if (status.bewusstlos) {
        return 'table-warning';
      }
      return '';
    },
    statusCardKlasse(row) {
      const status = this.lebensstatusFuerZeile(row);
      if (status.tot) {
        return 'zufall-status-error';
      }
      if (status.bewusstlos) {
        return 'zufall-status-warning';
      }
      return '';
    },
    indexNachId(liste, id) {
      return (liste || []).findIndex((row) => row.id === id);
    },
    listeFuerEntitaetTyp(typ) {
      const key =
        typ === 'npc'
          ? 'npcs'
          : typ === 'ort'
            ? 'orte'
            : typ === 'fraktion'
              ? 'fraktionen'
              : typ === 'pantheon'
                ? 'pantheon'
                : typ === 'raetsel'
                  ? 'raetsel'
                  : typ === 'bestie'
                    ? 'bestien'
                    : typ === 'gegenstand'
                      ? 'gegenstaende'
                      : '';
      if (!key || !this.zustand) {
        return [];
      }
      return Array.isArray(this.zustand[key]) ? this.zustand[key] : [];
    },
    zeileListenIndex(typ, id) {
      return this.listeFuerEntitaetTyp(typ).findIndex((row) => row && row.id === id);
    },
    kannZeileNachOben(typ, id) {
      return this.zeileListenIndex(typ, id) > 0;
    },
    kannZeileNachUnten(typ, id) {
      const liste = this.listeFuerEntitaetTyp(typ);
      const idx = this.zeileListenIndex(typ, id);
      return idx >= 0 && idx < liste.length - 1;
    },
    zeileReihenfolgeAendern(typ, id, richtung) {
      const liste = this.listeFuerEntitaetTyp(typ);
      const idx = this.zeileListenIndex(typ, id);
      if (idx < 0) {
        return;
      }
      const ziel = richtung === 'oben' ? idx - 1 : idx + 1;
      if (ziel < 0 || ziel >= liste.length) {
        return;
      }
      const [eintrag] = liste.splice(idx, 1);
      liste.splice(ziel, 0, eintrag);
      this.persist();
    },
    medienAusZeile(row) {
      return row && Array.isArray(row.medien) ? row.medien : [];
    },
    medienBilderAusZeile(row) {
      return this.medienAusZeile(row).filter((m) => this.mediumIstBild(m));
    },
    featuredBildAusZeile(row) {
      const bilder = this.medienBilderAusZeile(row);
      if (!bilder.length) {
        return null;
      }
      const primaryId = row && typeof row.primaryMediumId === 'string' ? row.primaryMediumId.trim() : '';
      if (!primaryId) {
        return bilder[0];
      }
      return bilder.find((bild) => bild.id === primaryId) || bilder[0];
    },
    medienDateienAusZeile(row) {
      return this.medienAusZeile(row).filter((m) => !this.mediumIstBild(m));
    },
    medienAnzahl(row) {
      return this.medienAusZeile(row).length;
    },
    mediumIstBild(medium) {
      if (!medium || typeof medium !== 'object') {
        return false;
      }
      if (medium.typ === 'bild') {
        return true;
      }
      if (typeof medium.mimeType === 'string' && medium.mimeType.startsWith('image/')) {
        return true;
      }
      return typeof medium.dataUrl === 'string' && medium.dataUrl.startsWith('data:image/');
    },
    mediumDateiname(medium) {
      if (!medium) {
        return 'Datei';
      }
      const text = String(medium.name || '').trim();
      if (text) {
        return text;
      }
      return this.mediumIstBild(medium) ? 'Bild' : 'Datei';
    },
    mediumDateiTypLabel(medium) {
      const mime = String((medium && medium.mimeType) || '').trim();
      if (mime) {
        return mime;
      }
      return this.mediumIstBild(medium) ? 'Bilddatei' : 'Datei';
    },
    mediumDateigroesseLabel(medium) {
      return zufallstabellenFormatBytes(medium && medium.size);
    },
    mediumImBildbetrachterOeffnen(medium) {
      if (!this.mediumIstBild(medium)) {
        return;
      }
      const dataUrl = typeof medium.dataUrl === 'string' ? medium.dataUrl : '';
      if (!dataUrl.startsWith('data:image/')) {
        return;
      }
      window.HTBAH.bildbetrachterOeffnen({
        dataUrl,
        titel: this.mediumDateiname(medium),
      });
    },
    mediumHerunterladen(medium) {
      if (!medium || typeof medium.dataUrl !== 'string' || !medium.dataUrl.startsWith('data:')) {
        return;
      }
      const a = document.createElement('a');
      a.href = medium.dataUrl;
      a.download = this.mediumDateiname(medium);
      document.body.appendChild(a);
      a.click();
      a.remove();
    },
    mediumAusBearbeitungEntfernen(index) {
      if (!this.bearbeitung || !this.bearbeitung.zeile || !Array.isArray(this.bearbeitung.zeile.medien)) {
        return;
      }
      if (!Number.isInteger(index) || index < 0 || index >= this.bearbeitung.zeile.medien.length) {
        return;
      }
      const entfernt = this.bearbeitung.zeile.medien[index];
      this.bearbeitung.zeile.medien.splice(index, 1);
      const kartenIconApi = window.HTBAH_SHARED && window.HTBAH_SHARED.EntityKartenIcon;
      if (kartenIconApi && entfernt && entfernt.id && this.bearbeitung.typ) {
        kartenIconApi.bereinigeKartenIconNachMediumEntfernung(
          this.bearbeitung.zeile,
          this.bearbeitung.typ,
          entfernt.id,
        );
      }
      const primaryId = String(this.bearbeitung.zeile.primaryMediumId || '').trim();
      if (!primaryId || !entfernt || primaryId !== entfernt.id) {
        this.zeileBearbeitungBeiBlurSpeichern();
        return;
      }
      const fallback = this.medienBilderAusZeile(this.bearbeitung.zeile)[0];
      this.bearbeitung.zeile.primaryMediumId = fallback && fallback.id ? fallback.id : '';
      this.zeileBearbeitungBeiBlurSpeichern();
    },
    mediumZurBearbeitungHinzufuegen(eintrag) {
      if (!this.bearbeitung || !this.bearbeitung.zeile || !eintrag) {
        return;
      }
      if (!Array.isArray(this.bearbeitung.zeile.medien)) {
        this.bearbeitung.zeile.medien = [];
      }
      this.bearbeitung.zeile.medien.push(eintrag);
      if (this.mediumIstBild(eintrag)) {
        const primaryId = String(this.bearbeitung.zeile.primaryMediumId || '').trim();
        if (!primaryId) {
          this.bearbeitung.zeile.primaryMediumId = eintrag.id;
        }
      }
    },
    async setzeBearbeitungPrimaryMedium(mediumId) {
      if (!this.bearbeitung || !this.bearbeitung.zeile || !Array.isArray(this.bearbeitung.zeile.medien)) {
        return;
      }
      const id = typeof mediumId === 'string' ? mediumId.trim() : '';
      if (!id) {
        return;
      }
      const medium = this.bearbeitung.zeile.medien.find((m) => m && m.id === id);
      if (!this.mediumIstBild(medium)) {
        return;
      }
      const bisherigePrimaryId = String(this.bearbeitung.zeile.primaryMediumId || '').trim();
      if (
        this.bearbeitung.typ === 'ort' &&
        bisherigePrimaryId &&
        bisherigePrimaryId !== id &&
        this.mediumIstBild(this.bearbeitung.zeile.medien.find((m) => m && m.id === bisherigePrimaryId))
      ) {
        const bestaetigt = await window.HTBAH.ui.confirm({
          titel: 'Titelbild ersetzen?',
          beschreibung:
            'Dieser Ort hat bereits ein Titelbild. Soll das bestehende Bild in der Interaktiven Welt durch das neue ersetzt werden?',
          bestaetigenText: 'Ersetzen',
          bestaetigenButtonClass: 'btn-warning',
          warnhinweisAnzeigen: false,
        });
        if (!bestaetigt) {
          return;
        }
      }
      this.bearbeitung.zeile.primaryMediumId = id;
      this.zeileBearbeitungBeiBlurSpeichern();
    },
    abbrecheMedienImportWarteschlange() {
      this.medienImportWarteschlange = [];
      if (this.bildImportTimeoutId != null) {
        window.clearTimeout(this.bildImportTimeoutId);
        this.bildImportTimeoutId = null;
      }
    },
    bildImportNaechstesAusWarteschlange() {
      if (!this.medienImportWarteschlange.length) {
        return;
      }
      const file = this.medienImportWarteschlange.shift();
      if (this.bildImportTimeoutId != null) {
        window.clearTimeout(this.bildImportTimeoutId);
      }
      this.bildImportTimeoutId = window.setTimeout(() => {
        this.bildImportTimeoutId = null;
        const modal = this.$refs.zufallstabellenBildImportModal;
        if (modal && typeof modal.oeffnenMitDatei === 'function') {
          modal.oeffnenMitDatei(file);
        }
      }, 200);
    },
    onZufallstabellenBildImportFertig({ dataUrl, name, dateigroesseBytes }) {
      if (!dataUrl || !String(dataUrl).startsWith('data:image/')) {
        this.bildImportNaechstesAusWarteschlange();
        return;
      }
      this.mediumZurBearbeitungHinzufuegen({
        id: window.HTBAH.neueEntropieId(),
        typ: 'bild',
        name: typeof name === 'string' && name.trim() ? name.trim() : 'Bild',
        mimeType: (String(dataUrl).match(/^data:([^;,]+)/i) || [])[1] || '',
        dataUrl,
        size: Number.isFinite(dateigroesseBytes) && dateigroesseBytes > 0 ? Math.round(dateigroesseBytes) : null,
        createdAt: new Date().toISOString(),
      });
      this.zeileBearbeitungBeiBlurSpeichern();
      this.bildImportNaechstesAusWarteschlange();
    },
    onZufallstabellenBildImportAbgebrochen() {
      this.abbrecheMedienImportWarteschlange();
    },
    onZufallstabellenBildImportFehler() {
      this.bildImportNaechstesAusWarteschlange();
    },
    async onBearbeitungsMedienDateienGewaehlt(ev) {
      const input = ev && ev.target ? ev.target : null;
      const dateiListe = input && input.files ? Array.from(input.files) : [];
      if (input) {
        input.value = '';
      }
      if (!dateiListe.length) {
        return;
      }
      const max = ZUFALLSTABELLEN_MAX_ROH_DATEI_BYTES;
      const zuGross = dateiListe.filter((f) => Number.isFinite(f.size) && f.size > max);
      const verwertbar = dateiListe.filter((f) => !Number.isFinite(f.size) || f.size <= max);
      if (zuGross.length) {
        const namen = zuGross.map((f) => `"${f.name}" (${zufallstabellenFormatBytes(f.size)})`).join(', ');
        await window.HTBAH.ui.alert({
          titel: 'Dateien übersprungen',
          beschreibung:
            `Übersprungen (zu groß, max. ${zufallstabellenFormatBytes(max)} pro Datei): ${namen}`,
        });
      }
      const bildDateien = verwertbar.filter(zufallstabellenIstBildDatei);
      const sonstigeDateien = verwertbar.filter((f) => !zufallstabellenIstBildDatei(f));
      if (bildDateien.length) {
        this.medienImportWarteschlange = this.medienImportWarteschlange.concat(bildDateien);
        if (this.medienImportWarteschlange.length === bildDateien.length) {
          this.bildImportNaechstesAusWarteschlange();
        }
      }
      for (const file of sonstigeDateien) {
        try {
          const dataUrl = await zufallstabellenDateiZuDataUrl(file);
          if (!dataUrl || !dataUrl.startsWith('data:')) {
            throw new Error('Ungültige Datei');
          }
          this.mediumZurBearbeitungHinzufuegen({
            id: window.HTBAH.neueEntropieId(),
            typ: 'datei',
            name: typeof file.name === 'string' && file.name.trim() ? file.name.trim() : 'Datei',
            mimeType: typeof file.type === 'string' ? file.type : '',
            dataUrl,
            size: Number.isFinite(file.size) && file.size > 0 ? Math.round(file.size) : null,
            createdAt: new Date().toISOString(),
          });
          this.zeileBearbeitungBeiBlurSpeichern();
        } catch {
          await window.HTBAH.ui.alert({
            titel: 'Datei konnte nicht gelesen werden',
            beschreibung: `Datei konnte nicht gelesen werden: ${file && file.name ? file.name : 'Unbekannt'}`,
          });
        }
      }
    },
    galerieFuerZeileOeffnen(row) {
      this.galerieModalZeile = row || null;
      this.$nextTick(() => {
        const el = this.$refs.galerieModalElement;
        if (!el || !window.bootstrap) {
          return;
        }
        this.galerieModalInstanz = window.bootstrap.Modal.getOrCreateInstance(el);
        this.galerieModalInstanz.show();
      });
    },
    onGalerieModalHidden() {
      this.galerieModalZeile = null;
    },
    zeileBearbeitenAusListe(typ, row) {
      if (!row) {
        return;
      }
      let liste;
      if (typ === 'npc') {
        liste = this.zustand.npcs;
      } else if (typ === 'ort') {
        liste = this.zustand.orte;
      } else if (typ === 'fraktion') {
        liste = this.zustand.fraktionen;
      } else if (typ === 'pantheon') {
        liste = this.zustand.pantheon;
      } else if (typ === 'raetsel') {
        liste = this.zustand.raetsel;
      } else if (typ === 'bestie') {
        liste = this.zustand.bestien;
      } else {
        liste = this.zustand.gegenstaende;
      }
      const idx = this.indexNachId(liste, row.id);
      if (typ === 'npc') {
        this.npcBearbeiten(row, idx);
      } else if (typ === 'ort') {
        this.ortBearbeiten(row, idx);
      } else if (typ === 'fraktion') {
        this.fraktionBearbeiten(row, idx);
      } else if (typ === 'pantheon') {
        this.pantheonBearbeiten(row, idx);
      } else if (typ === 'raetsel') {
        this.raetselBearbeiten(row, idx);
      } else if (typ === 'bestie') {
        this.bestieBearbeiten(row, idx);
      } else {
        this.gegenstandBearbeiten(row, idx);
      }
    },
    npcWaffenWerteText(row) {
      return this.entitaetInventarWaffenAnzeigeText(row);
    },
    bestieKategorieLabel(kategorie) {
      const E = window.HTBAH_SHARED && window.HTBAH_SHARED.EntitaetDetailFelder;
      if (E && typeof E.bestieKategorieLabel === 'function') {
        return E.bestieKategorieLabel(kategorie);
      }
      return 'Normales Tier';
    },
    bestieAggressivitaetText(row) {
      const E = window.HTBAH_SHARED && window.HTBAH_SHARED.EntitaetDetailFelder;
      if (E && typeof E.bestieAggressivitaetText === 'function') {
        return E.bestieAggressivitaetText(row);
      }
      return '—';
    },
    begabungenAusEntitaetZeile(row) {
      const EF = window.HTBAH_ENTITAET_FAEHIGKEITEN_MODEL;
      if (!row || typeof row !== 'object' || !EF || typeof EF.begabungenAusEntitaet !== 'function') {
        return { handeln: 0, wissen: 0, soziales: 0 };
      }
      return EF.begabungenAusEntitaet(row);
    },
    begabungHandelnAusEntitaetZeile(row) {
      const EF = window.HTBAH_ENTITAET_FAEHIGKEITEN_MODEL;
      if (!row || typeof row !== 'object' || !EF || typeof EF.begabungHandelnAusEntitaet !== 'function') {
        return 0;
      }
      return EF.begabungHandelnAusEntitaet(row);
    },
    begabungswerteKurzText(row) {
      if (!row || typeof row !== 'object') {
        return 'H 0 · W 0 · S 0';
      }
      const b = this.begabungenAusEntitaetZeile(row);
      const h = this.normalisiereBegabungswert(b.handeln);
      const w = this.normalisiereBegabungswert(b.wissen);
      const s = this.normalisiereBegabungswert(b.soziales);
      return `H ${h} · W ${w} · S ${s}`;
    },
    paradeWuerfelnFuerEntitaet(row, typ) {
      const handeln = this.begabungHandelnAusEntitaetZeile(row);
      const typLabel = typ === 'bestie' ? 'Bestie' : 'NPC';
      const name = this.zeilenWertAlsText(row && row.name);
      this.$refs.paradeModal?.oeffnen({
        titel: `Parade-Probe (${typLabel}${name ? `: ${name}` : ''})`,
        basiswert: handeln,
        ruestungen: [],
        waffenlosParade: true,
      });
    },
    entitaetInventarWaffenAnzeigeText(zeile, opts) {
      const E = window.HTBAH_SHARED && window.HTBAH_SHARED.EntitaetDetailFelder;
      if (E && typeof E.entitaetInventarWaffenAnzeigeText === 'function') {
        return E.entitaetInventarWaffenAnzeigeText(zeile, opts);
      }
      return '—';
    },
    schadenWuerfelnFuerEntitaet(row, typ) {
      const typLabel = typ === 'bestie' ? 'Bestie' : 'NPC';
      const name = this.zeilenWertAlsText(row && row.name);
      this.$refs.schadenModal?.oeffnen({
        titel: `Schaden würfeln (${typLabel}${name ? `: ${name}` : ''})`,
        charakter: row,
      });
    },
    gegenstandWaffenWerteText(row) {
      const E = window.HTBAH_SHARED && window.HTBAH_SHARED.EntitaetDetailFelder;
      if (E && typeof E.gegenstandWaffenWerteText === 'function') {
        return E.gegenstandWaffenWerteText(row);
      }
      return '—';
    },
    fraktionOrteListe(row) {
      const E = window.HTBAH_SHARED && window.HTBAH_SHARED.EntitaetDetailFelder;
      if (E && typeof E.fraktionOrteListe === 'function') {
        return E.fraktionOrteListe(row);
      }
      return [];
    },
    fraktionOrteText(row) {
      const E = window.HTBAH_SHARED && window.HTBAH_SHARED.EntitaetDetailFelder;
      if (E && typeof E.fraktionOrteText === 'function') {
        return E.fraktionOrteText(row);
      }
      return '';
    },
    npcLeer() {
      return {
        id: window.HTBAH.neueEntropieId(),
        name: '',
        spitzname: '',
        geschlecht: '',
        alter: '',
        familienstand: '',
        statur: '',
        gesinnung: '',
        beruf: '',
        ziel: '',
        geheimnis: '',
        stimme: '',
        lebenspunkte: '',
        kampfZustand: 'vital',
        aufenthaltsort: '',
        presetId: 'htbah-mittelalter-fantasy',
        handeln: [],
        wissen: [],
        soziales: [],
        initiative: '',
        fraktion: '',
        glaube: '',
        inventar: [],
        notizenHtml: '',
        medien: [],
        primaryMediumId: '',
      };
    },
    ortLeer() {
      return {
        id: window.HTBAH.neueEntropieId(),
        name: '',
        groesse: '',
        lage: '',
        zustand: '',
        notizenHtml: '',
        medien: [],
        primaryMediumId: '',
        kartenIcon: { quelle: '', emoji: '', mediumId: '', eigenDataUrl: '', form: 'eckig' },
      };
    },
    gegenstandLeer() {
      return {
        id: window.HTBAH.neueEntropieId(),
        name: '',
        kategorie: '',
        beschreibungHtml: '',
        aufenthaltsort: '',
        inGegenstandId: '',
        besitzerTyp: '',
        besitzerId: '',
        istWaffe: false,
        schadenswertNahkampf: '',
        schadenswertFernkampf: '',
        handeln: 16,
        wissen: 8,
        soziales: 16,
        lpBewusstlosAusgeblendet: false,
        lpMassenschadenBewusstlos: false,
        medien: [],
        primaryMediumId: '',
        kartenIcon: { quelle: '', emoji: '', mediumId: '', eigenDataUrl: '', form: 'eckig' },
      };
    },
    fraktionLeer() {
      return {
        id: window.HTBAH.neueEntropieId(),
        art: '',
        name: '',
        ziel: '',
        gesinnungVerhalten: '',
        orte: [],
        beschreibungHtml: '',
        medien: [],
        primaryMediumId: '',
        kartenIcon: { quelle: '', emoji: '', mediumId: '', eigenDataUrl: '', form: 'eckig' },
      };
    },
    pantheonLeer() {
      return {
        id: window.HTBAH.neueEntropieId(),
        name: '',
        geschlecht: '',
        domaene: '',
        charakter: '',
        staerke: '',
        schwaeche: '',
        schutzpatronat: '',
        verlangen: '',
        mythosGaben: '',
        notizenHtml: '',
        medien: [],
      };
    },
    raetselLeer() {
      return {
        id: window.HTBAH.neueEntropieId(),
        art: '',
        titel: '',
        aufenthaltsort: '',
        gegenstandId: '',
        aufgabenstellung: '',
        ergebnis: '',
        schwierigkeit: '',
        geloest: false,
        notizenHtml: '',
        medien: [],
        primaryMediumId: '',
        kartenIcon: { quelle: '', emoji: '', mediumId: '', eigenDataUrl: '', form: 'eckig' },
      };
    },
    bestieLeer() {
      return {
        id: window.HTBAH.neueEntropieId(),
        epoche: htbahStandardZufallEpoche(),
        kategorie: 'normales_tier',
        name: '',
        lebenspunkte: '',
        aufenthaltsort: '',
        presetId: 'htbah-mittelalter-fantasy',
        handeln: [],
        wissen: [],
        soziales: [],
        initiative: '',
        kampfZustand: 'vital',
        staerke: '',
        schwaeche: '',
        geheimnis: '',
        beschreibungHtml: '',
        aggressivitaetSkala: 5,
        inventar: [],
        medien: [],
        primaryMediumId: '',
      };
    },
    zeileQuillOrphanToolbarsInModalBodyEntfernen() {
      const modal = this.$refs.zeileModalElement;
      if (!modal) {
        return;
      }
      const body = modal.querySelector('.modal-body');
      if (!body) {
        return;
      }
      /* Quill hängt .ql-toolbar als Geschwister vor den Host — ohne Wrapper bleiben sie bei v-if/key von Vue liegen */
      body.querySelectorAll(':scope > .ql-toolbar.ql-snow').forEach((node) => {
        node.remove();
      });
    },
    zeileModalOeffnen(typ, zeile, index) {
      this.zeileQuillInstanz = null;
      this.zeileQuillHostElement = null;
      this.zeileQuillSession += 1;
      const zeileKopie = JSON.parse(JSON.stringify(zeile));
      if (!Array.isArray(zeileKopie.medien)) {
        zeileKopie.medien = [];
      }
      if (typeof zeileKopie.primaryMediumId !== 'string') {
        zeileKopie.primaryMediumId = '';
      }
      const kartenIconApi = window.HTBAH_SHARED && window.HTBAH_SHARED.EntityKartenIcon;
      if (kartenIconApi && typeof kartenIconApi.stelleKartenIconSicher === 'function') {
        kartenIconApi.stelleKartenIconSicher(zeileKopie, typ);
      }
      if (typ === 'fraktion') {
        zeileKopie.orte = this.fraktionOrteListe(zeileKopie);
      }
      if ((typ === 'npc' || typ === 'bestie') && !Array.isArray(zeileKopie.inventar)) {
        zeileKopie.inventar = [];
      }
      const EF = window.HTBAH_ENTITAET_FAEHIGKEITEN_MODEL;
      if (
        (typ === 'npc' || typ === 'bestie') &&
        EF &&
        typeof EF.istFaehigkeitenArrayFormat === 'function' &&
        typeof EF.normalisiereEntitaetFaehigkeiten === 'function' &&
        !EF.istFaehigkeitenArrayFormat(zeileKopie)
      ) {
        const norm = EF.normalisiereEntitaetFaehigkeiten(zeileKopie, {
          typ,
          fallbackEpocheUi:
            typ === 'bestie'
              ? String(zeileKopie.epoche || this.zufallBestieEpoche || 'mittelalter').trim()
              : String(this.zufallNpcEpoche || 'mittelalter').trim(),
        });
        zeileKopie.presetId = norm.presetId;
        zeileKopie.handeln = norm.handeln;
        zeileKopie.wissen = norm.wissen;
        zeileKopie.soziales = norm.soziales;
      }
      this.bearbeitung = {
        typ,
        zeile: zeileKopie,
      };
      this.bearbeitungIndex = index;
      this.$nextTick(() => this.zeileQuillOrphanToolbarsInModalBodyEntfernen());
    },
    npcHinzufuegen() {
      this.zeileModalOeffnen('npc', this.npcLeer(), -1);
    },
    npcBearbeiten(row, index) {
      this.zeileModalOeffnen('npc', row, index);
    },
    ortHinzufuegen() {
      this.zeileModalOeffnen('ort', this.ortLeer(), -1);
    },
    ortBearbeiten(row, index) {
      this.zeileModalOeffnen('ort', row, index);
    },
    gegenstandHinzufuegen() {
      this.zeileModalOeffnen('gegenstand', this.gegenstandLeer(), -1);
    },
    gegenstandBearbeiten(row, index) {
      this.zeileModalOeffnen('gegenstand', row, index);
    },
    fraktionHinzufuegen() {
      this.zeileModalOeffnen('fraktion', this.fraktionLeer(), -1);
    },
    fraktionBearbeiten(row, index) {
      this.zeileModalOeffnen('fraktion', row, index);
    },
    pantheonHinzufuegen() {
      this.zeileModalOeffnen('pantheon', this.pantheonLeer(), -1);
    },
    pantheonBearbeiten(row, index) {
      this.zeileModalOeffnen('pantheon', row, index);
    },
    raetselHinzufuegen() {
      this.zeileModalOeffnen('raetsel', this.raetselLeer(), -1);
    },
    raetselBearbeiten(row, index) {
      this.zeileModalOeffnen('raetsel', row, index);
    },
    bestieHinzufuegen() {
      this.zeileModalOeffnen('bestie', this.bestieLeer(), -1);
    },
    bestieBearbeiten(row, index) {
      this.zeileModalOeffnen('bestie', row, index);
    },
    htmlFuerQuillAusBearbeitung() {
      if (!this.bearbeitung) {
        return '';
      }
      if (this.bearbeitung.typ === 'gegenstand') {
        return this.bearbeitung.zeile.beschreibungHtml || '';
      }
      if (this.bearbeitung.typ === 'fraktion') {
        return this.bearbeitung.zeile.beschreibungHtml || '';
      }
      if (this.bearbeitung.typ === 'bestie') {
        return this.bearbeitung.zeile.beschreibungHtml || '';
      }
      return this.bearbeitung.zeile.notizenHtml || '';
    },
    htmlFuerQuillAusBearbeitungOverlay() {
      if (!this.bearbeitungOverlay) {
        return '';
      }
      if (this.bearbeitungOverlay.typ === 'gegenstand') {
        return this.bearbeitungOverlay.zeile.beschreibungHtml || '';
      }
      if (this.bearbeitungOverlay.typ === 'fraktion') {
        return this.bearbeitungOverlay.zeile.beschreibungHtml || '';
      }
      if (this.bearbeitungOverlay.typ === 'bestie') {
        return this.bearbeitungOverlay.zeile.beschreibungHtml || '';
      }
      return this.bearbeitungOverlay.zeile.notizenHtml || '';
    },
    overlayZeileQuillHostRef(el) {
      if (!el) {
        if (this.overlayZeileMentionController && typeof this.overlayZeileMentionController.destroy === 'function') {
          this.overlayZeileMentionController.destroy();
        }
        this.overlayZeileMentionController = null;
        this.overlayZeileQuillInstanz = null;
        this.overlayZeileQuillHostElement = null;
        return;
      }
      if (!this.bearbeitungOverlay) {
        return;
      }
      this.$nextTick(() => {
        if (!this.bearbeitungOverlay) {
          return;
        }
        this.overlayZeileQuillAufHostEinrichten(el);
      });
    },
    overlayZeileQuillAufHostEinrichten(el, quillRetry, sessionAtStart) {
      const r = typeof quillRetry === 'number' ? quillRetry : 0;
      const session =
        typeof sessionAtStart === 'number' ? sessionAtStart : this.overlayZeileQuillSession;
      if (session !== this.overlayZeileQuillSession) {
        return;
      }
      if (!el || !this.bearbeitungOverlay) {
        return;
      }
      if (!window.Quill) {
        if (r < 40) {
          setTimeout(() => this.overlayZeileQuillAufHostEinrichten(el, r + 1, session), 25);
        }
        return;
      }
      if (
        this.overlayZeileQuillInstanz &&
        this.overlayZeileQuillHostElement === el &&
        el.contains(this.overlayZeileQuillInstanz.root)
      ) {
        return;
      }
      this.overlayZeileQuillAufraeumen();
      this.zeileQuillHostDomLeeren(el);
      this.overlayZeileQuillHostElement = el;
      this.overlayZeileQuillInstanz = new window.Quill(el, {
        theme: 'snow',
        placeholder: 'Text formatieren…',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline'],
            [{ color: [] }, { background: [] }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['blockquote', 'code-block'],
            [{ header: [1, 2, false] }],
            ['clean'],
          ],
        },
      });
      if (this.overlayZeileMentionController && typeof this.overlayZeileMentionController.destroy === 'function') {
        this.overlayZeileMentionController.destroy();
      }
      const mentionApi = window.HTBAH_SHARED && window.HTBAH_SHARED.QuillEntityMentions;
      if (mentionApi && typeof mentionApi.installMentions === 'function') {
        this.overlayZeileMentionController = mentionApi.installMentions(this.overlayZeileQuillInstanz, {
          getItems: (query) => this.mentionItemsFuerQuill(query),
          onEntityClick: (target) => this.oeffneEntitaetAusMention(target),
        });
      }
      this.overlayZeileQuillInstanz.root.innerHTML = this.htmlFuerQuillAusBearbeitungOverlay();
      this.overlayZeileQuillSelectionHandler = (range, oldRange) => {
        if (this.bearbeitungOverlay && this.bearbeitungOverlayIndex >= 0 && oldRange && !range) {
          this.overlayZeileBearbeitungBeiBlurSpeichern();
        }
      };
      this.overlayZeileQuillInstanz.on('selection-change', this.overlayZeileQuillSelectionHandler);
    },
    zeileQuillHostRef(el) {
      if (!el) {
        this.zeileQuillInstanz = null;
        this.zeileQuillHostElement = null;
        return;
      }
      if (!this.bearbeitung) {
        return;
      }
      this.$nextTick(() => {
        if (!this.bearbeitung) {
          return;
        }
        this.zeileQuillAufHostEinrichten(el);
      });
    },
    zeileQuillHostDomLeeren(el) {
      if (!el) {
        return;
      }
      el.querySelectorAll('.ql-toolbar.ql-snow').forEach((node) => {
        node.remove();
      });
      el.innerHTML = '';
    },
    zeileQuillAufHostEinrichten(el, quillRetry, sessionAtStart) {
      const r = typeof quillRetry === 'number' ? quillRetry : 0;
      const session = typeof sessionAtStart === 'number' ? sessionAtStart : this.zeileQuillSession;
      if (session !== this.zeileQuillSession) {
        return;
      }
      if (!el || !this.bearbeitung) {
        return;
      }
      if (!window.Quill) {
        if (r < 40) {
          setTimeout(() => this.zeileQuillAufHostEinrichten(el, r + 1, session), 25);
        }
        return;
      }
      /* Funktions-:ref wird bei jedem Re-Render erneut aufgerufen — keine zweite Quill-Instanz */
      if (
        this.zeileQuillInstanz &&
        this.zeileQuillHostElement === el &&
        el.contains(this.zeileQuillInstanz.root)
      ) {
        return;
      }
      this.zeileQuillAufraeumen();
      this.zeileQuillHostDomLeeren(el);
      this.zeileQuillHostElement = el;
      this.zeileQuillInstanz = new window.Quill(el, {
        theme: 'snow',
        placeholder: 'Text formatieren…',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline'],
            [{ color: [] }, { background: [] }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['blockquote', 'code-block'],
            [{ header: [1, 2, false] }],
            ['clean'],
          ],
        },
      });
      if (this.zeileMentionController && typeof this.zeileMentionController.destroy === 'function') {
        this.zeileMentionController.destroy();
      }
      const mentionApi = window.HTBAH_SHARED && window.HTBAH_SHARED.QuillEntityMentions;
      if (mentionApi && typeof mentionApi.installMentions === 'function') {
        this.zeileMentionController = mentionApi.installMentions(this.zeileQuillInstanz, {
          getItems: (query) => this.mentionItemsFuerQuill(query),
          onEntityClick: (target) => this.oeffneEntitaetAusMention(target),
        });
      }
      this.zeileQuillInstanz.root.innerHTML = this.htmlFuerQuillAusBearbeitung();
      this.zeileQuillSelectionHandler = (range, oldRange) => {
        if (this.bearbeitung && this.bearbeitungIndex >= 0 && oldRange && !range) {
          this.zeileBearbeitungBeiBlurSpeichern();
        }
      };
      this.zeileQuillInstanz.on('selection-change', this.zeileQuillSelectionHandler);
    },
    schliesseZeileModal() {
      this.zeileQuillAufraeumen();
      this.zeileMentionController = null;
      this.zeileQuillInstanz = null;
      this.zeileQuillHostElement = null;
      this.zeileQuillSelectionHandler = null;
      this.abbrecheMedienImportWarteschlange();
      this.bearbeitung = null;
      this.bearbeitungIndex = -1;
      this.$nextTick(() => this.zeileQuillOrphanToolbarsInModalBodyEntfernen());
    },
    quillHtmlInBearbeitungSchreiben() {
      if (!this.bearbeitung || !this.zeileQuillInstanz) {
        return;
      }
      const html = this.zeileQuillInstanz.root.innerHTML;
      if (
        this.bearbeitung.typ === 'gegenstand' ||
        this.bearbeitung.typ === 'fraktion' ||
        this.bearbeitung.typ === 'bestie'
      ) {
        this.bearbeitung.zeile.beschreibungHtml = html;
      } else {
        this.bearbeitung.zeile.notizenHtml = html;
      }
    },
    quillAusBearbeitungSetzen() {
      if (!this.zeileQuillInstanz) {
        return;
      }
      this.zeileQuillInstanz.root.innerHTML = this.htmlFuerQuillAusBearbeitung();
    },
    zufallsvorschlagUebernehmen(payload) {
      if (!this.bearbeitung || this.bearbeitungIndex >= 0) {
        return;
      }
      const G = window.HTBAH && window.HTBAH.Zufallsgenerator;
      if (!G) {
        return;
      }
      const z = this.bearbeitung.zeile;
      const typ = this.bearbeitung.typ;
      const epocheAusEvent =
        payload && payload.epoche ? String(payload.epoche).trim() : '';
      let felder;
      if (typ === 'npc') {
        const orteNamen = (this.zustand.orte || []).map((o) => (o && o.name ? String(o.name) : ''));
        const fraktionNamen = (this.zustand.fraktionen || []).map((f) =>
          f && f.name ? String(f.name) : '',
        );
        const pantheonNamen = (this.zustand.pantheon || []).map((p) =>
          p && p.name ? String(p.name) : '',
        );
        felder = G.npc({
          epoche: epocheAusEvent || this.zufallNpcEpoche,
          orteNamen,
          fraktionNamen,
          pantheonNamen,
        });
      } else if (typ === 'ort') {
        felder = G.ort({ epoche: epocheAusEvent || this.zufallOrtEpoche });
      } else if (typ === 'fraktion') {
        felder = G.fraktion({ epoche: epocheAusEvent || this.zufallFraktionEpoche });
      } else if (typ === 'pantheon') {
        felder = G.pantheon({ epoche: epocheAusEvent || this.zufallPantheonEpoche });
      } else if (typ === 'raetsel') {
        const orteNamen = (this.zustand.orte || []).map((o) => (o && o.name ? String(o.name) : ''));
        const npcNamen = (this.zustand.npcs || []).map((n) => (n && n.name ? String(n.name) : ''));
        felder = G.raetsel({
          epoche: epocheAusEvent || this.zufallRaetselEpoche,
          orteNamen,
          npcNamen,
        });
      } else if (typ === 'bestie') {
        const orteNamen = (this.zustand.orte || []).map((o) => (o && o.name ? String(o.name) : ''));
        felder = G.bestie({ epoche: epocheAusEvent || this.zufallBestieEpoche, orteNamen });
      } else {
        const orteNamen = (this.zustand.orte || []).map((o) => (o && o.name ? String(o.name) : ''));
        felder = G.gegenstand({
          epoche: epocheAusEvent || this.zufallGegenstandEpoche,
          orteNamen,
        });
      }
      Object.assign(z, felder);
      if ((typ === 'bestie' || typ === 'gegenstand' || typ === 'raetsel') && !String(z.aufenthaltsort || '').trim()) {
        const ortMitNamen = (this.zustand.orte || []).find((o) => String((o && o.name) || '').trim());
        z.aufenthaltsort = ortMitNamen ? String(ortMitNamen.name).trim() : '';
      }
      this.$nextTick(() => this.quillAusBearbeitungSetzen());
    },
    npcFeldNeuWuerfeln(payload) {
      if (!this.bearbeitung || this.bearbeitung.typ !== 'npc' || !this.bearbeitung.zeile) {
        return;
      }
      const modul = window.HTBAH && window.HTBAH.ZufallsgeneratorNpcModul;
      if (!modul || typeof modul.neuBerechnenFeld !== 'function') {
        return;
      }
      const feld = payload && payload.feld ? String(payload.feld) : '';
      if (!feld) {
        return;
      }
      const orteNamen = (this.zustand.orte || []).map((o) => (o && o.name ? String(o.name) : ''));
      const fraktionNamen = (this.zustand.fraktionen || []).map((f) => (f && f.name ? String(f.name) : ''));
      const pantheonNamen = (this.zustand.pantheon || []).map((p) => (p && p.name ? String(p.name) : ''));
      const patch = modul.neuBerechnenFeld(this.bearbeitung.zeile, feld, {
        modus: payload && payload.modus === 'einzeln' ? 'einzeln' : 'mitAbhaengigen',
        epoche: this.zufallNpcEpoche,
        orteNamen,
        fraktionNamen,
        pantheonNamen,
      });
      if (patch && typeof patch === 'object') {
        Object.assign(this.bearbeitung.zeile, patch);
        this.migriereNpcZeileKampfwerteNachInventar(this.bearbeitung.zeile);
      }
    },
    migriereNpcZeileKampfwerteNachInventar(zeile) {
      const M = window.HTBAH_CHARAKTER_MODEL;
      if (!zeile || !M || typeof M.migriereLegacyKampfwerteNachInventar !== 'function') {
        return;
      }
      const migriert = M.migriereLegacyKampfwerteNachInventar(zeile, { npc: true });
      Object.assign(zeile, migriert);
    },
    overlayNpcFeldNeuWuerfeln(payload) {
      if (!this.bearbeitungOverlay || this.bearbeitungOverlay.typ !== 'npc' || !this.bearbeitungOverlay.zeile) {
        return;
      }
      const modul = window.HTBAH && window.HTBAH.ZufallsgeneratorNpcModul;
      if (!modul || typeof modul.neuBerechnenFeld !== 'function') {
        return;
      }
      const feld = payload && payload.feld ? String(payload.feld) : '';
      if (!feld) {
        return;
      }
      const orteNamen = (this.zustand.orte || []).map((o) => (o && o.name ? String(o.name) : ''));
      const fraktionNamen = (this.zustand.fraktionen || []).map((f) => (f && f.name ? String(f.name) : ''));
      const pantheonNamen = (this.zustand.pantheon || []).map((p) => (p && p.name ? String(p.name) : ''));
      const patch = modul.neuBerechnenFeld(this.bearbeitungOverlay.zeile, feld, {
        modus: payload && payload.modus === 'einzeln' ? 'einzeln' : 'mitAbhaengigen',
        epoche: this.zufallNpcEpoche,
        orteNamen,
        fraktionNamen,
        pantheonNamen,
      });
      if (patch && typeof patch === 'object') {
        Object.assign(this.bearbeitungOverlay.zeile, patch);
        this.migriereNpcZeileKampfwerteNachInventar(this.bearbeitungOverlay.zeile);
      }
    },
    npcWizardOeffnen() {
      if (!this.bearbeitung || this.bearbeitung.typ !== 'npc' || this.bearbeitungIndex >= 0) {
        return;
      }
      this.npcWizardZiel = 'haupt';
      const ref = this.$refs.npcWizardModal;
      if (ref && typeof ref.oeffnen === 'function') {
        ref.oeffnen();
      }
    },
    overlayNpcWizardOeffnen() {
      if (!this.bearbeitungOverlay || this.bearbeitungOverlay.typ !== 'npc' || this.bearbeitungOverlayIndex >= 0) {
        return;
      }
      this.npcWizardZiel = 'overlay';
      const ref = this.$refs.npcWizardModal;
      if (ref && typeof ref.oeffnen === 'function') {
        ref.oeffnen();
      }
    },
    npcWizardUebernehmenIntern(payload) {
      if (!this.bearbeitung || this.bearbeitung.typ !== 'npc' || !this.bearbeitung.zeile || this.bearbeitungIndex >= 0) {
        return;
      }
      const G = window.HTBAH && window.HTBAH.Zufallsgenerator;
      if (!G || typeof G.npc !== 'function') {
        return;
      }
      const orteNamen = (this.zustand.orte || []).map((o) => (o && o.name ? String(o.name) : ''));
      const fraktionNamen = (this.zustand.fraktionen || []).map((f) => (f && f.name ? String(f.name) : ''));
      const pantheonNamen = (this.zustand.pantheon || []).map((p) => (p && p.name ? String(p.name) : ''));
      const epoche = payload && payload.epoche ? String(payload.epoche) : 'mittelalter';
      this.zufallNpcEpoche = epoche;
      const felder = G.npc({
        epoche,
        geschlecht: payload && payload.geschlecht ? String(payload.geschlecht) : '',
        alter: payload && payload.alter ? String(payload.alter) : '',
        beruf: payload && payload.beruf ? String(payload.beruf) : '',
        orteNamen,
        fraktionNamen,
        pantheonNamen,
      });
      Object.assign(this.bearbeitung.zeile, felder);
      this.$nextTick(() => this.quillAusBearbeitungSetzen());
    },
    npcWizardUebernehmen(payload) {
      const ziel = this.npcWizardZiel;
      this.npcWizardZiel = null;
      if (ziel === 'overlay') {
        this.withModalKontext('overlay', () => this.npcWizardUebernehmenIntern(payload));
      } else {
        this.npcWizardUebernehmenIntern(payload);
      }
    },
    bestienWizardOeffnen() {
      if (!this.bearbeitung || this.bearbeitung.typ !== 'bestie' || this.bearbeitungIndex >= 0) {
        return;
      }
      this.bestienWizardZiel = 'haupt';
      const ref = this.$refs.bestienWizardModal;
      if (ref && typeof ref.oeffnen === 'function') {
        ref.oeffnen();
      }
    },
    overlayBestienWizardOeffnen() {
      if (
        !this.bearbeitungOverlay ||
        this.bearbeitungOverlay.typ !== 'bestie' ||
        this.bearbeitungOverlayIndex >= 0
      ) {
        return;
      }
      this.bestienWizardZiel = 'overlay';
      const ref = this.$refs.bestienWizardModal;
      if (ref && typeof ref.oeffnen === 'function') {
        ref.oeffnen();
      }
    },
    bestienWizardUebernehmenIntern(payload) {
      if (
        !this.bearbeitung ||
        this.bearbeitung.typ !== 'bestie' ||
        !this.bearbeitung.zeile ||
        this.bearbeitungIndex >= 0
      ) {
        return;
      }
      const G = window.HTBAH && window.HTBAH.Zufallsgenerator;
      if (!G || typeof G.bestie !== 'function') {
        return;
      }
      const orteNamen = (this.zustand.orte || []).map((o) => (o && o.name ? String(o.name) : ''));
      const epoche = payload && payload.epoche ? String(payload.epoche) : 'mittelalter';
      this.zufallBestieEpoche = epoche;
      const felder = G.bestie({
        epoche,
        kategorie: payload && payload.kategorie ? String(payload.kategorie) : '',
        name: payload && payload.name ? String(payload.name) : '',
        aggressivitaetSkala:
          payload && Number.isFinite(Number(payload.aggressivitaetSkala))
            ? Number(payload.aggressivitaetSkala)
            : undefined,
        orteNamen,
      });
      Object.assign(this.bearbeitung.zeile, felder);
      const M = window.HTBAH_CHARAKTER_MODEL;
      if (M && typeof M.migriereLegacyKampfwerteNachInventar === 'function') {
        Object.assign(
          this.bearbeitung.zeile,
          M.migriereLegacyKampfwerteNachInventar(this.bearbeitung.zeile, { bestie: true }),
        );
      }
      this.$nextTick(() => this.quillAusBearbeitungSetzen());
    },
    bestienWizardUebernehmen(payload) {
      const ziel = this.bestienWizardZiel;
      this.bestienWizardZiel = null;
      if (ziel === 'overlay') {
        this.withModalKontext('overlay', () => this.bestienWizardUebernehmenIntern(payload));
      } else {
        this.bestienWizardUebernehmenIntern(payload);
      }
    },
    ortWizardOeffnen() {
      if (!this.bearbeitung || this.bearbeitung.typ !== 'ort' || this.bearbeitungIndex >= 0) {
        return;
      }
      this.ortWizardZiel = 'haupt';
      const ref = this.$refs.ortWizardModal;
      if (ref && typeof ref.oeffnen === 'function') {
        ref.oeffnen();
      }
    },
    overlayOrtWizardOeffnen() {
      if (
        !this.bearbeitungOverlay ||
        this.bearbeitungOverlay.typ !== 'ort' ||
        this.bearbeitungOverlayIndex >= 0
      ) {
        return;
      }
      this.ortWizardZiel = 'overlay';
      const ref = this.$refs.ortWizardModal;
      if (ref && typeof ref.oeffnen === 'function') {
        ref.oeffnen();
      }
    },
    ortWizardUebernehmenIntern(payload) {
      if (
        !this.bearbeitung ||
        this.bearbeitung.typ !== 'ort' ||
        !this.bearbeitung.zeile ||
        this.bearbeitungIndex >= 0
      ) {
        return;
      }
      const G = window.HTBAH && window.HTBAH.Zufallsgenerator;
      if (!G || typeof G.ort !== 'function') {
        return;
      }
      const epoche = payload && payload.epoche ? String(payload.epoche) : 'mittelalter';
      this.zufallOrtEpoche = epoche;
      const felder = G.ort({
        epoche,
        groesse: payload && payload.groesse ? String(payload.groesse) : '',
        lage: payload && payload.lage ? String(payload.lage) : '',
      });
      Object.assign(this.bearbeitung.zeile, felder);
      this.$nextTick(() => this.quillAusBearbeitungSetzen());
    },
    ortWizardUebernehmen(payload) {
      const ziel = this.ortWizardZiel;
      this.ortWizardZiel = null;
      if (ziel === 'overlay') {
        this.withModalKontext('overlay', () => this.ortWizardUebernehmenIntern(payload));
      } else {
        this.ortWizardUebernehmenIntern(payload);
      }
    },
    fraktionWizardOeffnen() {
      if (!this.bearbeitung || this.bearbeitung.typ !== 'fraktion' || this.bearbeitungIndex >= 0) return;
      this.fraktionWizardZiel = 'haupt';
      const ref = this.$refs.fraktionWizardModal;
      if (ref && typeof ref.oeffnen === 'function') ref.oeffnen();
    },
    overlayFraktionWizardOeffnen() {
      if (!this.bearbeitungOverlay || this.bearbeitungOverlay.typ !== 'fraktion' || this.bearbeitungOverlayIndex >= 0) return;
      this.fraktionWizardZiel = 'overlay';
      const ref = this.$refs.fraktionWizardModal;
      if (ref && typeof ref.oeffnen === 'function') ref.oeffnen();
    },
    fraktionWizardUebernehmenIntern(payload) {
      if (!this.bearbeitung || this.bearbeitung.typ !== 'fraktion' || !this.bearbeitung.zeile || this.bearbeitungIndex >= 0) return;
      const G = window.HTBAH && window.HTBAH.Zufallsgenerator;
      if (!G || typeof G.fraktion !== 'function') return;
      const epoche = payload && payload.epoche ? String(payload.epoche) : 'mittelalter';
      this.zufallFraktionEpoche = epoche;
      Object.assign(this.bearbeitung.zeile, G.fraktion({
        epoche,
        art: payload && payload.art ? String(payload.art) : '',
      }));
      this.$nextTick(() => this.quillAusBearbeitungSetzen());
    },
    fraktionWizardUebernehmen(payload) {
      const ziel = this.fraktionWizardZiel;
      this.fraktionWizardZiel = null;
      if (ziel === 'overlay') this.withModalKontext('overlay', () => this.fraktionWizardUebernehmenIntern(payload));
      else this.fraktionWizardUebernehmenIntern(payload);
    },
    raetselWizardOeffnen() {
      if (!this.bearbeitung || this.bearbeitung.typ !== 'raetsel' || this.bearbeitungIndex >= 0) return;
      this.raetselWizardZiel = 'haupt';
      const ref = this.$refs.raetselWizardModal;
      if (ref && typeof ref.oeffnen === 'function') ref.oeffnen();
    },
    overlayRaetselWizardOeffnen() {
      if (!this.bearbeitungOverlay || this.bearbeitungOverlay.typ !== 'raetsel' || this.bearbeitungOverlayIndex >= 0) return;
      this.raetselWizardZiel = 'overlay';
      const ref = this.$refs.raetselWizardModal;
      if (ref && typeof ref.oeffnen === 'function') ref.oeffnen();
    },
    raetselWizardUebernehmenIntern(payload) {
      if (!this.bearbeitung || this.bearbeitung.typ !== 'raetsel' || !this.bearbeitung.zeile || this.bearbeitungIndex >= 0) return;
      const G = window.HTBAH && window.HTBAH.Zufallsgenerator;
      if (!G || typeof G.raetsel !== 'function') return;
      const epoche = payload && payload.epoche ? String(payload.epoche) : 'mittelalter';
      this.zufallRaetselEpoche = epoche;
      const orteNamen = (this.zustand.orte || []).map((o) => (o && o.name ? String(o.name) : ''));
      const npcNamen = (this.zustand.npcs || []).map((n) => (n && n.name ? String(n.name) : ''));
      Object.assign(this.bearbeitung.zeile, G.raetsel({
        epoche,
        familie: payload && payload.familie ? String(payload.familie) : '',
        schwierigkeit: payload && payload.schwierigkeit ? String(payload.schwierigkeit) : '',
        orteNamen,
        npcNamen,
      }));
      this.$nextTick(() => this.quillAusBearbeitungSetzen());
    },
    raetselWizardUebernehmen(payload) {
      const ziel = this.raetselWizardZiel;
      this.raetselWizardZiel = null;
      if (ziel === 'overlay') this.withModalKontext('overlay', () => this.raetselWizardUebernehmenIntern(payload));
      else this.raetselWizardUebernehmenIntern(payload);
    },
    pantheonWizardOeffnen() {
      if (!this.bearbeitung || this.bearbeitung.typ !== 'pantheon' || this.bearbeitungIndex >= 0) return;
      this.pantheonWizardZiel = 'haupt';
      const ref = this.$refs.pantheonWizardModal;
      if (ref && typeof ref.oeffnen === 'function') ref.oeffnen();
    },
    overlayPantheonWizardOeffnen() {
      if (!this.bearbeitungOverlay || this.bearbeitungOverlay.typ !== 'pantheon' || this.bearbeitungOverlayIndex >= 0) return;
      this.pantheonWizardZiel = 'overlay';
      const ref = this.$refs.pantheonWizardModal;
      if (ref && typeof ref.oeffnen === 'function') ref.oeffnen();
    },
    pantheonWizardUebernehmenIntern(payload) {
      if (!this.bearbeitung || this.bearbeitung.typ !== 'pantheon' || !this.bearbeitung.zeile || this.bearbeitungIndex >= 0) return;
      const G = window.HTBAH && window.HTBAH.Zufallsgenerator;
      if (!G || typeof G.pantheon !== 'function') return;
      const epoche = payload && payload.epoche ? String(payload.epoche) : 'mittelalter';
      this.zufallPantheonEpoche = epoche;
      Object.assign(this.bearbeitung.zeile, G.pantheon({
        epoche,
        domaene: payload && payload.domaene ? String(payload.domaene) : '',
      }));
      this.$nextTick(() => this.quillAusBearbeitungSetzen());
    },
    pantheonWizardUebernehmen(payload) {
      const ziel = this.pantheonWizardZiel;
      this.pantheonWizardZiel = null;
      if (ziel === 'overlay') this.withModalKontext('overlay', () => this.pantheonWizardUebernehmenIntern(payload));
      else this.pantheonWizardUebernehmenIntern(payload);
    },
    gegenstandWizardOeffnen() {
      if (!this.bearbeitung || this.bearbeitung.typ !== 'gegenstand' || this.bearbeitungIndex >= 0) return;
      this.gegenstandWizardZiel = 'haupt';
      const ref = this.$refs.gegenstandWizardModal;
      if (ref && typeof ref.oeffnen === 'function') ref.oeffnen();
    },
    overlayGegenstandWizardOeffnen() {
      if (!this.bearbeitungOverlay || this.bearbeitungOverlay.typ !== 'gegenstand' || this.bearbeitungOverlayIndex >= 0) return;
      this.gegenstandWizardZiel = 'overlay';
      const ref = this.$refs.gegenstandWizardModal;
      if (ref && typeof ref.oeffnen === 'function') ref.oeffnen();
    },
    gegenstandWizardUebernehmenIntern(payload) {
      if (!this.bearbeitung || this.bearbeitung.typ !== 'gegenstand' || !this.bearbeitung.zeile || this.bearbeitungIndex >= 0) return;
      const G = window.HTBAH && window.HTBAH.Zufallsgenerator;
      if (!G || typeof G.gegenstand !== 'function') return;
      const epoche = payload && payload.epoche ? String(payload.epoche) : 'mittelalter';
      this.zufallGegenstandEpoche = epoche;
      const orteNamen = (this.zustand.orte || []).map((o) => (o && o.name ? String(o.name) : ''));
      Object.assign(this.bearbeitung.zeile, G.gegenstand({
        epoche,
        kategorie: payload && payload.kategorie ? String(payload.kategorie) : '',
        orteNamen,
      }));
      this.$nextTick(() => this.quillAusBearbeitungSetzen());
    },
    gegenstandWizardUebernehmen(payload) {
      const ziel = this.gegenstandWizardZiel;
      this.gegenstandWizardZiel = null;
      if (ziel === 'overlay') this.withModalKontext('overlay', () => this.gegenstandWizardUebernehmenIntern(payload));
      else this.gegenstandWizardUebernehmenIntern(payload);
    },
    inInteraktiverWeltOeffnenIntern() {
      if (!this.bearbeitung || !this.bearbeitung.zeile) {
        return false;
      }
      const typ = this.bearbeitung.typ;
      if (!['npc', 'bestie', 'ort', 'raetsel', 'gegenstand'].includes(typ)) {
        return false;
      }
      if (this.bearbeitungIndex < 0) {
        return false;
      }
      const id = String(this.bearbeitung.zeile.id || '').trim();
      if (!id) {
        return false;
      }
      const mentionApi = window.HTBAH_SHARED && window.HTBAH_SHARED.QuillEntityMentions;
      const oeffneEntitaet =
        mentionApi && typeof mentionApi.oeffneEntitaetGlobal === 'function'
          ? mentionApi.oeffneEntitaetGlobal
          : null;
      if (!oeffneEntitaet) {
        window.HTBAH.ui.alert({
          titel: 'Interaktive Welt nicht verfügbar',
          beschreibung: 'Die Verknüpfung zur Interaktiven Welt ist aktuell nicht geladen.',
        });
        return false;
      }
      this.zeileBearbeitungBeiBlurSpeichern();
      oeffneEntitaet({ entityType: typ, entityId: id, openMode: 'focus' });
      return true;
    },
    zeileInWeltOeffnen() {
      if (!this.inInteraktiverWeltOeffnenIntern()) {
        return;
      }
      this.schliesseZeileModal();
      this.navigiereZuInteraktiverWelt();
    },
    overlayZeileInWeltOeffnen() {
      const erfolg = this.withModalKontext('overlay', () => this.inInteraktiverWeltOeffnenIntern());
      if (!erfolg) {
        return;
      }
      this.overlaySchliesseZeileModal();
      this.navigiereZuInteraktiverWelt();
    },
    navigiereZuInteraktiverWelt() {
      const kampagnenPfad = window.HTBAH && typeof window.HTBAH.kampagnenPfad === 'function'
        ? window.HTBAH.kampagnenPfad
        : null;
      if (!kampagnenPfad || !this.$router || typeof this.$router.push !== 'function') {
        return;
      }
      const aktuelleKampagneId =
        this.$route && this.$route.params && this.$route.params.kampagneSlug
          ? this.kampagneIdAusSlug(this.$route.params.kampagneSlug)
          : '';
      const ziel = kampagnenPfad('welt', aktuelleKampagneId);
      if (this.$route && this.$route.path === ziel) {
        return;
      }
      const nav = this.$router.push(ziel);
      if (nav && typeof nav.catch === 'function') {
        nav.catch(() => {});
      }
    },
    kampagneIdAusSlug(slugRaw) {
      const slug = typeof slugRaw === 'string' ? decodeURIComponent(slugRaw) : '';
      if (!slug) {
        return '';
      }
      const zustand =
        window.HTBAH && typeof window.HTBAH.ladeSpielleitungZustand === 'function'
          ? window.HTBAH.ladeSpielleitungZustand()
          : null;
      const kampagnen = zustand && Array.isArray(zustand.kampagnen) ? zustand.kampagnen : [];
      const slugAusName =
        window.HTBAH && typeof window.HTBAH.kampagnenSlugAusName === 'function'
          ? window.HTBAH.kampagnenSlugAusName
          : null;
      if (!slugAusName) {
        return '';
      }
      const treffer = kampagnen.find((k) => slugAusName(k && k.name) === slug);
      return treffer && treffer.id ? treffer.id : '';
    },
    onInventarEintragEntfernen(payload) {
      const gegenstandId =
        payload && typeof payload === 'object' ? String(payload.gegenstandId || '').trim() : '';
      if (!gegenstandId) {
        return;
      }
      const syncInventar = (bearbeitung) => {
        if (!bearbeitung || !bearbeitung.zeile || !Array.isArray(bearbeitung.zeile.inventar)) {
          return;
        }
        bearbeitung.zeile.inventar = bearbeitung.zeile.inventar.filter(
          (item) => item && String(item.gegenstandId || '').trim() !== gegenstandId,
        );
        const typ = bearbeitung.typ;
        const entityId = String(bearbeitung.zeile.id || '').trim();
        if ((typ === 'npc' || typ === 'bestie') && entityId) {
          const listeName = typ === 'npc' ? 'npcs' : 'bestien';
          this.zustand[listeName] = (this.zustand[listeName] || []).map((row) => {
            if (!row || row.id !== entityId || !Array.isArray(row.inventar)) {
              return row;
            }
            return {
              ...row,
              inventar: row.inventar.filter(
                (item) => item && String(item.gegenstandId || '').trim() !== gegenstandId,
              ),
            };
          });
        }
      };
      syncInventar(this.bearbeitung);
      syncInventar(this.bearbeitungOverlay);
      this.zustand.gegenstaende = (this.zustand.gegenstaende || []).map((g) =>
        g && g.id === gegenstandId ? { ...g, besitzerTyp: '', besitzerId: '' } : g,
      );
      this.persist();
    },
    zeileSpeichern() {
      this.zeileSpeichernIntern({ schliessenNachSpeichern: true });
    },
    zeileBearbeitungBeiBlurSpeichern() {
      if (!this.bearbeitung || this.bearbeitungIndex < 0) {
        return;
      }
      this.zeileSpeichernIntern({ schliessenNachSpeichern: false });
    },
    onInventarZeileGespeichert() {
      this.zeileBearbeitungBeiBlurSpeichern();
    },
    onOverlayInventarZeileGespeichert() {
      this.overlayZeileBearbeitungBeiBlurSpeichern();
    },
    zufallseintragZiehen() {
      const kategorien = this.zufallKategorienMitEintraegen;
      if (!kategorien.length) {
        return;
      }
      let kat = null;
      if (this.zufallKategorie === 'beliebig') {
        kat = kategorien[Math.floor(Math.random() * kategorien.length)];
      } else {
        kat = kategorien.find((k) => k.id === this.zufallKategorie) || null;
      }
      if (!kat) {
        return;
      }
      const liste =
        this.zustand && Array.isArray(this.zustand[kat.zustandKey]) ? this.zustand[kat.zustandKey] : [];
      if (!liste.length) {
        return;
      }
      const index = Math.floor(Math.random() * liste.length);
      const row = liste[index];
      if (row && typeof this[kat.bearbeiten] === 'function') {
        this[kat.bearbeiten](row, index);
      }
    },
    zeileSpeichernIntern({ schliessenNachSpeichern }) {
      if (!this.bearbeitung) {
        return;
      }
      this.quillHtmlInBearbeitungSchreiben();
      const z = this.bearbeitung.zeile;
      const typ = this.bearbeitung.typ;
      if (typ === 'bestie' && z) {
        let a = Number(z.aggressivitaetSkala);
        if (!Number.isFinite(a)) {
          a = 5;
        }
        a = Math.min(10, Math.max(1, Math.round(a)));
        z.aggressivitaetSkala = a;
      }
      if (typ === 'npc' && z) {
        const EF = window.HTBAH_ENTITAET_FAEHIGKEITEN_MODEL;
        if (EF && typeof EF.istFaehigkeitenArrayFormat === 'function' && EF.istFaehigkeitenArrayFormat(z)) {
          z.handeln = EF.normalisiereFaehigkeitenListe(z.handeln, { slModus: true });
          z.wissen = EF.normalisiereFaehigkeitenListe(z.wissen, { slModus: true });
          z.soziales = EF.normalisiereFaehigkeitenListe(z.soziales, { slModus: true });
        } else if (!EF || typeof EF.istFaehigkeitenArrayFormat !== 'function' || !EF.istFaehigkeitenArrayFormat(z)) {
          z.handeln = this.normalisiereBegabungswert(z.handeln);
          z.wissen = this.normalisiereBegabungswert(z.wissen);
          z.soziales = this.normalisiereBegabungswert(z.soziales);
        }
        z.initiative = this.normalisiereInitiativeWert(z.initiative, this.begabungHandelnAusEntitaetZeile(z));
      } else if (typ === 'bestie' && z) {
        const EF = window.HTBAH_ENTITAET_FAEHIGKEITEN_MODEL;
        if (EF && typeof EF.istFaehigkeitenArrayFormat === 'function' && EF.istFaehigkeitenArrayFormat(z)) {
          z.handeln = EF.normalisiereFaehigkeitenListe(z.handeln, { slModus: true });
          z.wissen = EF.normalisiereFaehigkeitenListe(z.wissen, { slModus: true });
          z.soziales = EF.normalisiereFaehigkeitenListe(z.soziales, { slModus: true });
        } else if (!EF || typeof EF.istFaehigkeitenArrayFormat !== 'function' || !EF.istFaehigkeitenArrayFormat(z)) {
          z.handeln = this.normalisiereBegabungswert(z.handeln);
          z.wissen = this.normalisiereBegabungswert(z.wissen);
          z.soziales = this.normalisiereBegabungswert(z.soziales);
        }
        z.initiative = this.normalisiereInitiativeWert(z.initiative, this.begabungHandelnAusEntitaetZeile(z));
      } else if (typ === 'fraktion' && z) {
        z.orte = this.fraktionOrteListe(z);
      }
      let liste;
      if (typ === 'npc') {
        liste = this.zustand.npcs;
      } else if (typ === 'ort') {
        liste = this.zustand.orte;
      } else if (typ === 'fraktion') {
        liste = this.zustand.fraktionen;
      } else if (typ === 'pantheon') {
        liste = this.zustand.pantheon;
      } else if (typ === 'raetsel') {
        liste = this.zustand.raetsel;
      } else if (typ === 'bestie') {
        liste = this.zustand.bestien;
      } else {
        liste = this.zustand.gegenstaende;
      }
      if (this.bearbeitungIndex < 0) {
        liste.push(z);
      } else {
        liste[this.bearbeitungIndex] = z;
      }
      this.persist();
      if (schliessenNachSpeichern) {
        this.schliesseZeileModal();
      }
    },
    zeileLoeschenDialog(typ, id) {
      this.zuLoeschendeZeile = { typ, id };
      this.$refs.zufallstabellenBestaetigen.oeffnen({
        titel: 'Zeile löschen?',
        beschreibung:
          'Diese Tabellenzeile wird entfernt <strong>und auch aus der interaktiven Welt gelöscht</strong>. Gespeicherte Position, Größe und Drehung werden ebenfalls bereinigt.',
        onBestaetigen: () => this.zeileLoeschenAusfuehren(),
      });
    },
    zeileLoeschenAusfuehren() {
      const p = this.zuLoeschendeZeile;
      this.zuLoeschendeZeile = null;
      if (!p) {
        return;
      }
      const { typ, id } = p;
      let liste;
      if (typ === 'npc') {
        liste = this.zustand.npcs;
      } else if (typ === 'ort') {
        liste = this.zustand.orte;
      } else if (typ === 'fraktion') {
        liste = this.zustand.fraktionen;
      } else if (typ === 'pantheon') {
        liste = this.zustand.pantheon;
      } else if (typ === 'raetsel') {
        liste = this.zustand.raetsel;
      } else if (typ === 'bestie') {
        liste = this.zustand.bestien;
      } else {
        liste = this.zustand.gegenstaende;
      }
      const i = liste.findIndex((r) => r.id === id);
      if (i !== -1) {
        liste.splice(i, 1);
        if (typ === 'gegenstand' && window.HTBAH) {
          window.HTBAH.entferneZufallstabellenParentReferenzenAufGegenstand(this.zustand, id);
          if (typeof window.HTBAH.entferneGegenstandAusAllenInventaren === 'function') {
            window.HTBAH.entferneGegenstandAusAllenInventaren(this.zustand, id);
          }
        } else if ((typ === 'npc' || typ === 'bestie') && window.HTBAH) {
          if (typeof window.HTBAH.entferneZufallstabellenBesitzerReferenzen === 'function') {
            window.HTBAH.entferneZufallstabellenBesitzerReferenzen(this.zustand, typ, id);
          }
        }
        this.bereinigeWeltenbauLayoutdaten([{ typ, id }]);
        this.persist();
      }
    },
    pantheonExportieren() {
      const paket = window.HTBAH.erstellePantheonExportPaket(this.kampagneIdEffektiv);
      const datum = new Date();
      const yyyy = String(datum.getFullYear());
      const mm = String(datum.getMonth() + 1).padStart(2, '0');
      const dd = String(datum.getDate()).padStart(2, '0');
      window.HTBAH.dateiHerunterladenJson(paket, `htbah-pantheon-${yyyy}-${mm}-${dd}.json`);
    },
    async pantheonImportieren(event) {
      const datei = event.target.files?.[0];
      if (!datei) {
        return;
      }
      let text;
      try {
        text = await datei.text();
      } catch {
        await window.HTBAH.ui.alert({
          titel: 'Import fehlgeschlagen',
          beschreibung: 'Die Datei konnte nicht gelesen werden.',
        });
        event.target.value = '';
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
        event.target.value = '';
        return;
      }
      const r = window.HTBAH.pantheonImportAusPaket(roh);
      if (!r.ok) {
        await window.HTBAH.ui.alert({
          titel: 'Import fehlgeschlagen',
          beschreibung: r.fehler,
        });
        event.target.value = '';
        return;
      }
      const bestaetigt = await window.HTBAH.ui.confirm({
        titel: 'Pantheon ersetzen?',
        beschreibung: 'Das Pantheon wird vollständig durch die Importdatei ersetzt. Fortfahren?',
        bestaetigenText: 'Ersetzen',
        bestaetigenButtonClass: 'btn-danger',
        warnhinweisAnzeigen: true,
      });
      if (!bestaetigt) {
        event.target.value = '';
        return;
      }
      this.zustand.pantheon = r.pantheon;
      this.persist();
      event.target.value = '';
    },
    tabelleLeerenDialog(typ) {
      const labels = {
        npcs: '👤 NPCs',
        orte: '🗺️ Orte',
        gegenstaende: '📦 Gegenstände',
        fraktionen: '🏛️ Fraktionen',
        pantheon: '✨ Pantheon',
        raetsel: '🧩 Rätsel',
        bestien: '🦁 Bestarium',
      };
      this.$refs.zufallstabellenBestaetigen.oeffnen({
        titel: `${labels[typ] || 'Tabelle'} leeren?`,
        beschreibung:
          'Alle Einträge in dieser Tabelle werden entfernt <strong>und auch aus der interaktiven Welt gelöscht</strong>. Gespeicherte Positionen, Größen und Drehungen werden ebenfalls bereinigt.',
        onBestaetigen: () => {
          const singularTyp = this.typSingularAusTabellenTyp(typ);
          let zuBereinigendeIds = [];
          if (typ === 'npcs') {
            zuBereinigendeIds = (this.zustand.npcs || []).map((row) => row && row.id).filter(Boolean);
            this.zustand.npcs = [];
          } else if (typ === 'orte') {
            zuBereinigendeIds = (this.zustand.orte || []).map((row) => row && row.id).filter(Boolean);
            this.zustand.orte = [];
          } else if (typ === 'gegenstaende') {
            zuBereinigendeIds = (this.zustand.gegenstaende || []).map((row) => row && row.id).filter(Boolean);
            this.zustand.gegenstaende = [];
          } else if (typ === 'fraktionen') {
            zuBereinigendeIds = (this.zustand.fraktionen || []).map((row) => row && row.id).filter(Boolean);
            this.zustand.fraktionen = [];
          } else if (typ === 'pantheon') {
            zuBereinigendeIds = (this.zustand.pantheon || []).map((row) => row && row.id).filter(Boolean);
            this.zustand.pantheon = [];
          } else if (typ === 'raetsel') {
            zuBereinigendeIds = (this.zustand.raetsel || []).map((row) => row && row.id).filter(Boolean);
            this.zustand.raetsel = [];
          } else if (typ === 'bestien') {
            zuBereinigendeIds = (this.zustand.bestien || []).map((row) => row && row.id).filter(Boolean);
            this.zustand.bestien = [];
          }
          if (singularTyp && zuBereinigendeIds.length) {
            this.bereinigeWeltenbauLayoutdaten(
              zuBereinigendeIds.map((id) => ({ typ: singularTyp, id })),
            );
          }
          this.persist();
        },
      });
    },
  },
  mounted() {
    window.addEventListener('htbah:open-entity-request', this.onGlobalOpenEntityRequest);
  },
  beforeUnmount() {
    this.abbrecheMedienImportWarteschlange();
    window.removeEventListener('htbah:open-entity-request', this.onGlobalOpenEntityRequest);
    this.zeileQuillSession += 1;
    this.overlayZeileQuillSession += 1;
    this.overlaySchliesseZeileModal();
    this.schliesseZeileModal();
    this.overlayZeileQuillAufraeumen();
  },
  template: `
    <div :class="rootKlassen">
      <weltenbau-bild-import-modal
        ref="zufallstabellenBildImportModal"
        @fertig="onZufallstabellenBildImportFertig"
        @abgebrochen="onZufallstabellenBildImportAbgebrochen"
        @datei-import-fehler="onZufallstabellenBildImportFehler" />

      <div class="card mb-4 text-start">
        <div class="card-body py-3">
          <div class="row g-3 align-items-end">
            <div class="col-12 col-lg">
              <label for="zufallstabellen-suche-global" class="form-label small text-secondary mb-1">Suche</label>
              <div class="input-group">
                <span class="input-group-text text-secondary" aria-hidden="true">
                  <span class="material-symbols-outlined" style="font-size: 1.25rem; line-height: 1;">search</span>
                </span>
                <input
                  id="zufallstabellen-suche-global"
                  v-model.trim="sucheGlobal"
                  type="search"
                  class="form-control"
                  placeholder="Alle Tabellen durchsuchen …"
                  autocomplete="off"
                  aria-label="Alle Tabellen durchsuchen" />
              </div>
            </div>
            <div class="col-12 col-md-7 col-lg-auto">
              <label for="zst-zufall-kategorie" class="form-label small text-secondary mb-1">Zufallseintrag</label>
              <div class="input-group">
                <select
                  id="zst-zufall-kategorie"
                  v-model="zufallKategorie"
                  class="form-select"
                  :disabled="!kannZufallseintragZiehen"
                  aria-label="Kategorie für Zufallseintrag">
                  <option v-if="kannZufallseintragZiehen" value="beliebig">🎲 Beliebig</option>
                  <option
                    v-for="k in zufallKategorienMitEintraegen"
                    :key="'zst-zk-' + k.id"
                    :value="k.id">
                    {{ k.emoji }} {{ k.label }}
                  </option>
                </select>
                <button
                  type="button"
                  class="btn btn-outline-primary"
                  :disabled="!kannZufallseintragZiehen"
                  title="Zufälligen Eintrag öffnen"
                  @click="zufallseintragZiehen">
                  🎲 Zufallseintrag
                </button>
              </div>
            </div>
            <div class="col-12 col-md-5 col-lg-auto">
              <button
                type="button"
                class="btn w-100"
                :class="duplizierenPanelOffen ? 'btn-primary' : 'btn-outline-secondary'"
                :aria-expanded="duplizierenPanelOffen ? 'true' : 'false'"
                aria-controls="zst-inhalte-duplizieren-panel"
                @click="duplizierenPanelOffen = !duplizierenPanelOffen">
                <span class="material-symbols-outlined align-middle me-1" style="font-size: 1.1rem; line-height: 1;" aria-hidden="true">content_copy</span>
                Inhalte duplizieren
              </button>
            </div>
          </div>
          <p v-if="!kannZufallseintragZiehen" class="small text-secondary mb-0 mt-2">
            Noch keine Einträge in den Tabellen — Zufallseintrag ist erst verfügbar, wenn mindestens eine Kategorie befüllt ist.
          </p>
          <p v-else-if="globaleSucheAktiv" class="small text-secondary mb-0 mt-2">
            Pro Kategorie siehst du die Treffer oder den Hinweis, dass es dort keine gibt.
          </p>
        </div>
        <div
          v-show="duplizierenPanelOffen"
          id="zst-inhalte-duplizieren-panel"
          class="card border-top-0 rounded-0 rounded-bottom text-start">
          <div class="card-body py-3">
            <h6 class="h6 mb-3 fw-semibold">Inhalte duplizieren</h6>
            <div class="row g-2 align-items-end">
              <div class="col-12">
                <label class="form-label small text-secondary mb-0" for="zst-duplikat-ziel-kampagne">Ziel-Kampagne</label>
                <div
                  class="input-group input-group-sm w-100 htbah-duplikat-ziel-input-group"
                  :class="{ 'htbah-duplikat-ziel-input-group--neu': duplizierenNeueKampagneModus }">
                  <select
                    id="zst-duplikat-ziel-kampagne"
                    v-model="duplizierenZielKampagneId"
                    class="form-select htbah-duplikat-ziel-select"
                    aria-label="Ziel-Kampagne für Duplikate">
                    <option v-for="k in spielleitungKampagnenFuerDuplikat" :key="'zst-dup-k-' + k.id" :value="k.id">
                      {{ k.name }}
                    </option>
                    <option :value="duplikatZielNeueKampagne">Neue Kampagne …</option>
                  </select>
                  <div
                    v-if="duplizierenNeueKampagneModus"
                    class="input-group htbah-duplikat-neue-kampagne-teil">
                    <input
                      id="zst-duplikat-neue-kampagne-name"
                      v-model.trim="duplizierenNeueKampagneName"
                      type="text"
                      class="form-control"
                      placeholder="Kampagnenname …"
                      autocomplete="off"
                      aria-label="Name der neuen Kampagne"
                      @keydown.enter.prevent="duplizierenNeueKampagneAnlegen" />
                    <button
                      type="button"
                      class="btn btn-outline-primary htbah-input-icon-btn"
                      title="Kampagne erstellen und als Ziel wählen"
                      aria-label="Kampagne erstellen und als Ziel wählen"
                      @click="duplizierenNeueKampagneAnlegen">
                      <span class="material-symbols-outlined" aria-hidden="true">add</span>
                    </button>
                  </div>
                </div>
              </div>
              <div class="col-12 d-flex flex-wrap gap-2 align-items-center justify-content-md-end">
                <button
                  type="button"
                  class="btn btn-sm"
                  :class="entitaetenAuswahlModus ? 'btn-primary' : 'btn-outline-secondary'"
                  @click="entitaetenAuswahlModusUmschalten">
                  {{ entitaetenAuswahlModus ? 'Auswahl beenden' : 'Auswahlmodus' }}
                </button>
                <template v-if="entitaetenAuswahlModus">
                  <button type="button" class="btn btn-sm btn-outline-secondary" @click="alleSichtbarenEntitaetenAuswahlUmschalten">
                    Alle sichtbaren
                  </button>
                  <span class="small text-secondary">{{ entitaetenAuswahlAnzahl }} markiert</span>
                  <button
                    type="button"
                    class="btn btn-sm btn-primary"
                    :disabled="!entitaetenAuswahlAnzahl"
                    @click="onAusgewaehlteEntitaetenDuplizieren">
                    Duplizieren
                  </button>
                </template>
              </div>
            </div>
            <p class="small text-secondary mb-0 mt-2">
              Duplikate übernehmen Tabellendaten und gespeicherte Positionen in der interaktiven Welt. Im Bearbeiten-Dialog steht ebenfalls „Duplizieren“ (Ziel wie hier gewählt).
            </p>
          </div>
        </div>
      </div>

      <zufallstabellen-sektion
        section-id="orte"
        aria-titel="Orte"
        :suche-steuerung-aktiv="sektionSucheAktiv('orte')"
        :suche-hat-treffer="sektionSucheHatTreffer('orte')">
        <template #titel><span class="fw-semibold">🗺️ Orte</span></template>
        <template #aktionen>
            <button type="button" class="btn btn-sm btn-outline-danger" @click="tabelleLeerenDialog('orte')">
              Leeren
            </button>
            <icon-text-button
              type="button"
              class="btn btn-sm btn-outline-primary flex-shrink-0"
              icon="add"
              @click="ortHinzufuegen"
              aria-label="Eintrag hinzufügen">
              Hinzufügen
            </icon-text-button>
        </template>
          <div class="p-2 border-bottom">
            <input
              v-model.trim="sucheOrte"
              type="search"
              class="form-control form-control-sm"
              placeholder="Orte durchsuchen…" />
          </div>
          <div class="table-responsive d-none d-md-block">
            <table class="table table-sm table-striped mb-0 align-middle">
              <thead>
                <tr>
                  <th v-if="entitaetenAuswahlModus" class="text-center zufallstabellen-auswahl-spalte" scope="col">
                    <span class="visually-hidden">Auswahl</span>
                  </th>
                  <th>Name</th>
                  <th>Größe</th>
                  <th>Lage</th>
                  <th>Zustand</th>
                  <th>Beschreibung</th>
                  <th class="text-end text-nowrap">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!anzeigeOrte.length">
                  <td :colspan="entitaetenAuswahlModus ? 7 : 6" class="text-secondary text-center py-3">
                    {{ zufallstabellenLeerNachricht((zustand.orte || []).length, sucheOrte) }}
                  </td>
                </tr>
                <tr
                  v-for="row in anzeigeOrte"
                  :key="row.id"
                  class="zufallstabellen-tabellenzeile-klickbar"
                  @click="zeileBearbeitenAusListe('ort', row)">
                  <td v-if="entitaetenAuswahlModus" class="text-center align-middle" @click.stop>
                    <input
                      class="form-check-input m-0"
                      type="checkbox"
                      :checked="istEntitaetAusgewaehlt('ort', row.id)"
                      :aria-label="'Ort auswählen: ' + karteWert(row.name)"
                      @change="toggleEntitaetAuswahl('ort', row.id)" />
                  </td>
                  <td>
                    {{ karteWert(row.name) }}
                    <span v-if="initiativeBadgeText(row.initiative)" class="badge rounded-pill text-bg-info ms-1">
                      INI {{ initiativeBadgeText(row.initiative) }}
                    </span>
                  </td>
                  <td>{{ karteWert(row.groesse) }}</td>
                  <td>{{ karteWert(row.lage) }}</td>
                  <td>{{ karteWert(row.zustand) }}</td>
                  <td class="small">
                    <div
                      v-if="zeilenWertAlsText(row.notizenHtml)"
                      class="htbah-zufall-rich-preview"
                      @click.stop="onRichTextLinkClick($event)"
                      v-html="richTextHtml(row.notizenHtml)"></div>
                    <span v-else>—</span>
                  </td>
                  <td class="text-end text-nowrap" @click.stop>
                    <div class="dropdown">
                      <button type="button" class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Aktionen">
                        ⚙️
                      </button>
                      <ul class="dropdown-menu dropdown-menu-end">
                        <li class="px-2 py-2">
                          <zufallstabellen-reihenfolge-split
                            :kann-nach-oben="kannZeileNachOben('ort', row.id)"
                            :kann-nach-unten="kannZeileNachUnten('ort', row.id)"
                            @nach-oben="zeileReihenfolgeAendern('ort', row.id, 'oben')"
                            @nach-unten="zeileReihenfolgeAendern('ort', row.id, 'unten')" />
                        </li>
                        <li><hr class="dropdown-divider" /></li>
                        <li><button type="button" class="dropdown-item" @click="galerieFuerZeileOeffnen(row)">Medien ({{ medienAnzahl(row) }})</button></li>
                        <li><button type="button" class="dropdown-item" @click="ortBearbeiten(row, indexNachId(zustand.orte, row.id))">Bearbeiten</button></li>
                        <li><button type="button" class="dropdown-item text-danger" @click="zeileLoeschenDialog('ort', row.id)">Löschen</button></li>
                      </ul>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="d-md-none p-2">
            <div v-if="!anzeigeOrte.length" class="text-secondary text-center py-3 small">
              {{ zufallstabellenLeerNachricht((zustand.orte || []).length, sucheOrte) }}
            </div>
            <div
              v-for="row in anzeigeOrte"
              :key="'ort-card-' + row.id"
              class="card zufallstabellen-mobile-card zufallstabellen-mobile-card--klickbar mb-2">
              <div class="card-body p-2" @click="zeileBearbeitenAusListe('ort', row)">
                <div v-if="entitaetenAuswahlModus" class="form-check mb-2" @click.stop>
                  <input
                    :id="'zst-ort-sel-' + row.id"
                    class="form-check-input"
                    type="checkbox"
                    :checked="istEntitaetAusgewaehlt('ort', row.id)"
                    @change="toggleEntitaetAuswahl('ort', row.id)" />
                  <label class="form-check-label small" :for="'zst-ort-sel-' + row.id">Auswählen</label>
                </div>
                <div class="fw-semibold mb-1">
                  {{ karteWert(row.name) }}
                  <span v-if="initiativeBadgeText(row.initiative)" class="badge rounded-pill text-bg-info ms-1">
                    INI {{ initiativeBadgeText(row.initiative) }}
                  </span>
                </div>
                <div class="small"><span class="text-secondary">Größe:</span> {{ karteWert(row.groesse) }}</div>
                <div class="small"><span class="text-secondary">Lage:</span> {{ karteWert(row.lage) }}</div>
                <div class="small mb-2"><span class="text-secondary">Zustand:</span> {{ karteWert(row.zustand) }}</div>                <div
                  v-if="featuredBildAusZeile(row)"
                  class="zufallstabellen-mobile-slides mb-2"
                  @click.stop>
                  <button
                    type="button"
                    class="zufallstabellen-mobile-slide"
                    aria-label="Titelbild anzeigen"
                    @click="mediumImBildbetrachterOeffnen(featuredBildAusZeile(row))">
                    <img :src="featuredBildAusZeile(row).dataUrl" :alt="mediumDateiname(featuredBildAusZeile(row))" loading="lazy" />
                  </button>
                </div>
                <div
                  v-if="zeilenWertAlsText(row.notizenHtml)"
                  class="small mb-2 zufallstabellen-richtext-vorschau"
                  @click.stop="onRichTextLinkClick($event)"
                  v-html="richTextHtml(row.notizenHtml)"></div>
                <div v-else class="small mb-2">—</div>
                <div class="dropdown" @click.stop>
                  <button type="button" class="btn btn-sm btn-outline-secondary w-100 dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Aktionen">
                    ⚙️
                  </button>
                  <ul class="dropdown-menu w-100">
                    <li class="px-2 py-2">
                      <zufallstabellen-reihenfolge-split
                        :kann-nach-oben="kannZeileNachOben('ort', row.id)"
                        :kann-nach-unten="kannZeileNachUnten('ort', row.id)"
                        @nach-oben="zeileReihenfolgeAendern('ort', row.id, 'oben')"
                        @nach-unten="zeileReihenfolgeAendern('ort', row.id, 'unten')" />
                    </li>
                    <li><hr class="dropdown-divider" /></li>
                    <li><button type="button" class="dropdown-item" @click="galerieFuerZeileOeffnen(row)">Medien ({{ medienAnzahl(row) }})</button></li>
                    <li><button type="button" class="dropdown-item" @click="ortBearbeiten(row, indexNachId(zustand.orte, row.id))">Bearbeiten</button></li>
                    <li><button type="button" class="dropdown-item text-danger" @click="zeileLoeschenDialog('ort', row.id)">Löschen</button></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
      </zufallstabellen-sektion>

      <zufallstabellen-sektion
        section-id="fraktionen"
        aria-titel="Fraktionen"
        :suche-steuerung-aktiv="sektionSucheAktiv('fraktionen')"
        :suche-hat-treffer="sektionSucheHatTreffer('fraktionen')">
        <template #titel><span class="fw-semibold">🏛️ Fraktionen</span></template>
        <template #aktionen>
            <button type="button" class="btn btn-sm btn-outline-danger" @click="tabelleLeerenDialog('fraktionen')">
              Leeren
            </button>
            <icon-text-button
              type="button"
              class="btn btn-sm btn-outline-primary flex-shrink-0"
              icon="add"
              @click="fraktionHinzufuegen"
              aria-label="Eintrag hinzufügen">
              Hinzufügen
            </icon-text-button>
        </template>
          <div class="p-2 border-bottom">
            <input
              v-model.trim="sucheFraktionen"
              type="search"
              class="form-control form-control-sm"
              placeholder="Fraktionen durchsuchen…" />
          </div>
          <div class="table-responsive d-none d-md-block">
            <table class="table table-sm table-striped mb-0 align-middle">
              <thead>
                <tr>
                  <th v-if="entitaetenAuswahlModus" class="text-center zufallstabellen-auswahl-spalte" scope="col">
                    <span class="visually-hidden">Auswahl</span>
                  </th>
                  <th>Art</th>
                  <th>Name</th>
                  <th>Orte</th>
                  <th>Ziel</th>
                  <th>Gesinnung / Verhalten</th>
                  <th>Beschreibung</th>
                  <th class="text-end text-nowrap">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!anzeigeFraktionen.length">
                  <td :colspan="entitaetenAuswahlModus ? 8 : 7" class="text-secondary text-center py-3">
                    {{ zufallstabellenLeerNachricht((zustand.fraktionen || []).length, sucheFraktionen) }}
                  </td>
                </tr>
                <tr
                  v-for="row in anzeigeFraktionen"
                  :key="row.id"
                  class="zufallstabellen-tabellenzeile-klickbar"
                  @click="zeileBearbeitenAusListe('fraktion', row)">
                  <td v-if="entitaetenAuswahlModus" class="text-center align-middle" @click.stop>
                    <input
                      class="form-check-input m-0"
                      type="checkbox"
                      :checked="istEntitaetAusgewaehlt('fraktion', row.id)"
                      :aria-label="'Fraktion auswählen: ' + karteWert(row.name)"
                      @change="toggleEntitaetAuswahl('fraktion', row.id)" />
                  </td>
                  <td>{{ karteWert(row.art) }}</td>
                  <td>{{ karteWert(row.name) }}</td>
                  <td class="small">{{ karteWert(fraktionOrteText(row)) }}</td>
                  <td class="small">{{ karteWert(row.ziel) }}</td>
                  <td class="small">{{ karteWert(row.gesinnungVerhalten) }}</td>
                  <td class="small">
                    <div
                      v-if="zeilenWertAlsText(row.beschreibungHtml)"
                      class="htbah-zufall-rich-preview"
                      @click.stop="onRichTextLinkClick($event)"
                      v-html="richTextHtml(bereinigeFraktionBeschreibungHtml(row.beschreibungHtml))"></div>
                    <span v-else>—</span>
                  </td>
                  <td class="text-end text-nowrap" @click.stop>
                    <div class="dropdown">
                      <button type="button" class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Aktionen">
                        ⚙️
                      </button>
                      <ul class="dropdown-menu dropdown-menu-end">
                        <li class="px-2 py-2">
                          <zufallstabellen-reihenfolge-split
                            :kann-nach-oben="kannZeileNachOben('fraktion', row.id)"
                            :kann-nach-unten="kannZeileNachUnten('fraktion', row.id)"
                            @nach-oben="zeileReihenfolgeAendern('fraktion', row.id, 'oben')"
                            @nach-unten="zeileReihenfolgeAendern('fraktion', row.id, 'unten')" />
                        </li>
                        <li><hr class="dropdown-divider" /></li>
                        <li><button type="button" class="dropdown-item" @click="galerieFuerZeileOeffnen(row)">Medien ({{ medienAnzahl(row) }})</button></li>
                        <li><button type="button" class="dropdown-item" @click="fraktionBearbeiten(row, indexNachId(zustand.fraktionen, row.id))">Bearbeiten</button></li>
                        <li><button type="button" class="dropdown-item text-danger" @click="zeileLoeschenDialog('fraktion', row.id)">Löschen</button></li>
                      </ul>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="d-md-none p-2">
            <div v-if="!anzeigeFraktionen.length" class="text-secondary text-center py-3 small">
              {{ zufallstabellenLeerNachricht((zustand.fraktionen || []).length, sucheFraktionen) }}
            </div>
            <div
              v-for="row in anzeigeFraktionen"
              :key="'fraktion-card-' + row.id"
              class="card zufallstabellen-mobile-card zufallstabellen-mobile-card--klickbar mb-2">
              <div class="card-body p-2" @click="zeileBearbeitenAusListe('fraktion', row)">
                <div v-if="entitaetenAuswahlModus" class="form-check mb-2" @click.stop>
                  <input
                    :id="'zst-fraktion-sel-' + row.id"
                    class="form-check-input"
                    type="checkbox"
                    :checked="istEntitaetAusgewaehlt('fraktion', row.id)"
                    @change="toggleEntitaetAuswahl('fraktion', row.id)" />
                  <label class="form-check-label small" :for="'zst-fraktion-sel-' + row.id">Auswählen</label>
                </div>
                <div class="fw-semibold mb-1">{{ karteWert(row.name) }}</div>
                <div class="small"><span class="text-secondary">Art:</span> {{ karteWert(row.art) }}</div>
                <div class="small"><span class="text-secondary">Orte:</span> {{ karteWert(fraktionOrteText(row)) }}</div>
                <div class="small"><span class="text-secondary">Ziel:</span> {{ karteWert(row.ziel) }}</div>
                <div class="small mb-2">
                  <span class="text-secondary">Gesinnung:</span> {{ karteWert(row.gesinnungVerhalten) }}
                </div>                <div
                  v-if="featuredBildAusZeile(row)"
                  class="zufallstabellen-mobile-slides mb-2"
                  @click.stop>
                  <button
                    type="button"
                    class="zufallstabellen-mobile-slide"
                    aria-label="Titelbild anzeigen"
                    @click="mediumImBildbetrachterOeffnen(featuredBildAusZeile(row))">
                    <img :src="featuredBildAusZeile(row).dataUrl" :alt="mediumDateiname(featuredBildAusZeile(row))" loading="lazy" />
                  </button>
                </div>
                <div
                  v-if="zeilenWertAlsText(row.beschreibungHtml)"
                  class="small mb-2 zufallstabellen-richtext-vorschau"
                  @click.stop="onRichTextLinkClick($event)"
                  v-html="richTextHtml(bereinigeFraktionBeschreibungHtml(row.beschreibungHtml))"></div>
                <div v-else class="small mb-2">—</div>
                <div class="dropdown" @click.stop>
                  <button type="button" class="btn btn-sm btn-outline-secondary w-100 dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Aktionen">
                    ⚙️
                  </button>
                  <ul class="dropdown-menu w-100">
                    <li class="px-2 py-2">
                      <zufallstabellen-reihenfolge-split
                        :kann-nach-oben="kannZeileNachOben('fraktion', row.id)"
                        :kann-nach-unten="kannZeileNachUnten('fraktion', row.id)"
                        @nach-oben="zeileReihenfolgeAendern('fraktion', row.id, 'oben')"
                        @nach-unten="zeileReihenfolgeAendern('fraktion', row.id, 'unten')" />
                    </li>
                    <li><hr class="dropdown-divider" /></li>
                    <li><button type="button" class="dropdown-item" @click="galerieFuerZeileOeffnen(row)">Medien ({{ medienAnzahl(row) }})</button></li>
                    <li><button type="button" class="dropdown-item" @click="fraktionBearbeiten(row, indexNachId(zustand.fraktionen, row.id))">Bearbeiten</button></li>
                    <li><button type="button" class="dropdown-item text-danger" @click="zeileLoeschenDialog('fraktion', row.id)">Löschen</button></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
      </zufallstabellen-sektion>

      <zufallstabellen-sektion
        section-id="npcs"
        aria-titel="NPCs"
        :suche-steuerung-aktiv="sektionSucheAktiv('npcs')"
        :suche-hat-treffer="sektionSucheHatTreffer('npcs')">
        <template #titel><span class="fw-semibold">👤 NPCs</span></template>
        <template #aktionen>
            <button type="button" class="btn btn-sm btn-outline-danger" @click="tabelleLeerenDialog('npcs')">
              Leeren
            </button>
            <icon-text-button
              type="button"
              class="btn btn-sm btn-outline-primary flex-shrink-0"
              icon="add"
              @click="npcHinzufuegen"
              aria-label="Eintrag hinzufügen">
              Hinzufügen
            </icon-text-button>
        </template>
          <div class="p-2 border-bottom">
            <input
              v-model.trim="sucheNpcs"
              type="search"
              class="form-control form-control-sm"
              placeholder="NPCs durchsuchen…" />
            <div class="d-flex flex-wrap gap-3 mt-2 small">
              <div class="form-check m-0">
                <input id="zst-npc-filter-bewusstlos" class="form-check-input" type="checkbox" v-model="zeigeBewusstloseNpcs" />
                <label class="form-check-label" for="zst-npc-filter-bewusstlos">Bewusstlose anzeigen</label>
              </div>
              <div class="form-check m-0">
                <input id="zst-npc-filter-tot" class="form-check-input" type="checkbox" v-model="zeigeToteNpcs" />
                <label class="form-check-label" for="zst-npc-filter-tot">Tote anzeigen</label>
              </div>
            </div>
          </div>
          <div class="table-responsive d-none d-md-block">
            <table class="table table-sm table-striped mb-0 align-middle">
              <thead>
                <tr>
                  <th v-if="entitaetenAuswahlModus" class="text-center zufallstabellen-auswahl-spalte" scope="col">
                    <span class="visually-hidden">Auswahl</span>
                  </th>
                  <th>Name</th>
                  <th>Spitzname</th>
                  <th>Geschlecht</th>
                  <th>Alter</th>
                  <th>Familienstand</th>
                  <th>Statur</th>
                  <th>LP</th>
                  <th>Gesinnung</th>
                  <th>Begabungen</th>
                  <th>Glaube</th>
                  <th>Beruf</th>
                  <th>Fraktion</th>
                  <th>Aufenthaltsort</th>
                  <th>Ziel</th>
                  <th>Stimme</th>
                  <th>Waffen (Inventar)</th>
                  <th>Notizen</th>
                  <th class="text-end text-nowrap">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!anzeigeNpcs.length">
                  <td :colspan="entitaetenAuswahlModus ? 19 : 18" class="text-secondary text-center py-3">
                    {{ zufallstabellenLeerNachricht((zustand.npcs || []).length, sucheNpcs) }}
                  </td>
                </tr>
                <tr
                  v-for="row in anzeigeNpcs"
                  :key="row.id"
                  class="zufallstabellen-tabellenzeile-klickbar"
                  :class="statusZeilenKlasse(row)"
                  @click="zeileBearbeitenAusListe('npc', row)">
                  <td v-if="entitaetenAuswahlModus" class="text-center align-middle" @click.stop>
                    <input
                      class="form-check-input m-0"
                      type="checkbox"
                      :checked="istEntitaetAusgewaehlt('npc', row.id)"
                      :aria-label="'NPC auswählen: ' + karteWert(row.name)"
                      @change="toggleEntitaetAuswahl('npc', row.id)" />
                  </td>
                  <td>
                    {{ karteWert(row.name) }}
                    <span v-if="initiativeBadgeText(row.initiative)" class="badge rounded-pill text-bg-info ms-1">
                      INI {{ initiativeBadgeText(row.initiative) }}
                    </span>
                    <span v-if="statusEmoji(row)">{{ statusEmoji(row) }}</span>
                  </td>
                  <td>{{ karteWert(row.spitzname) }}</td>
                  <td>{{ karteWert(row.geschlecht) }}</td>
                  <td>{{ karteWert(row.alter) }}</td>
                  <td>{{ karteWert(row.familienstand) }}</td>
                  <td>{{ karteWert(row.statur) }}</td>
                  <td>{{ karteWert(row.lebenspunkte) }}</td>
                  <td>{{ karteWert(row.gesinnung) }}</td>
                  <td class="small text-nowrap">{{ begabungswerteKurzText(row) }}</td>
                  <td>{{ karteWert(row.glaube) }}</td>
                  <td>{{ karteWert(row.beruf) }}</td>
                  <td>{{ karteWert(row.fraktion) }}</td>
                  <td>{{ karteWert(row.aufenthaltsort) }}</td>
                  <td>{{ karteWert(row.ziel) }}</td>
                  <td>{{ karteWert(row.stimme) }}</td>
                  <td class="small">{{ npcWaffenWerteText(row) }}</td>
                  <td class="small">
                    <div
                      v-if="zeilenWertAlsText(row.notizenHtml)"
                      class="htbah-zufall-rich-preview"
                      @click.stop="onRichTextLinkClick($event)"
                      v-html="richTextHtml(bereinigeNpcNotizenHtml(row.notizenHtml))"></div>
                    <span v-else>—</span>
                  </td>
                  <td class="text-end text-nowrap" @click.stop>
                    <div class="dropdown">
                      <button type="button" class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Aktionen">
                        ⚙️
                      </button>
                      <ul class="dropdown-menu dropdown-menu-end">
                        <li class="px-2 py-2">
                          <zufallstabellen-reihenfolge-split
                            :kann-nach-oben="kannZeileNachOben('npc', row.id)"
                            :kann-nach-unten="kannZeileNachUnten('npc', row.id)"
                            @nach-oben="zeileReihenfolgeAendern('npc', row.id, 'oben')"
                            @nach-unten="zeileReihenfolgeAendern('npc', row.id, 'unten')" />
                        </li>
                        <li><hr class="dropdown-divider" /></li>
                        <li><button type="button" class="dropdown-item" @click="paradeWuerfelnFuerEntitaet(row, 'npc')">Parieren</button></li>
                        <li><button type="button" class="dropdown-item" @click="schadenWuerfelnFuerEntitaet(row, 'npc')">Schaden</button></li>
                        <li><button type="button" class="dropdown-item" @click="galerieFuerZeileOeffnen(row)">Medien ({{ medienAnzahl(row) }})</button></li>
                        <li><button type="button" class="dropdown-item" @click="npcBearbeiten(row, indexNachId(zustand.npcs, row.id))">Bearbeiten</button></li>
                        <li><button type="button" class="dropdown-item text-danger" @click="zeileLoeschenDialog('npc', row.id)">Löschen</button></li>
                      </ul>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="d-md-none p-2">
            <div v-if="!anzeigeNpcs.length" class="text-secondary text-center py-3 small">
              {{ zufallstabellenLeerNachricht((zustand.npcs || []).length, sucheNpcs) }}
            </div>
            <div
              v-for="row in anzeigeNpcs"
              :key="'npc-card-' + row.id"
              class="card zufallstabellen-mobile-card zufallstabellen-mobile-card--klickbar mb-2"
              :class="statusCardKlasse(row)">
              <div class="card-body p-2" @click="zeileBearbeitenAusListe('npc', row)">
                <div v-if="entitaetenAuswahlModus" class="form-check mb-2" @click.stop>
                  <input
                    :id="'zst-npc-sel-' + row.id"
                    class="form-check-input"
                    type="checkbox"
                    :checked="istEntitaetAusgewaehlt('npc', row.id)"
                    @change="toggleEntitaetAuswahl('npc', row.id)" />
                  <label class="form-check-label small" :for="'zst-npc-sel-' + row.id">Auswählen</label>
                </div>
                <div class="fw-semibold mb-1">
                  {{ karteWert(row.name) }}
                  <span v-if="initiativeBadgeText(row.initiative)" class="badge rounded-pill text-bg-info ms-1">
                    INI {{ initiativeBadgeText(row.initiative) }}
                  </span>
                  <span v-if="statusEmoji(row)">{{ statusEmoji(row) }}</span>
                  <span v-if="zeilenWertAlsText(row.spitzname)" class="fw-normal text-secondary">({{ row.spitzname }})</span>
                </div>
                <div class="small"><span class="text-secondary">Beruf:</span> {{ karteWert(row.beruf) }}</div>
                <div class="small"><span class="text-secondary">Gesinnung:</span> {{ karteWert(row.gesinnung) }}</div>
                <div class="small"><span class="text-secondary">Begabungen:</span> {{ begabungswerteKurzText(row) }}</div>
                <div class="small"><span class="text-secondary">Ort:</span> {{ karteWert(row.aufenthaltsort) }}</div>
                <div class="small"><span class="text-secondary">Fraktion:</span> {{ karteWert(row.fraktion) }}</div>
                <div class="small mb-2"><span class="text-secondary">Werte:</span> {{ npcWaffenWerteText(row) }}</div>                <div
                  v-if="featuredBildAusZeile(row)"
                  class="zufallstabellen-mobile-slides mb-2"
                  @click.stop>
                  <button
                    type="button"
                    class="zufallstabellen-mobile-slide"
                    aria-label="Titelbild anzeigen"
                    @click="mediumImBildbetrachterOeffnen(featuredBildAusZeile(row))">
                    <img :src="featuredBildAusZeile(row).dataUrl" :alt="mediumDateiname(featuredBildAusZeile(row))" loading="lazy" />
                  </button>
                </div>
                <div
                  v-if="zeilenWertAlsText(row.notizenHtml)"
                  class="small mb-2 zufallstabellen-richtext-vorschau"
                  @click.stop="onRichTextLinkClick($event)"
                  v-html="richTextHtml(bereinigeNpcNotizenHtml(row.notizenHtml))"></div>
                <div v-else class="small mb-2">—</div>
                <div class="dropdown mt-2" @click.stop>
                  <button type="button" class="btn btn-sm btn-outline-secondary w-100 dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Aktionen">
                    ⚙️
                  </button>
                  <ul class="dropdown-menu w-100">
                    <li class="px-2 py-2">
                      <zufallstabellen-reihenfolge-split
                        :kann-nach-oben="kannZeileNachOben('npc', row.id)"
                        :kann-nach-unten="kannZeileNachUnten('npc', row.id)"
                        @nach-oben="zeileReihenfolgeAendern('npc', row.id, 'oben')"
                        @nach-unten="zeileReihenfolgeAendern('npc', row.id, 'unten')" />
                    </li>
                    <li><hr class="dropdown-divider" /></li>
                    <li><button type="button" class="dropdown-item" @click="paradeWuerfelnFuerEntitaet(row, 'npc')">Parieren</button></li>
                    <li><button type="button" class="dropdown-item" @click="schadenWuerfelnFuerEntitaet(row, 'npc')">Schaden</button></li>
                    <li><button type="button" class="dropdown-item" @click="galerieFuerZeileOeffnen(row)">Medien ({{ medienAnzahl(row) }})</button></li>
                    <li><button type="button" class="dropdown-item" @click="npcBearbeiten(row, indexNachId(zustand.npcs, row.id))">Bearbeiten</button></li>
                    <li><button type="button" class="dropdown-item text-danger" @click="zeileLoeschenDialog('npc', row.id)">Löschen</button></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
      </zufallstabellen-sektion>

      <zufallstabellen-sektion
        section-id="gegenstaende"
        aria-titel="Gegenstände"
        :suche-steuerung-aktiv="sektionSucheAktiv('gegenstaende')"
        :suche-hat-treffer="sektionSucheHatTreffer('gegenstaende')">
        <template #titel>
          <span class="fw-semibold htbah-zufall-karten-titel">
            <span class="material-symbols-outlined" aria-hidden="true">deployed_code</span>
            Gegenstände
          </span>
        </template>
        <template #aktionen>
            <button type="button" class="btn btn-sm btn-outline-danger" @click="tabelleLeerenDialog('gegenstaende')">
              Leeren
            </button>
            <icon-text-button
              type="button"
              class="btn btn-sm btn-outline-primary flex-shrink-0"
              icon="add"
              @click="gegenstandHinzufuegen"
              aria-label="Eintrag hinzufügen">
              Hinzufügen
            </icon-text-button>
        </template>
          <div class="p-2 border-bottom">
            <input
              v-model.trim="sucheGegenstaende"
              type="search"
              class="form-control form-control-sm"
              placeholder="Gegenstände durchsuchen…" />
          </div>
          <div class="table-responsive d-none d-md-block">
            <table class="table table-sm table-striped mb-0 align-middle">
              <thead>
                <tr>
                  <th v-if="entitaetenAuswahlModus" class="text-center zufallstabellen-auswahl-spalte" scope="col">
                    <span class="visually-hidden">Auswahl</span>
                  </th>
                  <th>Name</th>
                  <th>Aufenthaltsort</th>
                  <th>Beschreibung</th>
                  <th class="text-end text-nowrap">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!anzeigeGegenstaende.length">
                  <td :colspan="entitaetenAuswahlModus ? 5 : 4" class="text-secondary text-center py-3">
                    {{ zufallstabellenLeerNachricht((zustand.gegenstaende || []).length, sucheGegenstaende) }}
                  </td>
                </tr>
                <tr
                  v-for="row in anzeigeGegenstaende"
                  :key="row.id"
                  class="zufallstabellen-tabellenzeile-klickbar"
                  @click="zeileBearbeitenAusListe('gegenstand', row)">
                  <td v-if="entitaetenAuswahlModus" class="text-center align-middle" @click.stop>
                    <input
                      class="form-check-input m-0"
                      type="checkbox"
                      :checked="istEntitaetAusgewaehlt('gegenstand', row.id)"
                      :aria-label="'Gegenstand auswählen: ' + karteWert(row.name)"
                      @change="toggleEntitaetAuswahl('gegenstand', row.id)" />
                  </td>
                  <td>{{ karteWert(row.name) }}</td>
                  <td>{{ karteWert(row.aufenthaltsort) }}</td>
                  <td class="small">
                    <div
                      v-if="zeilenWertAlsText(row.beschreibungHtml)"
                      class="htbah-zufall-rich-preview"
                      @click.stop="onRichTextLinkClick($event)"
                      v-html="richTextHtml(row.beschreibungHtml)"></div>
                    <span v-else>—</span>
                  </td>
                  <td class="text-end text-nowrap" @click.stop>
                    <div class="dropdown">
                      <button type="button" class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Aktionen">
                        ⚙️
                      </button>
                      <ul class="dropdown-menu dropdown-menu-end">
                        <li class="px-2 py-2">
                          <zufallstabellen-reihenfolge-split
                            :kann-nach-oben="kannZeileNachOben('gegenstand', row.id)"
                            :kann-nach-unten="kannZeileNachUnten('gegenstand', row.id)"
                            @nach-oben="zeileReihenfolgeAendern('gegenstand', row.id, 'oben')"
                            @nach-unten="zeileReihenfolgeAendern('gegenstand', row.id, 'unten')" />
                        </li>
                        <li><hr class="dropdown-divider" /></li>
                        <li><button type="button" class="dropdown-item" @click="galerieFuerZeileOeffnen(row)">Medien ({{ medienAnzahl(row) }})</button></li>
                        <li><button type="button" class="dropdown-item" @click="gegenstandBearbeiten(row, indexNachId(zustand.gegenstaende, row.id))">Bearbeiten</button></li>
                        <li><button type="button" class="dropdown-item text-danger" @click="zeileLoeschenDialog('gegenstand', row.id)">Löschen</button></li>
                      </ul>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="d-md-none p-2">
            <div v-if="!anzeigeGegenstaende.length" class="text-secondary text-center py-3 small">
              {{ zufallstabellenLeerNachricht((zustand.gegenstaende || []).length, sucheGegenstaende) }}
            </div>
            <div
              v-for="row in anzeigeGegenstaende"
              :key="'gegenstand-card-' + row.id"
              class="card zufallstabellen-mobile-card zufallstabellen-mobile-card--klickbar mb-2">
              <div class="card-body p-2" @click="zeileBearbeitenAusListe('gegenstand', row)">
                <div v-if="entitaetenAuswahlModus" class="form-check mb-2" @click.stop>
                  <input
                    :id="'zst-gegenstand-sel-' + row.id"
                    class="form-check-input"
                    type="checkbox"
                    :checked="istEntitaetAusgewaehlt('gegenstand', row.id)"
                    @change="toggleEntitaetAuswahl('gegenstand', row.id)" />
                  <label class="form-check-label small" :for="'zst-gegenstand-sel-' + row.id">Auswählen</label>
                </div>
                <div class="fw-semibold mb-1">{{ karteWert(row.name) }}</div>
                <div class="small"><span class="text-secondary">Ort:</span> {{ karteWert(row.aufenthaltsort) }}</div>
                <div
                  v-if="featuredBildAusZeile(row)"
                  class="zufallstabellen-mobile-slides my-2"
                  @click.stop>
                  <button
                    type="button"
                    class="zufallstabellen-mobile-slide"
                    aria-label="Titelbild anzeigen"
                    @click="mediumImBildbetrachterOeffnen(featuredBildAusZeile(row))">
                    <img :src="featuredBildAusZeile(row).dataUrl" :alt="mediumDateiname(featuredBildAusZeile(row))" loading="lazy" />
                  </button>
                </div>
                <div
                  v-if="zeilenWertAlsText(row.beschreibungHtml)"
                  class="small mb-2 zufallstabellen-richtext-vorschau"
                  @click.stop="onRichTextLinkClick($event)"
                  v-html="richTextHtml(row.beschreibungHtml)"></div>
                <div v-else class="small mb-2">—</div>
                <div class="dropdown mt-2" @click.stop>
                  <button type="button" class="btn btn-sm btn-outline-secondary w-100 dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Aktionen">
                    ⚙️
                  </button>
                  <ul class="dropdown-menu w-100">
                    <li class="px-2 py-2">
                      <zufallstabellen-reihenfolge-split
                        :kann-nach-oben="kannZeileNachOben('gegenstand', row.id)"
                        :kann-nach-unten="kannZeileNachUnten('gegenstand', row.id)"
                        @nach-oben="zeileReihenfolgeAendern('gegenstand', row.id, 'oben')"
                        @nach-unten="zeileReihenfolgeAendern('gegenstand', row.id, 'unten')" />
                    </li>
                    <li><hr class="dropdown-divider" /></li>
                    <li><button type="button" class="dropdown-item" @click="galerieFuerZeileOeffnen(row)">Medien ({{ medienAnzahl(row) }})</button></li>
                    <li><button type="button" class="dropdown-item" @click="gegenstandBearbeiten(row, indexNachId(zustand.gegenstaende, row.id))">Bearbeiten</button></li>
                    <li><button type="button" class="dropdown-item text-danger" @click="zeileLoeschenDialog('gegenstand', row.id)">Löschen</button></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
      </zufallstabellen-sektion>

      <zufallstabellen-sektion
        section-id="pantheon"
        aria-titel="Pantheon"
        :suche-steuerung-aktiv="sektionSucheAktiv('pantheon')"
        :suche-hat-treffer="sektionSucheHatTreffer('pantheon')">
        <template #titel><span class="fw-semibold">✨ Pantheon</span></template>
        <template #aktionen>
            <button type="button" class="btn btn-sm btn-outline-secondary" @click="pantheonExportieren" title="Nur Pantheon als JSON">
              Export
            </button>
            <label class="btn btn-sm btn-outline-secondary mb-0" title="Pantheon aus JSON ersetzen">
              Import
              <input
                type="file"
                class="d-none"
                accept="application/json,.json"
                @change="pantheonImportieren" />
            </label>
            <button type="button" class="btn btn-sm btn-outline-danger" @click="tabelleLeerenDialog('pantheon')">
              Leeren
            </button>
            <icon-text-button
              type="button"
              class="btn btn-sm btn-outline-primary flex-shrink-0"
              icon="add"
              @click="pantheonHinzufuegen"
              aria-label="Eintrag hinzufügen">
              Hinzufügen
            </icon-text-button>
        </template>
          <div class="p-2 border-bottom">
            <input
              v-model.trim="suchePantheon"
              type="search"
              class="form-control form-control-sm"
              placeholder="Pantheon durchsuchen…" />
          </div>
          <div class="table-responsive d-none d-md-block">
            <table class="table table-sm table-striped mb-0 align-middle">
              <thead>
                <tr>
                  <th v-if="entitaetenAuswahlModus" class="text-center zufallstabellen-auswahl-spalte" scope="col">
                    <span class="visually-hidden">Auswahl</span>
                  </th>
                  <th>Name</th>
                  <th>Domäne</th>
                  <th>Charakter</th>
                  <th>Schutzpatronat</th>
                  <th>Notizen</th>
                  <th class="text-end text-nowrap">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!anzeigePantheon.length">
                  <td :colspan="entitaetenAuswahlModus ? 7 : 6" class="text-secondary text-center py-3">
                    {{ zufallstabellenLeerNachricht((zustand.pantheon || []).length, suchePantheon) }}
                  </td>
                </tr>
                <tr
                  v-for="row in anzeigePantheon"
                  :key="row.id"
                  class="zufallstabellen-tabellenzeile-klickbar"
                  @click="zeileBearbeitenAusListe('pantheon', row)">
                  <td v-if="entitaetenAuswahlModus" class="text-center align-middle" @click.stop>
                    <input
                      class="form-check-input m-0"
                      type="checkbox"
                      :checked="istEntitaetAusgewaehlt('pantheon', row.id)"
                      :aria-label="'Gottheit auswählen: ' + karteWert(row.name)"
                      @change="toggleEntitaetAuswahl('pantheon', row.id)" />
                  </td>
                  <td>{{ karteWert(row.name) }}</td>
                  <td class="small">{{ karteWert(row.domaene) }}</td>
                  <td class="small">{{ karteWert(row.charakter) }}</td>
                  <td class="small">{{ karteWert(row.schutzpatronat) }}</td>
                  <td class="small">
                    <div
                      v-if="zeilenWertAlsText(row.notizenHtml)"
                      class="htbah-zufall-rich-preview"
                      @click.stop="onRichTextLinkClick($event)"
                      v-html="richTextHtml(bereinigeRaetselNotizenHtml(row.notizenHtml))"></div>
                    <span v-else>—</span>
                  </td>
                  <td class="text-end text-nowrap" @click.stop>
                    <div class="dropdown">
                      <button type="button" class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Aktionen">
                        ⚙️
                      </button>
                      <ul class="dropdown-menu dropdown-menu-end">
                        <li class="px-2 py-2">
                          <zufallstabellen-reihenfolge-split
                            :kann-nach-oben="kannZeileNachOben('pantheon', row.id)"
                            :kann-nach-unten="kannZeileNachUnten('pantheon', row.id)"
                            @nach-oben="zeileReihenfolgeAendern('pantheon', row.id, 'oben')"
                            @nach-unten="zeileReihenfolgeAendern('pantheon', row.id, 'unten')" />
                        </li>
                        <li><hr class="dropdown-divider" /></li>
                        <li><button type="button" class="dropdown-item" @click="galerieFuerZeileOeffnen(row)">Medien ({{ medienAnzahl(row) }})</button></li>
                        <li><button type="button" class="dropdown-item" @click="pantheonBearbeiten(row, indexNachId(zustand.pantheon, row.id))">Bearbeiten</button></li>
                        <li><button type="button" class="dropdown-item text-danger" @click="zeileLoeschenDialog('pantheon', row.id)">Löschen</button></li>
                      </ul>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="d-md-none p-2">
            <div v-if="!anzeigePantheon.length" class="text-secondary text-center py-3 small">
              {{ zufallstabellenLeerNachricht((zustand.pantheon || []).length, suchePantheon) }}
            </div>
            <div
              v-for="row in anzeigePantheon"
              :key="'pantheon-card-' + row.id"
              class="card zufallstabellen-mobile-card zufallstabellen-mobile-card--klickbar mb-2">
              <div class="card-body p-2" @click="zeileBearbeitenAusListe('pantheon', row)">
                <div v-if="entitaetenAuswahlModus" class="form-check mb-2" @click.stop>
                  <input
                    :id="'zst-pantheon-sel-' + row.id"
                    class="form-check-input"
                    type="checkbox"
                    :checked="istEntitaetAusgewaehlt('pantheon', row.id)"
                    @change="toggleEntitaetAuswahl('pantheon', row.id)" />
                  <label class="form-check-label small" :for="'zst-pantheon-sel-' + row.id">Auswählen</label>
                </div>
                <div class="fw-semibold mb-1">{{ karteWert(row.name) }}</div>
                <div class="small"><span class="text-secondary">Domäne:</span> {{ karteWert(row.domaene) }}</div>
                <div class="small"><span class="text-secondary">Charakter:</span> {{ karteWert(row.charakter) }}</div>
                <div class="small mb-2">
                  <span class="text-secondary">Schutzpatronat:</span> {{ karteWert(row.schutzpatronat) }}
                </div>                <div
                  v-if="featuredBildAusZeile(row)"
                  class="zufallstabellen-mobile-slides mb-2"
                  @click.stop>
                  <button
                    type="button"
                    class="zufallstabellen-mobile-slide"
                    aria-label="Titelbild anzeigen"
                    @click="mediumImBildbetrachterOeffnen(featuredBildAusZeile(row))">
                    <img :src="featuredBildAusZeile(row).dataUrl" :alt="mediumDateiname(featuredBildAusZeile(row))" loading="lazy" />
                  </button>
                </div>
                <div
                  v-if="zeilenWertAlsText(row.notizenHtml)"
                  class="small mb-2 zufallstabellen-richtext-vorschau"
                  @click.stop="onRichTextLinkClick($event)"
                  v-html="richTextHtml(bereinigeRaetselNotizenHtml(row.notizenHtml))"></div>
                <div v-else class="small mb-2">—</div>
                <div class="dropdown" @click.stop>
                  <button type="button" class="btn btn-sm btn-outline-secondary w-100 dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Aktionen">
                    ⚙️
                  </button>
                  <ul class="dropdown-menu w-100">
                    <li class="px-2 py-2">
                      <zufallstabellen-reihenfolge-split
                        :kann-nach-oben="kannZeileNachOben('pantheon', row.id)"
                        :kann-nach-unten="kannZeileNachUnten('pantheon', row.id)"
                        @nach-oben="zeileReihenfolgeAendern('pantheon', row.id, 'oben')"
                        @nach-unten="zeileReihenfolgeAendern('pantheon', row.id, 'unten')" />
                    </li>
                    <li><hr class="dropdown-divider" /></li>
                    <li><button type="button" class="dropdown-item" @click="galerieFuerZeileOeffnen(row)">Medien ({{ medienAnzahl(row) }})</button></li>
                    <li><button type="button" class="dropdown-item" @click="pantheonBearbeiten(row, indexNachId(zustand.pantheon, row.id))">Bearbeiten</button></li>
                    <li><button type="button" class="dropdown-item text-danger" @click="zeileLoeschenDialog('pantheon', row.id)">Löschen</button></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
      </zufallstabellen-sektion>

      <zufallstabellen-sektion
        section-id="raetsel"
        aria-titel="Rätsel"
        :suche-steuerung-aktiv="sektionSucheAktiv('raetsel')"
        :suche-hat-treffer="sektionSucheHatTreffer('raetsel')">
        <template #titel><span class="fw-semibold">🧩 Rätsel</span></template>
        <template #aktionen>
            <button type="button" class="btn btn-sm btn-outline-danger" @click="tabelleLeerenDialog('raetsel')">
              Leeren
            </button>
            <icon-text-button
              type="button"
              class="btn btn-sm btn-outline-primary flex-shrink-0"
              icon="add"
              @click="raetselHinzufuegen"
              aria-label="Eintrag hinzufügen">
              Hinzufügen
            </icon-text-button>
        </template>
          <div class="p-2 border-bottom">
            <input
              v-model.trim="sucheRaetsel"
              type="search"
              class="form-control form-control-sm"
              placeholder="Rätsel durchsuchen…" />
          </div>
          <div class="table-responsive d-none d-md-block">
            <table class="table table-sm table-striped mb-0 align-middle">
              <thead>
                <tr>
                  <th v-if="entitaetenAuswahlModus" class="text-center zufallstabellen-auswahl-spalte" scope="col">
                    <span class="visually-hidden">Auswahl</span>
                  </th>
                  <th>Art</th>
                  <th>Titel</th>
                  <th>Ort</th>
                  <th>Status</th>
                  <th>Aufgabenstellung</th>
                  <th>Ergebnis</th>
                  <th>Schwierigkeit</th>
                  <th>Details</th>
                  <th class="text-end text-nowrap">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!anzeigeRaetsel.length">
                  <td :colspan="entitaetenAuswahlModus ? 10 : 9" class="text-secondary text-center py-3">
                    {{ zufallstabellenLeerNachricht((zustand.raetsel || []).length, sucheRaetsel) }}
                  </td>
                </tr>
                <tr
                  v-for="row in anzeigeRaetsel"
                  :key="row.id"
                  class="zufallstabellen-tabellenzeile-klickbar"
                  @click="zeileBearbeitenAusListe('raetsel', row)">
                  <td v-if="entitaetenAuswahlModus" class="text-center align-middle" @click.stop>
                    <input
                      class="form-check-input m-0"
                      type="checkbox"
                      :checked="istEntitaetAusgewaehlt('raetsel', row.id)"
                      :aria-label="'Rätsel auswählen: ' + karteWert(row.titel)"
                      @change="toggleEntitaetAuswahl('raetsel', row.id)" />
                  </td>
                  <td class="small">{{ karteWert(row.art) }}</td>
                  <td>{{ karteWert(row.titel) }}</td>
                  <td class="small">{{ karteWert(row.aufenthaltsort) }}</td>
                  <td class="small">
                    <span v-if="raetselGeloest(row)" class="text-success d-inline-flex align-items-center" title="Gelöst">
                      <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
                    </span>
                    <span v-else>—</span>
                  </td>
                  <td class="small">{{ textVorschau(row.aufgabenstellung, 56) }}</td>
                  <td class="small">{{ karteWert(row.ergebnis) }}</td>
                  <td class="small">{{ karteWert(row.schwierigkeit) }}</td>
                  <td class="small">
                    <div
                      v-if="zeilenWertAlsText(row.notizenHtml)"
                      class="htbah-zufall-rich-preview"
                      @click.stop="onRichTextLinkClick($event)"
                      v-html="richTextHtml(row.notizenHtml)"></div>
                    <span v-else>—</span>
                  </td>
                  <td class="text-end text-nowrap" @click.stop>
                    <div class="dropdown">
                      <button type="button" class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Aktionen">
                        ⚙️
                      </button>
                      <ul class="dropdown-menu dropdown-menu-end">
                        <li class="px-2 py-2">
                          <zufallstabellen-reihenfolge-split
                            :kann-nach-oben="kannZeileNachOben('raetsel', row.id)"
                            :kann-nach-unten="kannZeileNachUnten('raetsel', row.id)"
                            @nach-oben="zeileReihenfolgeAendern('raetsel', row.id, 'oben')"
                            @nach-unten="zeileReihenfolgeAendern('raetsel', row.id, 'unten')" />
                        </li>
                        <li><hr class="dropdown-divider" /></li>
                        <li><button type="button" class="dropdown-item" @click="galerieFuerZeileOeffnen(row)">Medien ({{ medienAnzahl(row) }})</button></li>
                        <li><button type="button" class="dropdown-item" @click="raetselBearbeiten(row, indexNachId(zustand.raetsel, row.id))">Bearbeiten</button></li>
                        <li><button type="button" class="dropdown-item text-danger" @click="zeileLoeschenDialog('raetsel', row.id)">Löschen</button></li>
                      </ul>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="d-md-none p-2">
            <div v-if="!anzeigeRaetsel.length" class="text-secondary text-center py-3 small">
              {{ zufallstabellenLeerNachricht((zustand.raetsel || []).length, sucheRaetsel) }}
            </div>
            <div
              v-for="row in anzeigeRaetsel"
              :key="'raetsel-card-' + row.id"
              class="card zufallstabellen-mobile-card zufallstabellen-mobile-card--klickbar mb-2">
              <div class="card-body p-2" @click="zeileBearbeitenAusListe('raetsel', row)">
                <div v-if="entitaetenAuswahlModus" class="form-check mb-2" @click.stop>
                  <input
                    :id="'zst-raetsel-sel-' + row.id"
                    class="form-check-input"
                    type="checkbox"
                    :checked="istEntitaetAusgewaehlt('raetsel', row.id)"
                    @change="toggleEntitaetAuswahl('raetsel', row.id)" />
                  <label class="form-check-label small" :for="'zst-raetsel-sel-' + row.id">Auswählen</label>
                </div>
                <div class="fw-semibold mb-1">{{ karteWert(row.titel) }}</div>
                <div class="small"><span class="text-secondary">Art:</span> {{ karteWert(row.art) }}</div>
                <div class="small"><span class="text-secondary">Ort:</span> {{ karteWert(row.aufenthaltsort) }}</div>
                <div class="small mb-1">
                  <span class="text-secondary">Status:</span>
                  <span v-if="raetselGeloest(row)" class="text-success d-inline-flex align-items-center">
                    <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
                  </span>
                  <span v-else>Offen</span>
                </div>
                <div class="small"><span class="text-secondary">Formulierung:</span> {{ textVorschau(row.aufgabenstellung, 96) }}</div>
                <div class="small"><span class="text-secondary">Ergebnis:</span> {{ karteWert(row.ergebnis) }}</div>
                <div class="small mb-2">
                  <span class="text-secondary">Schwierigkeit:</span> {{ karteWert(row.schwierigkeit) }}
                </div>                <div
                  v-if="featuredBildAusZeile(row)"
                  class="zufallstabellen-mobile-slides mb-2"
                  @click.stop>
                  <button
                    type="button"
                    class="zufallstabellen-mobile-slide"
                    aria-label="Titelbild anzeigen"
                    @click="mediumImBildbetrachterOeffnen(featuredBildAusZeile(row))">
                    <img :src="featuredBildAusZeile(row).dataUrl" :alt="mediumDateiname(featuredBildAusZeile(row))" loading="lazy" />
                  </button>
                </div>
                <div
                  v-if="zeilenWertAlsText(row.notizenHtml)"
                  class="small mb-2 zufallstabellen-richtext-vorschau"
                  @click.stop="onRichTextLinkClick($event)"
                  v-html="richTextHtml(row.notizenHtml)"></div>
                <div v-else class="small mb-2">—</div>
                <div class="dropdown" @click.stop>
                  <button type="button" class="btn btn-sm btn-outline-secondary w-100 dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Aktionen">
                    ⚙️
                  </button>
                  <ul class="dropdown-menu w-100">
                    <li class="px-2 py-2">
                      <zufallstabellen-reihenfolge-split
                        :kann-nach-oben="kannZeileNachOben('raetsel', row.id)"
                        :kann-nach-unten="kannZeileNachUnten('raetsel', row.id)"
                        @nach-oben="zeileReihenfolgeAendern('raetsel', row.id, 'oben')"
                        @nach-unten="zeileReihenfolgeAendern('raetsel', row.id, 'unten')" />
                    </li>
                    <li><hr class="dropdown-divider" /></li>
                    <li><button type="button" class="dropdown-item" @click="galerieFuerZeileOeffnen(row)">Medien ({{ medienAnzahl(row) }})</button></li>
                    <li><button type="button" class="dropdown-item" @click="raetselBearbeiten(row, indexNachId(zustand.raetsel, row.id))">Bearbeiten</button></li>
                    <li><button type="button" class="dropdown-item text-danger" @click="zeileLoeschenDialog('raetsel', row.id)">Löschen</button></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
      </zufallstabellen-sektion>

      <zufallstabellen-sektion
        section-id="bestien"
        aria-titel="Bestarium"
        :suche-steuerung-aktiv="sektionSucheAktiv('bestien')"
        :suche-hat-treffer="sektionSucheHatTreffer('bestien')">
        <template #titel>
          <span class="fw-semibold htbah-zufall-karten-titel">
            <span class="material-symbols-outlined" aria-hidden="true">pets</span>
            Bestarium
          </span>
        </template>
        <template #aktionen>
            <button type="button" class="btn btn-sm btn-outline-danger" @click="tabelleLeerenDialog('bestien')">
              Leeren
            </button>
            <icon-text-button
              type="button"
              class="btn btn-sm btn-outline-primary flex-shrink-0"
              icon="add"
              @click="bestieHinzufuegen"
              aria-label="Eintrag hinzufügen">
              Hinzufügen
            </icon-text-button>
        </template>
          <div class="p-2 border-bottom">
            <input
              v-model.trim="sucheBestien"
              type="search"
              class="form-control form-control-sm"
              placeholder="Bestien durchsuchen…" />
            <div class="d-flex flex-wrap gap-3 mt-2 small">
              <div class="form-check m-0">
                <input id="zst-bestie-filter-bewusstlos" class="form-check-input" type="checkbox" v-model="zeigeBewusstloseBestien" />
                <label class="form-check-label" for="zst-bestie-filter-bewusstlos">Bewusstlose anzeigen</label>
              </div>
              <div class="form-check m-0">
                <input id="zst-bestie-filter-tot" class="form-check-input" type="checkbox" v-model="zeigeToteBestien" />
                <label class="form-check-label" for="zst-bestie-filter-tot">Tote anzeigen</label>
              </div>
            </div>
          </div>
          <div class="table-responsive d-none d-md-block">
            <table class="table table-sm table-striped mb-0 align-middle">
              <thead>
                <tr>
                  <th v-if="entitaetenAuswahlModus" class="text-center zufallstabellen-auswahl-spalte" scope="col">
                    <span class="visually-hidden">Auswahl</span>
                  </th>
                  <th>Art</th>
                  <th>Name</th>
                  <th>Waffen (Inventar)</th>
                  <th>LP</th>
                  <th>Aufenthaltsort</th>
                  <th>Begabungen</th>
                  <th>Aggro</th>
                  <th>Stärken</th>
                  <th>Schwächen</th>
                  <th>Beschreibung</th>
                  <th class="text-end text-nowrap">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!anzeigeBestien.length">
                  <td :colspan="entitaetenAuswahlModus ? 12 : 11" class="text-secondary text-center py-3">
                    {{ zufallstabellenLeerNachricht((zustand.bestien || []).length, sucheBestien) }}
                  </td>
                </tr>
                <tr
                  v-for="row in anzeigeBestien"
                  :key="row.id"
                  class="zufallstabellen-tabellenzeile-klickbar"
                  :class="statusZeilenKlasse(row)"
                  @click="zeileBearbeitenAusListe('bestie', row)">
                  <td v-if="entitaetenAuswahlModus" class="text-center align-middle" @click.stop>
                    <input
                      class="form-check-input m-0"
                      type="checkbox"
                      :checked="istEntitaetAusgewaehlt('bestie', row.id)"
                      :aria-label="'Bestie auswählen: ' + karteWert(row.name)"
                      @change="toggleEntitaetAuswahl('bestie', row.id)" />
                  </td>
                  <td class="small">{{ bestieKategorieLabel(row.kategorie) }}</td>
                  <td>
                    {{ karteWert(row.name) }}
                    <span v-if="initiativeBadgeText(row.initiative)" class="badge rounded-pill text-bg-info ms-1">
                      INI {{ initiativeBadgeText(row.initiative) }}
                    </span>
                    <span v-if="statusEmoji(row)">{{ statusEmoji(row) }}</span>
                  </td>
                  <td class="small">{{ entitaetInventarWaffenAnzeigeText(row) }}</td>
                  <td class="small">{{ karteWert(row.lebenspunkte) }}</td>
                  <td>{{ karteWert(row.aufenthaltsort) }}</td>
                  <td class="small text-nowrap">{{ begabungswerteKurzText(row) }}</td>
                  <td class="small text-nowrap">{{ bestieAggressivitaetText(row) }}</td>
                  <td class="small">{{ textVorschau(row.staerke, 48) }}</td>
                  <td class="small">{{ textVorschau(row.schwaeche, 48) }}</td>
                  <td class="small">
                    <div
                      v-if="zeilenWertAlsText(row.beschreibungHtml)"
                      class="htbah-zufall-rich-preview"
                      @click.stop="onRichTextLinkClick($event)"
                      v-html="richTextHtml(row.beschreibungHtml)"></div>
                    <span v-else>—</span>
                  </td>
                  <td class="text-end text-nowrap" @click.stop>
                    <div class="dropdown">
                      <button type="button" class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Aktionen">
                        ⚙️
                      </button>
                      <ul class="dropdown-menu dropdown-menu-end">
                        <li class="px-2 py-2">
                          <zufallstabellen-reihenfolge-split
                            :kann-nach-oben="kannZeileNachOben('bestie', row.id)"
                            :kann-nach-unten="kannZeileNachUnten('bestie', row.id)"
                            @nach-oben="zeileReihenfolgeAendern('bestie', row.id, 'oben')"
                            @nach-unten="zeileReihenfolgeAendern('bestie', row.id, 'unten')" />
                        </li>
                        <li><hr class="dropdown-divider" /></li>
                        <li><button type="button" class="dropdown-item" @click="paradeWuerfelnFuerEntitaet(row, 'bestie')">Parieren</button></li>
                        <li><button type="button" class="dropdown-item" @click="schadenWuerfelnFuerEntitaet(row, 'bestie')">Schaden</button></li>
                        <li><button type="button" class="dropdown-item" @click="galerieFuerZeileOeffnen(row)">Medien ({{ medienAnzahl(row) }})</button></li>
                        <li><button type="button" class="dropdown-item" @click="bestieBearbeiten(row, indexNachId(zustand.bestien, row.id))">Bearbeiten</button></li>
                        <li><button type="button" class="dropdown-item text-danger" @click="zeileLoeschenDialog('bestie', row.id)">Löschen</button></li>
                      </ul>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="d-md-none p-2">
            <div v-if="!anzeigeBestien.length" class="text-secondary text-center py-3 small">
              {{ zufallstabellenLeerNachricht((zustand.bestien || []).length, sucheBestien) }}
            </div>
            <div
              v-for="row in anzeigeBestien"
              :key="'bestie-card-' + row.id"
              class="card zufallstabellen-mobile-card zufallstabellen-mobile-card--klickbar mb-2"
              :class="statusCardKlasse(row)">
              <div class="card-body p-2" @click="zeileBearbeitenAusListe('bestie', row)">
                <div v-if="entitaetenAuswahlModus" class="form-check mb-2" @click.stop>
                  <input
                    :id="'zst-bestie-sel-' + row.id"
                    class="form-check-input"
                    type="checkbox"
                    :checked="istEntitaetAusgewaehlt('bestie', row.id)"
                    @change="toggleEntitaetAuswahl('bestie', row.id)" />
                  <label class="form-check-label small" :for="'zst-bestie-sel-' + row.id">Auswählen</label>
                </div>
                <div class="fw-semibold mb-1">
                  {{ karteWert(row.name) }}
                  <span v-if="initiativeBadgeText(row.initiative)" class="badge rounded-pill text-bg-info ms-1">
                    INI {{ initiativeBadgeText(row.initiative) }}
                  </span>
                  <span v-if="statusEmoji(row)">{{ statusEmoji(row) }}</span>
                </div>
                <div class="small"><span class="text-secondary">Art:</span> {{ bestieKategorieLabel(row.kategorie) }}</div>
                <div class="small"><span class="text-secondary">Ort:</span> {{ karteWert(row.aufenthaltsort) }}</div>
                <div class="small"><span class="text-secondary">Begabungen:</span> {{ begabungswerteKurzText(row) }}</div>
                <div class="small">
                  <span class="text-secondary">Waffen:</span> {{ entitaetInventarWaffenAnzeigeText(row) }}
                </div>
                <div class="small">
                  <span class="text-secondary">LP:</span> {{ karteWert(row.lebenspunkte) }}
                </div>
                <div class="small mb-2">
                  <span class="text-secondary">Aggressiv / offensiv:</span> {{ bestieAggressivitaetText(row) }}
                </div>
                <div v-if="zeilenWertAlsText(row.staerke)" class="small">
                  <span class="text-secondary">Stärken:</span> {{ textVorschau(row.staerke, 120) }}
                </div>
                <div v-if="zeilenWertAlsText(row.schwaeche)" class="small mb-2">
                  <span class="text-secondary">Schwächen:</span> {{ textVorschau(row.schwaeche, 120) }}
                </div>                <div
                  v-if="featuredBildAusZeile(row)"
                  class="zufallstabellen-mobile-slides mb-2"
                  @click.stop>
                  <button
                    type="button"
                    class="zufallstabellen-mobile-slide"
                    aria-label="Titelbild anzeigen"
                    @click="mediumImBildbetrachterOeffnen(featuredBildAusZeile(row))">
                    <img :src="featuredBildAusZeile(row).dataUrl" :alt="mediumDateiname(featuredBildAusZeile(row))" loading="lazy" />
                  </button>
                </div>
                <div
                  v-if="zeilenWertAlsText(row.beschreibungHtml)"
                  class="small mb-2 zufallstabellen-richtext-vorschau"
                  @click.stop="onRichTextLinkClick($event)"
                  v-html="richTextHtml(row.beschreibungHtml)"></div>
                <div v-else class="small mb-2">—</div>
                <div class="dropdown mt-2" @click.stop>
                  <button type="button" class="btn btn-sm btn-outline-secondary w-100 dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Aktionen">
                    ⚙️
                  </button>
                  <ul class="dropdown-menu w-100">
                    <li class="px-2 py-2">
                      <zufallstabellen-reihenfolge-split
                        :kann-nach-oben="kannZeileNachOben('bestie', row.id)"
                        :kann-nach-unten="kannZeileNachUnten('bestie', row.id)"
                        @nach-oben="zeileReihenfolgeAendern('bestie', row.id, 'oben')"
                        @nach-unten="zeileReihenfolgeAendern('bestie', row.id, 'unten')" />
                    </li>
                    <li><hr class="dropdown-divider" /></li>
                    <li><button type="button" class="dropdown-item" @click="paradeWuerfelnFuerEntitaet(row, 'bestie')">Parieren</button></li>
                    <li><button type="button" class="dropdown-item" @click="schadenWuerfelnFuerEntitaet(row, 'bestie')">Schaden</button></li>
                    <li><button type="button" class="dropdown-item" @click="galerieFuerZeileOeffnen(row)">Medien ({{ medienAnzahl(row) }})</button></li>
                    <li><button type="button" class="dropdown-item" @click="bestieBearbeiten(row, indexNachId(zustand.bestien, row.id))">Bearbeiten</button></li>
                    <li><button type="button" class="dropdown-item text-danger" @click="zeileLoeschenDialog('bestie', row.id)">Löschen</button></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
      </zufallstabellen-sektion>

      <div class="abstandshalter" aria-hidden="true"></div>

      <zufallstabellen-zeile-modal
        :anlage="{ offen: !!bearbeitung, typ: bearbeitung ? bearbeitung.typ : '', zeile: bearbeitung ? bearbeitung.zeile : null }"
        :zeile-modal-titel="zeileModalTitel"
        :random-sichtbar="bearbeitungIndex < 0"
        :zufallsgenerator-bereit="zufallsgeneratorBereit"
        :zufall-npc-epoche="zufallNpcEpoche"
        :zufall-gegenstand-epoche="zufallGegenstandEpoche"
        :zufall-fraktion-epoche="zufallFraktionEpoche"
        :zufall-raetsel-epoche="zufallRaetselEpoche"
        :zufall-ort-epoche="zufallOrtEpoche"
        :zufall-pantheon-epoche="zufallPantheonEpoche"
        :zufall-bestie-epoche="zufallBestieEpoche"
        :pantheon-namen-liste="pantheonNamenListe"
        :fraktionen-mit-namen="fraktionenMitNamen"
        :orte-namen-liste="orteNamenListe"
        :zeile-quill-session="zeileQuillSession"
        :zeile-quill-host-ref-fn="zeileQuillHostRefFn"
        @close="schliesseZeileModal"
        @save="zeileSpeichern"
        @edit-blur="zeileBearbeitungBeiBlurSpeichern"
        @random="zufallsvorschlagUebernehmen"
        @npc-refresh-field="npcFeldNeuWuerfeln"
        @npc-wizard="npcWizardOeffnen"
        @bestien-wizard="bestienWizardOeffnen"
        @ort-wizard="ortWizardOeffnen"
        @fraktion-wizard="fraktionWizardOeffnen"
        @raetsel-wizard="raetselWizardOeffnen"
        @pantheon-wizard="pantheonWizardOeffnen"
        @gegenstand-wizard="gegenstandWizardOeffnen"
        @welt-open="zeileInWeltOeffnen"
        @media-upload="onBearbeitungsMedienDateienGewaehlt"
        @media-remove="mediumAusBearbeitungEntfernen"
        @media-set-primary="setzeBearbeitungPrimaryMedium"
        @media-open="mediumImBildbetrachterOeffnen"
        @media-download="mediumHerunterladen"
        @duplicate="onHauptZeileModalDuplicate"
        @inventar-remove="onInventarEintragEntfernen"
        @inventar-save="onInventarZeileGespeichert"
        @update:zufallNpcEpoche="zufallNpcEpoche = $event"
        @update:zufallGegenstandEpoche="zufallGegenstandEpoche = $event"
        @update:zufallFraktionEpoche="zufallFraktionEpoche = $event"
        @update:zufallRaetselEpoche="zufallRaetselEpoche = $event"
        @update:zufallOrtEpoche="zufallOrtEpoche = $event"
        @update:zufallPantheonEpoche="zufallPantheonEpoche = $event"
        @update:zufallBestieEpoche="zufallBestieEpoche = $event" />

      <zufallstabellen-zeile-modal
        :anlage="{ offen: !!bearbeitungOverlay, typ: bearbeitungOverlay ? bearbeitungOverlay.typ : '', zeile: bearbeitungOverlay ? bearbeitungOverlay.zeile : null }"
        :zeile-modal-titel="zeileModalTitelOverlay"
        :random-sichtbar="bearbeitungOverlayIndex < 0"
        :zufallsgenerator-bereit="zufallsgeneratorBereit"
        :zufall-npc-epoche="zufallNpcEpoche"
        :zufall-gegenstand-epoche="zufallGegenstandEpoche"
        :zufall-fraktion-epoche="zufallFraktionEpoche"
        :zufall-raetsel-epoche="zufallRaetselEpoche"
        :zufall-ort-epoche="zufallOrtEpoche"
        :zufall-pantheon-epoche="zufallPantheonEpoche"
        :zufall-bestie-epoche="zufallBestieEpoche"
        :pantheon-namen-liste="pantheonNamenListe"
        :fraktionen-mit-namen="fraktionenMitNamen"
        :orte-namen-liste="orteNamenListe"
        :zeile-quill-session="overlayZeileQuillSession"
        :zeile-quill-host-ref-fn="overlayZeileQuillHostRefFn"
        @close="overlaySchliesseZeileModal"
        @save="overlayZeileSpeichern"
        @edit-blur="overlayZeileBearbeitungBeiBlurSpeichern"
        @random="overlayZufallsvorschlagUebernehmen"
        @npc-refresh-field="overlayNpcFeldNeuWuerfeln"
        @npc-wizard="overlayNpcWizardOeffnen"
        @bestien-wizard="overlayBestienWizardOeffnen"
        @ort-wizard="overlayOrtWizardOeffnen"
        @fraktion-wizard="overlayFraktionWizardOeffnen"
        @raetsel-wizard="overlayRaetselWizardOeffnen"
        @pantheon-wizard="overlayPantheonWizardOeffnen"
        @gegenstand-wizard="overlayGegenstandWizardOeffnen"
        @welt-open="overlayZeileInWeltOeffnen"
        @media-upload="overlayMediaUpload"
        @media-remove="overlayMediaRemove"
        @media-set-primary="overlayMediaSetPrimary"
        @media-open="mediumImBildbetrachterOeffnen"
        @media-download="overlayMediaDownload"
        @duplicate="onOverlayZeileModalDuplicate"
        @inventar-remove="onInventarEintragEntfernen"
        @inventar-save="onOverlayInventarZeileGespeichert"
        @update:zufallNpcEpoche="zufallNpcEpoche = $event"
        @update:zufallGegenstandEpoche="zufallGegenstandEpoche = $event"
        @update:zufallFraktionEpoche="zufallFraktionEpoche = $event"
        @update:zufallRaetselEpoche="zufallRaetselEpoche = $event"
        @update:zufallOrtEpoche="zufallOrtEpoche = $event"
        @update:zufallPantheonEpoche="zufallPantheonEpoche = $event"
        @update:zufallBestieEpoche="zufallBestieEpoche = $event" />
      <parade-modal ref="paradeModal" />
      <schaden-modal ref="schadenModal" />

      <div
        class="modal fade"
        id="htbahZufallstabellenGalerieModal"
        ref="galerieModalElement"
        tabindex="-1"
        aria-labelledby="htbahZufallstabellenGalerieModalLabel"
        aria-hidden="true"
        @hidden.bs.modal="onGalerieModalHidden">
        <div class="modal-dialog modal-dialog-scrollable modal-lg">
          <div class="modal-content shadow-lg">
            <div class="modal-header">
              <h5 class="modal-title" id="htbahZufallstabellenGalerieModalLabel">Medien</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Schließen"></button>
            </div>
            <div class="modal-body text-start">
              <div v-if="!galerieModalZeile || !medienAnzahl(galerieModalZeile)" class="text-secondary small">
                Für diesen Eintrag sind keine Medien hinterlegt.
              </div>
              <template v-else>
                <h6 class="small text-secondary text-uppercase mb-2">Bilder</h6>
                <div v-if="!medienBilderAusZeile(galerieModalZeile).length" class="small text-secondary mb-3">
                  Keine Bilder.
                </div>
                <div v-else class="row g-2 mb-3">
                  <div
                    v-for="bild in medienBilderAusZeile(galerieModalZeile)"
                    :key="'galerie-bild-' + bild.id"
                    class="col-6 col-md-4">
                    <button
                      type="button"
                      class="zufallstabellen-galerie-thumb"
                      @click="mediumImBildbetrachterOeffnen(bild)">
                      <img :src="bild.dataUrl" :alt="mediumDateiname(bild)" loading="lazy" />
                    </button>
                    <div class="small mt-1 text-truncate">{{ mediumDateiname(bild) }}</div>
                  </div>
                </div>

                <h6 class="small text-secondary text-uppercase mb-2">Dateien</h6>
                <div v-if="!medienDateienAusZeile(galerieModalZeile).length" class="small text-secondary">
                  Keine weiteren Dateien.
                </div>
                <div v-else class="list-group list-group-flush">
                  <div
                    v-for="datei in medienDateienAusZeile(galerieModalZeile)"
                    :key="'galerie-datei-' + datei.id"
                    class="list-group-item px-0">
                    <div class="d-flex justify-content-between align-items-start gap-2">
                      <div class="small">
                        <div class="fw-semibold">{{ mediumDateiname(datei) }}</div>
                        <div class="text-secondary">{{ mediumDateiTypLabel(datei) }}</div>
                        <div v-if="mediumDateigroesseLabel(datei)" class="text-secondary">
                          {{ mediumDateigroesseLabel(datei) }}
                        </div>
                      </div>
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-secondary"
                        @click="mediumHerunterladen(datei)">
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <bestaetigen-modal ref="zufallstabellenBestaetigen" modal-id="htbahZufallstabellenBestaetigen" />

      <npc-wizard-modal
        ref="npcWizardModal"
        modal-id="htbahZufallstabellenNpcWizard"
        @generieren="npcWizardUebernehmen" />

      <bestien-wizard-modal
        ref="bestienWizardModal"
        modal-id="htbahZufallstabellenBestienWizard"
        @generieren="bestienWizardUebernehmen" />

      <ort-wizard-modal
        ref="ortWizardModal"
        modal-id="htbahZufallstabellenOrtWizard"
        @generieren="ortWizardUebernehmen" />

      <fraktion-wizard-modal
        ref="fraktionWizardModal"
        modal-id="htbahZufallstabellenFraktionWizard"
        @generieren="fraktionWizardUebernehmen" />

      <raetsel-wizard-modal
        ref="raetselWizardModal"
        modal-id="htbahZufallstabellenRaetselWizard"
        @generieren="raetselWizardUebernehmen" />

      <pantheon-wizard-modal
        ref="pantheonWizardModal"
        modal-id="htbahZufallstabellenPantheonWizard"
        @generieren="pantheonWizardUebernehmen" />

      <gegenstand-wizard-modal
        ref="gegenstandWizardModal"
        modal-id="htbahZufallstabellenGegenstandWizard"
        @generieren="gegenstandWizardUebernehmen" />
    </div>
  `,
};
