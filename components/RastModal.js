window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.RastModal = {
  components: {
    RastBerechnungPanel: window.HTBAH_KOMPONENTEN.RastBerechnungPanel,
  },
  props: {
    charakter: { type: Object, default: null },
    modalDomId: { type: String, default: 'rastModal' },
  },
  data() {
    return {
      modalInstanz: null,
      kontextTitel: 'Rast',
      kontextCharakter: null,
    };
  },
  computed: {
    modalTitleId() {
      return this.modalDomId + 'Label';
    },
    aktiverCharakter() {
      const kontext =
        this.kontextCharakter && typeof this.kontextCharakter === 'object'
          ? this.kontextCharakter
          : null;
      const prop = this.charakter && typeof this.charakter === 'object' ? this.charakter : null;
      return kontext || prop;
    },
  },
  methods: {
    oeffnen(payload) {
      const el = this.$refs.modalElement;
      if (!el) {
        return;
      }
      const daten =
        payload && payload.charakter && typeof payload.charakter === 'object'
          ? payload.charakter
          : null;
      this.kontextCharakter = daten;
      this.kontextTitel =
        payload && typeof payload.titel === 'string' && payload.titel.trim()
          ? payload.titel.trim()
          : 'Rast';
      this.$nextTick(() => {
        this.$refs.rastPanel?.zuruecksetzen?.();
        this.modalInstanz = window.bootstrap.Modal.getOrCreateInstance(el);
        this.modalInstanz.show();
      });
    },
    onModalVerborgen() {
      this.$refs.rastPanel?.zuruecksetzen?.();
    },
    onAngewendet() {
      if (this.modalInstanz) {
        this.modalInstanz.hide();
      }
    },
  },
  beforeUnmount() {
    const el = this.$refs.modalElement;
    if (el && window.bootstrap && window.bootstrap.Modal) {
      const instanz = window.bootstrap.Modal.getInstance(el);
      if (instanz) {
        instanz.hide();
      }
    }
  },
  template: `
    <div
      class="modal fade"
      :id="modalDomId"
      ref="modalElement"
      tabindex="-1"
      :aria-labelledby="modalTitleId"
      aria-hidden="true"
      v-on="{ 'hidden.bs.modal': onModalVerborgen }">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content shadow-lg">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center gap-2" :id="modalTitleId">
              <span class="material-symbols-outlined" aria-hidden="true">night_shelter</span>
              {{ kontextTitel }}
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Schließen"></button>
          </div>
          <div class="modal-body">
            <rast-berechnung-panel
              ref="rastPanel"
              modus="einzeln"
              :charakter="aktiverCharakter"
              :id-prefix="modalDomId + '-panel'"
              @angewendet="onAngewendet" />
          </div>
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
