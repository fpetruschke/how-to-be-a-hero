window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};
var HTBAH_BOOTSTRAP_MODAL_RAETSEL_WIZARD =
  (window.HTBAH_SHARED && window.HTBAH_SHARED.BootstrapModalHelper) || null;

window.HTBAH_KOMPONENTEN.RaetselWizardModal = {
  name: 'RaetselWizardModal',
  props: { modalId: { type: String, default: 'htbahRaetselWizardModal' } },
  emits: ['generieren'],
  data() {
    return { epoche: 'mittelalter', schwierigkeit: '', familie: '', aktiverSchritt: 1, modalInstanz: null, _fokusVorModal: null };
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
    schwierigkeitOptionen() {
      const m = window.HTBAH && window.HTBAH.ZufallsgeneratorRaetselModul;
      return m && typeof m.schwierigkeitOptionen === 'function' ? m.schwierigkeitOptionen() : [];
    },
    familieOptionen() {
      const m = window.HTBAH && window.HTBAH.ZufallsgeneratorRaetselModul;
      return m && typeof m.familieOptionen === 'function' ? m.familieOptionen() : [];
    },
    schritt2Aktiv() { return this.aktiverSchritt >= 2; },
    schritt3Aktiv() { return this.aktiverSchritt >= 3; },
    kannGenerieren() {
      return !!this.epoche && !!this.schwierigkeit && !!this.familie;
    },
  },
  methods: {
    oeffnen() {
      this._fokusVorModal = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this.epoche = 'mittelalter';
      this.schwierigkeit = '';
      this.familie = '';
      this.aktiverSchritt = 1;
      document.body.classList.add('htbah-raetsel-wizard-offen');
      this.$nextTick(() => {
        const el = this.$refs.modalElement;
        if (!el || !HTBAH_BOOTSTRAP_MODAL_RAETSEL_WIZARD) return;
        this.modalInstanz = HTBAH_BOOTSTRAP_MODAL_RAETSEL_WIZARD.ensureModalInstance(el);
        this.modalInstanz.show();
      });
    },
    schliessen() { if (this.modalInstanz) this.modalInstanz.hide(); },
    modalGeschlossen() {
      document.body.classList.remove('htbah-raetsel-wizard-offen');
      if (this._fokusVorModal && this._fokusVorModal.isConnected) this._fokusVorModal.focus();
      this._fokusVorModal = null;
    },
    setEpoche(wert) {
      this.epoche = wert;
      this.aktiverSchritt = Math.max(this.aktiverSchritt, 2);
      this.$nextTick(() => {
        const b = this.$refs.schwierigkeitButtons && this.$refs.schwierigkeitButtons[0];
        if (b && typeof b.focus === 'function') b.focus();
      });
    },
    setSchwierigkeit(wert) {
      this.schwierigkeit = wert;
      this.aktiverSchritt = Math.max(this.aktiverSchritt, 3);
      this.$nextTick(() => {
        const b = this.$refs.familieButtons && this.$refs.familieButtons[0];
        if (b && typeof b.focus === 'function') b.focus();
      });
    },
    setFamilie(wert) {
      this.familie = wert;
      this.$nextTick(() => {
        const btn = this.$refs.generierenBtn;
        if (btn && typeof btn.focus === 'function') btn.focus();
      });
    },
    generieren() {
      if (!this.kannGenerieren) return;
      this.$emit('generieren', { epoche: this.epoche, schwierigkeit: this.schwierigkeit, familie: this.familie });
      this.schliessen();
    },
  },
  mounted() {
    const el = this.$refs.modalElement;
    if (el && HTBAH_BOOTSTRAP_MODAL_RAETSEL_WIZARD) {
      HTBAH_BOOTSTRAP_MODAL_RAETSEL_WIZARD.bindHiddenEvent(el, this.modalGeschlossen);
    }
  },
  beforeUnmount() {
    const el = this.$refs.modalElement;
    if (el && HTBAH_BOOTSTRAP_MODAL_RAETSEL_WIZARD) {
      HTBAH_BOOTSTRAP_MODAL_RAETSEL_WIZARD.unbindHiddenEvent(el, this.modalGeschlossen);
    }
  },
  template: `
    <div ref="modalElement" class="modal fade" :id="modalId" tabindex="-1" :aria-labelledby="modalId + 'Label'" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content shadow-lg">
          <div class="modal-header py-2">
            <h5 class="modal-title" :id="modalId + 'Label'">🧙 Rätsel-Wizard</h5>
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
                  <button v-for="opt in epochenOptionen" :key="'wz-ra-ep-' + opt.wert" type="button" class="btn btn-sm"
                    :class="epoche === opt.wert ? 'btn-primary' : 'btn-outline-primary'" @click="setEpoche(opt.wert)">
                    {{ opt.icon }} {{ opt.label }}
                  </button>
                </div>
              </li>
              <li class="htbah-npc-wizard-step" :class="{ active: aktiverSchritt === 2, done: schwierigkeit && aktiverSchritt > 2, locked: !schritt2Aktiv }">
                <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                  <strong class="small">2. Schwierigkeit</strong>
                  <span v-if="schwierigkeit" class="badge text-bg-secondary">{{ schwierigkeit }}</span>
                </div>
                <div class="btn-group w-100" role="group">
                  <button v-for="opt in schwierigkeitOptionen" :key="'wz-ra-sch-' + opt" type="button" ref="schwierigkeitButtons" class="btn btn-sm"
                    :class="schwierigkeit === opt ? 'btn-primary' : 'btn-outline-primary'" :disabled="!schritt2Aktiv" @click="setSchwierigkeit(opt)">{{ opt }}</button>
                </div>
              </li>
              <li class="htbah-npc-wizard-step" :class="{ active: aktiverSchritt === 3, done: familie, locked: !schritt3Aktiv }">
                <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                  <strong class="small">3. Rätseltyp</strong>
                  <span v-if="familie" class="badge text-bg-secondary">{{ (familieOptionen.find(o => o.wert === familie) || {}).label || familie }}</span>
                </div>
                <div class="d-flex flex-wrap gap-1">
                  <button v-for="opt in familieOptionen" :key="'wz-ra-fam-' + opt.wert" type="button" ref="familieButtons" class="btn btn-sm"
                    :class="familie === opt.wert ? 'btn-primary' : 'btn-outline-primary'" :disabled="!schritt3Aktiv" @click="setFamilie(opt.wert)">
                    {{ opt.icon }} {{ opt.label }}
                  </button>
                </div>
              </li>
            </ol>
          </div>
          <div class="modal-footer py-2">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Abbrechen</button>
            <button ref="generierenBtn" type="button" class="btn btn-primary" :disabled="!kannGenerieren" @click="generieren">✨ Rätsel generieren</button>
          </div>
        </div>
      </div>
    </div>
  `,
};
