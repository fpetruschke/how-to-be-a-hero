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
    },
  },
  methods: {
    schliessen() {
      this.$emit('schliessen');
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
    drucken() {
      const iframe = this.$refs.pdfIframe;
      if (!iframe || !iframe.contentWindow) {
        return;
      }
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.error(e);
      }
    },
  },
  template: `
    <div v-if="offen && pdfUrl" class="regelwerk-modal-layer">
      <div
        ref="fensterElement"
        class="regelwerk-modal-window regelwerk-modal-window-fullscreen card shadow"
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
