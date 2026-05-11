window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};
var HTBAH_BOOTSTRAP_MODAL_NPC_WIZARD =
  (window.HTBAH_SHARED && window.HTBAH_SHARED.BootstrapModalHelper) || null;

window.HTBAH_KOMPONENTEN.NpcWizardModal = {
  name: 'NpcWizardModal',
  props: {
    modalId: { type: String, default: 'htbahNpcWizardModal' },
  },
  emits: ['generieren'],
  data() {
    return {
      epoche: 'mittelalter',
      geschlecht: '',
      alter: '',
      beruf: '',
      aktiverSchritt: 1,
      modalInstanz: null,
      _fokusVorModal: null,
      _hatGeneriert: false,
    };
  },
  computed: {
    geschlechtOptionen() {
      return ['Männlich', 'Weiblich'];
    },
    berufeListe() {
      const modul = window.HTBAH && window.HTBAH.ZufallsgeneratorNpcModul;
      if (modul && typeof modul.berufslisteFuerEpoche === 'function') {
        return modul.berufslisteFuerEpoche(this.epoche);
      }
      return [];
    },
    berufeDatalistId() {
      return `${this.modalId}-berufe`;
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
      const alterNum = Number(this.alter);
      return (
        !!this.epoche &&
        !!this.geschlecht &&
        Number.isFinite(alterNum) &&
        alterNum >= 1 &&
        !!String(this.beruf || '').trim()
      );
    },
  },
  methods: {
    oeffnen() {
      this._fokusVorModal =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this._hatGeneriert = false;
      this.epoche = 'mittelalter';
      this.geschlecht = '';
      this.alter = '';
      this.beruf = '';
      this.aktiverSchritt = 1;
      document.body.classList.add('htbah-npc-wizard-offen');
      this.$nextTick(() => {
        const el = this.$refs.modalElement;
        if (!el || !HTBAH_BOOTSTRAP_MODAL_NPC_WIZARD) {
          return;
        }
        this.modalInstanz = HTBAH_BOOTSTRAP_MODAL_NPC_WIZARD.ensureModalInstance(el);
        this.modalInstanz.show();
      });
    },
    schliessen() {
      if (this.modalInstanz) {
        this.modalInstanz.hide();
      }
    },
    modalGeschlossen() {
      document.body.classList.remove('htbah-npc-wizard-offen');
      if (this._fokusVorModal && this._fokusVorModal.isConnected) {
        this._fokusVorModal.focus();
      }
      this._fokusVorModal = null;
    },
    setEpoche(epoche) {
      const aenderung = this.epoche !== epoche;
      this.epoche = epoche;
      if (aenderung) {
        this.beruf = '';
      }
      this.aktiverSchritt = Math.max(this.aktiverSchritt, 2);
      this.$nextTick(() => {
        const erstes = this.$refs.geschlechtButtons && this.$refs.geschlechtButtons[0];
        if (erstes && typeof erstes.focus === 'function') {
          erstes.focus();
        }
      });
    },
    setGeschlecht(geschlecht) {
      this.geschlecht = geschlecht;
      this.aktiverSchritt = Math.max(this.aktiverSchritt, 3);
      this.$nextTick(() => {
        const input = this.$refs.alterInput;
        if (input && typeof input.focus === 'function') {
          input.focus();
          if (typeof input.select === 'function') {
            input.select();
          }
        }
      });
    },
    alterBestaetigen() {
      const a = parseInt(String(this.alter || '').trim(), 10);
      if (!Number.isFinite(a) || a < 1 || a > 200) {
        return;
      }
      this.alter = String(a);
      this.aktiverSchritt = Math.max(this.aktiverSchritt, 4);
      this.$nextTick(() => {
        const input = this.$refs.berufInput;
        if (input && typeof input.focus === 'function') {
          input.focus();
          if (typeof input.select === 'function') {
            input.select();
          }
        }
      });
    },
    berufBestaetigen() {
      if (!String(this.beruf || '').trim()) {
        return;
      }
      this.$nextTick(() => {
        const btn = this.$refs.generierenBtn;
        if (btn && typeof btn.focus === 'function') {
          btn.focus();
        }
      });
    },
    zufallsBeruf() {
      const liste = this.berufeListe;
      if (!Array.isArray(liste) || !liste.length) {
        return;
      }
      this.beruf = liste[Math.floor(Math.random() * liste.length)];
      this.berufBestaetigen();
    },
    generieren() {
      if (!this.kannGenerieren) {
        return;
      }
      this._hatGeneriert = true;
      this.$emit('generieren', {
        epoche: this.epoche,
        geschlecht: this.geschlecht,
        alter: String(parseInt(String(this.alter), 10)),
        beruf: String(this.beruf || '').trim(),
      });
      this.schliessen();
    },
  },
  mounted() {
    const el = this.$refs.modalElement;
    if (el && HTBAH_BOOTSTRAP_MODAL_NPC_WIZARD) {
      HTBAH_BOOTSTRAP_MODAL_NPC_WIZARD.bindHiddenEvent(el, this.modalGeschlossen);
    }
  },
  beforeUnmount() {
    const el = this.$refs.modalElement;
    if (el && HTBAH_BOOTSTRAP_MODAL_NPC_WIZARD) {
      HTBAH_BOOTSTRAP_MODAL_NPC_WIZARD.unbindHiddenEvent(el, this.modalGeschlossen);
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
            <h5 class="modal-title" :id="modalId + 'Label'">🧙 NPC-Wizard</h5>
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
                  <span v-if="epoche" class="badge text-bg-secondary">{{ epoche === 'mittelalter' ? 'Mittelalter' : (epoche === 'gegenwart' ? 'Gegenwart' : 'Zukunft') }}</span>
                </div>
                <div class="btn-group w-100" role="group" aria-label="Epoche wählen">
                  <button
                    type="button"
                    class="btn btn-sm"
                    :class="epoche === 'mittelalter' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="setEpoche('mittelalter')">
                    🏰 Mittelalter
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm"
                    :class="epoche === 'gegenwart' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="setEpoche('gegenwart')">
                    🏙️ Gegenwart
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm"
                    :class="epoche === 'zukunft' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="setEpoche('zukunft')">
                    🚀 Zukunft
                  </button>
                </div>
              </li>

              <li class="htbah-npc-wizard-step" :class="{ active: aktiverSchritt === 2, done: geschlecht && aktiverSchritt > 2, locked: !schritt2Aktiv }">
                <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                  <strong class="small">2. Geschlecht</strong>
                  <span v-if="geschlecht" class="badge text-bg-secondary">{{ geschlecht }}</span>
                </div>
                <div class="btn-group w-100" role="group" aria-label="Geschlecht wählen">
                  <button
                    v-for="(opt, idx) in geschlechtOptionen"
                    :key="'wz-geschlecht-' + opt"
                    type="button"
                    ref="geschlechtButtons"
                    class="btn btn-sm"
                    :class="geschlecht === opt ? 'btn-primary' : 'btn-outline-primary'"
                    :disabled="!schritt2Aktiv"
                    @click="setGeschlecht(opt)">
                    {{ opt === 'Männlich' ? '♂' : '♀' }} {{ opt }}
                  </button>
                </div>
              </li>

              <li class="htbah-npc-wizard-step" :class="{ active: aktiverSchritt === 3, done: alter && aktiverSchritt > 3, locked: !schritt3Aktiv }">
                <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                  <strong class="small">3. Alter</strong>
                  <span v-if="alter" class="badge text-bg-secondary">{{ alter }} Jahre</span>
                </div>
                <div class="input-group input-group-sm">
                  <input
                    ref="alterInput"
                    class="form-control"
                    type="number"
                    inputmode="numeric"
                    min="1"
                    max="200"
                    placeholder="z. B. 34"
                    v-model="alter"
                    :disabled="!schritt3Aktiv"
                    @keydown.enter.prevent="alterBestaetigen" />
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    :disabled="!schritt3Aktiv"
                    @click="alter = String(Math.floor(Math.random() * (72 - 16 + 1)) + 16); alterBestaetigen()">
                    🎲
                  </button>
                  <button
                    type="button"
                    class="btn btn-primary"
                    :disabled="!schritt3Aktiv || !String(alter).trim()"
                    @click="alterBestaetigen">
                    Weiter
                  </button>
                </div>
              </li>

              <li class="htbah-npc-wizard-step" :class="{ active: aktiverSchritt === 4, done: beruf, locked: !schritt4Aktiv }">
                <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                  <strong class="small">4. Beruf</strong>
                  <span v-if="beruf" class="badge text-bg-secondary text-truncate" style="max-width: 12rem;">{{ beruf }}</span>
                </div>
                <div class="input-group input-group-sm">
                  <input
                    ref="berufInput"
                    class="form-control"
                    type="text"
                    :list="berufeDatalistId"
                    placeholder="Aus Liste wählen oder Freitext"
                    v-model="beruf"
                    :disabled="!schritt4Aktiv"
                    @keydown.enter.prevent="berufBestaetigen" />
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    :disabled="!schritt4Aktiv || !berufeListe.length"
                    title="Beruf zufällig aus passender Epoche"
                    @click="zufallsBeruf">
                    🎲
                  </button>
                </div>
                <datalist :id="berufeDatalistId">
                  <option v-for="b in berufeListe" :key="'wz-beruf-' + b" :value="b"></option>
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
              ✨ NPC generieren
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
};
