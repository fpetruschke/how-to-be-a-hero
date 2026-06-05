window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

/**
 * Vollbild-PDF.js-Viewer für den Charakterbogen (Blob-URL), mit Download und Druck.
 */
window.HTBAH_KOMPONENTEN.CharakterPdfModal = {
  name: 'CharakterPdfModal',
  props: {
    offen: { type: Boolean, default: false },
    pdfUrl: { type: String, default: '' },
    dateiname: { type: String, default: 'charakter.pdf' },
  },
  emits: ['schliessen'],
  data() {
    return {
      fokusVorModal: null,
      druckIframe: null,
      druckFallbackTimeoutId: null,
    };
  },
  computed: {
    viewerUrl() {
      if (!this.pdfUrl) {
        return '';
      }
      const viewerBasisUrl = window.HTBAH.ermittleAssetUrl('assets/pdfjs/web/viewer.html');
      return `${viewerBasisUrl}?file=${encodeURIComponent(this.pdfUrl)}#zoom=page-width`;
    },
  },
  watch: {
    offen(neu) {
      if (neu) {
        this.fokusVorModal = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        this.$nextTick(() => {
          const fenster = this.$refs.fensterElement;
          if (fenster && typeof fenster.focus === 'function') {
            fenster.focus();
          }
        });
        return;
      }
      if (this.fokusVorModal && this.fokusVorModal.isConnected) {
        this.fokusVorModal.focus();
      }
      this.fokusVorModal = null;
      this.entsorgeViewerIframe();
    },
  },
  beforeUnmount() {
    this.entsorgeDruckIframe();
    this.entsorgeViewerIframe();
  },
  methods: {
    schliessen() {
      this.entsorgeViewerIframe();
      this.$emit('schliessen');
    },
    entsorgeViewerIframe() {
      const iframe = this.$refs.pdfIframe;
      if (iframe && typeof iframe.src === 'string' && iframe.src !== 'about:blank') {
        iframe.src = 'about:blank';
      }
    },
    onFensterEscape() {
      this.schliessen();
    },
    herunterladen() {
      if (!this.pdfUrl) {
        return;
      }
      const a = document.createElement('a');
      a.href = this.pdfUrl;
      a.download = this.dateiname || 'charakter.pdf';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    },
    entsorgeDruckIframe() {
      if (this.druckFallbackTimeoutId) {
        clearTimeout(this.druckFallbackTimeoutId);
        this.druckFallbackTimeoutId = null;
      }
      if (this.druckIframe && this.druckIframe.parentNode) {
        this.druckIframe.parentNode.removeChild(this.druckIframe);
      }
      this.druckIframe = null;
    },
    druckeUeberPdfJsViewer() {
      const iframe = this.$refs.pdfIframe;
      if (!iframe || !iframe.contentWindow) {
        return;
      }
      const win = iframe.contentWindow;
      const app = win.PDFViewerApplication;
      const starten = () => {
        if (app && app.pdfViewer && app.pdfViewer.pageViewsReady && typeof app.triggerPrinting === 'function') {
          app.triggerPrinting();
          return true;
        }
        try {
          win.focus();
          win.print();
        } catch (e) {
          console.error(e);
        }
        return false;
      };
      if (starten()) {
        return;
      }
      if (app && app.eventBus && typeof app.eventBus.on === 'function') {
        app.eventBus.on('documentloaded', () => {
          starten();
        }, { once: true });
      }
    },
    druckeUeberBlobIframe() {
      return new Promise((resolve) => {
        if (!this.pdfUrl) {
          resolve(false);
          return;
        }
        this.entsorgeDruckIframe();
        const frame = document.createElement('iframe');
        frame.setAttribute('aria-hidden', 'true');
        frame.title = 'Charakterbogen Druck';
        frame.style.cssText =
          'position:fixed;left:0;top:0;width:0;height:0;border:0;opacity:0;pointer-events:none;';
        this.druckIframe = frame;
        let erledigt = false;
        const abschliessen = (erfolg) => {
          if (erledigt) {
            return;
          }
          erledigt = true;
          if (this.druckFallbackTimeoutId) {
            clearTimeout(this.druckFallbackTimeoutId);
            this.druckFallbackTimeoutId = null;
          }
          this.entsorgeDruckIframe();
          resolve(!!erfolg);
        };
        const nachDruck = () => abschliessen(true);
        frame.addEventListener('load', () => {
          try {
            const win = frame.contentWindow;
            if (!win) {
              abschliessen(false);
              return;
            }
            win.addEventListener('afterprint', nachDruck, { once: true });
            win.focus();
            win.print();
            this.druckFallbackTimeoutId = setTimeout(() => abschliessen(true), 120000);
          } catch (e) {
            console.error(e);
            abschliessen(false);
          }
        }, { once: true });
        frame.addEventListener('error', () => abschliessen(false), { once: true });
        document.body.appendChild(frame);
        frame.src = this.pdfUrl;
      });
    },
    async drucken() {
      if (!this.pdfUrl) {
        return;
      }
      const blobOk = await this.druckeUeberBlobIframe();
      if (!blobOk) {
        this.druckeUeberPdfJsViewer();
      }
    },
  },
  template: `
    <div v-if="offen && pdfUrl" class="regelwerk-modal-layer">
      <div
        ref="fensterElement"
        class="regelwerk-modal-window regelwerk-modal-window-fullscreen card shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-label="Charakterbogen PDF"
        tabindex="-1"
        @keydown.esc.stop.prevent="onFensterEscape">
        <div
          class="regelwerk-modal-header d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
          <h4 class="mb-0 d-flex align-items-center gap-2">
            <span class="material-symbols-outlined" aria-hidden="true">picture_as_pdf</span>
            Charakterbogen
          </h4>
          <div class="d-flex gap-1 align-items-center">
            <button
              type="button"
              class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
              title="Herunterladen"
              aria-label="PDF herunterladen"
              @click="herunterladen">
              <span class="material-symbols-outlined" style="font-size:1.1rem;">download</span>
              <span class="d-none d-sm-inline">Download</span>
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              title="Drucken"
              aria-label="PDF drucken"
              @click="drucken">
              <span class="material-symbols-outlined" style="font-size:1.1rem;">print</span>
              <span class="d-none d-sm-inline">Drucken</span>
            </button>
            <button
              type="button"
              class="btn-close ms-1"
              aria-label="Schließen"
              @click="schliessen"></button>
          </div>
        </div>
        <iframe
          ref="pdfIframe"
          :src="viewerUrl"
          class="regelwerk-modal-content"
          title="Charakterbogen PDF"></iframe>
      </div>
    </div>
  `,
};
