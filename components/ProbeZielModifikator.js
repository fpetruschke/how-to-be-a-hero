window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.ProbeZielModifikator = {
  props: {
    basiswert: { type: Number, default: 0 },
    idPrefix: { type: String, default: 'probe-mod' },
    basisLabel: { type: String, default: 'Basiswert' },
    zielLabel: { type: String, default: 'Zielwert' },
    showBasisCard: { type: Boolean, default: true },
    showZielCard: { type: Boolean, default: true },
    showKritMiss: { type: Boolean, default: true },
  },
  data() {
    return {
      modifikatorWert: 0,
    };
  },
  computed: {
    modifikatorApi() {
      return window.HTBAH_SHARED && window.HTBAH_SHARED.ProbeZielModifikator;
    },
    modifikatorGrenzen() {
      if (!this.modifikatorApi) {
        return { min: 0, max: 100 };
      }
      return this.modifikatorApi.berechneModifikatorGrenzen(this.basiswert);
    },
    modifikatorMin() {
      return this.modifikatorGrenzen.min;
    },
    modifikatorMax() {
      return this.modifikatorGrenzen.max;
    },
    effektiverModifikator() {
      if (!this.modifikatorApi) {
        return 0;
      }
      return this.modifikatorApi.berechneEffektiverModifikator(this.modifikatorWert, this.basiswert);
    },
    zielwert() {
      if (!this.modifikatorApi) {
        return Math.max(0, Math.min(100, Math.round(Number(this.basiswert) || 0)));
      }
      return this.modifikatorApi.berechneZielwert(this.basiswert, this.modifikatorWert);
    },
    kritMissMin() {
      return Math.ceil(90 + this.zielwert * 0.1);
    },
    modifikatorHatWert() {
      return this.effektiverModifikator !== 0;
    },
    modifikatorBadgeText() {
      if (!this.modifikatorHatWert) {
        return '';
      }
      return this.effektiverModifikator > 0
        ? `Bonus: +${this.effektiverModifikator}`
        : `Malus: ${this.effektiverModifikator}`;
    },
    modifikatorBadgeKlasse() {
      if (!this.modifikatorHatWert) {
        return '';
      }
      return this.effektiverModifikator > 0 ? 'text-bg-success' : 'text-bg-danger';
    },
    modifikatorWertAnzeige() {
      if (this.effektiverModifikator === 0) {
        return '0';
      }
      return this.effektiverModifikator > 0
        ? `+${this.effektiverModifikator}`
        : String(this.effektiverModifikator);
    },
    modifikatorWertKlasse() {
      if (this.effektiverModifikator > 0) {
        return 'probe-mod-slider-wert--bonus';
      }
      if (this.effektiverModifikator < 0) {
        return 'probe-mod-slider-wert--malus';
      }
      return 'probe-mod-slider-wert--neutral';
    },
    sliderFillKlasse() {
      if (this.effektiverModifikator < 0) {
        return 'probe-wurf-slider-fill--malus';
      }
      if (this.effektiverModifikator > 0) {
        return 'probe-wurf-slider-fill--bonus';
      }
      return '';
    },
    sliderTrackStil() {
      const min = this.modifikatorMin;
      const max = this.modifikatorMax;
      const val = this.effektiverModifikator;
      const spanne = max - min;
      if (spanne <= 0) {
        return {
          '--probe-mod-fill-start': 50,
          '--probe-mod-fill-width': 0,
          '--probe-mod-zero-pct': 50,
          '--probe-mod-thumb-pct': 50,
        };
      }
      const nullPct = ((0 - min) / spanne) * 100;
      const thumbPct = ((val - min) / spanne) * 100;
      const fillStart = Math.min(nullPct, thumbPct);
      const fillEnd = Math.max(nullPct, thumbPct);
      return {
        '--probe-mod-zero-pct': nullPct,
        '--probe-mod-fill-start': fillStart,
        '--probe-mod-fill-width': fillEnd - fillStart,
        '--probe-mod-thumb-pct': thumbPct,
      };
    },
  },
  watch: {
    basiswert() {
      this.modifikatorWert = this.eingeschraenkterModifikator(this.modifikatorWert);
    },
    modifikatorWert(neu) {
      const eingeschraenkt = this.eingeschraenkterModifikator(neu);
      if (eingeschraenkt !== neu) {
        this.modifikatorWert = eingeschraenkt;
      }
    },
  },
  methods: {
    eingeschraenkterModifikator(wert) {
      if (!this.modifikatorApi) {
        return 0;
      }
      return this.modifikatorApi.berechneEffektiverModifikator(wert, this.basiswert);
    },
    zuruecksetzen() {
      this.modifikatorWert = 0;
    },
  },
  template: `
    <div>
      <div v-if="showBasisCard" class="card p-3 mb-3 probe-wurf-ziel-card">
        <div class="d-flex justify-content-between align-items-center">
          <span>{{ basisLabel }}</span>
          <span class="fs-5 fw-bold">{{ basiswert }}</span>
        </div>
      </div>

      <div class="probe-mod-slider-wrap mb-3">
        <label class="form-label small text-secondary mb-2" :for="idPrefix + '-slider'">
          SL-Modifikator (Zielwert)
        </label>
        <div class="probe-mod-slider-row d-flex align-items-center gap-2 gap-md-3">
          <span class="probe-mod-slider-label probe-mod-slider-label--malus small fw-semibold">Malus</span>
          <div class="probe-mod-slider-column flex-grow-1">
            <div class="probe-mod-slider-track-wrap">
              <div class="probe-wurf-slider" :style="sliderTrackStil">
                <div class="probe-wurf-slider-rail" aria-hidden="true">
                  <div class="probe-wurf-slider-track"></div>
                  <div
                    v-if="modifikatorHatWert"
                    class="probe-wurf-slider-fill"
                    :class="sliderFillKlasse"></div>
                </div>
                <div class="probe-wurf-slider-zero" aria-hidden="true"></div>
                <div class="probe-wurf-slider-handle" aria-hidden="true">
                  <span class="probe-wurf-slider-handle-body"></span>
                  <span class="probe-wurf-slider-handle-tip"></span>
                </div>
                <input
                  :id="idPrefix + '-slider'"
                  type="range"
                  class="probe-wurf-slider-input"
                  v-model.number="modifikatorWert"
                  :min="modifikatorMin"
                  :max="modifikatorMax"
                  step="1"
                  :aria-valuenow="effektiverModifikator"
                  :aria-valuemin="modifikatorMin"
                  :aria-valuemax="modifikatorMax"
                  :aria-valuetext="modifikatorWertAnzeige" />
              </div>
            </div>
            <div
              class="probe-mod-slider-wert text-center mt-2"
              :class="modifikatorWertKlasse"
              aria-live="polite">
              {{ modifikatorWertAnzeige }}
            </div>
          </div>
          <span class="probe-mod-slider-label probe-mod-slider-label--bonus small fw-semibold">Bonus</span>
        </div>
      </div>

      <div v-if="showZielCard" class="card p-3 mb-3 probe-wurf-ziel-card">
        <div class="d-flex justify-content-between align-items-center">
          <span>{{ zielLabel }}</span>
          <span class="fs-5 fw-bold">{{ zielwert }}</span>
        </div>
        <div v-if="modifikatorHatWert" class="small text-body-secondary mt-1">
          {{ modifikatorBadgeText }} auf Basiswert {{ basiswert }}
        </div>
        <div v-if="showKritMiss" class="small text-body-secondary mt-1">
          Kritischer Misserfolg: {{ kritMissMin }} bis 100
        </div>
      </div>
    </div>
  `,
};
