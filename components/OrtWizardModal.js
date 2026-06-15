window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};
var HTBAH_BOOTSTRAP_MODAL_ORT_WIZARD =
  (window.HTBAH_SHARED && window.HTBAH_SHARED.BootstrapModalHelper) || null;

window.HTBAH_KOMPONENTEN.OrtWizardModal = {
  name: 'OrtWizardModal',
  props: {
    modalId: { type: String, default: 'htbahOrtWizardModal' },
  },
  emits: ['generieren'],
  data() {
    return {
      epoche: 'mittelalter',
      groesse: '',
      lage: '',
      aktiverSchritt: 1,
      modalInstanz: null,
      _fokusVorModal: null,
    };
  },
  computed: {
    epochenOptionen() {
      return [
        { wert: 'mittelalter', label: 'Mittelalter', icon: '🏰' },
        { wert: 'gegenwart', label: 'Gegenwart', icon: '🏙️' },
        { wert: 'zukunft', label: 'Zukunft', icon: '🚀' },
      ];
    },
    epocheLabel() {
      const opt = this.epochenOptionen.find((o) => o.wert === this.epoche);
      return opt ? opt.label : '';
    },
    groesseOptionen() {
      const modul = window.HTBAH && window.HTBAH.ZufallsgeneratorOrtModul;
      if (modul && typeof modul.groesseOptionenFuerEpoche === 'function') {
        return modul.groesseOptionenFuerEpoche(this.epoche);
      }
      return [];
    },
    lageOptionen() {
      const modul = window.HTBAH && window.HTBAH.ZufallsgeneratorOrtModul;
      if (modul && typeof modul.lageOptionenFuerEpoche === 'function') {
        return modul.lageOptionenFuerEpoche(this.epoche);
      }
      return [];
    },
    schritt2Aktiv() {
      return this.aktiverSchritt >= 2;
    },
    schritt3Aktiv() {
      return this.aktiverSchritt >= 3;
    },
    kannGenerieren() {
      return !!this.epoche && !!String(this.groesse || '').trim() && !!String(this.lage || '').trim();
    },
  },
  methods: {
    oeffnen() {
      this._fokusVorModal =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this.epoche = 'mittelalter';
      this.groesse = '';
      this.lage = '';
      this.aktiverSchritt = 1;
      document.body.classList.add('htbah-ort-wizard-offen');
      this.$nextTick(() => {
        const el = this.$refs.modalElement;
        if (!el || !HTBAH_BOOTSTRAP_MODAL_ORT_WIZARD) {
          return;
        }
        this.modalInstanz = HTBAH_BOOTSTRAP_MODAL_ORT_WIZARD.ensureModalInstance(el);
        this.modalInstanz.show();
      });
    },
    schliessen() {
      if (this.modalInstanz) {
        this.modalInstanz.hide();
      }
    },
    modalGeschlossen() {
      document.body.classList.remove('htbah-ort-wizard-offen');
      if (this._fokusVorModal && this._fokusVorModal.isConnected) {
        this._fokusVorModal.focus();
      }
      this._fokusVorModal = null;
    },
    setEpoche(wert) {
      const aenderung = this.epoche !== wert;
      this.epoche = wert;
      if (aenderung) {
        this.groesse = '';
        this.lage = '';
      }
      this.aktiverSchritt = Math.max(this.aktiverSchritt, 2);
      this.$nextTick(() => {
        const erstes = this.$refs.groesseButtons && this.$refs.groesseButtons[0];
        if (erstes && typeof erstes.focus === 'function') {
          erstes.focus();
        }
      });
    },
    setGroesse(wert) {
      this.groesse = wert;
      this.aktiverSchritt = Math.max(this.aktiverSchritt, 3);
      this.$nextTick(() => {
        const erstes = this.$refs.lageButtons && this.$refs.lageButtons[0];
        if (erstes && typeof erstes.focus === 'function') {
          erstes.focus();
        }
      });
    },
    setLage(wert) {
      this.lage = wert;
      this.$nextTick(() => {
        const btn = this.$refs.generierenBtn;
        if (btn && typeof btn.focus === 'function') {
          btn.focus();
        }
      });
    },
    generieren() {
      if (!this.kannGenerieren) {
        return;
      }
      this.$emit('generieren', {
        epoche: this.epoche,
        groesse: String(this.groesse || '').trim(),
        lage: String(this.lage || '').trim(),
      });
      this.schliessen();
    },
  },
  mounted() {
    const el = this.$refs.modalElement;
    if (el && HTBAH_BOOTSTRAP_MODAL_ORT_WIZARD) {
      HTBAH_BOOTSTRAP_MODAL_ORT_WIZARD.bindHiddenEvent(el, this.modalGeschlossen);
    }
  },
  beforeUnmount() {
    const el = this.$refs.modalElement;
    if (el && HTBAH_BOOTSTRAP_MODAL_ORT_WIZARD) {
      HTBAH_BOOTSTRAP_MODAL_ORT_WIZARD.unbindHiddenEvent(el, this.modalGeschlossen);
    }
  },
  template: `
    <div
      ref="modalElement"
      class="modal fade"
      :id="modalId"
      tabindex="-1"
      :aria-labelledby="modalId + 'Label'"
      aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content shadow-lg">
          <div class="modal-header py-2">
            <h5 class="modal-title" :id="modalId + 'Label'">🧙 Orts-Wizard</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Schließen"></button>
          </div>
          <div class="modal-body text-start htbah-npc-wizard">
            <ol class="htbah-npc-wizard-steps mb-0 ps-0 list-unstyled">
              <li class="htbah-npc-wizard-step" :class="{ active: aktiverSchritt === 1, done: epoche && aktiverSchritt > 1 }">
                <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                  <strong class="small">1. Epoche</strong>
                  <span v-if="epocheLabel" class="badge text-bg-secondary">{{ epocheLabel }}</span>
                </div>
                <div class="btn-group w-100" role="group" aria-label="Epoche wählen">
                  <button
                    v-for="opt in epochenOptionen"
                    :key="'wz-ort-epoche-' + opt.wert"
                    type="button"
                    class="btn btn-sm"
                    :class="epoche === opt.wert ? 'btn-primary' : 'btn-outline-primary'"
                    @click="setEpoche(opt.wert)">
                    {{ opt.icon }} {{ opt.label }}
                  </button>
                </div>
              </li>

              <li class="htbah-npc-wizard-step" :class="{ active: aktiverSchritt === 2, done: groesse && aktiverSchritt > 2, locked: !schritt2Aktiv }">
                <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                  <strong class="small">2. Größe</strong>
                  <span v-if="groesse" class="badge text-bg-secondary">{{ groesse }}</span>
                </div>
                <div class="d-flex flex-wrap gap-1" role="group" aria-label="Größe wählen">
                  <button
                    v-for="opt in groesseOptionen"
                    :key="'wz-ort-groesse-' + opt"
                    type="button"
                    ref="groesseButtons"
                    class="btn btn-sm"
                    :class="groesse === opt ? 'btn-primary' : 'btn-outline-primary'"
                    :disabled="!schritt2Aktiv"
                    @click="setGroesse(opt)">
                    {{ opt }}
                  </button>
                </div>
              </li>

              <li class="htbah-npc-wizard-step" :class="{ active: aktiverSchritt === 3, done: lage, locked: !schritt3Aktiv }">
                <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                  <strong class="small">3. Lage</strong>
                  <span v-if="lage" class="badge text-bg-secondary">{{ lage }}</span>
                </div>
                <div class="d-flex flex-wrap gap-1" role="group" aria-label="Lage wählen">
                  <button
                    v-for="opt in lageOptionen"
                    :key="'wz-ort-lage-' + opt"
                    type="button"
                    ref="lageButtons"
                    class="btn btn-sm"
                    :class="lage === opt ? 'btn-primary' : 'btn-outline-primary'"
                    :disabled="!schritt3Aktiv"
                    @click="setLage(opt)">
                    {{ opt }}
                  </button>
                </div>
              </li>
            </ol>
          </div>
          <div class="modal-footer py-2">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal">
              Abbrechen
            </button>
            <button
              ref="generierenBtn"
              type="button"
              class="btn btn-primary"
              :disabled="!kannGenerieren"
              @click="generieren">
              ✨ Ort generieren
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
};
