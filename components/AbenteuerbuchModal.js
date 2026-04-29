window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.AbenteuerbuchModal = {
  props: ['uiZustand'],
  data() {
    return {
      ...window.HTBAH_MODAL_FENSTER.erstelleBasisDaten(),
      quill: null,
      mentionController: null,
      speichernTimer: null,
      fokusVorModal: null,
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
  },
  watch: {
    'uiZustand.abenteuerbuchOffen'(istOffen) {
      if (istOffen) {
        this.fokusVorModal = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        this.$nextTick(() => {
          this.initialisierePosition();
          this.editorInitialisieren();
          this.fokussiereFenster();
        });
        return;
      }

      this.beendeZiehen();
      this.beendeResize();
      this.istVollbild = false;
      this.speichernFlushen();
      if (this.mentionController && typeof this.mentionController.destroy === 'function') {
        this.mentionController.destroy();
      }
      this.mentionController = null;
      this.quill = null;
      this.stelleFokusWiederHer();
    },
  },
  mounted() {
    window.addEventListener('resize', this.beiFensterGroesseGeaendert);
    window.addEventListener('pagehide', this.beiSeiteVerlassen);
  },
  beforeUnmount() {
    this.beiSeiteVerlassen();
    if (this.mentionController && typeof this.mentionController.destroy === 'function') {
      this.mentionController.destroy();
    }
    this.mentionController = null;
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
    editorInitialisieren() {
      if (!window.Quill || !this.$refs.editorHost) {
        return;
      }

      const html = window.HTBAH.ladeSpielleitungAbenteuerbuchHtml() || '';

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
        this.quill.on('text-change', () => {
          this.speichernDebounced();
        });
        const mentionApi = window.HTBAH_SHARED && window.HTBAH_SHARED.QuillEntityMentions;
        if (mentionApi && typeof mentionApi.installMentions === 'function') {
          this.mentionController = mentionApi.installMentions(this.quill, {
            getItems: (query) => mentionApi.collectMentionItems(query),
            onEntityClick: (target) => mentionApi.oeffneEntitaetGlobal(target),
          });
        }
      }

      this.quill.root.innerHTML = html;
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
      if (this.quill) {
        window.HTBAH.speichereSpielleitungAbenteuerbuchHtml(this.quill.root.innerHTML);
      }
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
          <h4 class="mb-0">📔 Abenteuerbuch</h4>
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
        <div class="abenteuerbuch-modal-editor-wrap">
          <div ref="editorHost" class="quill-editor-host abenteuerbuch-quill-host"></div>
        </div>
        <div
          class="abenteuerbuch-modal-footer d-flex align-items-center justify-content-between px-3 py-2 border-top flex-shrink-0">
          <small class="text-muted mb-0">Wird automatisch im Browser gespeichert.</small>
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
