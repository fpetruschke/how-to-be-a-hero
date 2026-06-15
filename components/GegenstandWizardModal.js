window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};
var HTBAH_BOOTSTRAP_MODAL_GEGENSTAND_WIZARD =
  (window.HTBAH_SHARED && window.HTBAH_SHARED.BootstrapModalHelper) || null;

window.HTBAH_KOMPONENTEN.GegenstandWizardModal = {
  name: 'GegenstandWizardModal',
  props: { modalId: { type: String, default: 'htbahGegenstandWizardModal' } },
  emits: ['generieren'],
  data() {
    return { epoche: 'mittelalter', kategorie: '', aktiverSchritt: 1, modalInstanz: null, _fokusVorModal: null };
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
    kategorienOptionen() {
      const m = window.HTBAH && window.HTBAH.ZufallsgeneratorGegenstandModul;
      return m && typeof m.kategorienOptionen === 'function' ? m.kategorienOptionen() : [];
    },
    schritt2Aktiv() { return this.aktiverSchritt >= 2; },
    kannGenerieren() { return !!this.epoche && !!this.kategorie; },
  },
  methods: {
    oeffnen() {
      this._fokusVorModal = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this.epoche = 'mittelalter';
      this.kategorie = '';
      this.aktiverSchritt = 1;
      document.body.classList.add('htbah-gegenstand-wizard-offen');
      this.$nextTick(() => {
        const el = this.$refs.modalElement;
        if (!el || !HTBAH_BOOTSTRAP_MODAL_GEGENSTAND_WIZARD) return;
        this.modalInstanz = HTBAH_BOOTSTRAP_MODAL_GEGENSTAND_WIZARD.ensureModalInstance(el);
        this.modalInstanz.show();
      });
    },
    schliessen() { if (this.modalInstanz) this.modalInstanz.hide(); },
    modalGeschlossen() {
      document.body.classList.remove('htbah-gegenstand-wizard-offen');
      if (this._fokusVorModal && this._fokusVorModal.isConnected) this._fokusVorModal.focus();
      this._fokusVorModal = null;
    },
    setEpoche(wert) {
      this.epoche = wert;
      this.aktiverSchritt = Math.max(this.aktiverSchritt, 2);
      this.$nextTick(() => {
        const b = this.$refs.kategorieButtons && this.$refs.kategorieButtons[0];
        if (b && typeof b.focus === 'function') b.focus();
      });
    },
    setKategorie(wert) {
      this.kategorie = wert;
      this.$nextTick(() => {
        const btn = this.$refs.generierenBtn;
        if (btn && typeof btn.focus === 'function') btn.focus();
      });
    },
    generieren() {
      if (!this.kannGenerieren) return;
      this.$emit('generieren', {
        epoche: this.epoche,
        kategorie: this.kategorie,
      });
      this.schliessen();
    },
  },
  mounted() {
    const el = this.$refs.modalElement;
    if (el && HTBAH_BOOTSTRAP_MODAL_GEGENSTAND_WIZARD) {
      HTBAH_BOOTSTRAP_MODAL_GEGENSTAND_WIZARD.bindHiddenEvent(el, this.modalGeschlossen);
    }
  },
  beforeUnmount() {
    const el = this.$refs.modalElement;
    if (el && HTBAH_BOOTSTRAP_MODAL_GEGENSTAND_WIZARD) {
      HTBAH_BOOTSTRAP_MODAL_GEGENSTAND_WIZARD.unbindHiddenEvent(el, this.modalGeschlossen);
    }
  },
  template: `
    <div ref="modalElement" class="modal fade" :id="modalId" tabindex="-1" :aria-labelledby="modalId + 'Label'" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content shadow-lg">
          <div class="modal-header py-2">
            <h5 class="modal-title" :id="modalId + 'Label'">🧙 Gegenstands-Wizard</h5>
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
                  <button v-for="opt in epochenOptionen" :key="'wz-ge-ep-' + opt.wert" type="button" class="btn btn-sm"
                    :class="epoche === opt.wert ? 'btn-primary' : 'btn-outline-primary'" @click="setEpoche(opt.wert)">
                    {{ opt.icon }} {{ opt.label }}
                  </button>
                </div>
              </li>
              <li class="htbah-npc-wizard-step" :class="{ active: aktiverSchritt === 2, done: kategorie, locked: !schritt2Aktiv }">
                <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                  <strong class="small">2. Kategorie</strong>
                  <span v-if="kategorie" class="badge text-bg-secondary">{{ (kategorienOptionen.find(o => o.wert === kategorie) || {}).label || kategorie }}</span>
                </div>
                <div class="btn-group w-100 flex-wrap" role="group">
                  <button v-for="opt in kategorienOptionen" :key="'wz-ge-kat-' + opt.wert" type="button" ref="kategorieButtons" class="btn btn-sm"
                    :class="kategorie === opt.wert ? 'btn-primary' : 'btn-outline-primary'" :disabled="!schritt2Aktiv" @click="setKategorie(opt.wert)">
                    {{ opt.icon }} {{ opt.label }}
                  </button>
                </div>
              </li>
            </ol>
          </div>
          <div class="modal-footer py-2">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Abbrechen</button>
            <button ref="generierenBtn" type="button" class="btn btn-primary" :disabled="!kannGenerieren" @click="generieren">✨ Gegenstand generieren</button>
          </div>
        </div>
      </div>
    </div>
  `,
};
