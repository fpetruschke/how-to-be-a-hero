window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};
var HTBAH_BOOTSTRAP_MODAL_FORTSCHRITT =
  (window.HTBAH_SHARED && window.HTBAH_SHARED.BootstrapModalHelper) || null;

window.HTBAH_KOMPONENTEN.FortschrittModal = {
  props: {
    modalId: {
      type: String,
      default: 'htbahFortschrittModal',
    },
  },
  computed: {
    titelLabelId() {
      return `${this.modalId}Label`;
    },
    prozentAnzeige() {
      const p = Number(this.prozent);
      if (!Number.isFinite(p)) {
        return 0;
      }
      return Math.min(100, Math.max(0, Math.round(p)));
    },
  },
  data() {
    return {
      titel: 'Bitte warten …',
      statusText: '',
      prozent: 0,
      sichtbar: false,
      _schliessenLaufend: null,
      _schliessenLaufendAktiv: false,
    };
  },
  methods: {
    _diagLog(phase, details) {
      const DIAG = window.HTBAH_DIAG;
      if (DIAG && typeof DIAG.log === 'function') {
        DIAG.log('FortschrittModal', phase, details);
      }
    },
    oeffnen({ titel = 'Bitte warten …' } = {}) {
      this._schliessenLaufend = null;
      this._schliessenLaufendAktiv = false;
      this.titel = titel || 'Bitte warten …';
      this.statusText = 'Vorbereitung …';
      this.prozent = 0;
      this.sichtbar = true;
      this._diagLog('oeffnen', titel);
    },
    setzeFortschritt({ prozent = 0, text = '' } = {}) {
      if (this._schliessenLaufendAktiv) {
        return;
      }
      const p = Number(prozent);
      const neuProzent = Number.isFinite(p) ? Math.min(100, Math.max(0, p)) : 0;
      const neuText = typeof text === 'string' && text.trim() ? text.trim() : this.statusText;
      if (neuProzent === this.prozent && neuText === this.statusText) {
        return;
      }
      this.prozent = neuProzent;
      if (typeof text === 'string' && text.trim()) {
        this.statusText = neuText;
      }
      this._diagLog('fortschritt', { prozent: this.prozent, text: this.statusText });
    },
    async _schliessenIntern({ minAnzeigeMs = 150 } = {}) {
      this._diagLog('schliessen-start', { prozent: this.prozent });
      this._schliessenLaufendAktiv = true;
      const warteMs = Math.max(0, Number(minAnzeigeMs) || 0);
      if (warteMs > 0) {
        await new Promise((resolve) => {
          setTimeout(resolve, warteMs);
        });
      }

      this.sichtbar = false;
      this.statusText = '';
      this.prozent = 0;
      await this.$nextTick();
      if (HTBAH_BOOTSTRAP_MODAL_FORTSCHRITT && typeof HTBAH_BOOTSTRAP_MODAL_FORTSCHRITT.bereinigeBackdrop === 'function') {
        HTBAH_BOOTSTRAP_MODAL_FORTSCHRITT.bereinigeBackdrop();
      }
      this._diagLog('schliessen-fertig');
      this._schliessenLaufendAktiv = false;
    },
    schliessen(opts) {
      if (this._schliessenLaufend) {
        return this._schliessenLaufend;
      }
      this._schliessenLaufend = this._schliessenIntern(opts).finally(() => {
        this._schliessenLaufend = null;
      });
      return this._schliessenLaufend;
    },
    warteAufGeschlossen() {
      if (this._schliessenLaufend) {
        return this._schliessenLaufend;
      }
      return Promise.resolve();
    },
  },
  template: `
    <teleport to="body">
      <div
        v-if="sichtbar"
        class="modal fade show d-block htbah-fortschritt-overlay"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titelLabelId"
        style="background: rgba(0,0,0,0.45); z-index: 2100;">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content shadow-lg">
            <div class="modal-header border-0 pb-0">
              <h5 class="modal-title" :id="titelLabelId">{{ titel }}</h5>
            </div>
            <div class="modal-body text-start pt-2">
              <p class="small text-body-secondary mb-2" role="status">
                {{ statusText || 'Arbeite …' }}
              </p>
              <div class="progress" style="height: 1.25rem;" role="progressbar"
                :aria-valuenow="prozentAnzeige"
                aria-valuemin="0"
                aria-valuemax="100"
                :aria-label="titel">
                <div
                  class="progress-bar progress-bar-striped"
                  :class="{ 'progress-bar-animated': prozentAnzeige < 100 }"
                  :style="{ width: prozentAnzeige + '%' }">
                  {{ prozentAnzeige }}&nbsp;%
                </div>
              </div>
              <p class="small text-body-secondary mb-0 mt-2">
                Bitte dieses Fenster nicht schließen — der Tab bleibt kurzzeitig beschäftigt.
              </p>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
