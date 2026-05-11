window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};
var HTBAH_BOOTSTRAP_MODAL_BESTIEN_WIZARD =
  (window.HTBAH_SHARED && window.HTBAH_SHARED.BootstrapModalHelper) || null;

window.HTBAH_KOMPONENTEN.BestienWizardModal = {
  name: 'BestienWizardModal',
  props: {
    modalId: { type: String, default: 'htbahBestienWizardModal' },
  },
  emits: ['generieren'],
  data() {
    return {
      kategorie: '',
      epoche: 'mittelalter',
      aggressivitaetSkala: 5,
      name: '',
      aktiverSchritt: 1,
      modalInstanz: null,
      _fokusVorModal: null,
    };
  },
  computed: {
    kategorieOptionen() {
      return [
        { wert: 'normales_tier', label: 'Normal', icon: '🐾' },
        { wert: 'fantasy_tier', label: 'Magisch / Fantasy', icon: '🦄' },
        { wert: 'mutiert', label: 'Mutiert', icon: '☢️' },
        { wert: 'monster', label: 'Monster', icon: '👹' },
      ];
    },
    epochenOptionen() {
      return [
        { wert: 'mittelalter', label: 'Mittelalter', icon: '🏰' },
        { wert: 'gegenwart', label: 'Gegenwart', icon: '🏙️' },
        { wert: 'zukunft', label: 'Zukunft', icon: '🚀' },
      ];
    },
    kategorieLabel() {
      const opt = this.kategorieOptionen.find((o) => o.wert === this.kategorie);
      return opt ? opt.label : '';
    },
    epocheLabel() {
      const opt = this.epochenOptionen.find((o) => o.wert === this.epoche);
      return opt ? opt.label : '';
    },
    namenslistenId() {
      return `${this.modalId}-namen`;
    },
    namenVorschlaege() {
      const modul = window.HTBAH && window.HTBAH.ZufallsgeneratorBestienModul;
      if (modul && typeof modul.namenslisteFuerKategorieUndEpoche === 'function' && this.kategorie) {
        return modul.namenslisteFuerKategorieUndEpoche(this.kategorie, this.epoche);
      }
      return [];
    },
    aggressivitaetText() {
      const a = Math.min(10, Math.max(1, Math.round(Number(this.aggressivitaetSkala) || 1)));
      if (a <= 3) {
        return `${a} – scheu / defensiv`;
      }
      if (a <= 6) {
        return `${a} – ausgeglichen`;
      }
      if (a <= 8) {
        return `${a} – offensiv`;
      }
      return `${a} – sehr aggressiv`;
    },
    schritt2Aktiv() {
      return this.aktiverSchritt >= 2;
    },
    schritt3Aktiv() {
      return this.aktiverSchritt >= 3;
    },
    schritt4Aktiv() {
      return this.aktiverSchritt >= 4;
    },
    kannGenerieren() {
      return (
        !!this.kategorie &&
        !!this.epoche &&
        Number.isFinite(Number(this.aggressivitaetSkala)) &&
        !!String(this.name || '').trim()
      );
    },
  },
  methods: {
    oeffnen() {
      this._fokusVorModal =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this.kategorie = '';
      this.epoche = 'mittelalter';
      this.aggressivitaetSkala = 5;
      this.name = '';
      this.aktiverSchritt = 1;
      document.body.classList.add('htbah-bestien-wizard-offen');
      this.$nextTick(() => {
        const el = this.$refs.modalElement;
        if (!el || !HTBAH_BOOTSTRAP_MODAL_BESTIEN_WIZARD) {
          return;
        }
        this.modalInstanz = HTBAH_BOOTSTRAP_MODAL_BESTIEN_WIZARD.ensureModalInstance(el);
        this.modalInstanz.show();
      });
    },
    schliessen() {
      if (this.modalInstanz) {
        this.modalInstanz.hide();
      }
    },
    modalGeschlossen() {
      document.body.classList.remove('htbah-bestien-wizard-offen');
      if (this._fokusVorModal && this._fokusVorModal.isConnected) {
        this._fokusVorModal.focus();
      }
      this._fokusVorModal = null;
    },
    setKategorie(wert) {
      const aenderung = this.kategorie !== wert;
      this.kategorie = wert;
      if (aenderung) {
        this.name = '';
      }
      this.aktiverSchritt = Math.max(this.aktiverSchritt, 2);
      this.$nextTick(() => {
        const erstes = this.$refs.epocheButtons && this.$refs.epocheButtons[0];
        if (erstes && typeof erstes.focus === 'function') {
          erstes.focus();
        }
      });
    },
    setEpoche(wert) {
      const aenderung = this.epoche !== wert;
      this.epoche = wert;
      if (aenderung) {
        this.name = '';
      }
      this.aktiverSchritt = Math.max(this.aktiverSchritt, 3);
      this.$nextTick(() => {
        const input = this.$refs.aggressivitaetInput;
        if (input && typeof input.focus === 'function') {
          input.focus();
        }
      });
    },
    aggressivitaetBestaetigen() {
      const a = Math.min(10, Math.max(1, Math.round(Number(this.aggressivitaetSkala) || 5)));
      this.aggressivitaetSkala = a;
      this.aktiverSchritt = Math.max(this.aktiverSchritt, 4);
      this.$nextTick(() => {
        const input = this.$refs.nameInput;
        if (input && typeof input.focus === 'function') {
          input.focus();
          if (typeof input.select === 'function') {
            input.select();
          }
        }
      });
    },
    zufallsName() {
      const liste = this.namenVorschlaege;
      if (!Array.isArray(liste) || !liste.length) {
        return;
      }
      this.name = liste[Math.floor(Math.random() * liste.length)];
      this.nameBestaetigen();
    },
    nameBestaetigen() {
      if (!String(this.name || '').trim()) {
        return;
      }
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
        kategorie: this.kategorie,
        epoche: this.epoche,
        aggressivitaetSkala: Math.min(10, Math.max(1, Math.round(Number(this.aggressivitaetSkala) || 5))),
        name: String(this.name || '').trim(),
      });
      this.schliessen();
    },
  },
  mounted() {
    const el = this.$refs.modalElement;
    if (el && HTBAH_BOOTSTRAP_MODAL_BESTIEN_WIZARD) {
      HTBAH_BOOTSTRAP_MODAL_BESTIEN_WIZARD.bindHiddenEvent(el, this.modalGeschlossen);
    }
  },
  beforeUnmount() {
    const el = this.$refs.modalElement;
    if (el && HTBAH_BOOTSTRAP_MODAL_BESTIEN_WIZARD) {
      HTBAH_BOOTSTRAP_MODAL_BESTIEN_WIZARD.unbindHiddenEvent(el, this.modalGeschlossen);
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
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content shadow">
          <div class="modal-header py-2">
            <h5 class="modal-title" :id="modalId + 'Label'">🧙 Bestiarium-Wizard</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Schließen"></button>
          </div>
          <div class="modal-body text-start htbah-npc-wizard">
            <ol class="htbah-npc-wizard-steps mb-0 ps-0 list-unstyled">
              <li class="htbah-npc-wizard-step" :class="{ active: aktiverSchritt === 1, done: kategorie && aktiverSchritt > 1 }">
                <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                  <strong class="small">1. Kategorie</strong>
                  <span v-if="kategorieLabel" class="badge text-bg-secondary">{{ kategorieLabel }}</span>
                </div>
                <div class="btn-group btn-group-sm w-100 flex-wrap" role="group" aria-label="Kategorie wählen">
                  <button
                    v-for="opt in kategorieOptionen"
                    :key="'wz-kat-' + opt.wert"
                    type="button"
                    class="btn"
                    :class="kategorie === opt.wert ? 'btn-primary' : 'btn-outline-primary'"
                    @click="setKategorie(opt.wert)">
                    {{ opt.icon }} {{ opt.label }}
                  </button>
                </div>
              </li>

              <li class="htbah-npc-wizard-step" :class="{ active: aktiverSchritt === 2, done: epoche && aktiverSchritt > 2, locked: !schritt2Aktiv }">
                <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                  <strong class="small">2. Epoche</strong>
                  <span v-if="epocheLabel" class="badge text-bg-secondary">{{ epocheLabel }}</span>
                </div>
                <div class="btn-group w-100" role="group" aria-label="Epoche wählen">
                  <button
                    v-for="opt in epochenOptionen"
                    :key="'wz-bestie-epoche-' + opt.wert"
                    type="button"
                    ref="epocheButtons"
                    class="btn btn-sm"
                    :class="epoche === opt.wert ? 'btn-primary' : 'btn-outline-primary'"
                    :disabled="!schritt2Aktiv"
                    @click="setEpoche(opt.wert)">
                    {{ opt.icon }} {{ opt.label }}
                  </button>
                </div>
              </li>

              <li class="htbah-npc-wizard-step" :class="{ active: aktiverSchritt === 3, done: aktiverSchritt > 3, locked: !schritt3Aktiv }">
                <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                  <strong class="small">3. Aggressivität</strong>
                  <span class="badge text-bg-secondary">{{ aggressivitaetText }}</span>
                </div>
                <div class="d-flex align-items-center gap-2 mb-2">
                  <input
                    ref="aggressivitaetInput"
                    type="range"
                    class="form-range flex-grow-1"
                    min="1"
                    max="10"
                    step="1"
                    v-model.number="aggressivitaetSkala"
                    :disabled="!schritt3Aktiv" />
                  <span class="small text-secondary text-nowrap" style="min-width: 3rem;">
                    {{ Math.min(10, Math.max(1, Math.round(Number(aggressivitaetSkala) || 1))) }} / 10
                  </span>
                </div>
                <div class="d-flex justify-content-between small text-secondary mb-2">
                  <span>scheu</span>
                  <span>ausgeglichen</span>
                  <span>aggressiv</span>
                </div>
                <button
                  type="button"
                  class="btn btn-sm btn-primary w-100"
                  :disabled="!schritt3Aktiv"
                  @click="aggressivitaetBestaetigen">
                  Weiter
                </button>
              </li>

              <li class="htbah-npc-wizard-step" :class="{ active: aktiverSchritt === 4, done: name, locked: !schritt4Aktiv }">
                <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                  <strong class="small">4. Name</strong>
                  <span v-if="name" class="badge text-bg-secondary text-truncate" style="max-width: 12rem;">{{ name }}</span>
                </div>
                <div class="input-group input-group-sm">
                  <input
                    ref="nameInput"
                    class="form-control"
                    type="text"
                    :list="namenslistenId"
                    placeholder="Aus Liste wählen oder Freitext"
                    v-model="name"
                    :disabled="!schritt4Aktiv"
                    @keydown.enter.prevent="nameBestaetigen" />
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    :disabled="!schritt4Aktiv || !namenVorschlaege.length"
                    title="Namen zufällig aus passender Kategorie + Epoche"
                    @click="zufallsName">
                    🎲
                  </button>
                </div>
                <datalist :id="namenslistenId">
                  <option v-for="n in namenVorschlaege" :key="'wz-bestie-name-' + n" :value="n"></option>
                </datalist>
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
              ✨ Bestie generieren
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
};
