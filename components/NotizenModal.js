window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.NotizenModal = {
  props: {
    journalHtml: { type: String, default: '' },
  },
  emits: ['update:journalHtml'],
  data() {
    return {
      offen: false,
      ...window.HTBAH_MODAL_FENSTER.erstelleBasisDaten(),
      fokusVorModal: null,
      notizenQuill: null,
      mentionController: null,
      quillTextChangeHandler: null,
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
  mounted() {
    window.addEventListener('resize', this.beiFensterGroesseGeaendert);
  },
  beforeUnmount() {
    this.beendeZiehen();
    this.beendeResize();
    window.removeEventListener('resize', this.beiFensterGroesseGeaendert);
    this.quillAufraeumen();
  },
  methods: {
    ...window.HTBAH_MODAL_FENSTER.methoden,
    begrenzeFensterGroesse(breite, hoehe) {
      return window.HTBAH_MODAL_FENSTER.utils.begrenzeGroesse(breite, hoehe, 420, 320);
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
    quillAufraeumen() {
      const lifecycle = window.HTBAH_SHARED && window.HTBAH_SHARED.QuillLifecycle;
      if (lifecycle && typeof lifecycle.zerstoereQuillInstanz === 'function') {
        lifecycle.zerstoereQuillInstanz({
          quill: this.notizenQuill,
          hostElement: this.$refs.notizenEditorElement || null,
          mentionController: this.mentionController,
          handler: this.quillTextChangeHandler
            ? [{ event: 'text-change', fn: this.quillTextChangeHandler }]
            : [],
        });
      } else if (this.mentionController && typeof this.mentionController.destroy === 'function') {
        this.mentionController.destroy();
      }
      this.mentionController = null;
      this.notizenQuill = null;
      this.quillTextChangeHandler = null;
    },
    syncInhaltZuParent() {
      if (this.notizenQuill) {
        this.$emit('update:journalHtml', this.notizenQuill.root.innerHTML);
      }
    },
    notizenEditorInitialisieren() {
      if (!window.Quill || !this.$refs.notizenEditorElement) {
        return;
      }

      if (!this.notizenQuill) {
        this.notizenQuill = new window.Quill(this.$refs.notizenEditorElement, {
          theme: 'snow',
          placeholder: 'Halte Ereignisse und Gedanken fest...',
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
        this.quillTextChangeHandler = () => {
          this.syncInhaltZuParent();
        };
        this.notizenQuill.on('text-change', this.quillTextChangeHandler);
        const mentionApi = window.HTBAH_SHARED && window.HTBAH_SHARED.QuillEntityMentions;
        if (mentionApi && typeof mentionApi.installMentions === 'function') {
          this.mentionController = mentionApi.installMentions(this.notizenQuill, {
            getItems: (query) => mentionApi.collectMentionItems(query),
            onEntityClick: (target) => mentionApi.oeffneEntitaetGlobal(target),
          });
        }
      }

      this.notizenQuill.root.innerHTML = this.journalHtml || '';
    },
    schliessen() {
      this.syncInhaltZuParent();
      this.beendeZiehen();
      this.beendeResize();
      this.istVollbild = false;
      const S = window.HTBAH_MODAL_FENSTER && window.HTBAH_MODAL_FENSTER.speicher;
      if (S) {
        S.beimModalSchliessen(this, 'notizen');
      } else {
        this.bereinigeMinimiertZustand('notizen');
      }
      this.offen = false;
      this.stelleFokusWiederHer();
    },
    modalMinimieren() {
      this.syncInhaltZuParent();
      this.minimieren({
        id: 'notizen',
        titel: 'Notizen',
        emoji: '📝',
        onSchliessen: () => this.schliessen(),
        onWiederherstellen: () => {
          this.$nextTick(() => {
            this.stelleSichtbaresFensterSicher();
            this.fokussiereFenster();
          });
        },
      });
    },
    oeffnen() {
      this.fokusVorModal = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this.offen = true;
      this.$nextTick(() => {
        const S = window.HTBAH_MODAL_FENSTER && window.HTBAH_MODAL_FENSTER.speicher;
        if (S) {
          S.beimModalOeffnen('notizen', this, {
            fensterOpts: { minBreite: 420, minHoehe: 320 },
            onSchliessen: () => this.schliessen(),
            onWiederherstellen: () => {
              this.$nextTick(() => {
                this.stelleSichtbaresFensterSicher();
                this.notizenEditorInitialisieren();
                this.fokussiereFenster();
              });
            },
          });
        } else {
          this.bindModalSpeicher('notizen');
        }
        this.initialisierePosition();
        this.notizenEditorInitialisieren();
        if (!this.minimiert) {
          this.fokussiereFenster();
        }
      });
    },
    onFensterEscape() {
      this.schliessen();
    },
  },
  template: `
    <div v-if="offen" class="regelwerk-modal-layer">
      <div
        v-show="!minimiert"
        ref="fensterElement"
        class="regelwerk-modal-window card shadow-lg htbah-notizen-modal-window"
        :class="{ 'regelwerk-modal-window-fullscreen': istVollbild }"
        :style="fensterStil"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notizenEditorLabel"
        tabindex="-1"
        @keydown.esc.stop.prevent="onFensterEscape">
        <div
          class="regelwerk-modal-header d-flex justify-content-between align-items-center px-3 py-2 border-bottom flex-shrink-0"
          @pointerdown="starteZiehen">
          <h5 class="modal-title mb-0" id="notizenEditorLabel">Notizen</h5>
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
        <div class="htbah-notizen-modal-body p-3">
          <div
            ref="notizenEditorElement"
            class="htbah-notizen-quill-host quill-editor-host"></div>
        </div>
        <div class="border-top px-3 py-2 d-flex justify-content-end flex-shrink-0">
          <button type="button" class="btn btn-secondary" @click="schliessen">
            Schließen
          </button>
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
