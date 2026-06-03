window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.RegelwerkModal = {
  props: ['uiZustand'],
  data() {
    return {
      ...window.HTBAH_MODAL_FENSTER.erstelleBasisDaten(),
      fokusVorModal: null,
      regelwerkTab: 'cheat-sheet',
    };
  },
  computed: {
    viewerThemeKey() {
      return window.HTBAH && typeof window.HTBAH.ladeTheme === 'function' && window.HTBAH.ladeTheme() === 'dark'
        ? 'dark'
        : 'light';
    },
    viewerUrl() {
      void this.viewerThemeKey;
      const regelwerkUrl = window.HTBAH.ermittleRegelwerkQuelleUrl();
      const viewerBasisUrl = window.HTBAH.ermittleAssetUrl('assets/pdfjs/web/viewer.html');
      const themeParam = this.viewerThemeKey === 'dark' ? 'dark' : 'light';
      return `${viewerBasisUrl}?file=${encodeURIComponent(regelwerkUrl)}&htbahTheme=${themeParam}#zoom=page-width&pagemode=thumbs`;
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
    cheatSheetAnzeigeHtml() {
      const CS = window.HTBAH_SHARED && window.HTBAH_SHARED.SpielleitungPdfCheatSheet;
      if (!CS || typeof CS.baueCheatSheetAnzeigeHtml !== 'function') {
        return '';
      }
      const stil =
        typeof CS.leseCheatSheetStil === 'function'
          ? CS.leseCheatSheetStil({ stil: 'fantasy-mittelalter' })
          : null;
      return CS.baueCheatSheetAnzeigeHtml(stil);
    },
    regelwerkTabAktiv() {
      return this.regelwerkTab === 'regelwerk';
    },
    cheatSheetTabAktiv() {
      return this.regelwerkTab === 'cheat-sheet';
    },
  },
  watch: {
    'uiZustand.regelwerkOffen'(istOffen) {
      if (istOffen) {
        this.regelwerkTab = 'cheat-sheet';
        this.fokusVorModal = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        this.$nextTick(() => this.wiederherstelleRegelwerkAusSpeicher());
        return;
      }

      this.beendeZiehen();
      this.beendeResize();
      this.entsorgeViewerIframe();
      const S = window.HTBAH_MODAL_FENSTER && window.HTBAH_MODAL_FENSTER.speicher;
      if (S) {
        S.beimModalSchliessen(this, 'regelwerk');
      } else {
        this.bereinigeMinimiertZustand('regelwerk');
      }
      this.stelleFokusWiederHer();
    },
  },
  mounted() {
    window.addEventListener('resize', this.beiFensterGroesseGeaendert);
    if (this.uiZustand.regelwerkOffen) {
      this.regelwerkTab = 'cheat-sheet';
      this.$nextTick(() => this.wiederherstelleRegelwerkAusSpeicher());
    }
  },
  beforeUnmount() {
    this.beendeZiehen();
    this.beendeResize();
    this.entsorgeViewerIframe();
    window.removeEventListener('resize', this.beiFensterGroesseGeaendert);
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
    wiederherstelleRegelwerkAusSpeicher() {
      const S = window.HTBAH_MODAL_FENSTER && window.HTBAH_MODAL_FENSTER.speicher;
      if (S) {
        S.beimModalOeffnen('regelwerk', this, {
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
        this.bindModalSpeicher('regelwerk');
        this.initialisierePosition();
        if (!this.minimiert) {
          this.fokussiereFenster();
        }
      }
    },
    schliessen() {
      this.beendeZiehen();
      this.beendeResize();
      const S = window.HTBAH_MODAL_FENSTER && window.HTBAH_MODAL_FENSTER.speicher;
      if (S) {
        S.beimModalSchliessen(this, 'regelwerk');
      } else {
        this.bereinigeMinimiertZustand('regelwerk');
      }
      this.uiZustand.regelwerkOffen = false;
    },
    modalMinimieren() {
      this.minimieren({
        id: 'regelwerk',
        titel: 'Regelwerk',
        emoji: '📜',
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
    setzeRegelwerkTab(tab) {
      if (tab === 'regelwerk' || tab === 'cheat-sheet') {
        this.regelwerkTab = tab;
      }
    },
    entsorgeViewerIframe() {
      const iframe = this.$refs.viewerIframe;
      if (iframe && typeof iframe.src === 'string' && iframe.src !== 'about:blank') {
        iframe.src = 'about:blank';
      }
    },
    beimViewerLoad() {
      const iframe = this.$refs.viewerIframe;
      const win = iframe && iframe.contentWindow ? iframe.contentWindow : null;
      if (!win) {
        return;
      }
      const themeVal =
        window.HTBAH && typeof window.HTBAH.ladeTheme === 'function' && window.HTBAH.ladeTheme() === 'dark'
          ? 2
          : 1;
      const wendeViewerThemeAn = () => {
        if (win.PDFViewerApplicationOptions && typeof win.PDFViewerApplicationOptions.set === 'function') {
          win.PDFViewerApplicationOptions.set('viewerCssTheme', themeVal);
        }
        if (win.PDFViewerApplication && typeof win.PDFViewerApplication._forceCssTheme === 'function') {
          win.PDFViewerApplication._forceCssTheme();
        }
      };
      if (win.PDFViewerApplication && win.PDFViewerApplication.initializedPromise) {
        win.PDFViewerApplication.initializedPromise.then(wendeViewerThemeAn).catch(wendeViewerThemeAn);
      } else {
        wendeViewerThemeAn();
      }
    },
  },
  template: `
    <div v-if="uiZustand.regelwerkOffen" class="regelwerk-modal-layer">
      <div
        v-show="!minimiert"
        ref="fensterElement"
        class="regelwerk-modal-window card shadow"
        :class="{ 'regelwerk-modal-window-fullscreen': istVollbild }"
        :style="fensterStil"
        role="dialog"
        aria-modal="true"
        aria-label="Regelwerk und Cheat-Sheet"
        tabindex="-1"
        @keydown.esc.stop.prevent="onFensterEscape">
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
        <ul class="nav nav-tabs px-3 pt-0 border-bottom regelwerk-modal-tabs" role="tablist">
          <li class="nav-item" role="presentation">
            <button
              type="button"
              class="nav-link"
              :class="{ active: cheatSheetTabAktiv }"
              role="tab"
              :aria-selected="cheatSheetTabAktiv"
              @click="setzeRegelwerkTab('cheat-sheet')">
              Cheat-Sheet
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button
              type="button"
              class="nav-link"
              :class="{ active: regelwerkTabAktiv }"
              role="tab"
              :aria-selected="regelwerkTabAktiv"
              @click="setzeRegelwerkTab('regelwerk')">
              Regelwerk
            </button>
          </li>
        </ul>
        <div
          v-show="cheatSheetTabAktiv"
          class="regelwerk-modal-cheat-sheet-body"
          role="tabpanel"
          aria-label="Cheat-Sheet">
          <div class="regelwerk-modal-cheat-sheet-inner" v-html="cheatSheetAnzeigeHtml"></div>
        </div>
        <iframe
          v-show="regelwerkTabAktiv"
          ref="viewerIframe"
          :key="'regelwerk-viewer-' + viewerThemeKey"
          :src="regelwerkTabAktiv ? viewerUrl : 'about:blank'"
          class="regelwerk-modal-content"
          title="Regelwerk PDF"
          role="tabpanel"
          aria-label="Regelwerk PDF"
          @load="beimViewerLoad"></iframe>
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
