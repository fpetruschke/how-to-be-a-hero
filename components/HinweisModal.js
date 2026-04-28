window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};
var HTBAH_BOOTSTRAP_MODAL =
  (window.HTBAH_SHARED && window.HTBAH_SHARED.BootstrapModalHelper) || null;

window.HTBAH_KOMPONENTEN.HinweisModal = {
  props: {
    modalId: {
      type: String,
      default: 'htbahHinweisModal',
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
      bestaetigenText: 'OK',
      bestaetigenButtonClass: 'btn-primary',
      _onBestaetigen: null,
      _erledigt: false,
      modalInstanz: null,
      _fokusVorModal: null,
    };
  },
  methods: {
    oeffnen({
      titel,
      beschreibung,
      bestaetigenText = 'OK',
      bestaetigenButtonClass = 'btn-primary',
      onBestaetigen,
    }) {
      this._fokusVorModal = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this.titel = titel || 'Hinweis';
      this.beschreibung = beschreibung || '';
      this.bestaetigenText = bestaetigenText || 'OK';
      this.bestaetigenButtonClass = bestaetigenButtonClass || 'btn-primary';
      this._onBestaetigen = typeof onBestaetigen === 'function' ? onBestaetigen : null;
      this._erledigt = false;

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
      this._erledigt = true;
      if (this._onBestaetigen) {
        this._onBestaetigen();
      }
      this._onBestaetigen = null;
      if (this.modalInstanz) {
        this.modalInstanz.hide();
      }
    },
    modalGeschlossen() {
      if (!this._erledigt && this._onBestaetigen) {
        this._onBestaetigen();
      }
      if (this._fokusVorModal && this._fokusVorModal.isConnected) {
        this._fokusVorModal.focus();
      }
      this._onBestaetigen = null;
      this._erledigt = false;
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
            <h5 class="modal-title" :id="titelLabelId">{{ titel }}</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Schließen"></button>
          </div>
          <div class="modal-body text-start">
            {{ beschreibung }}
          </div>
          <div class="modal-footer">
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
