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
      inventarModal: null,
    };
  },
  methods: {
    oeffnen() {
      const modalElement = this.$refs.inventarModalElement;
      if (!modalElement) {
        return;
      }
      this.inventarModal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
      this.inventarModal.show();
    },
    inventarModalGeschlossen() {
      const panel = this.$refs.inventarPanel;
      if (panel && panel.inventarEditId && typeof panel.inventarSpeichernZeile === 'function') {
        panel.inventarSpeichernZeile();
      }
    },
  },
  mounted() {
    const inventarModalElement = this.$refs.inventarModalElement;
    if (inventarModalElement) {
      inventarModalElement.addEventListener('hidden.bs.modal', this.inventarModalGeschlossen);
    }
  },
  beforeUnmount() {
    const inventarModalElement = this.$refs.inventarModalElement;
    if (inventarModalElement) {
      inventarModalElement.removeEventListener(
        'hidden.bs.modal',
        this.inventarModalGeschlossen,
      );
    }
  },
  template: `
    <div
      class="modal fade"
      id="inventarEditorModal"
      ref="inventarModalElement"
      tabindex="-1"
      aria-labelledby="inventarEditorLabel"
      aria-hidden="true">
      <div class="modal-dialog modal-dialog-scrollable htbah-modal-respektiert-nav">
        <div class="modal-content shadow">
          <div class="modal-header">
            <h5 class="modal-title" id="inventarEditorLabel">Inventar</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Schließen"></button>
          </div>
          <inventar-editor-panel
            v-if="charakter"
            ref="inventarPanel"
            :inventar="charakter.inventar" />
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
};
