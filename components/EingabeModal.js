window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.EingabeModal = {
  props: {
    modalId: {
      type: String,
      default: 'htbahEingabeModal',
    },
  },
  computed: {
    titelLabelId() {
      return `${this.modalId}Label`;
    },
    inputId() {
      return `${this.modalId}Input`;
    },
  },
  data() {
    return {
      titel: '',
      beschreibung: '',
      label: 'Eingabe',
      wert: '',
      placeholder: '',
      bestaetigenText: 'Speichern',
      bestaetigenButtonClass: 'btn-primary',
      modalInstanz: null,
      _onBestaetigen: null,
      _onAbbrechen: null,
      _erledigt: false,
    };
  },
  methods: {
    oeffnen({
      titel,
      beschreibung,
      label = 'Eingabe',
      startwert = '',
      placeholder = '',
      bestaetigenText = 'Speichern',
      bestaetigenButtonClass = 'btn-primary',
      onBestaetigen,
      onAbbrechen,
    }) {
      this.titel = titel || 'Eingabe';
      this.beschreibung = beschreibung || '';
      this.label = label || 'Eingabe';
      this.wert = typeof startwert === 'string' ? startwert : '';
      this.placeholder = placeholder || '';
      this.bestaetigenText = bestaetigenText || 'Speichern';
      this.bestaetigenButtonClass = bestaetigenButtonClass || 'btn-primary';
      this._onBestaetigen = typeof onBestaetigen === 'function' ? onBestaetigen : null;
      this._onAbbrechen = typeof onAbbrechen === 'function' ? onAbbrechen : null;
      this._erledigt = false;

      this.$nextTick(() => {
        const el = this.$refs.modalElement;
        if (!el || !window.bootstrap) {
          return;
        }
        this.modalInstanz = window.bootstrap.Modal.getOrCreateInstance(el);
        this.modalInstanz.show();
        this.$nextTick(() => {
          if (this.$refs.inputElement) {
            this.$refs.inputElement.focus();
            this.$refs.inputElement.select();
          }
        });
      });
    },
    bestaetigen() {
      this._erledigt = true;
      if (this._onBestaetigen) {
        this._onBestaetigen(this.wert);
      }
      this.aufrufeZuruecksetzen();
      if (this.modalInstanz) {
        this.modalInstanz.hide();
      }
    },
    abbrechen() {
      this._erledigt = true;
      if (this._onAbbrechen) {
        this._onAbbrechen();
      }
      this.aufrufeZuruecksetzen();
      if (this.modalInstanz) {
        this.modalInstanz.hide();
      }
    },
    beiTasteEnter() {
      this.bestaetigen();
    },
    aufrufeZuruecksetzen() {
      this._onBestaetigen = null;
      this._onAbbrechen = null;
      this._erledigt = false;
    },
    modalGeschlossen() {
      if (!this._erledigt && this._onAbbrechen) {
        this._onAbbrechen();
      }
      this.aufrufeZuruecksetzen();
    },
  },
  mounted() {
    const el = this.$refs.modalElement;
    if (el) {
      el.addEventListener('hidden.bs.modal', this.modalGeschlossen);
    }
  },
  beforeUnmount() {
    const el = this.$refs.modalElement;
    if (el) {
      el.removeEventListener('hidden.bs.modal', this.modalGeschlossen);
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
              aria-label="Schließen"
              @click="abbrechen"></button>
          </div>
          <div class="modal-body text-start">
            <p v-if="beschreibung" class="mb-2">{{ beschreibung }}</p>
            <div class="form-floating">
              <input
                :id="inputId"
                ref="inputElement"
                type="text"
                class="form-control"
                v-model="wert"
                :placeholder="placeholder || ' '"
                @keydown.enter.prevent="beiTasteEnter" />
              <label :for="inputId">{{ label }}</label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="abbrechen">
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
