window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};
var HTBAH_BOOTSTRAP_MODAL_FRAKTION_WIZARD =
  (window.HTBAH_SHARED && window.HTBAH_SHARED.BootstrapModalHelper) || null;

function htbahWizardStandardEpoche() {
  if (window.HTBAH && typeof window.HTBAH.standardZufallEpocheFuerAktivesTheme === 'function') {
    return window.HTBAH.standardZufallEpocheFuerAktivesTheme();
  }
  return 'mittelalter';
}

window.HTBAH_KOMPONENTEN.FraktionWizardModal = {
  name: 'FraktionWizardModal',
  props: { modalId: { type: String, default: 'htbahFraktionWizardModal' } },
  emits: ['generieren'],
  data() {
    return { epoche: htbahWizardStandardEpoche(), art: '', aktiverSchritt: 1, modalInstanz: null, _fokusVorModal: null };
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
      const o = this.epochenOptionen.find((x) => x.wert === this.epoche);
      return o ? o.label : '';
    },
    artenOptionen() {
      const m = window.HTBAH && window.HTBAH.ZufallsgeneratorFraktionModul;
      return m && typeof m.artenOptionen === 'function' ? m.artenOptionen() : [];
    },
    schritt2Aktiv() { return this.aktiverSchritt >= 2; },
    kannGenerieren() { return !!this.epoche && !!String(this.art || '').trim(); },
  },
  methods: {
    oeffnen() {
      this._fokusVorModal = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this.epoche = htbahWizardStandardEpoche();
      this.art = '';
      this.aktiverSchritt = 1;
      document.body.classList.add('htbah-fraktion-wizard-offen');
      this.$nextTick(() => {
        const el = this.$refs.modalElement;
        if (!el || !HTBAH_BOOTSTRAP_MODAL_FRAKTION_WIZARD) return;
        this.modalInstanz = HTBAH_BOOTSTRAP_MODAL_FRAKTION_WIZARD.ensureModalInstance(el);
        this.modalInstanz.show();
      });
    },
    schliessen() { if (this.modalInstanz) this.modalInstanz.hide(); },
    modalGeschlossen() {
      document.body.classList.remove('htbah-fraktion-wizard-offen');
      if (this._fokusVorModal && this._fokusVorModal.isConnected) this._fokusVorModal.focus();
      this._fokusVorModal = null;
    },
    setEpoche(wert) {
      this.epoche = wert;
      this.aktiverSchritt = Math.max(this.aktiverSchritt, 2);
      this.$nextTick(() => {
        const b = this.$refs.artButtons && this.$refs.artButtons[0];
        if (b && typeof b.focus === 'function') b.focus();
      });
    },
    setArt(wert) {
      this.art = wert;
      this.$nextTick(() => {
        const btn = this.$refs.generierenBtn;
        if (btn && typeof btn.focus === 'function') btn.focus();
      });
    },
    generieren() {
      if (!this.kannGenerieren) return;
      this.$emit('generieren', { epoche: this.epoche, art: String(this.art).trim() });
      this.schliessen();
    },
  },
  mounted() {
    const el = this.$refs.modalElement;
    if (el && HTBAH_BOOTSTRAP_MODAL_FRAKTION_WIZARD) {
      HTBAH_BOOTSTRAP_MODAL_FRAKTION_WIZARD.bindHiddenEvent(el, this.modalGeschlossen);
    }
  },
  beforeUnmount() {
    const el = this.$refs.modalElement;
    if (el && HTBAH_BOOTSTRAP_MODAL_FRAKTION_WIZARD) {
      HTBAH_BOOTSTRAP_MODAL_FRAKTION_WIZARD.unbindHiddenEvent(el, this.modalGeschlossen);
    }
  },
  template: `
    <div ref="modalElement" class="modal fade" :id="modalId" tabindex="-1" :aria-labelledby="modalId + 'Label'" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content shadow-lg">
          <div class="modal-header py-2">
            <h5 class="modal-title" :id="modalId + 'Label'">🧙 Fraktions-Wizard</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Schließen"></button>
          </div>
          <div class="modal-body text-start htbah-npc-wizard">
            <ol class="htbah-npc-wizard-steps mb-0 ps-0 list-unstyled">
              <li class="htbah-npc-wizard-step" :class="{ active: aktiverSchritt === 1, done: epoche && aktiverSchritt > 1 }">
                <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                  <strong class="small">1. Epoche</strong>
                  <span v-if="epocheLabel" class="badge text-bg-secondary">{{ epocheLabel }}</span>
                </div>
                <div class="btn-group w-100" role="group">
                  <button v-for="opt in epochenOptionen" :key="'wz-fr-ep-' + opt.wert" type="button" class="btn btn-sm"
                    :class="epoche === opt.wert ? 'btn-primary' : 'btn-outline-primary'" @click="setEpoche(opt.wert)">
                    {{ opt.icon }} {{ opt.label }}
                  </button>
                </div>
              </li>
              <li class="htbah-npc-wizard-step" :class="{ active: aktiverSchritt === 2, done: art, locked: !schritt2Aktiv }">
                <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                  <strong class="small">2. Art</strong>
                  <span v-if="art" class="badge text-bg-secondary">{{ art }}</span>
                </div>
                <div class="d-flex flex-wrap gap-1">
                  <button v-for="opt in artenOptionen" :key="'wz-fr-art-' + opt" type="button" ref="artButtons" class="btn btn-sm"
                    :class="art === opt ? 'btn-primary' : 'btn-outline-primary'" :disabled="!schritt2Aktiv" @click="setArt(opt)">{{ opt }}</button>
                </div>
              </li>
            </ol>
          </div>
          <div class="modal-footer py-2">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Abbrechen</button>
            <button ref="generierenBtn" type="button" class="btn btn-primary" :disabled="!kannGenerieren" @click="generieren">✨ Fraktion generieren</button>
          </div>
        </div>
      </div>
    </div>
  `,
};
