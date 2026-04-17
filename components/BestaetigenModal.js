window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.BestaetigenModal = {
  props: {
    modalId: {
      type: String,
      default: 'htbahBestaetigenModal',
    },
  },
  computed: {
    titelLabelId() {
      return `${this.modalId}Label`;
    },
  },
  data() {
    return {
      titel: '',
      beschreibung: '',
      bestaetigenText: 'Ja, löschen',
      bestaetigenButtonClass: 'btn-danger',
      warnhinweisAnzeigen: true,
      _onBestaetigen: null,
      modalInstanz: null,
    };
  },
  methods: {
    oeffnen({
      titel,
      beschreibung,
      onBestaetigen,
      bestaetigenText = 'Ja, löschen',
      bestaetigenButtonClass = 'btn-danger',
      warnhinweisAnzeigen = true,
    }) {
      this.titel = titel || '';
      this.beschreibung = beschreibung || '';
      this.bestaetigenText = bestaetigenText;
      this.bestaetigenButtonClass = bestaetigenButtonClass || 'btn-danger';
      this.warnhinweisAnzeigen = warnhinweisAnzeigen;
      this._onBestaetigen = typeof onBestaetigen === 'function' ? onBestaetigen : null;

      this.$nextTick(() => {
        const el = this.$refs.modalElement;
        if (!el || !window.bootstrap) {
          return;
        }

        this.modalInstanz = window.bootstrap.Modal.getOrCreateInstance(el);
        this.modalInstanz.show();
      });
    },
    bestaetigen() {
      if (this._onBestaetigen) {
        this._onBestaetigen();
      }

      if (this.modalInstanz) {
        this.modalInstanz.hide();
      }

      this._onBestaetigen = null;
    },
  },
  template: `
    <div
      ref="modalElement"
      class="modal fade"
      :id="modalId"
      tabindex="-1"
      :aria-labelledby="titelLabelId"
      aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content shadow">
          <div class="modal-header">
            <h5 class="modal-title" :id="titelLabelId">
              {{ titel }}
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Schließen"></button>
          </div>
          <div class="modal-body text-start htbah-bestaetigen-beschreibung">
            {{ beschreibung }}
            <template v-if="warnhinweisAnzeigen">
              <br />
              <br />
              Dieser Schritt kann nicht rückgängig gemacht werden.
            </template>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal">
              Abbrechen
            </button>
            <button
              type="button"
              :class="['btn', bestaetigenButtonClass]"
              @click="bestaetigen">
              {{ bestaetigenText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
};
