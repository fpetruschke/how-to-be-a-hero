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
        this.aktualisiereAktiveKampagne();
        if (!this.aktiveKampagneIdLokal) {
          this.uiZustand.abenteuerbuchOffen = false;
          return;
        }
        this.fokusVorModal = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        this.$nextTick(() => {
          this.initialisierePosition();
          this.abenteuerbuchLaden();
          this.editorInitialisieren();
          this.fokussiereFenster();
        });
        return;
      }

      this.beendeZiehen();
      this.beendeResize();
      this.istVollbild = false;
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
  },
  beforeUnmount() {
    this.beiSeiteVerlassen();
    this.quillAufraeumen();
    this.beendeZiehen();
    this.beendeResize();
    if (this.speichernTimer) {
      window.clearTimeout(this.speichernTimer);
    }
    window.removeEventListener('resize', this.beiFensterGroesseGeaendert);
    window.removeEventListener('pagehide', this.beiSeiteVerlassen);
  },
  methods: {
    ...window.HTBAH_MODAL_FENSTER.methoden,
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
    schliessen() {
      this.speichernFlushen();
      this.beendeZiehen();
      this.beendeResize();
      this.istVollbild = false;
      this.uiZustand.abenteuerbuchOffen = false;
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
      const zustand = window.HTBAH.ladeSpielleiterZustand();
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
      this.abenteuerbuchLokal = {
        reiter: (norm.reiter || []).map((t) => ({ ...t })),
        aktiverReiterId: norm.aktiverReiterId,
      };
      this.aktiverReiterId = norm.aktiverReiterId;
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
    async wechsleReiter(reiterId) {
      if (!reiterId || reiterId === this.aktiverReiterId) {
        return;
      }
      this.syncQuillZuAktivemReiter();
      this.aktiverReiterId = reiterId;
      if (this.abenteuerbuchLokal) {
        this.abenteuerbuchLokal.aktiverReiterId = reiterId;
      }
      this.ladeQuillVonAktivemReiter();
      this.speichernDebounced();
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
      this.ladeQuillVonAktivemReiter();
      this.speichernDebounced();
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
      const payload = {
        reiter: this.abenteuerbuchLokal.reiter.map((t) => ({
          id: t.id,
          name: t.name,
          html: t.html,
        })),
        aktiverReiterId: this.aktiverReiterId,
      };
      window.HTBAH.speichereKampagnenAbenteuerbuch(this.aktiveKampagneIdLokal, payload);
    },
  },
  template: `
    <div v-if="uiZustand.abenteuerbuchOffen" class="regelwerk-modal-layer">
      <div
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
            <button type="button" class="btn-close" aria-label="Schließen" @click="schliessen"></button>
          </div>
        </div>
        <div class="abenteuerbuch-reiter-leiste" role="tablist" aria-label="Abenteuerbuch Reiter">
          <div
            v-for="(reiter, index) in reiterListe"
            :key="reiter.id"
            class="abenteuerbuch-reiter"
            :class="{ 'abenteuerbuch-reiter--aktiv': reiterIstAktiv(reiter.id) }">
            <button
              type="button"
              class="abenteuerbuch-reiter-tap"
              role="tab"
              :aria-selected="reiterIstAktiv(reiter.id) ? 'true' : 'false'"
              :tabindex="reiterIstAktiv(reiter.id) ? 0 : -1"
              @click="wechsleReiter(reiter.id)">
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
