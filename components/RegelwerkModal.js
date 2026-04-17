window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.RegelwerkModal = {
  props: ['uiZustand'],
  data() {
    return {
      regelwerkUrl: window.HTBAH.ermittleRegelwerkQuelleUrl(),
      viewerBasisUrl: window.HTBAH.ermittleAssetUrl('assets/pdfjs/web/viewer.html'),
    };
  },
  computed: {
    viewerUrl() {
      return `${this.viewerBasisUrl}?file=${encodeURIComponent(this.regelwerkUrl)}#zoom=page-width&pagemode=thumbs`;
    },
  },
  methods: {
    schliessen() {
      this.uiZustand.regelwerkOffen = false;
    },
  },
  template: `
    <div v-if="uiZustand.regelwerkOffen" class="regelwerk-modal-backdrop" @click.self="schliessen">
      <div class="regelwerk-modal-window card">
        <div class="d-flex justify-content-between align-items-center p-3">
          <h4 class="mb-0">📜 Regelwerk</h4>
          <div class="d-flex gap-2">
            <a href="https://howtobeahero.de" target="_blank" class="btn btn-sm btn-secondary">
              Wiki ↗
            </a>
            <a :href="regelwerkUrl" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-secondary">
              PDF öffnen ↗
            </a>
            <button class="btn btn-sm btn-danger" @click="schliessen">Schließen</button>
          </div>
        </div>
        <iframe :src="viewerUrl" class="regelwerk-modal-content"></iframe>
      </div>
    </div>
  `,
};
