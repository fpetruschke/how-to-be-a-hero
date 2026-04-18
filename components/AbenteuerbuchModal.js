window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.AbenteuerbuchModal = {
  props: ['uiZustand'],
  data() {
    return {
      istVollbild: false,
      positionX: null,
      positionY: null,
      ziehenAktiv: false,
      ziehOffsetX: 0,
      ziehOffsetY: 0,
      quill: null,
      speichernTimer: null,
    };
  },
  computed: {
    fensterStil() {
      if (this.istVollbild || this.positionX === null || this.positionY === null) {
        return {};
      }

      return {
        left: `${this.positionX}px`,
        top: `${this.positionY}px`,
      };
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
        this.$nextTick(() => {
          this.initialisierePosition();
          this.editorInitialisieren();
        });
        return;
      }

      this.beendeZiehen();
      this.istVollbild = false;
      this.speichernFlushen();
      this.quill = null;
    },
  },
  mounted() {
    window.addEventListener('resize', this.beiFensterGroesseGeaendert);
    window.addEventListener('pagehide', this.beiSeiteVerlassen);
  },
  beforeUnmount() {
    this.beiSeiteVerlassen();
    this.beendeZiehen();
    if (this.speichernTimer) {
      window.clearTimeout(this.speichernTimer);
    }
    window.removeEventListener('resize', this.beiFensterGroesseGeaendert);
    window.removeEventListener('pagehide', this.beiSeiteVerlassen);
  },
  methods: {
    oeffnen() {
      this.uiZustand.abenteuerbuchOffen = true;
    },
    schliessen() {
      this.speichernFlushen();
      this.beendeZiehen();
      this.istVollbild = false;
      this.uiZustand.abenteuerbuchOffen = false;
    },
    initialisierePosition() {
      const fenster = this.$refs.fensterElement;
      if (!fenster || this.positionX !== null || this.positionY !== null) {
        this.stelleSichtbaresFensterSicher();
        return;
      }

      const startX = window.innerWidth * 0.05;
      const startY = window.innerHeight * 0.05;
      const maxX = Math.max(0, window.innerWidth - fenster.offsetWidth);
      const maxY = Math.max(0, window.innerHeight - fenster.offsetHeight);
      this.positionX = Math.min(startX, maxX);
      this.positionY = Math.min(startY, maxY);
    },
    starteZiehen(event) {
      if (this.istVollbild || event.target.closest('button, a')) {
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
      this.ziehenAktiv = true;
      this.ziehOffsetX = event.clientX - rechteck.left;
      this.ziehOffsetY = event.clientY - rechteck.top;

      window.addEventListener('pointermove', this.beimZiehen);
      window.addEventListener('pointerup', this.beendeZiehen);
      window.addEventListener('pointercancel', this.beendeZiehen);
      event.preventDefault();
    },
    beimZiehen(event) {
      if (!this.ziehenAktiv || this.istVollbild) {
        return;
      }

      const fenster = this.$refs.fensterElement;
      if (!fenster) {
        return;
      }

      const maxX = Math.max(0, window.innerWidth - fenster.offsetWidth);
      const maxY = Math.max(0, window.innerHeight - fenster.offsetHeight);
      const neueXPosition = event.clientX - this.ziehOffsetX;
      const neueYPosition = event.clientY - this.ziehOffsetY;
      this.positionX = Math.min(Math.max(0, neueXPosition), maxX);
      this.positionY = Math.min(Math.max(0, neueYPosition), maxY);
    },
    beendeZiehen() {
      this.ziehenAktiv = false;
      window.removeEventListener('pointermove', this.beimZiehen);
      window.removeEventListener('pointerup', this.beendeZiehen);
      window.removeEventListener('pointercancel', this.beendeZiehen);
    },
    vollbildUmschalten() {
      this.istVollbild = !this.istVollbild;
      if (!this.istVollbild) {
        this.$nextTick(this.stelleSichtbaresFensterSicher);
      }
    },
    stelleSichtbaresFensterSicher() {
      if (this.istVollbild) {
        return;
      }

      const fenster = this.$refs.fensterElement;
      if (!fenster || this.positionX === null || this.positionY === null) {
        return;
      }

      const maxX = Math.max(0, window.innerWidth - fenster.offsetWidth);
      const maxY = Math.max(0, window.innerHeight - fenster.offsetHeight);
      this.positionX = Math.min(Math.max(0, this.positionX), maxX);
      this.positionY = Math.min(Math.max(0, this.positionY), maxY);
    },
    beiFensterGroesseGeaendert() {
      this.$nextTick(this.stelleSichtbaresFensterSicher);
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
    <teleport to="body">
      <button
        v-show="!uiZustand.abenteuerbuchOffen"
        type="button"
        class="htbah-abenteuerbuch-fab"
        title="Abenteuerbuch (Spielleitung)"
        aria-label="Abenteuerbuch öffnen"
        @click="oeffnen">
        <span class="htbah-abenteuerbuch-fab-emoji" aria-hidden="true">📝</span>
      </button>
    </teleport>

    <div v-if="uiZustand.abenteuerbuchOffen" class="regelwerk-modal-layer">
      <div
        ref="fensterElement"
        class="regelwerk-modal-window card shadow abenteuerbuch-modal-window"
        :class="{ 'regelwerk-modal-window-fullscreen': istVollbild }"
        :style="fensterStil">
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
      </div>
    </div>
  `,
};
