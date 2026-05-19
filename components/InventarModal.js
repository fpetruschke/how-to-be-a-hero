window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.InventarModal = {
  components: {
    InventarEditorPanel: window.HTBAH_KOMPONENTEN.InventarEditorPanel,
  },
  props: {
    charakter: { type: Object, required: true },
  },
  data() {
    return {
      offen: false,
      ...window.HTBAH_MODAL_FENSTER.erstelleBasisDaten(),
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
  mounted() {
    window.addEventListener('resize', this.beiFensterGroesseGeaendert);
  },
  beforeUnmount() {
    this.beendeZiehen();
    this.beendeResize();
    window.removeEventListener('resize', this.beiFensterGroesseGeaendert);
  },
  methods: {
    ...window.HTBAH_MODAL_FENSTER.methoden,
    begrenzeFensterGroesse(breite, hoehe) {
      return window.HTBAH_MODAL_FENSTER.utils.begrenzeGroesse(breite, hoehe, 480, 320);
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
    inventarModalGeschlossen() {
      const panel = this.$refs.inventarPanel;
      if (panel && panel.inventarEditId && typeof panel.inventarSpeichernZeile === 'function') {
        panel.inventarSpeichernZeile();
      }
    },
    schliessen() {
      this.inventarModalGeschlossen();
      this.beendeZiehen();
      this.beendeResize();
      this.istVollbild = false;
      this.offen = false;
      this.stelleFokusWiederHer();
    },
    oeffnen() {
      this.fokusVorModal = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this.offen = true;
      this.$nextTick(() => {
        this.initialisierePosition();
        this.fokussiereFenster();
      });
    },
    onFensterEscape() {
      this.schliessen();
    },
  },
  template: `
    <div v-if="offen" class="regelwerk-modal-layer">
      <div
        ref="fensterElement"
        class="regelwerk-modal-window card shadow htbah-inventar-modal-window"
        :class="{ 'regelwerk-modal-window-fullscreen': istVollbild }"
        :style="fensterStil"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inventarEditorLabel"
        tabindex="-1"
        @keydown.esc.stop.prevent="onFensterEscape">
        <div
          class="regelwerk-modal-header d-flex justify-content-between align-items-center px-3 py-2 border-bottom flex-shrink-0"
          @pointerdown="starteZiehen">
          <h5 class="modal-title mb-0" id="inventarEditorLabel">Inventar</h5>
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
        <div class="htbah-inventar-modal-body inventar-modal-body p-3">
          <inventar-editor-panel
            v-if="charakter"
            ref="inventarPanel"
            :inventar="charakter.inventar" />
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
