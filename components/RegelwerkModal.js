window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.RegelwerkModal = {
  props: ['uiZustand'],
  data() {
    return {
      ...window.HTBAH_MODAL_FENSTER.erstelleBasisDaten(),
    };
  },
  computed: {
    viewerUrl() {
      const regelwerkUrl = window.HTBAH.ermittleRegelwerkQuelleUrl();
      const viewerBasisUrl = window.HTBAH.ermittleAssetUrl('assets/pdfjs/web/viewer.html');
      return `${viewerBasisUrl}?file=${encodeURIComponent(regelwerkUrl)}#zoom=page-width&pagemode=thumbs`;
    },
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
    'uiZustand.regelwerkOffen'(istOffen) {
      if (istOffen) {
        this.$nextTick(this.initialisierePosition);
        return;
      }

      this.beendeZiehen();
      this.beendeResize();
      this.istVollbild = false;
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
    schliessen() {
      this.beendeZiehen();
      this.beendeResize();
      this.istVollbild = false;
      this.uiZustand.regelwerkOffen = false;
    },
  },
  template: `
    <div v-if="uiZustand.regelwerkOffen" class="regelwerk-modal-layer">
      <div
        ref="fensterElement"
        class="regelwerk-modal-window card shadow"
        :class="{ 'regelwerk-modal-window-fullscreen': istVollbild }"
        :style="fensterStil">
        <div class="regelwerk-modal-header d-flex justify-content-between align-items-center p-3" @pointerdown="starteZiehen">
          <h4 class="mb-0">📜 Regelwerk</h4>
          <div class="d-flex gap-2 align-items-center">
            <span class="d-flex align-items-center">
              <small class="text-muted">Wiki:</small>
              <a
                href="https://howtobeahero.de"
                target="_blank"
                rel="noopener noreferrer"
                class="regelwerk-icon-button"
                title="Wiki öffnen"
                aria-label="Wiki öffnen">
                <span class="material-symbols-outlined">open_in_new</span>
              </a>
            </span>
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
        <iframe :src="viewerUrl" class="regelwerk-modal-content"></iframe>
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
