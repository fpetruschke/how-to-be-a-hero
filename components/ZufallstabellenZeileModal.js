window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.ZufallstabellenZeileModal = {
  name: 'ZufallstabellenZeileModal',
  components: {
    ParadeModal: window.HTBAH_KOMPONENTEN.ParadeModal,
    SchadenModal: window.HTBAH_KOMPONENTEN.SchadenModal,
    ProbeWurfModal: window.HTBAH_KOMPONENTEN.ProbeWurfModal,
    InventarEditorPanel: window.HTBAH_KOMPONENTEN.InventarEditorPanel,
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
    zufallGegenstandKleidung: { type: Boolean, default: true },
    zufallFraktionEpoche: { type: String, default: 'mittelalter' },
    zufallRaetselEpoche: { type: String, default: 'mittelalter' },
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
    'update:zufallGegenstandKleidung',
    'update:zufallFraktionEpoche',
    'update:zufallRaetselEpoche',
    'npc-refresh-field',
    'npc-wizard',
    'bestien-wizard',
    'welt-open',
    'inventar-remove',
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
    zeigtRandomAlsDropdown() {
      if (!this.randomSichtbar) {
        return false;
      }
      const typ = this.anlage && this.anlage.typ;
      return (
        this.randomWizardVerfuegbar && (typ === 'npc' || typ === 'bestie')
      );
    },
    kampfZustandOptionen() {
      return [
        { id: 'vital', label: 'Vital', emoji: '💚' },
        { id: 'bewusstlos', label: 'Bewusstlos', emoji: '😵' },
        { id: 'tot', label: 'Tot', emoji: '💀' },
      ];
    },
    bestieAngriffAlsZahl() {
      if (!this.anlage || this.anlage.typ !== 'bestie' || !this.anlage.zeile) {
        return null;
      }
      const text = String(this.anlage.zeile.angriff == null ? '' : this.anlage.zeile.angriff).trim();
      if (!text || !/^\d+$/.test(text)) {
        return null;
      }
      const wert = Math.round(Number(text));
      if (!Number.isFinite(wert) || wert < 0 || wert > 100) {
        return null;
      }
      return wert;
    },
    kannBestieAngriffProbe() {
      return this.bestieAngriffAlsZahl !== null;
    },
  },
  watch: {
    'anlage.offen'(offen) {
      if (offen && !this.eingebettet) {
        this.fokusVorModal = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        this.$nextTick(() => {
          this.initialisierePosition();
          this.fokussiereFenster();
        });
      } else if (!offen) {
        this.beendeZiehen();
        this.beendeResize();
        this.modal.istVollbild = false;
        this.stelleFokusWiederHer();
      }
      this.fraktionOrtEingabe = '';
      if (offen) {
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
      this.modal.istVollbild = !this.modal.istVollbild;
      if (!this.modal.istVollbild) {
        this.$nextTick(() => this.stelleSichtbaresFensterSicher());
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
    schliessen() {
      this.kampfWuerfelModalsSchliessenUndZuruecksetzen();
      this.$emit('close');
    },
    onResize() {
      this.$nextTick(() => this.stelleSichtbaresFensterSicher());
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
      if (!this.anlage || !this.anlage.zeile) {
        return 0;
      }
      const handeln = Math.round(Number(this.anlage.zeile.handeln) || 0);
      return Math.max(0, Math.min(40, handeln));
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
      return Math.max(0, Math.min(100, Math.round(Number(this.anlage.zeile[kategorie]) || 0)));
    },
    angriffProbeOeffnen() {
      if (!this.anlage || !this.anlage.zeile || this.anlage.typ !== 'bestie') {
        return;
      }
      const zielwert = this.bestieAngriffAlsZahl;
      if (zielwert === null) {
        return;
      }
      const name = String(this.anlage.zeile.name || '').trim();
      const payload = {
        modus: 'begabung',
        basiswert: zielwert,
        zielwert,
        zeigtModifikator: true,
        basisLabel: 'Angriffswert',
        zielLabel: 'Zielwert Angriff (zu unterbieten)',
        titel: 'Probe: Angriff' + (name ? ` (${name})` : ''),
        untertitel: 'Angriffswert ' + zielwert + ' — W100-Probe.',
      };
      this.probeModalGeneration += 1;
      this.$nextTick(() => {
        this.$refs.probeWurfModal?.oeffnen(payload);
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
      const basiswert = this.berechneHandelnFuerInitiative();
      const titelTeil = this.anlage.typ === 'bestie' ? 'Bestie' : 'NPC';
      const payload = {
        titel: `Parade-Probe (${titelTeil})`,
        basiswert,
        ruestungen: [],
        waffenlosParade: true,
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
      const waffenName = String(zeile.waffe || '').trim() || 'Waffe';
      const inventar = [
        {
          id: `${this.anlage.typ || 'eintrag'}-waffe`,
          typ: 'waffe',
          name: waffenName,
          schadenswertNahkampf: zeile.schadenswertNahkampf || '',
          schadenswertFernkampf: zeile.schadenswertFernkampf || '',
        },
      ];
      const waffenlos = String(zeile.waffenloserKampf || '').trim();
      if (waffenlos && this.anlage.typ === 'npc') {
        inventar.push({
          id: `${this.anlage.typ || 'eintrag'}-waffenlos`,
          typ: 'waffe',
          name: 'Waffenlos (Fäuste, Tritte)',
          schadenswertNahkampf: waffenlos,
          schadenswertFernkampf: '',
        });
      }
      const payload = {
        titel: `Schaden würfeln (${typ}${name ? `: ${name}` : ''})`,
        charakter: {
          inventar,
          handeln: [],
        },
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
    npcAbhaengigkeitsLabel(feld) {
      if (feld === 'alter') {
        return 'mit Statur + LP + waffenloser Kampf';
      }
      if (feld === 'beruf') {
        return 'mit Statur, Waffe, Schaden, LP, Begabungen';
      }
      if (feld === 'statur') {
        return 'mit LP + waffenloser Kampf';
      }
      if (feld === 'waffe') {
        return 'mit Schadenswerten';
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
  },
  template: `
    <div v-if="anlage.offen && anlage.zeile" class="regelwerk-modal-layer">
      <div
        ref="fensterElement"
        class="regelwerk-modal-window card shadow"
        :class="{ 'regelwerk-modal-window-fullscreen': modal.istVollbild }"
        :style="fensterStil"
        role="dialog"
        aria-modal="true"
        :aria-label="zeileModalTitel || 'Eintrag bearbeiten'"
        tabindex="-1"
        @keydown.esc.stop.prevent="schliessen">
        <div class="regelwerk-modal-header d-flex justify-content-between align-items-center p-2" @pointerdown="starteZiehen">
          <strong>{{ zeileModalTitel }}</strong>
          <div class="d-flex align-items-center gap-2">
            <div v-if="randomSichtbar && zeigtRandomAlsDropdown" class="dropdown">
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary dropdown-toggle"
                :disabled="!zufallsgeneratorBereit"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                aria-label="Aktionen">
                ⚙️
              </button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li>
                  <button type="button" class="dropdown-item" :disabled="!zufallsgeneratorBereit" @click="$emit('random')">
                    🎲 Zufallsvorschlag
                  </button>
                </li>
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
              </ul>
            </div>
            <button
              v-else-if="randomSichtbar"
              type="button"
              class="btn btn-sm btn-outline-secondary"
              :disabled="!zufallsgeneratorBereit"
              title="Zufallsvorschlag"
              aria-label="Zufallsvorschlag"
              @click="$emit('random')">
              🎲
            </button>
            <button
              type="button"
              class="regelwerk-icon-button"
              :aria-label="modal.istVollbild ? 'Vollbild beenden' : 'Vollbild'"
              :title="modal.istVollbild ? 'Vollbild beenden' : 'Vollbild'"
              @click="vollbildUmschalten">
              <span class="material-symbols-outlined">{{ vollbildIcon }}</span>
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
          <div class="row g-2">
            <div class="col-12">
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
                  <span aria-hidden="true">{{ opt.emoji }}</span>
                  <span class="ms-1">{{ opt.label }}</span>
                </button>
              </div>
              <p class="form-text mb-0 mt-1">
                Wird bei LP-Änderung automatisch gesetzt (0 = tot, 1–10 oder −60+ auf einmal = bewusstlos).
              </p>
            </div>
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
                <button
                  v-if="anlage.typ === 'bestie'"
                  type="button"
                  class="btn btn-sm btn-outline-primary"
                  :disabled="!kannBestieAngriffProbe"
                  :title="kannBestieAngriffProbe ? '' : 'Angriffswert muss eine Zahl von 0 bis 100 sein (keine Würfelnotation).'"
                  @click="angriffProbeOeffnen">
                  🎲 Angriff<template v-if="kannBestieAngriffProbe"> ({{ bestieAngriffAlsZahl }})</template>
                </button>
              </div>
            </div>
            <div class="col-6">
              <button
                type="button"
                class="btn btn-outline-primary btn-sm w-100"
                @click="schadenModalOeffnenFuerZeile">
                💥 Schaden erwürfeln
              </button>
            </div>
            <div class="col-6">
              <button
                type="button"
                class="btn btn-outline-primary btn-sm w-100"
                @click="paradeModalOeffnenFuerZeile">
                🛡️ Parieren
              </button>
            </div>
            <div class="col-12">
              <label class="form-label small text-secondary mb-1">Initiative</label>
              <div class="input-group">
                <input
                  class="form-control"
                  type="number"
                  min="1"
                  :max="10 + Math.max(0, Math.min(40, Math.round(Number(anlage.zeile.handeln) || 0)))"
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
                Gültig: 1 bis {{ 10 + Math.max(0, Math.min(40, Math.round(Number(anlage.zeile.handeln) || 0))) }} (1W10 + Handeln).
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
            <div class="row g-2">
              <div class="col-md-6"><label class="form-label small text-secondary mb-1">Lebenspunkte</label><div class="input-group"><input class="form-control" v-model="anlage.zeile.lebenspunkte" placeholder="Lebenspunkte" inputmode="numeric" autocomplete="off" @focus="onKampfLebenspunkteFocus" @blur="onKampfLebenspunkteBlur" /><button type="button" class="btn btn-outline-secondary htbah-input-icon-btn" :disabled="!zufallsgeneratorBereit || !randomSichtbar" title="Lebenspunkte neu würfeln" @click="npcFeldNeuWuerfeln('lebenspunkte', 'mitAbhaengigen')"><span class="material-symbols-outlined">refresh</span></button></div></div>
              <div class="col-md-6"><div class="form-floating"><input class="form-control" type="number" min="0" max="40" v-model.number="anlage.zeile.handeln" placeholder=" " inputmode="numeric" autocomplete="off" /><label>Begabung Handeln (0-40)</label></div></div>
              <div class="col-md-6"><div class="form-floating"><input class="form-control" type="number" min="0" max="40" v-model.number="anlage.zeile.wissen" placeholder=" " inputmode="numeric" autocomplete="off" /><label>Begabung Wissen (0-40)</label></div></div>
              <div class="col-md-6"><div class="form-floating"><input class="form-control" type="number" min="0" max="40" v-model.number="anlage.zeile.soziales" placeholder=" " inputmode="numeric" autocomplete="off" /><label>Begabung Soziales (0-40)</label></div></div>
              <div class="col-md-6">
                <label class="form-label small text-secondary mb-1">Waffe</label>
                <div class="input-group">
                  <input class="form-control" v-model="anlage.zeile.waffe" placeholder="Waffe" />
                  <button type="button" class="btn btn-outline-secondary htbah-input-icon-btn" :disabled="!zufallsgeneratorBereit || !randomSichtbar" title="Waffe neu würfeln (mit Schadenswerten)" @click="npcFeldNeuWuerfeln('waffe', 'mitAbhaengigen')"><span class="material-symbols-outlined">refresh</span></button>
                </div>
              </div>
              <div class="col-md-6"><label class="form-label small text-secondary mb-1">Schadenswert Nahkampf</label><div class="input-group"><input class="form-control" v-model="anlage.zeile.schadenswertNahkampf" placeholder="Schadenswert Nahkampf" autocomplete="off" /><button type="button" class="btn btn-outline-secondary htbah-input-icon-btn" :disabled="!zufallsgeneratorBereit || !randomSichtbar" title="Nahkampfschaden neu würfeln" @click="npcFeldNeuWuerfeln('schadenswertNahkampf', 'einzeln')"><span class="material-symbols-outlined">refresh</span></button></div></div>
              <div class="col-md-6"><label class="form-label small text-secondary mb-1">Schadenswert Fernkampf</label><div class="input-group"><input class="form-control" v-model="anlage.zeile.schadenswertFernkampf" placeholder="Schadenswert Fernkampf" autocomplete="off" /><button type="button" class="btn btn-outline-secondary htbah-input-icon-btn" :disabled="!zufallsgeneratorBereit || !randomSichtbar" title="Fernkampfschaden neu würfeln" @click="npcFeldNeuWuerfeln('schadenswertFernkampf', 'einzeln')"><span class="material-symbols-outlined">refresh</span></button></div></div>
              <div class="col-md-6">
                <label class="form-label small text-secondary mb-1">Waffenloser Kampf (Fäuste, Tritte)</label>
                <div class="input-group">
                  <input class="form-control" v-model="anlage.zeile.waffenloserKampf" placeholder="z. B. 1W10+2" autocomplete="off" />
                  <button type="button" class="btn btn-outline-secondary htbah-input-icon-btn" :disabled="!zufallsgeneratorBereit || !randomSichtbar" title="Waffenlosen Nahkampf neu würfeln (nach Statur)" @click="npcFeldNeuWuerfeln('waffenloserKampf', 'einzeln')"><span class="material-symbols-outlined">refresh</span></button>
                  <button type="button" class="btn btn-outline-secondary dropdown-toggle dropdown-toggle-split htbah-input-icon-btn" :disabled="!zufallsgeneratorBereit || !randomSichtbar" data-bs-toggle="dropdown" aria-expanded="false"><span class="visually-hidden">Optionen</span></button>
                  <ul class="dropdown-menu dropdown-menu-end">
                    <li><button type="button" class="dropdown-item" @click="npcFeldNeuWuerfeln('waffenloserKampf', 'einzeln')">Nur waffenloser Kampf neu</button></li>
                    <li><button type="button" class="dropdown-item" @click="npcFeldNeuWuerfeln('statur', 'mitAbhaengigen')">Statur + {{ npcAbhaengigkeitsLabel('statur') }}</button></li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
          <section class="htbah-entitaet-bereich">
            <h6 class="htbah-entitaet-bereich-titel">🧭 Zugehörigkeit & Kontext</h6>
            <div class="row g-2">
              <div class="col-md-6"><label class="form-label small text-secondary mb-1">Gesinnung</label><div class="input-group"><input class="form-control" v-model="anlage.zeile.gesinnung" placeholder="Gesinnung" /><button type="button" class="btn btn-outline-secondary htbah-input-icon-btn" :disabled="!zufallsgeneratorBereit || !randomSichtbar" title="Gesinnung neu würfeln" @click="npcFeldNeuWuerfeln('gesinnung', 'einzeln')"><span class="material-symbols-outlined">refresh</span></button></div></div>
              <div class="col-md-6 htbah-npc-feld-anheben">
                <label class="form-label small text-secondary mb-1" for="wb-zfn-glaube">Glaube</label>
                <div class="input-group">
                  <input id="wb-zfn-glaube" class="form-control" v-model="anlage.zeile.glaube" :list="pantheonNamenListe.length ? 'wb-zfn-glaube-datalist' : undefined" placeholder="Leer, aus Liste wählen oder Freitext" autocomplete="off" />
                  <button type="button" class="btn btn-outline-secondary htbah-input-icon-btn" :disabled="!zufallsgeneratorBereit || !randomSichtbar" title="Glaube neu würfeln" @click="npcFeldNeuWuerfeln('glaube', 'einzeln')"><span class="material-symbols-outlined">refresh</span></button>
                </div>
                <datalist v-if="pantheonNamenListe.length" id="wb-zfn-glaube-datalist">
                  <option v-for="n in pantheonNamenListe" :key="'wb-pg-' + n" :value="n"></option>
                </datalist>
              </div>
              <div class="col-md-6 htbah-npc-feld-anheben"><label class="form-label small text-secondary mb-1">Fraktion</label><div class="input-group"><select class="form-select" v-model="anlage.zeile.fraktion"><option value="">— keine —</option><option v-for="f in fraktionenMitNamen" :key="f.id" :value="f.name">{{ f.name }}</option></select><button type="button" class="btn btn-outline-secondary htbah-input-icon-btn" :disabled="!zufallsgeneratorBereit || !randomSichtbar" title="Fraktion neu würfeln" @click="npcFeldNeuWuerfeln('fraktion', 'einzeln')"><span class="material-symbols-outlined">refresh</span></button></div></div>
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
            <div class="row g-2 mb-2 align-items-end" v-if="randomSichtbar">
              <div class="col-md-6">
                <label class="form-label small text-secondary mb-1">Epoche für Namensvorschlag</label>
                <select class="form-select form-select-sm" :value="zufallFraktionEpoche" @change="$emit('update:zufallFraktionEpoche', $event.target.value)">
                  <option value="mittelalter">Mittelalter</option>
                  <option value="gegenwart">Gegenwart</option>
                  <option value="zukunft">Zukunft</option>
                </select>
              </div>
            </div>
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
            <div class="row g-2">
              <div class="col-md-6"><div class="form-floating"><textarea class="form-control" style="height:4.5rem" v-model="anlage.zeile.charakter" placeholder=" "></textarea><label>Charakter (z. B. rachsüchtig, gütig)</label></div></div>
              <div class="col-md-6"><div class="form-floating"><textarea class="form-control" style="height:4.5rem" v-model="anlage.zeile.staerke" placeholder=" "></textarea><label>Stärken</label></div></div>
              <div class="col-md-6"><div class="form-floating"><textarea class="form-control" style="height:4.5rem" v-model="anlage.zeile.schwaeche" placeholder=" "></textarea><label>Schwächen</label></div></div>
            </div>
          </section>
          <section class="htbah-entitaet-bereich">
            <h6 class="htbah-entitaet-bereich-titel">🙏 Kultbezug</h6>
            <div class="row g-2">
              <div class="col-md-6"><div class="form-floating"><textarea class="form-control" style="height:4.5rem" v-model="anlage.zeile.schutzpatronat" placeholder=" "></textarea><label>Schutzpatronat (wer / was)</label></div></div>
              <div class="col-md-6"><div class="form-floating"><textarea class="form-control" style="height:4.5rem" v-model="anlage.zeile.verlangen" placeholder=" "></textarea><label>Was verlangt sie (Opfer, Gebote)</label></div></div>
              <div class="col-md-6"><div class="form-floating"><textarea class="form-control" style="height:4.5rem" v-model="anlage.zeile.mythosGaben" placeholder=" "></textarea><label>Mythos: Was wird erzählt, dass sie geben würde</label></div></div>
            </div>
          </section>
        </template>
        <template v-else-if="anlage.typ === 'raetsel'">
          <section class="htbah-entitaet-bereich">
            <h6 class="htbah-entitaet-bereich-titel">🧾 Stammdaten</h6>
            <div class="row g-2 mb-2 align-items-end" v-if="randomSichtbar">
              <div class="col-md-6">
                <label class="form-label small text-secondary mb-1">Epoche für Zufallsvorschlag</label>
                <select class="form-select form-select-sm" :value="zufallRaetselEpoche" @change="$emit('update:zufallRaetselEpoche', $event.target.value)">
                  <option value="mittelalter">Mittelalter</option>
                  <option value="gegenwart">Gegenwart</option>
                  <option value="zukunft">Zukunft</option>
                </select>
              </div>
              <div class="col-md-6 small text-secondary align-self-end">
                Namen aus den Tabellen „Orte“ und „NPCs“ können im Ergebnistext vorkommen, wenn Einträge existieren.
              </div>
            </div>
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
            <div class="row g-2">
              <div class="col-md-4"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.angriff" placeholder=" " autocomplete="off" /><label>Angriff</label></div></div>
              <div class="col-md-4"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.verteidigung" placeholder=" " autocomplete="off" /><label>Verteidigung</label></div></div>
              <div class="col-md-4"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.lebenspunkte" placeholder=" " autocomplete="off" @focus="onKampfLebenspunkteFocus" @blur="onKampfLebenspunkteBlur" /><label>Lebenspunkte</label></div></div>
              <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.waffe" placeholder=" " /><label>Waffe</label></div></div>
              <div class="col-md-3"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.schadenswertNahkampf" placeholder=" " autocomplete="off" /><label>Schaden NK</label></div></div>
              <div class="col-md-3"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.schadenswertFernkampf" placeholder=" " autocomplete="off" /><label>Schaden FK</label></div></div>
              <div class="col-md-4"><div class="form-floating"><input class="form-control" type="number" min="0" max="40" v-model.number="anlage.zeile.handeln" placeholder=" " inputmode="numeric" autocomplete="off" /><label>Begabung Handeln (0-40)</label></div></div>
              <div class="col-md-4"><div class="form-floating"><input class="form-control" type="number" min="0" max="40" v-model.number="anlage.zeile.wissen" placeholder=" " inputmode="numeric" autocomplete="off" /><label>Begabung Wissen (0-40)</label></div></div>
              <div class="col-md-4"><div class="form-floating"><input class="form-control" type="number" min="0" max="40" v-model.number="anlage.zeile.soziales" placeholder=" " inputmode="numeric" autocomplete="off" /><label>Begabung Soziales (0-40)</label></div></div>
            </div>
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
            <div class="row g-2 mb-2 align-items-end" v-if="randomSichtbar">
              <div class="col-md-6">
                <label class="form-label small text-secondary mb-1">Epoche für Zufallsvorschlag</label>
                <select class="form-select form-select-sm" :value="zufallGegenstandEpoche" @change="$emit('update:zufallGegenstandEpoche', $event.target.value)">
                  <option value="mittelalter">Mittelalter</option>
                  <option value="gegenwart">Gegenwart</option>
                  <option value="zukunft">Zukunft</option>
                </select>
              </div>
              <div class="col-md-6"><div class="form-check mt-3"><input class="form-check-input" type="checkbox" :checked="zufallGegenstandKleidung" @change="$emit('update:zufallGegenstandKleidung', $event.target.checked)" id="wb-zg-kleid" /><label class="form-check-label small" for="wb-zg-kleid">Kleidung als Kategorie zulassen</label></div></div>
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
              class="form-control mb-3"
              v-model="anlage.zeile.aufenthaltsort"
              :list="orteNamenListe.length ? 'wb-zg-ort-datalist' : undefined"
              placeholder="Ort wählen oder Freitext"
              autocomplete="off" />
            <datalist v-if="orteNamenListe.length" id="wb-zg-ort-datalist">
              <option v-for="ort in orteNamenListe" :key="'wb-zg-ort-' + ort" :value="ort"></option>
            </datalist>
            <label class="form-label small text-secondary mb-1">Initiative</label>
            <div class="input-group mb-1">
              <input
                class="form-control"
                type="number"
                min="1"
                max="50"
                v-model="anlage.zeile.initiative"
                placeholder="z. B. 9"
                inputmode="numeric"
                autocomplete="off" />
              <button
                type="button"
                class="btn btn-outline-secondary"
                :disabled="!String(anlage.zeile.initiative || '').trim()"
                @click="anlage.zeile.initiative = ''">
                Leeren
              </button>
            </div>
          </section>
          <section class="htbah-entitaet-bereich">
            <h6 class="htbah-entitaet-bereich-titel">🗡️ Kampffunktion</h6>
            <div class="form-check mb-3"><input class="form-check-input" type="checkbox" v-model="anlage.zeile.istWaffe" id="wb-zg-waffe" /><label class="form-check-label" for="wb-zg-waffe">Waffe</label></div>
            <div class="row g-2 mb-1 align-items-end" v-if="anlage.zeile.istWaffe">
              <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.schadenswertNahkampf" placeholder=" " autocomplete="off" /><label>Schadenswert Nahkampf (z. B. 2W10+1)</label></div></div>
              <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.schadenswertFernkampf" placeholder=" " autocomplete="off" /><label>Schadenswert Fernkampf (z. B. 3W10)</label></div></div>
            </div>
          </section>
        </template>
        </div>

        <div v-if="zeigtMedienTab" class="mt-3 mb-3">
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
            <label class="form-label mb-0">Medien & Dateien</label>
            <label class="btn btn-sm btn-outline-secondary mb-0">
              Hochladen
              <input type="file" class="d-none" multiple @change="$emit('media-upload', $event)" />
            </label>
          </div>
          <div v-if="!(anlage.zeile.medien || []).length" class="text-secondary small">Noch keine Medien.</div>
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
        </div>

        <section v-if="zeigtInventarBereich && zeigtDatenTab" class="htbah-entitaet-bereich mt-3">
          <h6 class="htbah-entitaet-bereich-titel">🎒 Inventar</h6>
          <p class="small text-secondary mb-2">
            Gegenstände hier bearbeiten oder per Drag &amp; Drop auf der interaktiven Welt zuordnen.
          </p>
          <inventar-editor-panel
            v-if="anlage.zeile"
            :inventar="inventarListeModel"
            @remove="inventarEintragEntfernenEvent" />
        </section>

        <div v-if="zeigtDatenTab">
        <label class="form-label mt-3 mb-1" v-if="anlage.typ === 'npc'">Notizen</label>
        <label class="form-label mt-3 mb-1" v-else-if="anlage.typ === 'pantheon'">Notizen & Mythos</label>
        <label class="form-label mt-3 mb-1" v-else-if="anlage.typ === 'raetsel'">Notizen</label>
        <label class="form-label mt-3 mb-1" v-else-if="anlage.typ === 'bestie'">Lebensraum, Lebensweise und Legende</label>
        <label class="form-label mt-3 mb-1" v-else-if="anlage.typ === 'ort'">Beschreibung / Notizen</label>
        <label class="form-label mt-3 mb-1" v-else>Beschreibung</label>
        <div class="zufallstabellen-quill-wrap" :key="'wb-zeile-q-' + zeileQuillSession">
          <div :ref="zeileQuillHostRefFn" class="quill-editor-host zufallstabellen-quill-host entitaet-quill-editor-host"></div>
        </div>
        </div>
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
