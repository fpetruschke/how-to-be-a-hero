window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.ProbeZielModifikator = {
  props: {
    basiswert: { type: Number, default: 0 },
    idPrefix: { type: String, default: 'probe-mod' },
    basisLabel: { type: String, default: 'Basiswert' },
    zielLabel: { type: String, default: 'Zielwert' },
    labelSuffix: { type: String, default: 'optional' },
    /** Überschreibt den Toggle-Text links (sonst „SL-Modifikator (…)“) */
    modifikatorTitel: { type: String, default: '' },
    showBasisCard: { type: Boolean, default: true },
    showZielCard: { type: Boolean, default: true },
    showKritMiss: { type: Boolean, default: true },
    /** 'basis' = an Basiswert gekoppelt (Proben); 'symmetrisch' = ±max (Schaden) */
    sliderModus: { type: String, default: 'basis' },
    symmetrischMax: { type: Number, default: 50 },
    zielCardKlasse: { type: String, default: '' },
  },
  data() {
    return {
      modifikatorWert: 0,
      sliderOffen: false,
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
      if (this.sliderModus === 'symmetrisch') {
        return this.modifikatorApi.berechneSymmetrischeModifikatorGrenzen(this.symmetrischMax);
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
      if (this.sliderModus === 'symmetrisch') {
        return this.modifikatorApi.berechneEffektiverSymmetrischerModifikator(
          this.modifikatorWert,
          this.symmetrischMax,
        );
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
    modifikatorStaerke() {
      if (!this.modifikatorApi) {
        return { stufe: 0, label: '' };
      }
      return this.modifikatorApi.berechneModifikatorStaerke(this.effektiverModifikator);
    },
    modifikatorRichtung() {
      if (this.effektiverModifikator > 0) {
        return 'bonus';
      }
      if (this.effektiverModifikator < 0) {
        return 'malus';
      }
      return 'neutral';
    },
    modifikatorBadgeText() {
      if (!this.modifikatorHatWert) {
        return '';
      }
      const richtung = this.effektiverModifikator > 0 ? 'Bonus' : 'Malus';
      const wert =
        this.effektiverModifikator > 0
          ? `+${this.effektiverModifikator}`
          : String(this.effektiverModifikator);
      const staerke = this.modifikatorStaerke.label;
      return `${richtung}: ${wert}${staerke ? ` (${staerke})` : ''}`;
    },
    modifikatorToggleLabel() {
      if (this.modifikatorTitel) {
        return this.modifikatorTitel;
      }
      return `SL-Modifikator (${this.labelSuffix})`;
    },
    modifikatorBadgeKlasse() {
      if (!this.modifikatorHatWert) {
        return '';
      }
      const stufe = this.modifikatorStaerke.stufe;
      if (this.modifikatorRichtung === 'bonus') {
        return `probe-mod-badge--bonus probe-mod-badge--bonus-stufe-${stufe}`;
      }
      return `probe-mod-badge--malus probe-mod-badge--malus-stufe-${stufe}`;
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
      if (this.modifikatorRichtung === 'bonus') {
        return `probe-mod-slider-wert--bonus probe-mod-slider-wert--bonus-stufe-${this.modifikatorStaerke.stufe}`;
      }
      if (this.modifikatorRichtung === 'malus') {
        return `probe-mod-slider-wert--malus probe-mod-slider-wert--malus-stufe-${this.modifikatorStaerke.stufe}`;
      }
      return 'probe-mod-slider-wert--neutral';
    },
    sliderFillKlasse() {
      if (this.modifikatorRichtung === 'malus') {
        return `probe-wurf-slider-fill--malus probe-wurf-slider-fill--malus-stufe-${this.modifikatorStaerke.stufe}`;
      }
      if (this.modifikatorRichtung === 'bonus') {
        return `probe-wurf-slider-fill--bonus probe-wurf-slider-fill--bonus-stufe-${this.modifikatorStaerke.stufe}`;
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
    sliderLabelMalusKlasse() {
      if (this.modifikatorRichtung !== 'malus') {
        return 'probe-mod-slider-label--malus';
      }
      return `probe-mod-slider-label--malus probe-mod-slider-label--malus-stufe-${this.modifikatorStaerke.stufe}`;
    },
    sliderLabelBonusKlasse() {
      if (this.modifikatorRichtung !== 'bonus') {
        return 'probe-mod-slider-label--bonus';
      }
      return `probe-mod-slider-label--bonus probe-mod-slider-label--bonus-stufe-${this.modifikatorStaerke.stufe}`;
    },
    modifikatorEingabe: {
      get() {
        return this.effektiverModifikator;
      },
      set(roh) {
        this.modifikatorWert = this.eingeschraenkterModifikator(roh);
      },
    },
    zielwertEingabe: {
      get() {
        return this.zielwert;
      },
      set(roh) {
        if (!this.modifikatorApi) {
          return;
        }
        this.modifikatorWert = this.modifikatorApi.berechneModifikatorAusZielwert(
          this.basiswert,
          roh,
        );
      },
    },
    zielwertMin() {
      return 0;
    },
    zielwertMax() {
      return 100;
    },
  },
  watch: {
    basiswert() {
      this.modifikatorWert = this.eingeschraenkterModifikator(this.modifikatorWert);
    },
    symmetrischMax() {
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
      if (this.sliderModus === 'symmetrisch') {
        return this.modifikatorApi.berechneEffektiverSymmetrischerModifikator(
          wert,
          this.symmetrischMax,
        );
      }
      return this.modifikatorApi.berechneEffektiverModifikator(wert, this.basiswert);
    },
    zuruecksetzen() {
      this.modifikatorWert = 0;
      this.sliderOffen = false;
    },
    setzeModifikator(wert) {
      this.modifikatorWert = this.eingeschraenkterModifikator(wert);
    },
    sliderToggle() {
      this.sliderOffen = !this.sliderOffen;
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
        <button
          type="button"
          class="probe-mod-toggle-btn btn btn-link w-100 d-flex align-items-center justify-content-between gap-2 p-0 text-start text-decoration-none"
          :aria-expanded="sliderOffen"
          :aria-controls="idPrefix + '-slider-panel'"
          @click="sliderToggle">
          <span class="form-label small text-secondary mb-0">
            {{ modifikatorToggleLabel }}
          </span>
          <span class="d-flex align-items-center gap-2 flex-shrink-0">
            <span
              v-if="modifikatorHatWert && !sliderOffen"
              class="badge rounded-pill probe-mod-toggle-badge"
              :class="modifikatorBadgeKlasse">
              {{ modifikatorWertAnzeige }}
            </span>
            <span
              class="material-symbols-outlined probe-mod-toggle-ico"
              aria-hidden="true">{{ sliderOffen ? 'expand_less' : 'expand_more' }}</span>
          </span>
        </button>
        <div
          v-show="sliderOffen"
          :id="idPrefix + '-slider-panel'"
          class="probe-mod-slider-panel pt-2">
          <div class="probe-mod-slider-row d-flex align-items-center gap-2 gap-md-3">
          <span class="probe-mod-slider-label small fw-semibold" :class="sliderLabelMalusKlasse">Malus</span>
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
            <div class="probe-mod-slider-wert-row d-flex justify-content-center align-items-center gap-2 mt-2">
              <label class="visually-hidden" :for="idPrefix + '-modifikator'">Modifikator</label>
              <input
                :id="idPrefix + '-modifikator'"
                type="number"
                class="form-control form-control-sm probe-mod-wert-input text-center"
                :class="modifikatorWertKlasse"
                v-model.number="modifikatorEingabe"
                :min="modifikatorMin"
                :max="modifikatorMax"
                step="1"
                :aria-valuetext="modifikatorWertAnzeige" />
            </div>
            <div
              v-if="modifikatorHatWert && modifikatorStaerke.label"
              class="probe-mod-staerke-label text-center small fw-semibold mt-1"
              :class="modifikatorWertKlasse"
              aria-live="polite">
              {{ modifikatorStaerke.label }}
            </div>
          </div>
          <span class="probe-mod-slider-label small fw-semibold" :class="sliderLabelBonusKlasse">Bonus</span>
        </div>
        </div>
      </div>

      <div
        v-if="showZielCard && sliderModus !== 'symmetrisch'"
        class="card p-3 mb-3 probe-wurf-ziel-card"
        :class="zielCardKlasse">
        <div class="d-flex justify-content-between align-items-center gap-2">
          <span>{{ zielLabel }}</span>
          <input
            :id="idPrefix + '-zielwert'"
            type="number"
            class="form-control form-control-sm probe-mod-zielwert-input text-end"
            v-model.number="zielwertEingabe"
            :min="zielwertMin"
            :max="zielwertMax"
            step="1"
            :aria-label="zielLabel" />
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
