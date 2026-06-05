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
    beschreibungEnthaeltHtml() {
      return /<[^>]+>/.test(String(this.beschreibung || ''));
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
      _onSekundaer: null,
      sekundaerText: '',
      sekundaerButtonClass: 'btn-outline-secondary',
      _hatBestaetigt: false,
      _hatSekundaerAktion: false,
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
      onSekundaer,
      sekundaerText = '',
      sekundaerButtonClass = 'btn-outline-secondary',
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
      this._onSekundaer = typeof onSekundaer === 'function' ? onSekundaer : null;
      this.sekundaerText = typeof sekundaerText === 'string' ? sekundaerText : '';
      this.sekundaerButtonClass = sekundaerButtonClass || 'btn-outline-secondary';
      this._hatBestaetigt = false;
      this._hatSekundaerAktion = false;

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
      this.schliessen();
    },
    sekundaerAktion() {
      this._hatSekundaerAktion = true;
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
      this._onSekundaer = null;
      this.sekundaerText = '';
      this._hatBestaetigt = false;
      this._hatSekundaerAktion = false;
    },
    modalGeschlossen() {
      const onBestaetigen = this._onBestaetigen;
      const onSekundaer = this._onSekundaer;
      const onAbbrechen = this._onAbbrechen;
      const hatBestaetigt = this._hatBestaetigt;
      const hatSekundaer = this._hatSekundaerAktion;
      const fokusZiel = this._fokusVorModal;
      this.zuruecksetzenCallbacks();
      this._fokusVorModal = null;

      const nachBackdropBereinigung = (fn) => {
        if (typeof fn !== 'function') {
          return;
        }
        requestAnimationFrame(() => {
          if (window.HTBAH && window.HTBAH.ui && typeof window.HTBAH.ui.bereinigeModalBackdrop === 'function') {
            window.HTBAH.ui.bereinigeModalBackdrop();
          }
          requestAnimationFrame(() => fn());
        });
      };

      const fokusWiederherstellen = () => {
        if (fokusZiel && fokusZiel.isConnected) {
          fokusZiel.focus();
        }
      };

      if (hatBestaetigt) {
        nachBackdropBereinigung(() => {
          if (onBestaetigen) {
            onBestaetigen();
          }
          fokusWiederherstellen();
        });
      } else if (hatSekundaer) {
        nachBackdropBereinigung(() => {
          if (onSekundaer) {
            onSekundaer();
          }
          fokusWiederherstellen();
        });
      } else if (onAbbrechen) {
        nachBackdropBereinigung(() => {
          onAbbrechen();
          fokusWiederherstellen();
        });
      } else {
        fokusWiederherstellen();
      }
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
        <div class="modal-content shadow-lg">
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
            <span v-if="beschreibungEnthaeltHtml" v-html="beschreibung"></span>
            <span v-else>{{ beschreibung }}</span>
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
              v-if="sekundaerText"
              type="button"
              :class="['btn', sekundaerButtonClass]"
              @click="sekundaerAktion">
              {{ sekundaerText }}
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
