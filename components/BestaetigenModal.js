window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};
var HTBAH_BOOTSTRAP_MODAL =
  (window.HTBAH_SHARED && window.HTBAH_SHARED.BootstrapModalHelper) || null;

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
      _onAbbrechen: null,
      _hatBestaetigt: false,
      modalInstanz: null,
      _fokusVorModal: null,
    };
  },
  methods: {
    oeffnen({
      titel,
      beschreibung,
      onBestaetigen,
      onAbbrechen,
      bestaetigenText = 'Ja, löschen',
      bestaetigenButtonClass = 'btn-danger',
      warnhinweisAnzeigen = true,
    }) {
      this._fokusVorModal = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this.titel = titel || '';
      this.beschreibung = beschreibung || '';
      this.bestaetigenText = bestaetigenText;
      this.bestaetigenButtonClass = bestaetigenButtonClass || 'btn-danger';
      this.warnhinweisAnzeigen = warnhinweisAnzeigen;
      this._onBestaetigen = typeof onBestaetigen === 'function' ? onBestaetigen : null;
      this._onAbbrechen = typeof onAbbrechen === 'function' ? onAbbrechen : null;
      this._hatBestaetigt = false;

      this.$nextTick(() => {
        const el = this.$refs.modalElement;
        if (!el || !HTBAH_BOOTSTRAP_MODAL) {
          return;
        }
        this.modalInstanz = HTBAH_BOOTSTRAP_MODAL.ensureModalInstance(el);
        this.modalInstanz.show();
      });
    },
    bestaetigen() {
      this._hatBestaetigt = true;
      if (this._onBestaetigen) {
        this._onBestaetigen();
      }
      this.schliessen();
    },
    schliessen() {
      if (this.modalInstanz) {
        this.modalInstanz.hide();
      }
    },
    zuruecksetzenCallbacks() {
      this._onBestaetigen = null;
      this._onAbbrechen = null;
      this._hatBestaetigt = false;
    },
    modalGeschlossen() {
      if (!this._hatBestaetigt && this._onAbbrechen) {
        this._onAbbrechen();
      }
      if (this._fokusVorModal && this._fokusVorModal.isConnected) {
        this._fokusVorModal.focus();
      }
      this.zuruecksetzenCallbacks();
      this._fokusVorModal = null;
    },
  },
  mounted() {
    const el = this.$refs.modalElement;
    if (el && HTBAH_BOOTSTRAP_MODAL) {
      HTBAH_BOOTSTRAP_MODAL.bindHiddenEvent(el, this.modalGeschlossen);
    }
  },
  beforeUnmount() {
    const el = this.$refs.modalElement;
    if (el && HTBAH_BOOTSTRAP_MODAL) {
      HTBAH_BOOTSTRAP_MODAL.unbindHiddenEvent(el, this.modalGeschlossen);
    }
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
