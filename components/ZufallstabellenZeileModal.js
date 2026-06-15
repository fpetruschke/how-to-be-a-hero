window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.ZufallstabellenZeileModal = {
  name: 'ZufallstabellenZeileModal',
  components: {
    ParadeModal: window.HTBAH_KOMPONENTEN.ParadeModal,
    SchadenModal: window.HTBAH_KOMPONENTEN.SchadenModal,
    ProbeWurfModal: window.HTBAH_KOMPONENTEN.ProbeWurfModal,
    InventarEditorPanel: window.HTBAH_KOMPONENTEN.InventarEditorPanel,
    HtmlFeldQuillEditor: window.HTBAH_KOMPONENTEN.HtmlFeldQuillEditor,
    FaehigkeitenEditorPanel: window.HTBAH_KOMPONENTEN.FaehigkeitenEditorPanel,
    FaehigkeitenKompaktPanel: window.HTBAH_KOMPONENTEN.FaehigkeitenKompaktPanel,
    EntityKartenIconFeld: window.HTBAH_KOMPONENTEN.EntityKartenIconFeld,
    EntitaetAnzeigeIcon: window.HTBAH_KOMPONENTEN.EntitaetAnzeigeIcon,
  },
  props: {
    anlage: { type: Object, required: true },
    zeileModalTitel: { type: String, default: '' },
    eingebettet: { type: Boolean, default: false },
    randomSichtbar: { type: Boolean, default: true },
    randomWizardVerfuegbar: { type: Boolean, default: true },
    zufallsgeneratorBereit: { type: Boolean, default: false },
    zufallNpcEpoche: { type: String, default: 'mittelalter' },
    zufallGegenstandEpoche: { type: String, default: 'mittelalter' },
    zufallFraktionEpoche: { type: String, default: 'mittelalter' },
    zufallRaetselEpoche: { type: String, default: 'mittelalter' },
    zufallOrtEpoche: { type: String, default: 'mittelalter' },
    zufallPantheonEpoche: { type: String, default: 'mittelalter' },
    zufallBestieEpoche: { type: String, default: 'mittelalter' },
    pantheonNamenListe: { type: Array, default: () => [] },
    fraktionenMitNamen: { type: Array, default: () => [] },
    orteNamenListe: { type: Array, default: () => [] },
    speicherDeaktiviert: { type: Boolean, default: false },
    speicherHinweis: { type: String, default: '' },
    interaktiveWeltBearbeitung: { type: Boolean, default: false },
    hatUngespeicherteAenderungen: { type: Boolean, default: false },
    zeileQuillSession: { type: Number, default: 0 },
    zeileQuillHostRefFn: { type: Function, required: true },
  },
  emits: [
    'close',
    'save',
    'random',
    'media-upload',
    'media-remove',
    'media-set-primary',
    'media-open',
    'media-download',
    'edit-blur',
    'delete',
    'duplicate',
    'update:zufallNpcEpoche',
    'update:zufallGegenstandEpoche',
    'update:zufallFraktionEpoche',
    'update:zufallRaetselEpoche',
    'update:zufallOrtEpoche',
    'update:zufallPantheonEpoche',
    'update:zufallBestieEpoche',
    'npc-refresh-field',
    'npc-wizard',
    'bestien-wizard',
    'ort-wizard',
    'fraktion-wizard',
    'raetsel-wizard',
    'pantheon-wizard',
    'gegenstand-wizard',
    'welt-open',
    'inventar-remove',
    'inventar-save',
    'karten-icon-change',
  ],
  data() {
    return {
      modal: { ...window.HTBAH_MODAL_FENSTER.erstelleBasisDaten() },
      fraktionOrtEingabe: '',
      aktiverBearbeitungsTab: 'daten',
      fokusVorModal: null,
      lpSnapshotVorEingabe: null,
      kampfZustandSyncAusLpAktiv: false,
      kampfModalDomPrefix:
        'htbah-zeile-kampf-' + Math.random().toString(36).slice(2, 11),
      probeModalGeneration: 0,
      paradeModalGeneration: 0,
      schadenModalGeneration: 0,
      zufallEpocheSelect: 'mittelalter',
    };
  },
  computed: {
    fensterStil() {
      return window.HTBAH_MODAL_FENSTER.berechneFensterStil.call(this.modal);
    },
    vollbildIcon() {
      return this.modal.istVollbild ? 'close_fullscreen' : 'open_in_full';
    },
    entitaetGespeichert() {
      return !(Number.isInteger(this.anlage && this.anlage.index) && this.anlage.index < 0);
    },
    istNeu() {
      return !this.entitaetGespeichert;
    },
    istBearbeitung() {
      return !this.istNeu;
    },
    zeigtDatenTab() {
      return this.istNeu || this.aktiverBearbeitungsTab === 'daten';
    },
    zeigtMedienTab() {
      return this.istBearbeitung && this.aktiverBearbeitungsTab === 'medien';
    },
    kannLoeschen() {
      const typ = this.anlage && this.anlage.typ;
      if (!this.istBearbeitung || !typ) {
        return false;
      }
      return ['npc', 'ort', 'fraktion', 'pantheon', 'raetsel', 'bestie', 'gegenstand'].includes(typ);
    },
    kannDuplizieren() {
      const typ = this.anlage && this.anlage.typ;
      return (
        this.istBearbeitung &&
        !!typ &&
        ['npc', 'ort', 'fraktion', 'pantheon', 'raetsel', 'bestie', 'gegenstand'].includes(typ)
      );
    },
    entitaetBegabungen() {
      const zeile = this.anlage && this.anlage.zeile;
      const EF = window.HTBAH_ENTITAET_FAEHIGKEITEN_MODEL;
      if (!zeile || !EF || typeof EF.begabungenAusEntitaet !== 'function') {
        return { handeln: 0, wissen: 0, soziales: 0 };
      }
      return EF.begabungenAusEntitaet(zeile);
    },
    begabungHandelnFuerInitiative() {
      const b = this.entitaetBegabungen.handeln;
      return Math.max(0, Math.min(40, Math.round(Number(b) || 0)));
    },
    zeilePresetId() {
      const zeile = this.anlage && this.anlage.zeile;
      const EF = window.HTBAH_ENTITAET_FAEHIGKEITEN_MODEL;
      if (!zeile || !EF || typeof EF.presetIdFuerEntitaet !== 'function') {
        return '';
      }
      const typ = this.anlage.typ === 'bestie' ? 'bestie' : 'npc';
      return EF.presetIdFuerEntitaet(typ, zeile, this.zufallNpcEpoche);
    },
    kannInWeltOeffnen() {
      if (this.randomSichtbar) {
        return false;
      }
      const typ = this.anlage && this.anlage.typ;
      if (!['npc', 'bestie', 'ort', 'raetsel', 'gegenstand'].includes(typ)) {
        return false;
      }
      const id = this.anlage && this.anlage.zeile && this.anlage.zeile.id;
      return !!(id && String(id).trim());
    },
    zeigtInventarBereich() {
      const typ = this.anlage && this.anlage.typ;
      return typ === 'npc' || typ === 'bestie';
    },
    inventarListe() {
      if (!this.zeigtInventarBereich || !this.anlage || !this.anlage.zeile) {
        return [];
      }
      return Array.isArray(this.anlage.zeile.inventar) ? this.anlage.zeile.inventar : [];
    },
    inventarListeModel() {
      if (!this.anlage || !this.anlage.zeile) {
        return [];
      }
      if (!Array.isArray(this.anlage.zeile.inventar)) {
        this.anlage.zeile.inventar = [];
      }
      return this.anlage.zeile.inventar;
    },
    zeigtKampfSchnellaktionen() {
      const typ = this.anlage && this.anlage.typ;
      return (typ === 'npc' || typ === 'bestie') && this.istBearbeitung;
    },
    entitaetLebenspunkteStatus() {
      const zeile = this.anlage && this.anlage.zeile;
      if (!zeile || typeof window.HTBAH.berechneLebenspunkteStatus !== 'function') {
        return { tot: false, bewusstlos: false };
      }
      return window.HTBAH.berechneLebenspunkteStatus(zeile);
    },
    zeigtWizardMenue() {
      if (!this.randomSichtbar || !this.randomWizardVerfuegbar) {
        return false;
      }
      const typ = this.anlage && this.anlage.typ;
      return ['npc', 'bestie', 'ort', 'fraktion', 'raetsel', 'pantheon', 'gegenstand'].includes(typ);
    },
    zeigtZufallEpochenAuswahl() {
      if (!this.randomSichtbar) {
        return false;
      }
      const typ = this.anlage && this.anlage.typ;
      return ['npc', 'ort', 'fraktion', 'pantheon', 'raetsel', 'bestie', 'gegenstand'].includes(typ);
    },
    kampfZustandOptionen() {
      return [
        { id: 'vital', label: 'Vital', emoji: '💚' },
        { id: 'bewusstlos', label: 'Bewusstlos', emoji: '😵' },
        { id: 'tot', label: 'Tot', emoji: '💀' },
      ];
    },
    zeigtKartenIconFeld() {
      const typ = this.anlage && this.anlage.typ;
      return ['ort', 'fraktion', 'raetsel', 'gegenstand'].includes(typ);
    },
    kartenIconModalSuffix() {
      return this.interaktiveWeltBearbeitung ? 'iw' : 'zst';
    },
    notizenBereichTitel() {
      const typ = this.anlage && this.anlage.typ;
      if (typ === 'npc') {
        return '📝 Notizen';
      }
      if (typ === 'pantheon') {
        return '📝 Notizen & Mythos';
      }
      if (typ === 'raetsel') {
        return '📝 Notizen';
      }
      if (typ === 'bestie') {
        return '📝 Lebensraum, Lebensweise und Legende';
      }
      if (typ === 'ort') {
        return '📝 Beschreibung / Notizen';
      }
      return '📝 Beschreibung';
    },
    gegenstandArtKategorie() {
      const z = this.anlage && this.anlage.zeile;
      if (!z) {
        return 'sonstiges';
      }
      const kat = typeof z.kategorie === 'string' ? z.kategorie.trim() : '';
      if (kat === 'waffe' || kat === 'kleidung' || kat === 'sonstiges') {
        return kat;
      }
      if (z.istWaffe) {
        return 'waffe';
      }
      return 'sonstiges';
    },
    gegenstandArtLabel() {
      const k = this.gegenstandArtKategorie;
      if (k === 'waffe') {
        return 'Waffe';
      }
      if (k === 'kleidung') {
        return 'Kleidung';
      }
      return 'Gegenstand';
    },
    gegenstandArtBadgeClass() {
      const k = this.gegenstandArtKategorie;
      if (k === 'waffe') {
        return 'inventar-typ-badge text-bg-warning';
      }
      if (k === 'kleidung') {
        return 'inventar-typ-badge text-bg-info';
      }
      return 'inventar-typ-badge text-bg-secondary';
    },
    pantheonQuillEditorKey() {
      const id = this.anlage && this.anlage.zeile && this.anlage.zeile.id ? this.anlage.zeile.id : 'neu';
      return String(id);
    },
  },
  watch: {
    'anlage.zeile': {
      immediate: true,
      handler() {
        this.stelleKartenIconSicher();
      },
    },
    'anlage.offen'(offen) {
      if (offen && !this.eingebettet) {
        this.fokusVorModal = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        this.$nextTick(() => {
          const dockId = this.zeileModalDockId();
          const S = window.HTBAH_MODAL_FENSTER && window.HTBAH_MODAL_FENSTER.speicher;
          if (S) {
            S.beimModalOeffnen(dockId, this.modal, {
              fensterOpts: { minBreite: 360, minHoehe: 300 },
              extrasLieferant: () => ({
                dockTitel: this.zeileModalTitel || 'Eintrag bearbeiten',
                dockEmoji: '✏️',
              }),
              onSchliessen: () => this.schliessen(),
              onWiederherstellen: () => {
                this.$nextTick(() => {
                  this.stelleSichtbaresFensterSicher();
                  this.fokussiereFenster();
                });
              },
            });
          }
          const S2 = window.HTBAH_MODAL_FENSTER && window.HTBAH_MODAL_FENSTER.speicher;
          if (S2) {
            S2.nachGeoeffnetAusSpeicher(this.modal, this, {
              initialisierePosition: this.initialisierePosition,
              fokussiere: this.fokussiereFenster,
            });
          } else if (!this.modal.istVollbild) {
            this.initialisierePosition();
          }
          if (!this.modal.minimiert) {
            this.fokussiereFenster();
          }
        });
      } else if (!offen) {
        this.beendeZiehen();
        this.beendeResize();
        this.modal.istVollbild = false;
        const dockId = this.zeileModalDockId();
        const S = window.HTBAH_MODAL_FENSTER && window.HTBAH_MODAL_FENSTER.speicher;
        if (S) {
          S.beimModalSchliessen(this.modal, dockId);
        } else {
          window.HTBAH_MODAL_FENSTER.methoden.bereinigeMinimiertZustand.call(this.modal, dockId);
        }
        this.stelleFokusWiederHer();
      }
      this.fraktionOrtEingabe = '';
      if (offen) {
        this.synchronisiereZufallEpocheSelect();
        this.aktiverBearbeitungsTab = 'daten';
        this.kampfZustandSyncAusLpAktiv = false;
        this.initialisiereKampfZustandBeiOeffnen();
        this.$nextTick(() => {
          this.kampfZustandSyncAusLpAktiv = true;
        });
      } else {
        this.lpSnapshotVorEingabe = null;
        this.kampfZustandSyncAusLpAktiv = false;
      }
    },
    'anlage.zeile.lebenspunkte'() {
      if (!this.zeigtKampfSchnellaktionen || !this.kampfZustandSyncAusLpAktiv) {
        return;
      }
      this.synchronisiereKampfZustandAusLp();
    },
  },
  mounted() {
    window.addEventListener('resize', this.onResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.onResize);
    this.beendeZiehen();
    this.beendeResize();
    this.kampfWuerfelModalsSchliessenUndZuruecksetzen();
  },
  methods: {
    ermittleViewportGroesse() {
      return window.HTBAH_MODAL_FENSTER.utils.ermittleViewportGroesse();
    },
    begrenzeFensterGroesse(breite, hoehe) {
      return window.HTBAH_MODAL_FENSTER.utils.begrenzeGroesse(breite, hoehe, 360, 300);
    },
    initialisierePosition() {
      const fenster = this.$refs.fensterElement;
      if (!fenster) {
        return;
      }
      if (this.modal.breite == null || this.modal.hoehe == null) {
        const groesse = this.begrenzeFensterGroesse(fenster.offsetWidth, fenster.offsetHeight);
        this.modal.breite = groesse.breite;
        this.modal.hoehe = groesse.hoehe;
      }
      if (this.modal.positionX == null || this.modal.positionY == null) {
        const v = this.ermittleViewportGroesse();
        this.modal.positionX = Math.max(0, Math.round((v.viewportBreite - this.modal.breite) / 2));
        this.modal.positionY = Math.max(0, Math.round((v.viewportHoehe - this.modal.hoehe) / 2));
      }
      this.stelleSichtbaresFensterSicher();
    },
    stelleSichtbaresFensterSicher() {
      if (this.modal.istVollbild || this.modal.breite == null || this.modal.hoehe == null) {
        return;
      }
      const groesse = this.begrenzeFensterGroesse(this.modal.breite, this.modal.hoehe);
      this.modal.breite = groesse.breite;
      this.modal.hoehe = groesse.hoehe;
      const pos = window.HTBAH_MODAL_FENSTER.utils.begrenzePosition(
        this.modal.positionX || 0,
        this.modal.positionY || 0,
        this.modal.breite,
        this.modal.hoehe,
      );
      this.modal.positionX = pos.x;
      this.modal.positionY = pos.y;
    },
    starteZiehen(event) {
      if (this.modal.istVollbild || (event.target && event.target.closest('button, a, input, select, textarea'))) {
        return;
      }
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }
      const fenster = this.$refs.fensterElement;
      if (!fenster) {
        return;
      }
      const rechteck = fenster.getBoundingClientRect();
      this.modal.ziehenAktiv = true;
      this.modal.ziehOffsetX = event.clientX - rechteck.left;
      this.modal.ziehOffsetY = event.clientY - rechteck.top;
      window.addEventListener('pointermove', this.beimZiehen);
      window.addEventListener('pointerup', this.beendeZiehen);
      window.addEventListener('pointercancel', this.beendeZiehen);
      event.preventDefault();
    },
    beimZiehen(event) {
      if (!this.modal.ziehenAktiv || this.modal.istVollbild || this.modal.breite == null || this.modal.hoehe == null) {
        return;
      }
      this.modal.positionX = event.clientX - this.modal.ziehOffsetX;
      this.modal.positionY = event.clientY - this.modal.ziehOffsetY;
      this.stelleSichtbaresFensterSicher();
    },
    beendeZiehen() {
      this.modal.ziehenAktiv = false;
      window.removeEventListener('pointermove', this.beimZiehen);
      window.removeEventListener('pointerup', this.beendeZiehen);
      window.removeEventListener('pointercancel', this.beendeZiehen);
    },
    starteResize(event) {
      if (this.modal.istVollbild) {
        return;
      }
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }
      const fenster = this.$refs.fensterElement;
      if (!fenster) {
        return;
      }
      this.modal.resizeAktiv = true;
      this.modal.resizeStartX = event.clientX;
      this.modal.resizeStartY = event.clientY;
      this.modal.resizeStartBreite = this.modal.breite != null ? this.modal.breite : fenster.offsetWidth;
      this.modal.resizeStartHoehe = this.modal.hoehe != null ? this.modal.hoehe : fenster.offsetHeight;
      window.addEventListener('pointermove', this.beimResize);
      window.addEventListener('pointerup', this.beendeResize);
      window.addEventListener('pointercancel', this.beendeResize);
      event.preventDefault();
    },
    beimResize(event) {
      if (!this.modal.resizeAktiv || this.modal.istVollbild) {
        return;
      }
      const neueBreite = this.modal.resizeStartBreite + (event.clientX - this.modal.resizeStartX);
      const neueHoehe = this.modal.resizeStartHoehe + (event.clientY - this.modal.resizeStartY);
      const groesse = this.begrenzeFensterGroesse(neueBreite, neueHoehe);
      this.modal.breite = groesse.breite;
      this.modal.hoehe = groesse.hoehe;
      this.stelleSichtbaresFensterSicher();
    },
    beendeResize() {
      this.modal.resizeAktiv = false;
      window.removeEventListener('pointermove', this.beimResize);
      window.removeEventListener('pointerup', this.beendeResize);
      window.removeEventListener('pointercancel', this.beendeResize);
    },
    vollbildUmschalten() {
      const M = window.HTBAH_MODAL_FENSTER && window.HTBAH_MODAL_FENSTER.methoden;
      const warVollbild = this.modal.istVollbild;
      this.modal.istVollbild = !this.modal.istVollbild;
      if (!this.modal.istVollbild && warVollbild) {
        this.$nextTick(() => {
          if (M) {
            M.bereiteFensterNachVollbildBeenden.call(
              this,
              this.modal,
              this,
              'fensterElement',
              (breite, hoehe) => this.begrenzeFensterGroesse(breite, hoehe),
            );
          } else {
            this.stelleSichtbaresFensterSicher();
          }
        });
      }
    },
    fokussiereFenster() {
      const fenster = this.$refs.fensterElement;
      if (fenster && typeof fenster.focus === 'function') {
        fenster.focus();
      }
    },
    stelleFokusWiederHer() {
      if (this.fokusVorModal && this.fokusVorModal.isConnected) {
        this.fokusVorModal.focus();
      }
      this.fokusVorModal = null;
    },
    kampfWuerfelModalsSchliessenUndZuruecksetzen() {
      if (!this.zeigtKampfSchnellaktionen) {
        return;
      }
      ['probeWurfModal', 'paradeModal', 'schadenModal'].forEach((refName) => {
        const komponente = this.$refs[refName];
        if (!komponente || typeof komponente.schliessenUndZuruecksetzen !== 'function') {
          return;
        }
        komponente.schliessenUndZuruecksetzen();
      });
    },
    zeileModalDockId() {
      const typ = this.anlage && this.anlage.typ ? String(this.anlage.typ) : 'eintrag';
      const id =
        this.anlage && this.anlage.zeile && this.anlage.zeile.id
          ? String(this.anlage.zeile.id)
          : 'neu';
      return `zufallstabellen-zeile-${typ}-${id}`;
    },
    schliessen() {
      this.kampfWuerfelModalsSchliessenUndZuruecksetzen();
      const dockId = this.zeileModalDockId();
      const S = window.HTBAH_MODAL_FENSTER && window.HTBAH_MODAL_FENSTER.speicher;
      if (S) {
        S.beimModalSchliessen(this.modal, dockId);
      } else {
        window.HTBAH_MODAL_FENSTER.methoden.bereinigeMinimiertZustand.call(this.modal, dockId);
      }
      this.$emit('close');
    },
    zeileModalMinimieren() {
      window.HTBAH_MODAL_FENSTER.methoden.minimieren.call(this.modal, {
        id: this.zeileModalDockId(),
        titel: this.zeileModalTitel || 'Eintrag bearbeiten',
        emoji: '✏️',
        onSchliessen: () => this.schliessen(),
        onWiederherstellen: () => {
          this.$nextTick(() => {
            this.stelleSichtbaresFensterSicher();
            this.fokussiereFenster();
          });
        },
      });
    },
    onResize() {
      this.$nextTick(() => this.stelleSichtbaresFensterSicher());
    },
    stelleKartenIconSicher() {
      const api = window.HTBAH_SHARED && window.HTBAH_SHARED.EntityKartenIcon;
      if (!api || !this.anlage || !this.anlage.zeile || !this.anlage.typ) {
        return;
      }
      if (typeof api.stelleKartenIconSicher === 'function') {
        api.stelleKartenIconSicher(this.anlage.zeile, this.anlage.typ);
      }
    },
    aufKartenIconAktualisiert(wert) {
      if (!this.anlage || !this.anlage.zeile || !this.anlage.typ) {
        return;
      }
      const api = window.HTBAH_SHARED && window.HTBAH_SHARED.EntityKartenIcon;
      const normalisiert =
        api && typeof api.normalisiereKartenIcon === 'function'
          ? api.normalisiereKartenIcon(wert, this.anlage.typ)
          : wert;
      this.anlage.zeile = { ...this.anlage.zeile, kartenIcon: normalisiert };
      this.$emit('karten-icon-change', normalisiert);
    },
    fraktionOrtHinzufuegen() {
      if (!this.anlage || this.anlage.typ !== 'fraktion' || !this.anlage.zeile) {
        return;
      }
      const ort = String(this.fraktionOrtEingabe || '').trim();
      if (!ort) {
        return;
      }
      const liste = Array.isArray(this.anlage.zeile.orte) ? this.anlage.zeile.orte : [];
      if (!liste.includes(ort)) {
        this.anlage.zeile.orte = [...liste, ort];
      }
      this.fraktionOrtEingabe = '';
    },
    fraktionOrtEntfernen(index) {
      if (!this.anlage || this.anlage.typ !== 'fraktion' || !this.anlage.zeile) {
        return;
      }
      if (!Array.isArray(this.anlage.zeile.orte)) {
        return;
      }
      if (index < 0 || index >= this.anlage.zeile.orte.length) {
        return;
      }
      this.anlage.zeile.orte.splice(index, 1);
    },
    bestieFraktionAktiv(fraktionsName) {
      const liste = Array.isArray(this.anlage && this.anlage.zeile && this.anlage.zeile.fraktionen)
        ? this.anlage.zeile.fraktionen
        : [];
      return liste.includes(fraktionsName);
    },
    bestieFraktionUmschalten(fraktionsName) {
      if (!this.anlage || this.anlage.typ !== 'bestie' || !this.anlage.zeile || !fraktionsName) {
        return;
      }
      const liste = Array.isArray(this.anlage.zeile.fraktionen) ? this.anlage.zeile.fraktionen.slice() : [];
      const index = liste.indexOf(fraktionsName);
      if (index >= 0) {
        liste.splice(index, 1);
      } else {
        liste.push(fraktionsName);
      }
      this.anlage.zeile.fraktionen = liste;
    },
    normalisiereLp(wert) {
      const n = Math.round(Number(String(wert ?? '').trim()) || 0);
      return Math.max(0, Number.isFinite(n) ? n : 0);
    },
    initialisiereKampfZustandBeiOeffnen() {
      if (!this.zeigtKampfSchnellaktionen || !this.anlage || !this.anlage.zeile) {
        return;
      }
      const zeile = this.anlage.zeile;
      const lp = this.normalisiereLp(zeile.lebenspunkte);
      this.lpSnapshotVorEingabe = lp;
      const gespeichert =
        window.HTBAH && typeof window.HTBAH.normalisiereKampfZustand === 'function'
          ? window.HTBAH.normalisiereKampfZustand(zeile.kampfZustand)
          : '';
      if (gespeichert) {
        zeile.kampfZustand = gespeichert;
        return;
      }
      if (typeof window.HTBAH.ermittleKampfZustandFuerNpcBestie === 'function') {
        zeile.kampfZustand = window.HTBAH.ermittleKampfZustandFuerNpcBestie(zeile);
      } else if (typeof window.HTBAH.berechneKampfZustandAusLp === 'function') {
        zeile.kampfZustand = window.HTBAH.berechneKampfZustandAusLp(lp, lp);
      }
    },
    onKampfLebenspunkteFocus() {
      if (!this.anlage || !this.anlage.zeile) {
        return;
      }
      this.lpSnapshotVorEingabe = this.normalisiereLp(this.anlage.zeile.lebenspunkte);
    },
    onKampfLebenspunkteBlur() {
      if (!this.anlage || !this.anlage.zeile) {
        return;
      }
      this.lpSnapshotVorEingabe = this.normalisiereLp(this.anlage.zeile.lebenspunkte);
    },
    synchronisiereKampfZustandAusLp() {
      const zeile = this.anlage && this.anlage.zeile;
      if (!zeile || typeof window.HTBAH.berechneKampfZustandAusLp !== 'function') {
        return;
      }
      const aktuell = this.normalisiereLp(zeile.lebenspunkte);
      const vorher =
        this.lpSnapshotVorEingabe != null ? this.lpSnapshotVorEingabe : aktuell;
      zeile.kampfZustand = window.HTBAH.berechneKampfZustandAusLp(aktuell, vorher);
    },
    setzeKampfZustand(zustand) {
      if (!this.anlage || !this.anlage.zeile) {
        return;
      }
      const normalisiert =
        window.HTBAH && typeof window.HTBAH.normalisiereKampfZustand === 'function'
          ? window.HTBAH.normalisiereKampfZustand(zustand)
          : '';
      if (!normalisiert) {
        return;
      }
      this.anlage.zeile.kampfZustand = normalisiert;
    },
    berechneHandelnFuerInitiative() {
      return this.begabungHandelnFuerInitiative;
    },
    initiativeWuerfelnFuerZeile() {
      if (!this.anlage || !this.anlage.zeile) {
        return;
      }
      const handeln = this.berechneHandelnFuerInitiative();
      const wurf = Math.floor(Math.random() * 10) + 1;
      const gesamt = wurf + handeln;
      const max = 10 + handeln;
      this.anlage.zeile.initiative = String(Math.max(1, Math.min(max, gesamt)));
    },
    async initiativeZuruecksetzen() {
      if (!this.anlage || !this.anlage.zeile) {
        return;
      }
      const hatWert = String(this.anlage.zeile.initiative || '').trim();
      if (!hatWert) {
        return;
      }
      const bestaetigt = await window.HTBAH.ui.confirm({
        titel: 'Initiative zurücksetzen?',
        beschreibung: 'Ist der Kampf wirklich schon vorbei?',
        bestaetigenText: 'Zurücksetzen',
        bestaetigenButtonClass: 'btn-danger',
        warnhinweisAnzeigen: false,
      });
      if (!bestaetigt) {
        return;
      }
      this.anlage.zeile.initiative = '';
    },
    begabungKategorieLabel(kategorie) {
      if (kategorie === 'handeln') {
        return 'Handeln';
      }
      if (kategorie === 'wissen') {
        return 'Wissen';
      }
      if (kategorie === 'soziales') {
        return 'Soziales';
      }
      return kategorie;
    },
    begabungZielwert(kategorie) {
      if (!this.anlage || !this.anlage.zeile) {
        return 0;
      }
      return Math.max(0, Math.min(40, Math.round(Number(this.entitaetBegabungen[kategorie]) || 0)));
    },
    faehigkeitenProbeOeffnen(payload) {
      if (!payload || !this.anlage || !this.anlage.zeile) {
        return;
      }
      const typLabel = this.anlage.typ === 'bestie' ? 'Bestie' : 'NPC';
      const name = String(this.anlage.zeile.name || '').trim();
      const suffix = typLabel + (name ? ': ' + name : '');
      const probePayload = {
        modus: payload.typ === 'begabung' ? 'begabung' : 'faehigkeit',
        basiswert: payload.zielwert,
        zielwert: payload.zielwert,
        zeigtModifikator: true,
        basisLabel:
          payload.typ === 'begabung'
            ? 'Begabung ' + this.begabungKategorieLabel(payload.kategorie)
            : 'Effektivwert',
        titel: (payload.titel || 'Probe') + ' (' + suffix + ')',
        untertitel: payload.untertitel || '',
      };
      this.probeModalGeneration += 1;
      this.$nextTick(() => {
        this.$refs.probeWurfModal?.oeffnen(probePayload);
      });
    },
    begabungProbeOeffnen(kategorie) {
      if (!this.anlage || !this.anlage.zeile) {
        return;
      }
      const typLabel = this.anlage.typ === 'bestie' ? 'Bestie' : 'NPC';
      const name = String(this.anlage.zeile.name || '').trim();
      const zielwert = this.begabungZielwert(kategorie);
      const payload = {
        modus: 'begabung',
        basiswert: zielwert,
        zielwert,
        zeigtModifikator: true,
        basisLabel: 'Begabung ' + this.begabungKategorieLabel(kategorie),
        zielLabel: 'Zielwert (zu unterbieten)',
        titel:
          'Probe: Begabung ' +
          this.begabungKategorieLabel(kategorie) +
          ' (' +
          typLabel +
          (name ? ': ' + name : '') +
          ')',
        untertitel:
          'Begabungswert ' +
          zielwert +
          ' — ohne kritische Erfolge (Regelwerk).',
      };
      this.probeModalGeneration += 1;
      this.$nextTick(() => {
        this.$refs.probeWurfModal?.oeffnen(payload);
      });
    },
    paradeModalOeffnenFuerZeile() {
      if (!this.anlage || !this.anlage.zeile) {
        return;
      }
      const zeile = this.anlage.zeile;
      const basiswert = this.berechneHandelnFuerInitiative();
      const titelTeil = this.anlage.typ === 'bestie' ? 'Bestie' : 'NPC';
      const inventar = Array.isArray(zeile.inventar) ? zeile.inventar : [];
      const ruestungen = inventar
        .filter((eintrag) => eintrag && eintrag.typ === 'rustung')
        .map((eintrag) => ({
          name: typeof eintrag.name === 'string' ? eintrag.name : '',
          rustwert: eintrag.rustwert,
        }));
      const payload = {
        titel: `Parade-Probe (${titelTeil})`,
        basiswert,
        ruestungen,
        waffenlosParade: !ruestungen.length,
      };
      this.paradeModalGeneration += 1;
      this.$nextTick(() => {
        this.$refs.paradeModal?.oeffnen(payload);
      });
    },
    schadenModalOeffnenFuerZeile() {
      if (!this.anlage || !this.anlage.zeile) {
        return;
      }
      const zeile = this.anlage.zeile;
      const typ = this.anlage.typ === 'bestie' ? 'Bestie' : 'NPC';
      const name = String(zeile.name || '').trim();
      const payload = {
        titel: `Schaden würfeln (${typ}${name ? `: ${name}` : ''})`,
        charakter: zeile,
      };
      this.schadenModalGeneration += 1;
      this.$nextTick(() => {
        this.$refs.schadenModal?.oeffnen(payload);
      });
    },
    datenBereichBlur(event) {
      if (!this.istBearbeitung || this.interaktiveWeltBearbeitung) {
        return;
      }
      const current = event && event.currentTarget;
      const next = event && event.relatedTarget;
      if (current && next && current.contains(next)) {
        return;
      }
      this.$emit('edit-blur');
    },
    zufallEpochePropNameFuerTyp(typ) {
      const map = {
        npc: 'zufallNpcEpoche',
        ort: 'zufallOrtEpoche',
        fraktion: 'zufallFraktionEpoche',
        pantheon: 'zufallPantheonEpoche',
        raetsel: 'zufallRaetselEpoche',
        bestie: 'zufallBestieEpoche',
        gegenstand: 'zufallGegenstandEpoche',
      };
      return map[typ] || '';
    },
    zufallEpocheEmitFuerTyp(typ) {
      const map = {
        npc: 'update:zufallNpcEpoche',
        ort: 'update:zufallOrtEpoche',
        fraktion: 'update:zufallFraktionEpoche',
        pantheon: 'update:zufallPantheonEpoche',
        raetsel: 'update:zufallRaetselEpoche',
        bestie: 'update:zufallBestieEpoche',
        gegenstand: 'update:zufallGegenstandEpoche',
      };
      return map[typ] || '';
    },
    synchronisiereZufallEpocheSelect() {
      const typ = this.anlage && this.anlage.typ;
      const prop = this.zufallEpochePropNameFuerTyp(typ);
      if (!prop || this.zufallEpocheSelect === 'zufaellig') {
        return;
      }
      const ep = this[prop];
      if (typeof ep === 'string' && ep.trim()) {
        this.zufallEpocheSelect = ep.trim();
      }
    },
    aufgeloesteZufallEpoche() {
      if (this.zufallEpocheSelect === 'zufaellig') {
        const optionen = ['mittelalter', 'gegenwart', 'zukunft'];
        return optionen[Math.floor(Math.random() * optionen.length)];
      }
      return this.zufallEpocheSelect;
    },
    zufallEpochePropAktualisieren(epoche) {
      const typ = this.anlage && this.anlage.typ;
      const emitKey = this.zufallEpocheEmitFuerTyp(typ);
      if (emitKey && epoche) {
        this.$emit(emitKey, epoche);
      }
    },
    onZufallEpocheSelectAendern() {
      if (this.zufallEpocheSelect !== 'zufaellig') {
        this.zufallEpochePropAktualisieren(this.zufallEpocheSelect);
      }
    },
    zufallsvorschlagAusloesen() {
      if (!this.zufallsgeneratorBereit) {
        return;
      }
      const epoche = this.aufgeloesteZufallEpoche();
      this.zufallEpochePropAktualisieren(epoche);
      this.$emit('random', { epoche });
    },
    npcAbhaengigkeitsLabel(feld) {
      if (feld === 'alter') {
        return 'mit Statur + LP + Inventar-Waffen';
      }
      if (feld === 'beruf') {
        return 'mit Statur, Inventar-Waffen, LP, Begabungen';
      }
      if (feld === 'statur') {
        return 'mit LP + Inventar-Waffen';
      }
      return '';
    },
    npcFeldNeuWuerfeln(feld, modus) {
      if (!this.randomSichtbar || !this.zufallsgeneratorBereit || !feld) {
        return;
      }
      this.$emit('npc-refresh-field', {
        feld,
        modus: modus === 'einzeln' ? 'einzeln' : 'mitAbhaengigen',
      });
    },
    inWeltOeffnen() {
      if (!this.kannInWeltOeffnen) {
        return;
      }
      this.$emit('welt-open');
    },
    inventarEintragLabel(item) {
      const name = String(item && item.name ? item.name : '').trim();
      const typ = String(item && item.typ ? item.typ : '').trim();
      if (name && typ) {
        return `${name} (${typ})`;
      }
      return name || typ || 'Gegenstand';
    },
    inventarEintragEntfernen(item) {
      if (!this.anlage || !this.anlage.zeile || !Array.isArray(this.anlage.zeile.inventar)) {
        return;
      }
      const gegenstandId = String(item && item.gegenstandId ? item.gegenstandId : '').trim();
      const index = this.anlage.zeile.inventar.indexOf(item);
      if (index >= 0) {
        this.anlage.zeile.inventar.splice(index, 1);
      }
      if (gegenstandId) {
        this.$emit('inventar-remove', { gegenstandId });
      }
    },
    inventarEintragEntfernenEvent(payload) {
      const gegenstandId = payload && payload.gegenstandId ? String(payload.gegenstandId).trim() : '';
      if (gegenstandId) {
        this.$emit('inventar-remove', { gegenstandId });
      }
    },
    inventarZeileGespeichert() {
      this.$emit('inventar-save');
    },
  },
  template: `
    <div v-if="anlage.offen && anlage.zeile" class="regelwerk-modal-layer">
      <div
        v-show="!modal.minimiert"
        ref="fensterElement"
        class="regelwerk-modal-window card shadow-lg"
        :class="{ 'regelwerk-modal-window-fullscreen': modal.istVollbild }"
        :style="fensterStil"
        role="dialog"
        aria-modal="true"
        :aria-label="zeileModalTitel || 'Eintrag bearbeiten'"
        tabindex="-1"
        @keydown.esc.stop.prevent="schliessen">
        <div class="regelwerk-modal-header d-flex justify-content-between align-items-center p-2" @pointerdown="starteZiehen">
          <span class="htbah-modal-titel-mit-icon">
            <entitaet-anzeige-icon
              v-if="anlage && anlage.typ && anlage.zeile"
              :key="'zeile-kopf-icon-' + anlage.typ + '-' + (anlage.zeile.kartenIcon && anlage.zeile.kartenIcon.quelle ? anlage.zeile.kartenIcon.quelle : '') + '-' + (anlage.zeile.kartenIcon && anlage.zeile.kartenIcon.emoji ? anlage.zeile.kartenIcon.emoji : '') + '-' + (anlage.zeile.kartenIcon && anlage.zeile.kartenIcon.mediumId ? anlage.zeile.kartenIcon.mediumId : '') + '-' + (anlage.zeile.kartenIcon && anlage.zeile.kartenIcon.form ? anlage.zeile.kartenIcon.form : '')"
              :entity-typ="anlage.typ"
              :zeile="anlage.zeile"
              groesse="sm"
              :titel="zeileModalTitel" />
            <strong>{{ zeileModalTitel }}</strong>
          </span>
          <div class="d-flex align-items-center gap-2">
            <template v-if="randomSichtbar && zeigtZufallEpochenAuswahl">
              <div v-if="zeigtWizardMenue" class="dropdown">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary dropdown-toggle"
                  :disabled="!zufallsgeneratorBereit"
                  data-bs-toggle="dropdown"
                  data-bs-auto-close="true"
                  aria-expanded="false"
                  aria-label="Zufall und Wizard">
                  <span aria-hidden="true">🎲</span>
                  <span class="d-none d-md-inline ms-1">Zufall</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end htbah-zufallsvorschlag-dropdown-menu">
                  <li class="px-2 py-2 htbah-zufallsvorschlag-dropdown-panel" @click.stop>
                    <label class="form-label small text-secondary mb-1">Epoche</label>
                    <div class="input-group input-group-sm htbah-zufallsvorschlag-gruppe">
                      <select
                        class="form-select"
                        v-model="zufallEpocheSelect"
                        :disabled="!zufallsgeneratorBereit"
                        aria-label="Epoche für Zufallsvorschlag"
                        @change="onZufallEpocheSelectAendern">
                        <option value="zufaellig">Zufällig</option>
                        <option value="mittelalter">Mittelalter</option>
                        <option value="gegenwart">Gegenwart</option>
                        <option value="zukunft">Zukunft</option>
                      </select>
                      <button
                        type="button"
                        class="btn btn-outline-secondary text-nowrap"
                        :disabled="!zufallsgeneratorBereit"
                        title="Zufallsvorschlag"
                        @click="zufallsvorschlagAusloesen">
                        <span aria-hidden="true">🎲</span>
                        <span class="d-none d-md-inline ms-1">Vorschlag</span>
                      </button>
                    </div>
                  </li>
                  <li><hr class="dropdown-divider my-1" /></li>
                  <li v-if="anlage.typ === 'npc'">
                    <button type="button" class="dropdown-item" :disabled="!zufallsgeneratorBereit" @click="$emit('npc-wizard')">
                      🧙 Wizard …
                    </button>
                  </li>
                  <li v-if="anlage.typ === 'bestie'">
                    <button type="button" class="dropdown-item" :disabled="!zufallsgeneratorBereit" @click="$emit('bestien-wizard')">
                      🧙 Wizard …
                    </button>
                  </li>
                  <li v-if="anlage.typ === 'ort'">
                    <button type="button" class="dropdown-item" :disabled="!zufallsgeneratorBereit" @click="$emit('ort-wizard')">
                      🧙 Wizard …
                    </button>
                  </li>
                  <li v-if="anlage.typ === 'fraktion'">
                    <button type="button" class="dropdown-item" :disabled="!zufallsgeneratorBereit" @click="$emit('fraktion-wizard')">
                      🧙 Wizard …
                    </button>
                  </li>
                  <li v-if="anlage.typ === 'raetsel'">
                    <button type="button" class="dropdown-item" :disabled="!zufallsgeneratorBereit" @click="$emit('raetsel-wizard')">
                      🧙 Wizard …
                    </button>
                  </li>
                  <li v-if="anlage.typ === 'pantheon'">
                    <button type="button" class="dropdown-item" :disabled="!zufallsgeneratorBereit" @click="$emit('pantheon-wizard')">
                      🧙 Wizard …
                    </button>
                  </li>
                  <li v-if="anlage.typ === 'gegenstand'">
                    <button type="button" class="dropdown-item" :disabled="!zufallsgeneratorBereit" @click="$emit('gegenstand-wizard')">
                      🧙 Wizard …
                    </button>
                  </li>
                </ul>
              </div>
              <div v-else class="input-group input-group-sm htbah-zufallsvorschlag-gruppe">
                <select
                  class="form-select"
                  v-model="zufallEpocheSelect"
                  :disabled="!zufallsgeneratorBereit"
                  aria-label="Epoche für Zufallsvorschlag"
                  @change="onZufallEpocheSelectAendern">
                  <option value="zufaellig">Zufällig</option>
                  <option value="mittelalter">Mittelalter</option>
                  <option value="gegenwart">Gegenwart</option>
                  <option value="zukunft">Zukunft</option>
                </select>
                <button
                  type="button"
                  class="btn btn-outline-secondary text-nowrap"
                  :disabled="!zufallsgeneratorBereit"
                  title="Zufallsvorschlag"
                  aria-label="Zufallsvorschlag"
                  @click="zufallsvorschlagAusloesen">
                  <span aria-hidden="true">🎲</span>
                  <span class="d-none d-md-inline ms-1">Zufallsvorschlag</span>
                </button>
              </div>
            </template>
            <button
              type="button"
              class="regelwerk-icon-button"
              :aria-label="modal.istVollbild ? 'Vollbild beenden' : 'Vollbild'"
              :title="modal.istVollbild ? 'Vollbild beenden' : 'Vollbild'"
              @click="vollbildUmschalten">
              <span class="material-symbols-outlined">{{ vollbildIcon }}</span>
            </button>
            <button
              type="button"
              class="regelwerk-icon-button"
              title="Minimieren"
              aria-label="Minimieren"
              @click="zeileModalMinimieren">
              <span class="material-symbols-outlined">minimize</span>
            </button>
            <button type="button" class="btn-close" aria-label="Schließen" @click="schliessen"></button>
          </div>
        </div>
        <div
          v-if="interaktiveWeltBearbeitung"
          class="px-2 py-2 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2 htbah-modal-speicher-leiste">
          <span v-if="hatUngespeicherteAenderungen" class="badge rounded-pill text-bg-warning">Ungespeicherte Änderungen</span>
          <span v-else class="small text-body-secondary">Alle Änderungen gespeichert</span>
          <div class="d-flex gap-2 ms-auto">
            <button type="button" class="btn btn-sm btn-outline-secondary" @click="schliessen">Schließen</button>
            <button
              type="button"
              class="btn btn-sm btn-primary"
              :disabled="speicherDeaktiviert || !hatUngespeicherteAenderungen"
              @click="$emit('save')">
              Speichern
            </button>
          </div>
        </div>
        <div class="card-body py-2 small" style="max-height:70vh; overflow:auto;">
        <div v-if="istBearbeitung" class="mb-3">
          <ul class="nav nav-pills nav-fill htbah-weltenbau-pill-tabs">
            <li class="nav-item">
              <button
                type="button"
                class="nav-link htbah-weltenbau-pill-tab"
                :class="{ active: aktiverBearbeitungsTab === 'daten' }"
                @click="aktiverBearbeitungsTab = 'daten'">
                📋 Daten
              </button>
            </li>
            <li class="nav-item">
              <button
                type="button"
                class="nav-link htbah-weltenbau-pill-tab"
                :class="{ active: aktiverBearbeitungsTab === 'medien' }"
                @click="aktiverBearbeitungsTab = 'medien'">
                🖼️ Medien
              </button>
            </li>
          </ul>
        </div>
        <div v-if="zeigtDatenTab" @focusout="datenBereichBlur">
        <section v-if="zeigtKampfSchnellaktionen" class="htbah-entitaet-bereich">
          <h6 class="htbah-entitaet-bereich-titel">⚔️ Kampf &amp; Proben</h6>
          <div
            v-if="entitaetLebenspunkteStatus.tot || entitaetLebenspunkteStatus.bewusstlos"
            class="alert py-2 px-3 mb-2 htbah-charakter-status-alert"
            :class="entitaetLebenspunkteStatus.tot ? 'alert-secondary' : 'alert-warning'">
            <strong v-if="entitaetLebenspunkteStatus.tot">💀 Tot</strong>
            <strong v-else>😵 Bewusstlos</strong>
            <span class="ms-1">— LP 0 = tot, LP 1–10 oder Massenschaden (≥60 Verlust) = bewusstlos.</span>
          </div>
          <div class="row g-2 mb-2 align-items-start">
            <div class="col-md-4">
              <label class="form-label small text-secondary mb-1">Lebenspunkte</label>
              <div class="input-group">
                <input
                  class="form-control"
                  v-model="anlage.zeile.lebenspunkte"
                  placeholder="Lebenspunkte"
                  inputmode="numeric"
                  autocomplete="off"
                  @focus="onKampfLebenspunkteFocus"
                  @blur="onKampfLebenspunkteBlur" />
                <button
                  v-if="anlage.typ === 'npc'"
                  type="button"
                  class="btn btn-outline-secondary htbah-input-icon-btn"
                  :disabled="!zufallsgeneratorBereit || !randomSichtbar"
                  title="Lebenspunkte neu würfeln"
                  @click="npcFeldNeuWuerfeln('lebenspunkte', 'mitAbhaengigen')">
                  <span class="material-symbols-outlined">refresh</span>
                </button>
              </div>
            </div>
            <div class="col-md-8">
              <label class="form-label small text-secondary mb-1">Zustand</label>
              <div class="btn-group w-100 htbah-kampf-zustand-toggle" role="group" aria-label="Kampfzustand">
                <button
                  v-for="opt in kampfZustandOptionen"
                  :key="'kz-' + opt.id"
                  type="button"
                  class="btn btn-sm"
                  :class="anlage.zeile.kampfZustand === opt.id ? 'btn-primary' : 'btn-outline-secondary'"
                  :aria-pressed="anlage.zeile.kampfZustand === opt.id ? 'true' : 'false'"
                  @click="setzeKampfZustand(opt.id)">
                  <span class="htbah-kampf-zustand-btn-inhalt">
                    <span class="htbah-kampf-zustand-btn-ico" aria-hidden="true">{{ opt.emoji }}</span>
                    <span class="htbah-kampf-zustand-btn-text">{{ opt.label }}</span>
                  </span>
                </button>
              </div>
              <p class="form-text mb-0 mt-1">
                Wird bei LP-Änderung automatisch gesetzt (0 = tot, 1–10 oder −60+ auf einmal = bewusstlos).
              </p>
            </div>
          </div>
          <div class="row g-2">
            <div class="col-12">
              <div class="d-flex flex-wrap gap-2">
                <button
                  v-for="kategorie in ['handeln', 'wissen', 'soziales']"
                  :key="'kampf-probe-' + kategorie"
                  type="button"
                  class="btn btn-sm btn-outline-primary"
                  :aria-label="'W100-Probe Begabung ' + begabungKategorieLabel(kategorie)"
                  @click="begabungProbeOeffnen(kategorie)">
                  🎲 {{ begabungKategorieLabel(kategorie) }} ({{ begabungZielwert(kategorie) }})
                </button>
              </div>
            </div>
            <div class="col-6">
              <button
                type="button"
                class="btn btn-outline-primary btn-sm w-100"
                @click="paradeModalOeffnenFuerZeile">
                🛡️ Parieren
              </button>
            </div>
            <div class="col-6">
              <button
                type="button"
                class="btn btn-outline-primary btn-sm w-100"
                @click="schadenModalOeffnenFuerZeile">
                💥 Schaden erwürfeln
              </button>
            </div>
            <div class="col-12">
              <label class="form-label small text-secondary mb-1">Initiative</label>
              <div class="input-group">
                <input
                  class="form-control"
                  type="number"
                  min="1"
                  :max="10 + begabungHandelnFuerInitiative"
                  v-model="anlage.zeile.initiative"
                  placeholder="z. B. 12"
                  inputmode="numeric"
                  autocomplete="off" />
                <button
                  type="button"
                  class="btn btn-outline-primary"
                  title="1W10 + Begabung Handeln"
                  @click="initiativeWuerfelnFuerZeile">
                  🎲
                </button>
                <button
                  type="button"
                  class="btn btn-outline-danger htbah-input-icon-btn"
                  title="Initiative leeren"
                  aria-label="Initiative leeren"
                  :disabled="!String(anlage.zeile.initiative || '').trim()"
                  @click="initiativeZuruecksetzen">
                  <span class="material-symbols-outlined" aria-hidden="true">close</span>
                </button>
              </div>
              <p class="form-text mb-0">
                Gültig: 1 bis {{ 10 + begabungHandelnFuerInitiative }} (1W10 + Handeln).
              </p>
            </div>
          </div>
        </section>
        <template v-if="anlage.typ === 'npc'">
          <section class="htbah-entitaet-bereich">
            <h6 class="htbah-entitaet-bereich-titel">🧾 Stammdaten</h6>
            <div class="row g-2">
              <div class="col-md-6"><label class="form-label small text-secondary mb-1">Name</label><div class="input-group"><input class="form-control" v-model="anlage.zeile.name" placeholder="Name" /><button v-if="kannInWeltOeffnen" type="button" class="btn btn-outline-secondary htbah-input-icon-btn" title="In interaktiver Welt öffnen" aria-label="In interaktiver Welt öffnen" @click="inWeltOeffnen">🌍</button><button type="button" class="btn btn-outline-secondary htbah-input-icon-btn" :disabled="!zufallsgeneratorBereit || !randomSichtbar" title="Name neu würfeln" @click="npcFeldNeuWuerfeln('name', 'einzeln')"><span class="material-symbols-outlined">refresh</span></button></div></div>
              <div class="col-md-6"><label class="form-label small text-secondary mb-1">Spitzname</label><div class="input-group"><input class="form-control" v-model="anlage.zeile.spitzname" placeholder="Spitzname" /><button type="button" class="btn btn-outline-secondary htbah-input-icon-btn" :disabled="!zufallsgeneratorBereit || !randomSichtbar" title="Spitzname neu würfeln" @click="npcFeldNeuWuerfeln('spitzname', 'einzeln')"><span class="material-symbols-outlined">refresh</span></button></div></div>
              <div class="col-md-6"><label class="form-label small text-secondary mb-1">Geschlecht</label><div class="input-group"><input class="form-control" v-model="anlage.zeile.geschlecht" placeholder="Geschlecht" /><button type="button" class="btn btn-outline-secondary htbah-input-icon-btn" :disabled="!zufallsgeneratorBereit || !randomSichtbar" title="Geschlecht neu würfeln" @click="npcFeldNeuWuerfeln('geschlecht', 'einzeln')"><span class="material-symbols-outlined">refresh</span></button></div></div>
              <div class="col-md-6">
                <label class="form-label small text-secondary mb-1">Alter</label>
                <div class="input-group">
                  <input class="form-control" v-model="anlage.zeile.alter" placeholder="Alter" />
                  <button type="button" class="btn btn-outline-secondary htbah-input-icon-btn" :disabled="!zufallsgeneratorBereit || !randomSichtbar" title="Alter neu würfeln (einzeln)" @click="npcFeldNeuWuerfeln('alter', 'einzeln')"><span class="material-symbols-outlined">refresh</span></button>
                  <button type="button" class="btn btn-outline-secondary dropdown-toggle dropdown-toggle-split htbah-input-icon-btn" :disabled="!zufallsgeneratorBereit || !randomSichtbar" data-bs-toggle="dropdown" aria-expanded="false"><span class="visually-hidden">Optionen</span></button>
                  <ul class="dropdown-menu dropdown-menu-end">
                    <li><button type="button" class="dropdown-item" @click="npcFeldNeuWuerfeln('alter', 'einzeln')">Nur Alter neu</button></li>
                    <li><button type="button" class="dropdown-item" @click="npcFeldNeuWuerfeln('alter', 'mitAbhaengigen')">Alter + {{ npcAbhaengigkeitsLabel('alter') }}</button></li>
                  </ul>
                </div>
              </div>
              <div class="col-md-6"><label class="form-label small text-secondary mb-1">Familienstand</label><div class="input-group"><input class="form-control" v-model="anlage.zeile.familienstand" placeholder="Familienstand" /><button type="button" class="btn btn-outline-secondary htbah-input-icon-btn" :disabled="!zufallsgeneratorBereit || !randomSichtbar" title="Familienstand neu würfeln" @click="npcFeldNeuWuerfeln('familienstand', 'einzeln')"><span class="material-symbols-outlined">refresh</span></button></div></div>
              <div class="col-md-6">
                <label class="form-label small text-secondary mb-1">Beruf</label>
                <div class="input-group">
                  <input class="form-control" v-model="anlage.zeile.beruf" placeholder="Beruf" />
                  <button type="button" class="btn btn-outline-secondary htbah-input-icon-btn" :disabled="!zufallsgeneratorBereit || !randomSichtbar" title="Beruf neu würfeln (einzeln)" @click="npcFeldNeuWuerfeln('beruf', 'einzeln')"><span class="material-symbols-outlined">refresh</span></button>
                  <button type="button" class="btn btn-outline-secondary dropdown-toggle dropdown-toggle-split htbah-input-icon-btn" :disabled="!zufallsgeneratorBereit || !randomSichtbar" data-bs-toggle="dropdown" aria-expanded="false"><span class="visually-hidden">Optionen</span></button>
                  <ul class="dropdown-menu dropdown-menu-end">
                    <li><button type="button" class="dropdown-item" @click="npcFeldNeuWuerfeln('beruf', 'einzeln')">Nur Beruf neu</button></li>
                    <li><button type="button" class="dropdown-item" @click="npcFeldNeuWuerfeln('beruf', 'mitAbhaengigen')">Beruf + {{ npcAbhaengigkeitsLabel('beruf') }}</button></li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
          <section class="htbah-entitaet-bereich">
            <h6 class="htbah-entitaet-bereich-titel">🧍 Körper & Merkmale</h6>
            <div class="row g-2">
              <div class="col-md-6">
                <label class="form-label small text-secondary mb-1">Statur</label>
                <div class="input-group">
                  <input class="form-control" v-model="anlage.zeile.statur" placeholder="Statur" />
                  <button type="button" class="btn btn-outline-secondary htbah-input-icon-btn" :disabled="!zufallsgeneratorBereit || !randomSichtbar" title="Statur neu würfeln (einzeln)" @click="npcFeldNeuWuerfeln('statur', 'einzeln')"><span class="material-symbols-outlined">refresh</span></button>
                  <button type="button" class="btn btn-outline-secondary dropdown-toggle dropdown-toggle-split htbah-input-icon-btn" :disabled="!zufallsgeneratorBereit || !randomSichtbar" data-bs-toggle="dropdown" aria-expanded="false"><span class="visually-hidden">Optionen</span></button>
                  <ul class="dropdown-menu dropdown-menu-end">
                    <li><button type="button" class="dropdown-item" @click="npcFeldNeuWuerfeln('statur', 'einzeln')">Nur Statur neu</button></li>
                    <li><button type="button" class="dropdown-item" @click="npcFeldNeuWuerfeln('statur', 'mitAbhaengigen')">Statur + {{ npcAbhaengigkeitsLabel('statur') }}</button></li>
                  </ul>
                </div>
              </div>
              <div class="col-md-6"><label class="form-label small text-secondary mb-1">Stimme</label><div class="input-group"><input class="form-control" v-model="anlage.zeile.stimme" placeholder="Stimme" /><button type="button" class="btn btn-outline-secondary htbah-input-icon-btn" :disabled="!zufallsgeneratorBereit || !randomSichtbar" title="Stimme neu würfeln" @click="npcFeldNeuWuerfeln('stimme', 'einzeln')"><span class="material-symbols-outlined">refresh</span></button></div></div>
            </div>
          </section>
          <section class="htbah-entitaet-bereich">
            <h6 class="htbah-entitaet-bereich-titel">⚔️ Kampfwerte</h6>
            <div v-if="!zeigtKampfSchnellaktionen" class="row g-2 mb-2">
              <div class="col-md-6"><label class="form-label small text-secondary mb-1">Lebenspunkte</label><div class="input-group"><input class="form-control" v-model="anlage.zeile.lebenspunkte" placeholder="Lebenspunkte" inputmode="numeric" autocomplete="off" @focus="onKampfLebenspunkteFocus" @blur="onKampfLebenspunkteBlur" /><button type="button" class="btn btn-outline-secondary htbah-input-icon-btn" :disabled="!zufallsgeneratorBereit || !randomSichtbar" title="Lebenspunkte neu würfeln" @click="npcFeldNeuWuerfeln('lebenspunkte', 'mitAbhaengigen')"><span class="material-symbols-outlined">refresh</span></button></div></div>
            </div>
            <faehigkeiten-kompakt-panel
              v-if="interaktiveWeltBearbeitung"
              :entitaet="anlage.zeile"
              @probe="faehigkeitenProbeOeffnen" />
            <faehigkeiten-editor-panel
              v-else
              :entitaet="anlage.zeile"
              modus="sl"
              :preset-id="zeilePresetId"
              :id-prefix="'zfn-npc-' + (anlage.zeile.id || 'neu')"
              @probe="faehigkeitenProbeOeffnen" />
          </section>
          <section class="htbah-entitaet-bereich">
            <h6 class="htbah-entitaet-bereich-titel">🧭 Zugehörigkeit & Kontext</h6>
            <div class="row g-2">
              <div class="col-md-6">
                <label class="form-label small text-secondary mb-1">Gesinnung</label>
                <div class="input-group">
                  <input class="form-control" v-model="anlage.zeile.gesinnung" placeholder="Gesinnung" />
                  <button type="button" class="btn btn-outline-secondary htbah-input-icon-btn" :disabled="!zufallsgeneratorBereit || !randomSichtbar" title="Gesinnung neu würfeln" @click="npcFeldNeuWuerfeln('gesinnung', 'einzeln')"><span class="material-symbols-outlined">refresh</span></button>
                </div>
              </div>
              <div class="col-md-6">
                <label class="form-label small text-secondary mb-1" for="wb-zfn-glaube">Glaube</label>
                <div class="input-group">
                  <input id="wb-zfn-glaube" class="form-control" v-model="anlage.zeile.glaube" :list="pantheonNamenListe.length ? 'wb-zfn-glaube-datalist' : undefined" placeholder="Leer, aus Liste wählen oder Freitext" autocomplete="off" />
                  <button type="button" class="btn btn-outline-secondary htbah-input-icon-btn" :disabled="!zufallsgeneratorBereit || !randomSichtbar" title="Glaube neu würfeln" @click="npcFeldNeuWuerfeln('glaube', 'einzeln')"><span class="material-symbols-outlined">refresh</span></button>
                </div>
                <datalist v-if="pantheonNamenListe.length" id="wb-zfn-glaube-datalist">
                  <option v-for="n in pantheonNamenListe" :key="'wb-pg-' + n" :value="n"></option>
                </datalist>
              </div>
              <div class="col-md-6">
                <label class="form-label small text-secondary mb-1">Fraktion</label>
                <div class="input-group">
                  <select class="form-select" v-model="anlage.zeile.fraktion">
                    <option value="">— keine —</option>
                    <option v-for="f in fraktionenMitNamen" :key="f.id" :value="f.name">{{ f.name }}</option>
                  </select>
                  <button type="button" class="btn btn-outline-secondary htbah-input-icon-btn" :disabled="!zufallsgeneratorBereit || !randomSichtbar" title="Fraktion neu würfeln" @click="npcFeldNeuWuerfeln('fraktion', 'einzeln')"><span class="material-symbols-outlined">refresh</span></button>
                </div>
              </div>
              <div class="col-md-6">
                <label class="form-label small text-secondary mb-1" for="wb-zfn-ort">Aufenthaltsort</label>
                <div class="input-group">
                  <input
                    id="wb-zfn-ort"
                    class="form-control"
                    v-model="anlage.zeile.aufenthaltsort"
                    :list="orteNamenListe.length ? 'wb-zfn-ort-datalist' : undefined"
                    placeholder="Ort wählen oder Freitext"
                    autocomplete="off" />
                  <button type="button" class="btn btn-outline-secondary htbah-input-icon-btn" :disabled="!zufallsgeneratorBereit || !randomSichtbar" title="Aufenthaltsort neu würfeln" @click="npcFeldNeuWuerfeln('aufenthaltsort', 'einzeln')"><span class="material-symbols-outlined">refresh</span></button>
                </div>
                <datalist v-if="orteNamenListe.length" id="wb-zfn-ort-datalist">
                  <option v-for="ort in orteNamenListe" :key="'wb-zfn-ort-' + ort" :value="ort"></option>
                </datalist>
              </div>
            </div>
          </section>
          <section class="htbah-entitaet-bereich">
            <h6 class="htbah-entitaet-bereich-titel">🎯 Motivation</h6>
            <div class="row g-2">
              <div class="col-12"><label class="form-label small text-secondary mb-1">Geheimnis</label><div class="input-group"><input class="form-control" v-model="anlage.zeile.geheimnis" placeholder="Geheimnis" /><button type="button" class="btn btn-outline-secondary htbah-input-icon-btn" :disabled="!zufallsgeneratorBereit || !randomSichtbar" title="Geheimnis neu würfeln" @click="npcFeldNeuWuerfeln('geheimnis', 'einzeln')"><span class="material-symbols-outlined">refresh</span></button></div></div>
              <div class="col-12"><label class="form-label small text-secondary mb-1">Ziel</label><div class="input-group"><input class="form-control" v-model="anlage.zeile.ziel" placeholder="Ziel (z. B. Wohlstand, Lebenswandel)" /><button type="button" class="btn btn-outline-secondary htbah-input-icon-btn" :disabled="!zufallsgeneratorBereit || !randomSichtbar" title="Ziel neu würfeln" @click="npcFeldNeuWuerfeln('ziel', 'einzeln')"><span class="material-symbols-outlined">refresh</span></button></div></div>
            </div>
          </section>
        </template>
        <template v-else-if="anlage.typ === 'ort'">
          <section class="htbah-entitaet-bereich">
            <h6 class="htbah-entitaet-bereich-titel">🧾 Stammdaten</h6>
            <div class="row g-2">
              <div class="col-md-6"><div class="input-group"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.name" placeholder=" " /><label>Name</label></div><button v-if="kannInWeltOeffnen" type="button" class="btn btn-outline-secondary htbah-input-icon-btn" title="In interaktiver Welt öffnen" aria-label="In interaktiver Welt öffnen" @click="inWeltOeffnen">🌍</button></div></div>
              <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.groesse" placeholder=" " /><label>Größe</label></div></div>
            </div>
          </section>
          <section class="htbah-entitaet-bereich">
            <h6 class="htbah-entitaet-bereich-titel">🗺️ Geografie & Zustand</h6>
            <div class="row g-2">
              <div class="col-12"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.lage" placeholder=" " /><label>Lage (z. B. Wald, Hafenstadt, Fluss, Insel)</label></div></div>
              <div class="col-12"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.zustand" placeholder=" " /><label>Zustand (z. B. zerstört, intakt, florierend)</label></div></div>
            </div>
          </section>
        </template>
        <template v-else-if="anlage.typ === 'fraktion'">
          <section class="htbah-entitaet-bereich">
            <h6 class="htbah-entitaet-bereich-titel">🧾 Stammdaten</h6>
            <div class="row g-2">
              <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.art" placeholder=" " /><label>Art (z. B. Gilde, Partei, Bande)</label></div></div>
              <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.name" placeholder=" " /><label>Name</label></div></div>
            </div>
          </section>
          <section class="htbah-entitaet-bereich">
            <h6 class="htbah-entitaet-bereich-titel">📍 Einflussraum</h6>
            <div class="row g-2">
              <div class="col-12">
                <label class="form-label small text-secondary mb-1">Zugeordnete Orte (Mehrfachauswahl)</label>
                <div class="input-group">
                  <input
                    class="form-control"
                    v-model="fraktionOrtEingabe"
                    :list="orteNamenListe.length ? 'zst-fraktion-orte-datalist' : undefined"
                    placeholder="Ort wählen oder frei eingeben"
                    autocomplete="off"
                    @keydown.enter.prevent="fraktionOrtHinzufuegen" />
                  <button type="button" class="btn btn-outline-secondary" @click="fraktionOrtHinzufuegen">
                    Hinzufügen
                  </button>
                </div>
                <datalist v-if="orteNamenListe.length" id="zst-fraktion-orte-datalist">
                  <option v-for="ort in orteNamenListe" :key="'zst-fraktion-ort-' + ort" :value="ort"></option>
                </datalist>
                <div class="d-flex flex-wrap gap-1 mt-2">
                  <span
                    v-for="(ort, ortIndex) in (anlage.zeile.orte || [])"
                    :key="'fraktion-ort-chip-' + ort + '-' + ortIndex"
                    class="badge text-bg-secondary d-inline-flex align-items-center gap-1">
                    {{ ort }}
                    <button
                      type="button"
                      class="btn-close btn-close-white"
                      aria-label="Ort entfernen"
                      style="font-size: .6rem;"
                      @click="fraktionOrtEntfernen(ortIndex)"></button>
                  </span>
                </div>
              </div>
            </div>
          </section>
          <section class="htbah-entitaet-bereich">
            <h6 class="htbah-entitaet-bereich-titel">🧠 Ausrichtung</h6>
            <div class="row g-2">
              <div class="col-12"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.ziel" placeholder=" " /><label>Ziel</label></div></div>
              <div class="col-12"><div class="form-floating"><textarea class="form-control" style="height:5rem" v-model="anlage.zeile.gesinnungVerhalten" placeholder=" "></textarea><label>Gesinnung / Verhalten</label></div></div>
            </div>
          </section>
        </template>
        <template v-else-if="anlage.typ === 'pantheon'">
          <section class="htbah-entitaet-bereich">
            <h6 class="htbah-entitaet-bereich-titel">🧾 Stammdaten</h6>
            <div class="row g-2">
              <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.name" placeholder=" " /><label>Name</label></div></div>
              <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.geschlecht" placeholder=" " /><label>Geschlecht / Darstellung</label></div></div>
              <div class="col-12"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.domaene" placeholder=" " /><label>Wofür steht die Gottheit (Domäne)</label></div></div>
            </div>
          </section>
          <section class="htbah-entitaet-bereich">
            <h6 class="htbah-entitaet-bereich-titel">🕯️ Wesen & Lehre</h6>
            <div class="row g-2 mb-2">
              <div class="col-12">
                <label class="form-label small text-secondary mb-1">Charakter (z. B. rachsüchtig, gütig)</label>
                <html-feld-quill-editor
                  :key="'pantheon-charakter-' + pantheonQuillEditorKey"
                  v-model="anlage.zeile.charakter"
                  :editor-key="'pantheon-charakter-' + pantheonQuillEditorKey"
                  placeholder="Charakter der Gottheit beschreiben …" />
              </div>
            </div>
            <div class="table-responsive rounded border border-secondary border-opacity-25 vor-nachteile-karte-wrap">
              <table class="table table-sm mb-0 inventar-tabelle vor-nachteile-tabelle vor-nachteile-karte-tabelle pantheon-staerken-tabelle">
                <thead>
                  <tr>
                    <th scope="col" class="vn-col-vorteil">Stärken</th>
                    <th scope="col" class="vn-col-nachteil">Schwächen</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="vn-col-vorteil align-top">
                      <textarea
                        class="form-control form-control-sm pantheon-staerken-feld"
                        rows="4"
                        v-model="anlage.zeile.staerke"
                        placeholder="Stärken der Gottheit …"></textarea>
                    </td>
                    <td class="vn-col-nachteil align-top">
                      <textarea
                        class="form-control form-control-sm pantheon-staerken-feld"
                        rows="4"
                        v-model="anlage.zeile.schwaeche"
                        placeholder="Schwächen der Gottheit …"></textarea>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <section class="htbah-entitaet-bereich">
            <h6 class="htbah-entitaet-bereich-titel">🙏 Kultbezug</h6>
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label small text-secondary mb-1">Schutzpatronat (wer / was)</label>
                <html-feld-quill-editor
                  :key="'pantheon-schutz-' + pantheonQuillEditorKey"
                  v-model="anlage.zeile.schutzpatronat"
                  :editor-key="'pantheon-schutz-' + pantheonQuillEditorKey"
                  placeholder="Schutzpatronat …" />
              </div>
              <div class="col-12">
                <label class="form-label small text-secondary mb-1">Was verlangt sie (Opfer, Gebote)</label>
                <html-feld-quill-editor
                  :key="'pantheon-verlangen-' + pantheonQuillEditorKey"
                  v-model="anlage.zeile.verlangen"
                  :editor-key="'pantheon-verlangen-' + pantheonQuillEditorKey"
                  placeholder="Opfer, Gebote, Erwartungen …" />
              </div>
              <div class="col-12">
                <label class="form-label small text-secondary mb-1">Mythos: Was wird erzählt, dass sie geben würde</label>
                <html-feld-quill-editor
                  :key="'pantheon-mythos-' + pantheonQuillEditorKey"
                  v-model="anlage.zeile.mythosGaben"
                  :editor-key="'pantheon-mythos-' + pantheonQuillEditorKey"
                  placeholder="Mythische Gaben und Legenden …" />
              </div>
            </div>
          </section>
        </template>
        <template v-else-if="anlage.typ === 'raetsel'">
          <section class="htbah-entitaet-bereich">
            <h6 class="htbah-entitaet-bereich-titel">🧾 Stammdaten</h6>
            <p v-if="randomSichtbar" class="small text-secondary mb-2">
              Namen aus den Tabellen „Orte“ und „NPCs“ können im Ergebnistext vorkommen, wenn Einträge existieren.
            </p>
            <div class="row g-2">
              <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.art" placeholder=" " /><label>Art (z. B. Licht- & Spiegelpuzzle)</label></div></div>
              <div class="col-md-6"><div class="input-group"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.titel" placeholder=" " /><label>Titel / Stichwort</label></div><button v-if="kannInWeltOeffnen" type="button" class="btn btn-outline-secondary htbah-input-icon-btn" title="In interaktiver Welt öffnen" aria-label="In interaktiver Welt öffnen" @click="inWeltOeffnen">🌍</button></div></div>
              <div class="col-md-6">
                <label class="form-label small text-secondary mb-1" for="wb-zr-ort">Aufenthaltsort (optional)</label>
                <input
                  id="wb-zr-ort"
                  class="form-control"
                  v-model="anlage.zeile.aufenthaltsort"
                  :list="orteNamenListe.length ? 'wb-zr-ort-datalist' : undefined"
                  placeholder="Ort wählen oder Freitext"
                  autocomplete="off" />
                <datalist v-if="orteNamenListe.length" id="wb-zr-ort-datalist">
                  <option v-for="ort in orteNamenListe" :key="'wb-zr-ort-' + ort" :value="ort"></option>
                </datalist>
              </div>
              <div class="col-md-6 d-flex align-items-center">
                <div class="form-check form-switch mt-2">
                  <input class="form-check-input" type="checkbox" role="switch" v-model="anlage.zeile.geloest" id="wb-zr-geloest" />
                  <label class="form-check-label" for="wb-zr-geloest">Rätsel gelöst</label>
                </div>
              </div>
            </div>
          </section>
          <section class="htbah-entitaet-bereich">
            <h6 class="htbah-entitaet-bereich-titel">🧩 Spiellogik</h6>
            <div class="row g-2">
              <div class="col-12"><div class="form-floating"><textarea class="form-control" style="height:4.5rem" v-model="anlage.zeile.aufgabenstellung" placeholder=" "></textarea><label>Wie könnte die Aufgabenstellung lauten?</label></div></div>
              <div class="col-12"><div class="form-floating"><textarea class="form-control" style="height:4rem" v-model="anlage.zeile.ergebnis" placeholder=" "></textarea><label>Ergebnis (Himmelsrichtung, Ort, Person, Tageszeit …)</label></div></div>
              <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.schwierigkeit" placeholder=" " /><label>Schwierigkeit</label></div></div>
            </div>
          </section>
        </template>
        <template v-else-if="anlage.typ === 'bestie'">
          <section class="htbah-entitaet-bereich">
            <h6 class="htbah-entitaet-bereich-titel">🧾 Stammdaten</h6>
            <div class="row g-2">
              <div class="col-md-6"><label class="form-label small text-secondary mb-1">Kategorie</label><select class="form-select" v-model="anlage.zeile.kategorie"><option value="normales_tier">Normales Tier</option><option value="fantasy_tier">Magisch / Fantasy</option><option value="mutiert">Mutiert</option><option value="monster">Monster</option></select></div>
              <div class="col-12"><div class="input-group"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.name" placeholder=" " /><label>Name der Bestie</label></div><button v-if="kannInWeltOeffnen" type="button" class="btn btn-outline-secondary htbah-input-icon-btn" title="In interaktiver Welt öffnen" aria-label="In interaktiver Welt öffnen" @click="inWeltOeffnen">🌍</button></div></div>
            </div>
          </section>
          <section class="htbah-entitaet-bereich">
            <h6 class="htbah-entitaet-bereich-titel">⚔️ Kampfwerte</h6>
            <div v-if="!zeigtKampfSchnellaktionen" class="row g-2 mb-2">
              <div class="col-md-4"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.lebenspunkte" placeholder=" " autocomplete="off" @focus="onKampfLebenspunkteFocus" @blur="onKampfLebenspunkteBlur" /><label>Lebenspunkte</label></div></div>
            </div>
            <faehigkeiten-kompakt-panel
              v-if="interaktiveWeltBearbeitung"
              :entitaet="anlage.zeile"
              @probe="faehigkeitenProbeOeffnen" />
            <faehigkeiten-editor-panel
              v-else
              :entitaet="anlage.zeile"
              modus="sl"
              :preset-id="zeilePresetId"
              :id-prefix="'zfn-bestie-' + (anlage.zeile.id || 'neu')"
              @probe="faehigkeitenProbeOeffnen" />
          </section>
          <section class="htbah-entitaet-bereich">
            <h6 class="htbah-entitaet-bereich-titel">🐾 Verhalten & Natur</h6>
            <div class="row g-2">
              <div class="col-12">
                <label class="form-label small text-secondary mb-1">
                  Aggressivität und Offensive (Skala 1 = sehr defensiv / scheu, 10 = sehr aggressiv und offensiv)
                </label>
                <div class="d-flex align-items-center gap-3">
                  <input type="range" class="form-range flex-grow-1" min="1" max="10" step="1" v-model.number="anlage.zeile.aggressivitaetSkala" />
                  <span class="small text-nowrap text-secondary" style="min-width: 3.5rem">{{ Math.min(10, Math.max(1, Math.round(Number(anlage.zeile.aggressivitaetSkala) || 1))) }} / 10</span>
                </div>
              </div>
              <div class="col-md-6"><div class="form-floating"><textarea class="form-control" style="height:4.5rem" v-model="anlage.zeile.staerke" placeholder=" "></textarea><label>Stärken (optional)</label></div></div>
              <div class="col-md-6"><div class="form-floating"><textarea class="form-control" style="height:4.5rem" v-model="anlage.zeile.schwaeche" placeholder=" "></textarea><label>Schwächen (optional)</label></div></div>
            </div>
          </section>
          <section class="htbah-entitaet-bereich">
            <h6 class="htbah-entitaet-bereich-titel">🌍 Weltbezug</h6>
            <div class="row g-2">
              <div class="col-12">
                <label class="form-label small text-secondary mb-1" for="wb-zb-ort">Aufenthaltsort</label>
                <input
                  id="wb-zb-ort"
                  class="form-control"
                  v-model="anlage.zeile.aufenthaltsort"
                  :list="orteNamenListe.length ? 'wb-zb-ort-datalist' : undefined"
                  placeholder="Ort wählen oder Freitext"
                  autocomplete="off" />
                <datalist v-if="orteNamenListe.length" id="wb-zb-ort-datalist">
                  <option v-for="ort in orteNamenListe" :key="'wb-zb-ort-' + ort" :value="ort"></option>
                </datalist>
              </div>
              <div class="col-12"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.geheimnis" placeholder=" " /><label>Geheimnis</label></div></div>
              <div class="col-12">
                <label class="form-label small text-secondary mb-1">Fraktionen</label>
                <div v-if="fraktionenMitNamen.length" class="d-flex flex-wrap gap-2">
                  <button
                    v-for="f in fraktionenMitNamen"
                    :key="'bestie-fraktion-chip-' + f.id"
                    type="button"
                    class="btn btn-sm"
                    :class="bestieFraktionAktiv(f.name) ? 'btn-primary' : 'btn-outline-secondary'"
                    @click="bestieFraktionUmschalten(f.name)">
                    {{ f.name }}
                  </button>
                </div>
                <div v-else class="small text-body-secondary">Keine Fraktionen vorhanden.</div>
                <div class="form-text">Mehrfachauswahl per Tap/Klick auf die Chips.</div>
              </div>
            </div>
          </section>
        </template>
        <template v-else-if="anlage.typ === 'gegenstand'">
          <section class="htbah-entitaet-bereich">
            <h6 class="htbah-entitaet-bereich-titel">🧾 Stammdaten</h6>
            <div class="mb-2">
              <span class="badge rounded-pill" :class="gegenstandArtBadgeClass">{{ gegenstandArtLabel }}</span>
            </div>
            <div class="row g-2">
              <div class="col-12"><div class="input-group"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.name" placeholder=" " /><label>Name</label></div><button v-if="kannInWeltOeffnen" type="button" class="btn btn-outline-secondary htbah-input-icon-btn" title="In interaktiver Welt öffnen" aria-label="In interaktiver Welt öffnen" @click="inWeltOeffnen">🌍</button></div></div>
            </div>
          </section>
          <section class="htbah-entitaet-bereich">
            <h6 class="htbah-entitaet-bereich-titel">📍 Einordnung & Standort</h6>
            <label class="form-label small text-secondary mb-1" for="wb-zg-ort">Aufenthaltsort</label>
            <input
              id="wb-zg-ort"
              class="form-control"
              v-model="anlage.zeile.aufenthaltsort"
              :list="orteNamenListe.length ? 'wb-zg-ort-datalist' : undefined"
              placeholder="Ort wählen oder Freitext"
              autocomplete="off" />
            <datalist v-if="orteNamenListe.length" id="wb-zg-ort-datalist">
              <option v-for="ort in orteNamenListe" :key="'wb-zg-ort-' + ort" :value="ort"></option>
            </datalist>
          </section>
        </template>
        </div>

        <div v-if="zeigtMedienTab" class="mt-3 mb-3">
          <entity-karten-icon-feld
            v-if="zeigtKartenIconFeld"
            :entity-typ="anlage.typ"
            :model-value="anlage.zeile.kartenIcon"
            :medien="anlage.zeile.medien || []"
            :modal-id-suffix="kartenIconModalSuffix"
            @update:model-value="aufKartenIconAktualisiert" />
          <section class="htbah-entitaet-bereich">
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
              <h6 class="htbah-entitaet-bereich-titel mb-0">🖼️ Medien &amp; Dateien</h6>
              <label class="btn btn-sm btn-outline-secondary mb-0">
                Hochladen
                <input type="file" class="d-none" multiple @change="$emit('media-upload', $event)" />
              </label>
            </div>
            <div v-if="!(anlage.zeile.medien || []).length" class="text-secondary small mb-0">Noch keine Medien.</div>
            <div v-else class="row g-2">
              <div v-for="(medium, mediumIndex) in (anlage.zeile.medien || [])" :key="'wb-bearbeitung-medium-' + medium.id" class="col-12 col-md-6">
                <div class="border rounded p-2 h-100 zufallstabellen-medium-karte">
                  <button
                    v-if="typeof medium.dataUrl === 'string' && medium.dataUrl.startsWith('data:image/')"
                    type="button"
                    class="zufallstabellen-medium-thumb-button mb-2"
                    @click="$emit('media-open', medium)">
                    <img :src="medium.dataUrl" :alt="medium.name || 'Bild'" />
                  </button>
                  <div class="small">
                    <div class="fw-semibold">{{ medium.name || 'Datei' }}</div>
                    <div class="text-secondary">{{ medium.mimeType || 'Datei' }}</div>
                    <div v-if="Number.isFinite(medium.size)" class="text-secondary">{{ Math.round(medium.size / 1024) }} KiB</div>
                  </div>
                  <div class="d-flex gap-2 mt-2">
                    <button
                      v-if="typeof medium.dataUrl === 'string' && medium.dataUrl.startsWith('data:image/')"
                      type="button"
                      class="btn btn-sm"
                      :class="anlage.zeile.primaryMediumId === medium.id ? 'btn-primary' : 'btn-outline-primary'"
                      @click="$emit('media-set-primary', medium.id)">
                      {{ anlage.zeile.primaryMediumId === medium.id ? 'Titelbild' : 'Als Titelbild' }}
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-secondary" @click="$emit('media-download', medium)">Download</button>
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="$emit('media-remove', mediumIndex)">Entfernen</button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section v-if="zeigtInventarBereich && zeigtDatenTab" class="htbah-entitaet-bereich mt-3">
          <h6 class="htbah-entitaet-bereich-titel">🎒 Inventar</h6>
          <p class="small text-secondary mb-2">
            Gegenstände hier bearbeiten oder per Drag &amp; Drop auf der interaktiven Welt zuordnen.
          </p>
          <inventar-editor-panel
            v-if="anlage.zeile"
            :inventar="inventarListeModel"
            @remove="inventarEintragEntfernenEvent"
            @change="inventarZeileGespeichert" />
        </section>

        <section v-if="zeigtDatenTab" class="htbah-entitaet-bereich mt-3">
          <h6 class="htbah-entitaet-bereich-titel">{{ notizenBereichTitel }}</h6>
          <div class="zufallstabellen-quill-wrap" :key="'wb-zeile-q-' + zeileQuillSession">
            <div :ref="zeileQuillHostRefFn" class="quill-editor-host zufallstabellen-quill-host entitaet-quill-editor-host"></div>
          </div>
        </section>
        <div class="d-flex justify-content-between align-items-center gap-2 mt-3">
          <div class="d-flex gap-2">
            <button v-if="kannDuplizieren" type="button" class="btn btn-sm btn-outline-primary" @click="$emit('duplicate')">Duplizieren</button>
            <button v-if="kannLoeschen" type="button" class="btn btn-sm btn-outline-danger" @click="$emit('delete')">Löschen</button>
          </div>
          <div class="d-flex flex-wrap align-items-center gap-2">
            <span
              v-if="interaktiveWeltBearbeitung && hatUngespeicherteAenderungen"
              class="badge rounded-pill text-bg-warning me-1">
              Ungespeichert
            </span>
            <button type="button" class="btn btn-sm btn-outline-secondary" @click="schliessen">
              {{ interaktiveWeltBearbeitung ? 'Schließen' : 'Abbrechen' }}
            </button>
            <button
              type="button"
              class="btn btn-sm btn-primary"
              :disabled="speicherDeaktiviert || (interaktiveWeltBearbeitung && !hatUngespeicherteAenderungen)"
              @click="$emit('save')">
              Speichern
            </button>
          </div>
        </div>
        <div v-if="speicherHinweis" class="form-text text-end mt-1">{{ speicherHinweis }}</div>
        </div>
        <teleport to="body">
          <parade-modal
            :key="kampfModalDomPrefix + '-parade-' + paradeModalGeneration"
            :modal-dom-id="kampfModalDomPrefix + '-parade'"
            ref="paradeModal" />
          <schaden-modal
            :key="kampfModalDomPrefix + '-schaden-' + schadenModalGeneration"
            :modal-dom-id="kampfModalDomPrefix + '-schaden'"
            ref="schadenModal" />
          <probe-wurf-modal
            :key="kampfModalDomPrefix + '-probe-' + probeModalGeneration"
            :modal-dom-id="kampfModalDomPrefix + '-probe'"
            ref="probeWurfModal" />
        </teleport>
        <div
          v-if="!modal.istVollbild"
          class="regelwerk-modal-resize-handle"
          role="presentation"
          aria-hidden="true"
          @pointerdown="starteResize"></div>
      </div>
    </div>
  `,
};
