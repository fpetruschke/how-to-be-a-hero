window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.AbenteuerbuchModal = {
  props: ['uiZustand'],
  data() {
    return {
      ...window.HTBAH_MODAL_FENSTER.erstelleBasisDaten(),
      quill: null,
      mentionController: null,
      quillTextChangeHandler: null,
      speichernTimer: null,
      fokusVorModal: null,
      aktiveKampagneIdLokal: '',
      aktiveKampagneName: '',
      abenteuerbuchLokal: null,
      aktiverReiterId: '',
      reiterZiehtIndex: null,
      reiterDropIndex: null,
      reiterZiehenAktiv: false,
      reiterPointerSort: null,
      _reiterSortMoveHandler: null,
      _reiterSortUpHandler: null,
      reiterLeisteUmbruch: false,
    };
  },
  computed: {
    fensterStil() {
      return window.HTBAH_MODAL_FENSTER.berechneFensterStil.call(this);
    },
    vollbildIcon() {
      return this.istVollbild ? 'close_fullscreen' : 'open_in_full';
    },
    vollbildLabel() {
      return this.istVollbild ? 'Vollbild beenden' : 'Vollbild';
    },
    titel() {
      return this.aktiveKampagneName
        ? `Abenteuerbuch — ${this.aktiveKampagneName}`
        : 'Abenteuerbuch';
    },
    reiterListe() {
      return this.abenteuerbuchLokal && Array.isArray(this.abenteuerbuchLokal.reiter)
        ? this.abenteuerbuchLokal.reiter
        : [];
    },
    aktiverReiter() {
      return (
        this.reiterListe.find((t) => t.id === this.aktiverReiterId) ||
        this.reiterListe[0] ||
        null
      );
    },
  },
  watch: {
    'uiZustand.abenteuerbuchOffen'(istOffen) {
      if (istOffen) {
        this.abenteuerbuchEinstellungenAktualisieren();
        this.aktualisiereAktiveKampagne();
        if (!this.aktiveKampagneIdLokal) {
          this.uiZustand.abenteuerbuchOffen = false;
          return;
        }
        this.fokusVorModal = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        this.$nextTick(() => this.wiederherstelleAbenteuerbuchAusSpeicher());
        return;
      }

      this.beendeZiehen();
      this.beendeResize();
      this.reiterSortAufraeumen();
      const S = window.HTBAH_MODAL_FENSTER && window.HTBAH_MODAL_FENSTER.speicher;
      if (S) {
        S.beimModalSchliessen(this, 'abenteuerbuch');
      } else {
        this.bereinigeMinimiertZustand('abenteuerbuch');
      }
      this.speichernFlushen();
      this.quillAufraeumen();
      this.abenteuerbuchLokal = null;
      this.aktiverReiterId = '';
      this.stelleFokusWiederHer();
    },
  },
  mounted() {
    window.addEventListener('resize', this.beiFensterGroesseGeaendert);
    window.addEventListener('pagehide', this.beiSeiteVerlassen);
    this._abenteuerbuchEinstellungenHandler = () => this.abenteuerbuchEinstellungenAktualisieren();
    window.addEventListener(
      'htbah:abenteuerbuch-einstellungen-geaendert',
      this._abenteuerbuchEinstellungenHandler,
    );
    this.abenteuerbuchEinstellungenAktualisieren();
    if (this.uiZustand.abenteuerbuchOffen) {
      this.aktualisiereAktiveKampagne();
      if (this.aktiveKampagneIdLokal) {
        this.$nextTick(() => this.wiederherstelleAbenteuerbuchAusSpeicher());
      }
    }
  },
  beforeUnmount() {
    this.beiSeiteVerlassen();
    this.quillAufraeumen();
    this.reiterSortAufraeumen();
    this.beendeZiehen();
    this.beendeResize();
    if (this.speichernTimer) {
      window.clearTimeout(this.speichernTimer);
    }
    window.removeEventListener('resize', this.beiFensterGroesseGeaendert);
    window.removeEventListener('pagehide', this.beiSeiteVerlassen);
    if (this._abenteuerbuchEinstellungenHandler) {
      window.removeEventListener(
        'htbah:abenteuerbuch-einstellungen-geaendert',
        this._abenteuerbuchEinstellungenHandler,
      );
      this._abenteuerbuchEinstellungenHandler = null;
    }
  },
  methods: {
    ...window.HTBAH_MODAL_FENSTER.methoden,
    abenteuerbuchEinstellungenAktualisieren() {
      const e =
        window.HTBAH && typeof window.HTBAH.ladeAbenteuerbuchEinstellungen === 'function'
          ? window.HTBAH.ladeAbenteuerbuchEinstellungen()
          : null;
      this.reiterLeisteUmbruch = e ? Boolean(e.reiterLeisteUmbruch) : false;
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
    oeffnen() {
      this.uiZustand.abenteuerbuchOffen = true;
    },
    wiederherstelleAbenteuerbuchAusSpeicher() {
      const S = window.HTBAH_MODAL_FENSTER && window.HTBAH_MODAL_FENSTER.speicher;
      if (S) {
        S.beimModalOeffnen('abenteuerbuch', this, {
          onWiederherstellen: () => {
            this.$nextTick(() => {
              if (!this.istVollbild) {
                this.stelleSichtbaresFensterSicher();
              }
              this.fokussiereFenster();
            });
          },
        });
        S.nachGeoeffnetAusSpeicher(this, this, {
          initialisierePosition: this.initialisierePosition,
          fokussiere: this.fokussiereFenster,
        });
      } else {
        this.bindModalSpeicher('abenteuerbuch');
        if (!this.istVollbild) {
          this.initialisierePosition();
        }
        if (!this.minimiert) {
          this.fokussiereFenster();
        }
      }
      this.abenteuerbuchLaden();
      this.editorInitialisieren();
    },
    schliessen() {
      this.speichernFlushen();
      this.beendeZiehen();
      this.beendeResize();
      this.reiterSortAufraeumen();
      const S = window.HTBAH_MODAL_FENSTER && window.HTBAH_MODAL_FENSTER.speicher;
      if (S) {
        S.beimModalSchliessen(this, 'abenteuerbuch');
      } else {
        this.bereinigeMinimiertZustand('abenteuerbuch');
      }
      this.uiZustand.abenteuerbuchOffen = false;
    },
    modalMinimieren() {
      const titel = this.titel ? String(this.titel) : 'Abenteuerbuch';
      this.minimieren({
        id: 'abenteuerbuch',
        titel,
        emoji: '📔',
        onWiederherstellen: () => {
          this.$nextTick(() => {
            this.stelleSichtbaresFensterSicher();
            this.fokussiereFenster();
          });
        },
      });
    },
    onFensterEscape() {
      this.schliessen();
    },
    beiSeiteVerlassen() {
      if (this.speichernTimer) {
        window.clearTimeout(this.speichernTimer);
        this.speichernTimer = null;
      }
      this.speichernFlushen();
    },
    quillAufraeumen() {
      const lifecycle = window.HTBAH_SHARED && window.HTBAH_SHARED.QuillLifecycle;
      if (lifecycle && typeof lifecycle.zerstoereQuillInstanz === 'function') {
        lifecycle.zerstoereQuillInstanz({
          quill: this.quill,
          hostElement: this.$refs.editorHost || null,
          mentionController: this.mentionController,
          handler: this.quillTextChangeHandler
            ? [{ event: 'text-change', fn: this.quillTextChangeHandler }]
            : [],
        });
      } else if (this.mentionController && typeof this.mentionController.destroy === 'function') {
        this.mentionController.destroy();
      }
      this.mentionController = null;
      this.quill = null;
      this.quillTextChangeHandler = null;
    },
    aktualisiereAktiveKampagne() {
      const zustand = window.HTBAH.ladeSpielleitungZustand();
      const id = typeof zustand.aktiveKampagneId === 'string' ? zustand.aktiveKampagneId : '';
      const kampagne = id
        ? (Array.isArray(zustand.kampagnen) ? zustand.kampagnen : []).find((k) => k && k.id === id)
        : null;
      this.aktiveKampagneIdLokal = kampagne ? kampagne.id : '';
      this.aktiveKampagneName = kampagne ? String(kampagne.name || '') : '';
    },
    abenteuerbuchLaden() {
      const geladen = this.aktiveKampagneIdLokal
        ? window.HTBAH.ladeKampagnenAbenteuerbuch(this.aktiveKampagneIdLokal)
        : null;
      const AB = window.HTBAH_SHARED;
      const norm =
        AB && typeof AB.normalisiereAbenteuerbuch === 'function'
          ? AB.normalisiereAbenteuerbuch(geladen)
          : geladen;
      const zuletztId = norm.aktiverReiterId || norm.zuletztGeoeffneterReiterId || '';
      this.abenteuerbuchLokal = {
        reiter: (norm.reiter || []).map((t) => ({ ...t })),
        aktiverReiterId: zuletztId,
        zuletztGeoeffneterReiterId: zuletztId,
      };
      this.aktiverReiterId = zuletztId;
    },
    syncQuillZuAktivemReiter() {
      if (!this.quill || !this.abenteuerbuchLokal || !this.aktiverReiter) {
        return;
      }
      this.aktiverReiter.html = this.quill.root.innerHTML;
    },
    ladeQuillVonAktivemReiter() {
      if (!this.quill || !this.aktiverReiter) {
        return;
      }
      this.quill.root.innerHTML = this.aktiverReiter.html || '';
    },
    reiterIstAktiv(reiterId) {
      return reiterId === this.aktiverReiterId;
    },
    reiterKannGeloeschtWerden() {
      return this.reiterListe.length > 1;
    },
    reiterTap(reiterId) {
      if (this.reiterZiehenAktiv) {
        return;
      }
      this.wechsleReiter(reiterId);
    },
    async wechsleReiter(reiterId) {
      if (!reiterId || reiterId === this.aktiverReiterId) {
        return;
      }
      this.syncQuillZuAktivemReiter();
      this.aktiverReiterId = reiterId;
      if (this.abenteuerbuchLokal) {
        this.abenteuerbuchLokal.aktiverReiterId = reiterId;
        this.abenteuerbuchLokal.zuletztGeoeffneterReiterId = reiterId;
      }
      this.ladeQuillVonAktivemReiter();
      this.speichernFlushen();
    },
    reiterSortAufraeumen() {
      if (this._reiterSortMoveHandler) {
        document.removeEventListener('pointermove', this._reiterSortMoveHandler);
        this._reiterSortMoveHandler = null;
      }
      if (this._reiterSortUpHandler) {
        document.removeEventListener('pointerup', this._reiterSortUpHandler);
        document.removeEventListener('pointercancel', this._reiterSortUpHandler);
        this._reiterSortUpHandler = null;
      }
      this.reiterPointerSort = null;
      this.reiterZiehtIndex = null;
      this.reiterDropIndex = null;
      this.reiterZiehenAktiv = false;
    },
    reiterKannSortiertWerden() {
      return this.reiterListe.length > 1;
    },
    reiterVerschieben(vonIndex, nachIndex) {
      if (!this.abenteuerbuchLokal || !Array.isArray(this.abenteuerbuchLokal.reiter)) {
        return;
      }
      const liste = this.abenteuerbuchLokal.reiter;
      if (
        vonIndex === nachIndex ||
        vonIndex < 0 ||
        nachIndex < 0 ||
        vonIndex >= liste.length ||
        nachIndex >= liste.length
      ) {
        return;
      }
      this.syncQuillZuAktivemReiter();
      const [eintrag] = liste.splice(vonIndex, 1);
      liste.splice(nachIndex, 0, eintrag);
      this.speichernFlushen();
    },
    reiterDragStart(event, index) {
      if (!this.reiterKannSortiertWerden()) {
        return;
      }
      this.reiterZiehtIndex = index;
      this.reiterZiehenAktiv = false;
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(index));
      }
    },
    reiterDragEnd() {
      this.reiterZiehtIndex = null;
      this.reiterDropIndex = null;
      window.setTimeout(() => {
        this.reiterZiehenAktiv = false;
      }, 0);
    },
    reiterDragOver(event, index) {
      if (!this.reiterKannSortiertWerden()) {
        return;
      }
      event.preventDefault();
      if (this.reiterZiehtIndex === null || this.reiterZiehtIndex === index) {
        return;
      }
      this.reiterZiehenAktiv = true;
      this.reiterDropIndex = index;
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
    },
    reiterDragLeave(index) {
      if (this.reiterDropIndex === index) {
        this.reiterDropIndex = null;
      }
    },
    reiterDrop(event, index) {
      event.preventDefault();
      const von = this.reiterZiehtIndex;
      if (von !== null && von !== index) {
        this.reiterVerschieben(von, index);
      }
      this.reiterDragEnd();
    },
    reiterGriffPointerDown(event, index) {
      if (!this.reiterKannSortiertWerden()) {
        return;
      }
      if (event.button != null && event.button !== 0) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      this.reiterSortAufraeumen();
      this.reiterPointerSort = {
        vonIndex: index,
        pointerId: event.pointerId,
        hatBewegt: false,
        captureEl: event.currentTarget,
      };
      this.reiterZiehtIndex = index;
      this._reiterSortMoveHandler = (ev) => this.reiterGriffPointerMove(ev);
      this._reiterSortUpHandler = () => this.reiterGriffPointerUp();
      document.addEventListener('pointermove', this._reiterSortMoveHandler, { passive: false });
      document.addEventListener('pointerup', this._reiterSortUpHandler);
      document.addEventListener('pointercancel', this._reiterSortUpHandler);
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* optional */
      }
    },
    reiterGriffPointerMove(event) {
      const sort = this.reiterPointerSort;
      if (!sort) {
        return;
      }
      event.preventDefault();
      sort.hatBewegt = true;
      this.reiterZiehenAktiv = true;
      const ziel = document.elementFromPoint(event.clientX, event.clientY);
      const reiterEl = ziel && ziel.closest ? ziel.closest('[data-ab-reiter-index]') : null;
      if (!reiterEl) {
        return;
      }
      const idx = Number(reiterEl.getAttribute('data-ab-reiter-index'));
      if (!Number.isNaN(idx)) {
        this.reiterDropIndex = idx;
      }
    },
    reiterGriffPointerUp() {
      const sort = this.reiterPointerSort;
      if (
        sort &&
        sort.hatBewegt &&
        this.reiterDropIndex !== null &&
        sort.vonIndex !== this.reiterDropIndex
      ) {
        this.reiterVerschieben(sort.vonIndex, this.reiterDropIndex);
      }
      if (sort && sort.captureEl && sort.pointerId != null) {
        try {
          sort.captureEl.releasePointerCapture(sort.pointerId);
        } catch {
          /* optional */
        }
      }
      this.reiterSortAufraeumen();
      window.setTimeout(() => {
        this.reiterZiehenAktiv = false;
      }, 0);
    },
    reiterNameInput(reiter, event) {
      if (!reiter || !event || !event.target) {
        return;
      }
      reiter.name = String(event.target.value || '').slice(0, 80);
      this.speichernDebounced();
    },
    reiterNameBlur(reiter, event) {
      if (!reiter) {
        return;
      }
      const roh = event && event.target ? String(event.target.value || '').trim() : String(reiter.name || '').trim();
      const fallback =
        (window.HTBAH_SHARED && window.HTBAH_SHARED.ABENTEUERBUCH_DEFAULT_REITER_NAME) || 'Übersicht';
      reiter.name = roh || fallback;
      if (event && event.target) {
        event.target.value = reiter.name;
      }
      this.speichernDebounced();
    },
    reiterHinzufuegen() {
      const AB = window.HTBAH_SHARED;
      if (!this.abenteuerbuchLokal || !AB) {
        return;
      }
      this.syncQuillZuAktivemReiter();
      const id =
        typeof AB.neueAbenteuerbuchReiterId === 'function'
          ? AB.neueAbenteuerbuchReiterId()
          : `ab-${Date.now()}`;
      const name =
        typeof AB.naechsterAbenteuerbuchReiterName === 'function'
          ? AB.naechsterAbenteuerbuchReiterName(this.reiterListe)
          : 'Reiter';
      this.abenteuerbuchLokal.reiter.push({ id, name, html: '' });
      this.aktiverReiterId = id;
      this.abenteuerbuchLokal.aktiverReiterId = id;
      this.abenteuerbuchLokal.zuletztGeoeffneterReiterId = id;
      this.ladeQuillVonAktivemReiter();
      this.speichernFlushen();
      this.$nextTick(() => {
        const input = this.$refs[`reiterName-${id}`];
        const el = Array.isArray(input) ? input[0] : input;
        if (el && typeof el.focus === 'function') {
          el.focus();
          if (typeof el.select === 'function') {
            el.select();
          }
        }
      });
    },
    async reiterLoeschenAnfragen(reiter, index) {
      if (!reiter || !this.reiterKannGeloeschtWerden()) {
        return;
      }
      const name = String(reiter.name || 'Reiter').trim() || 'Reiter';
      const ok = await window.HTBAH.ui.confirm({
        titel: 'Reiter löschen',
        beschreibung: `Reiter „${name}" und seinen Inhalt endgültig löschen?`,
        bestaetigenText: 'Löschen',
        bestaetigenButtonClass: 'btn-danger',
        warnhinweisAnzeigen: true,
      });
      if (!ok) {
        return;
      }
      this.syncQuillZuAktivemReiter();
      const warAktiv = reiter.id === this.aktiverReiterId;
      this.abenteuerbuchLokal.reiter.splice(index, 1);
      if (warAktiv) {
        const ersatz =
          this.reiterListe[index] ||
          this.reiterListe[index - 1] ||
          this.reiterListe[0];
        this.aktiverReiterId = ersatz ? ersatz.id : '';
        this.abenteuerbuchLokal.aktiverReiterId = this.aktiverReiterId;
        this.abenteuerbuchLokal.zuletztGeoeffneterReiterId = this.aktiverReiterId;
        this.ladeQuillVonAktivemReiter();
      }
      this.speichernFlushen();
    },
    editorInitialisieren() {
      if (!window.Quill || !this.$refs.editorHost) {
        return;
      }

      if (!this.quill) {
        this.quill = new window.Quill(this.$refs.editorHost, {
          theme: 'snow',
          placeholder:
            'Szenen, Pläne, NPCs, Timing … während des Abenteuers oder für Vorbereitung und Auswertung.',
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
        if (!this.quillTextChangeHandler) {
          this.quillTextChangeHandler = () => {
            this.speichernDebounced();
          };
        }
        this.quill.on('text-change', this.quillTextChangeHandler);
        const mentionApi = window.HTBAH_SHARED && window.HTBAH_SHARED.QuillEntityMentions;
        if (mentionApi && typeof mentionApi.installMentions === 'function') {
          this.mentionController = mentionApi.installMentions(this.quill, {
            getItems: (query) => mentionApi.collectMentionItems(query),
            onEntityClick: (target) => mentionApi.oeffneEntitaetGlobal(target),
          });
        }
      }

      this.ladeQuillVonAktivemReiter();
    },
    speichernDebounced() {
      if (this.speichernTimer) {
        window.clearTimeout(this.speichernTimer);
      }
      this.speichernTimer = window.setTimeout(() => {
        this.speichernFlushen();
        this.speichernTimer = null;
      }, 450);
    },
    speichernFlushen() {
      if (!this.aktiveKampagneIdLokal || !this.abenteuerbuchLokal) {
        return;
      }
      this.syncQuillZuAktivemReiter();
      const zuletztId = this.aktiverReiterId;
      const payload = {
        reiter: this.abenteuerbuchLokal.reiter.map((t) => ({
          id: t.id,
          name: t.name,
          html: t.html,
        })),
        aktiverReiterId: zuletztId,
        zuletztGeoeffneterReiterId: zuletztId,
      };
      window.HTBAH.speichereKampagnenAbenteuerbuch(this.aktiveKampagneIdLokal, payload);
    },
  },
  template: `
    <div v-if="uiZustand.abenteuerbuchOffen" class="regelwerk-modal-layer">
      <div
        v-show="!minimiert"
        ref="fensterElement"
        class="regelwerk-modal-window card shadow abenteuerbuch-modal-window"
        :class="{ 'regelwerk-modal-window-fullscreen': istVollbild }"
        :style="fensterStil"
        role="dialog"
        aria-modal="true"
        aria-label="Abenteuerbuch"
        tabindex="-1"
        @keydown.esc.stop.prevent="onFensterEscape">
        <div
          class="regelwerk-modal-header d-flex justify-content-between align-items-center p-3 flex-shrink-0"
          @pointerdown="starteZiehen">
          <h4 class="mb-0">📔 {{ titel }}</h4>
          <div class="d-flex gap-2 align-items-center">
            <button
              type="button"
              class="regelwerk-icon-button"
              :title="vollbildLabel"
              :aria-label="vollbildLabel"
              @click="vollbildUmschalten">
              <span class="material-symbols-outlined">{{ vollbildIcon }}</span>
            </button>
            <button
              type="button"
              class="regelwerk-icon-button"
              title="Minimieren"
              aria-label="Minimieren"
              @click="modalMinimieren">
              <span class="material-symbols-outlined">minimize</span>
            </button>
            <button type="button" class="btn-close" aria-label="Schließen" @click="schliessen"></button>
          </div>
        </div>
        <div
          class="abenteuerbuch-reiter-leiste"
          :class="{ 'abenteuerbuch-reiter-leiste--umbruch': reiterLeisteUmbruch }"
          role="tablist"
          aria-label="Abenteuerbuch Reiter">
          <div
            v-for="(reiter, index) in reiterListe"
            :key="reiter.id"
            class="abenteuerbuch-reiter"
            :class="{
              'abenteuerbuch-reiter--aktiv': reiterIstAktiv(reiter.id),
              'abenteuerbuch-reiter--zieht': reiterZiehtIndex === index,
              'abenteuerbuch-reiter--drop-ziel': reiterDropIndex === index,
            }"
            :data-ab-reiter-index="index"
            @dragover="reiterDragOver($event, index)"
            @dragleave="reiterDragLeave(index)"
            @drop="reiterDrop($event, index)">
            <span
              v-if="reiterKannSortiertWerden()"
              class="abenteuerbuch-reiter-griff"
              draggable="true"
              title="Reihenfolge ändern"
              aria-label="Reihenfolge ändern"
              @dragstart.stop="reiterDragStart($event, index)"
              @dragend.stop="reiterDragEnd"
              @pointerdown.stop="reiterGriffPointerDown($event, index)"
              @click.stop>⠿</span>
            <button
              type="button"
              class="abenteuerbuch-reiter-tap"
              role="tab"
              :aria-selected="reiterIstAktiv(reiter.id) ? 'true' : 'false'"
              :tabindex="reiterIstAktiv(reiter.id) ? 0 : -1"
              @click="reiterTap(reiter.id)">
              <input
                v-if="reiterIstAktiv(reiter.id)"
                :ref="'reiterName-' + reiter.id"
                type="text"
                class="abenteuerbuch-reiter-name-input"
                :value="reiter.name"
                maxlength="80"
                autocomplete="off"
                spellcheck="false"
                :aria-label="'Reitername: ' + reiter.name"
                @click.stop
                @input="reiterNameInput(reiter, $event)"
                @blur="reiterNameBlur(reiter, $event)"
                @keydown.enter.prevent="$event.target.blur()" />
              <span v-else class="abenteuerbuch-reiter-name-text text-truncate">{{ reiter.name }}</span>
            </button>
            <button
              v-if="reiterKannGeloeschtWerden()"
              type="button"
              class="abenteuerbuch-reiter-loeschen"
              title="Reiter löschen"
              aria-label="Reiter löschen"
              @click.stop="reiterLoeschenAnfragen(reiter, index)">
              <span class="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          </div>
          <button
            type="button"
            class="abenteuerbuch-reiter-hinzufuegen"
            title="Reiter hinzufügen"
            aria-label="Reiter hinzufügen"
            @click="reiterHinzufuegen">
            <span class="material-symbols-outlined" aria-hidden="true">add</span>
          </button>
        </div>
        <div class="abenteuerbuch-modal-editor-wrap">
          <div ref="editorHost" class="quill-editor-host abenteuerbuch-quill-host"></div>
        </div>
        <div class="abenteuerbuch-modal-footer d-flex justify-content-end px-3 py-2 border-top flex-shrink-0">
          <button type="button" class="btn btn-sm btn-primary" @click="schliessen">Schließen</button>
        </div>
        <div
          v-if="!istVollbild"
          class="regelwerk-modal-resize-handle"
          role="presentation"
          aria-hidden="true"
          @pointerdown="starteResize"></div>
      </div>
    </div>
  `,
};
