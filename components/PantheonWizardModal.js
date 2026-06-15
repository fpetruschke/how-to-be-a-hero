window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};
var HTBAH_BOOTSTRAP_MODAL_PANTHEON_WIZARD =
  (window.HTBAH_SHARED && window.HTBAH_SHARED.BootstrapModalHelper) || null;

window.HTBAH_KOMPONENTEN.PantheonWizardModal = {
  name: 'PantheonWizardModal',
  props: { modalId: { type: String, default: 'htbahPantheonWizardModal' } },
  emits: ['generieren'],
  data() {
    return { epoche: 'mittelalter', domaene: '', aktiverSchritt: 1, modalInstanz: null, _fokusVorModal: null };
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
    domaenenOptionen() {
      const m = window.HTBAH && window.HTBAH.ZufallsgeneratorPantheonModul;
      return m && typeof m.domaenenOptionen === 'function' ? m.domaenenOptionen() : [];
    },
    schritt2Aktiv() { return this.aktiverSchritt >= 2; },
    kannGenerieren() { return !!this.epoche && !!String(this.domaene || '').trim(); },
  },
  methods: {
    oeffnen() {
      this._fokusVorModal = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this.epoche = 'mittelalter';
      this.domaene = '';
      this.aktiverSchritt = 1;
      document.body.classList.add('htbah-pantheon-wizard-offen');
      this.$nextTick(() => {
        const el = this.$refs.modalElement;
        if (!el || !HTBAH_BOOTSTRAP_MODAL_PANTHEON_WIZARD) return;
        this.modalInstanz = HTBAH_BOOTSTRAP_MODAL_PANTHEON_WIZARD.ensureModalInstance(el);
        this.modalInstanz.show();
      });
    },
    schliessen() { if (this.modalInstanz) this.modalInstanz.hide(); },
    modalGeschlossen() {
      document.body.classList.remove('htbah-pantheon-wizard-offen');
      if (this._fokusVorModal && this._fokusVorModal.isConnected) this._fokusVorModal.focus();
      this._fokusVorModal = null;
    },
    setEpoche(wert) {
      this.epoche = wert;
      this.aktiverSchritt = Math.max(this.aktiverSchritt, 2);
      this.$nextTick(() => {
        const b = this.$refs.domaeneButtons && this.$refs.domaeneButtons[0];
        if (b && typeof b.focus === 'function') b.focus();
      });
    },
    setDomaene(wert) {
      this.domaene = wert;
      this.$nextTick(() => {
        const btn = this.$refs.generierenBtn;
        if (btn && typeof btn.focus === 'function') btn.focus();
      });
    },
    generieren() {
      if (!this.kannGenerieren) return;
      this.$emit('generieren', { epoche: this.epoche, domaene: String(this.domaene).trim() });
      this.schliessen();
    },
  },
  mounted() {
    const el = this.$refs.modalElement;
    if (el && HTBAH_BOOTSTRAP_MODAL_PANTHEON_WIZARD) {
      HTBAH_BOOTSTRAP_MODAL_PANTHEON_WIZARD.bindHiddenEvent(el, this.modalGeschlossen);
    }
  },
  beforeUnmount() {
    const el = this.$refs.modalElement;
    if (el && HTBAH_BOOTSTRAP_MODAL_PANTHEON_WIZARD) {
      HTBAH_BOOTSTRAP_MODAL_PANTHEON_WIZARD.unbindHiddenEvent(el, this.modalGeschlossen);
    }
  },
  template: `
    <div ref="modalElement" class="modal fade" :id="modalId" tabindex="-1" :aria-labelledby="modalId + 'Label'" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content shadow-lg">
          <div class="modal-header py-2">
            <h5 class="modal-title" :id="modalId + 'Label'">🧙 Pantheon-Wizard</h5>
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
                  <button v-for="opt in epochenOptionen" :key="'wz-pa-ep-' + opt.wert" type="button" class="btn btn-sm"
                    :class="epoche === opt.wert ? 'btn-primary' : 'btn-outline-primary'" @click="setEpoche(opt.wert)">
                    {{ opt.icon }} {{ opt.label }}
                  </button>
                </div>
              </li>
              <li class="htbah-npc-wizard-step" :class="{ active: aktiverSchritt === 2, done: domaene, locked: !schritt2Aktiv }">
                <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                  <strong class="small">2. Domäne</strong>
                  <span v-if="domaene" class="badge text-bg-secondary text-truncate" style="max-width:12rem">{{ domaene }}</span>
                </div>
                <div class="d-flex flex-wrap gap-1">
                  <button v-for="opt in domaenenOptionen" :key="'wz-pa-dom-' + opt" type="button" ref="domaeneButtons" class="btn btn-sm"
                    :class="domaene === opt ? 'btn-primary' : 'btn-outline-primary'" :disabled="!schritt2Aktiv" @click="setDomaene(opt)">{{ opt }}</button>
                </div>
              </li>
            </ol>
          </div>
          <div class="modal-footer py-2">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Abbrechen</button>
            <button ref="generierenBtn" type="button" class="btn btn-primary" :disabled="!kannGenerieren" @click="generieren">✨ Gottheit generieren</button>
          </div>
        </div>
      </div>
    </div>
  `,
};
