window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.RegelwerkModal = {
  props: ['uiZustand'],
  data() {
    return {
      istVollbild: false,
      positionX: null,
      positionY: null,
      ziehenAktiv: false,
      ziehOffsetX: 0,
      ziehOffsetY: 0,
    };
  },
  computed: {
    viewerUrl() {
      const regelwerkUrl = window.HTBAH.ermittleRegelwerkQuelleUrl();
      const viewerBasisUrl = window.HTBAH.ermittleAssetUrl('assets/pdfjs/web/viewer.html');
      return `${viewerBasisUrl}?file=${encodeURIComponent(regelwerkUrl)}#zoom=page-width&pagemode=thumbs`;
    },
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
    'uiZustand.regelwerkOffen'(istOffen) {
      if (istOffen) {
        this.$nextTick(this.initialisierePosition);
        return;
      }

      this.beendeZiehen();
      this.istVollbild = false;
    },
  },
  mounted() {
    window.addEventListener('resize', this.beiFensterGroesseGeaendert);
  },
  beforeUnmount() {
    this.beendeZiehen();
    window.removeEventListener('resize', this.beiFensterGroesseGeaendert);
  },
  methods: {
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
    schliessen() {
      this.beendeZiehen();
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
      </div>
    </div>
  `,
};
