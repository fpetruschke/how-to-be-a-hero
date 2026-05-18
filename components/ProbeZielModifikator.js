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
      modifikatorArt: 'kein',
      bonusWert: 1,
      malusWert: -1,
    };
  },
  computed: {
    effektiverModifikator() {
      const api = window.HTBAH_SHARED && window.HTBAH_SHARED.ProbeZielModifikator;
      if (!api) {
        return 0;
      }
      return api.berechneEffektiverModifikator(this.modifikatorArt, this.bonusWert, this.malusWert);
    },
    zielwert() {
      const api = window.HTBAH_SHARED && window.HTBAH_SHARED.ProbeZielModifikator;
      if (!api) {
        return Math.max(0, Math.min(100, Math.round(Number(this.basiswert) || 0)));
      }
      return api.berechneZielwert(this.basiswert, this.modifikatorArt, this.bonusWert, this.malusWert);
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
  },
  methods: {
    zuruecksetzen() {
      this.modifikatorArt = 'kein';
      this.bonusWert = 1;
      this.malusWert = -1;
    },
    gesamtwertFuerAnzeige(rohwurf) {
      if (this.modifikatorArt === 'kein') {
        return rohwurf;
      }
      return this.zielwert;
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

      <div class="mb-3">
        <label class="form-label small text-secondary mb-1">SL-Modifikator</label>
        <div class="d-flex flex-wrap gap-3">
          <div class="form-check">
            <input
              :id="idPrefix + '-kein'"
              class="form-check-input"
              type="radio"
              value="kein"
              v-model="modifikatorArt" />
            <label class="form-check-label" :for="idPrefix + '-kein'">Kein Modifikator</label>
          </div>
          <div class="form-check">
            <input
              :id="idPrefix + '-bonus'"
              class="form-check-input"
              type="radio"
              value="bonus"
              v-model="modifikatorArt" />
            <label class="form-check-label" :for="idPrefix + '-bonus'">Bonus</label>
          </div>
          <div class="form-check">
            <input
              :id="idPrefix + '-malus'"
              class="form-check-input"
              type="radio"
              value="malus"
              v-model="modifikatorArt" />
            <label class="form-check-label" :for="idPrefix + '-malus'">Malus</label>
          </div>
        </div>
      </div>

      <div class="row g-2 mb-3">
        <div class="col-12 col-md-6" v-if="modifikatorArt === 'bonus'">
          <div class="form-floating">
            <input
              :id="idPrefix + '-bonus-input'"
              type="number"
              class="form-control"
              v-model.number="bonusWert"
              min="1"
              max="100"
              step="1"
              placeholder=" " />
            <label :for="idPrefix + '-bonus-input'">Bonus (1 bis 100)</label>
          </div>
        </div>
        <div class="col-12 col-md-6" v-if="modifikatorArt === 'malus'">
          <div class="form-floating">
            <input
              :id="idPrefix + '-malus-input'"
              type="number"
              class="form-control"
              v-model.number="malusWert"
              min="-100"
              max="-1"
              step="1"
              placeholder=" " />
            <label :for="idPrefix + '-malus-input'">Malus (-1 bis -100)</label>
          </div>
        </div>
      </div>

      <div v-if="showZielCard" class="card p-3 mb-3 probe-wurf-ziel-card">
        <div class="d-flex justify-content-between align-items-center">
          <span>{{ zielLabel }}</span>
          <span class="fs-5 fw-bold">{{ zielwert }}</span>
        </div>
        <div v-if="showKritMiss" class="small text-body-secondary mt-1">
          Kritischer Misserfolg: {{ kritMissMin }} bis 100
        </div>
      </div>
    </div>
  `,
};
