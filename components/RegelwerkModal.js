window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.RegelwerkModal = {
  props: ['uiZustand'],
  data() {
    return {
      regelwerkUrl: window.HTBAH.ermittleRegelwerkQuelleUrl(),
    };
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
            <button class="btn btn-sm btn-danger" @click="schliessen">Schließen</button>
          </div>
        </div>
        <iframe :src="regelwerkUrl" class="regelwerk-modal-content"></iframe>
      </div>
    </div>
  `,
};
