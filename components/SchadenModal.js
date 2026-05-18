window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

/** Schaden laut Regelwerk (Kampf): xW10 je Waffenart; kritischer Treffer verdoppelt den Schaden. */
window.HTBAH_KOMPONENTEN.SchadenModal = {
  components: {
    WuerfelbecherWurf: window.HTBAH_KOMPONENTEN.WuerfelbecherWurf,
  },
  props: {
    charakter: { type: Object, default: null },
    modalDomId: { type: String, default: 'schadenModal' },
  },
  data() {
    return {
      modalInstanz: null,
      kontextTitel: 'Schaden erwürfeln',
      kontextCharakter: null,
      letzterWurf: [],
      kritischerTreffer: false,
      halbeSchadenWaffenloseParade: false,
      ausgewaehlteWaffeId: 'fallback-unarmed',
      ausgewaehlteSchadensart: 'nah',
      wurfGeneration: 0,
    };
  },
  computed: {
    modalTitleId() {
      return this.modalDomId + 'Label';
    },
    aktiveCharakterDaten() {
      return this.kontextCharakter || this.charakter || {};
    },
    inventarWaffen() {
      const inventar = Array.isArray(this.aktiveCharakterDaten?.inventar) ? this.aktiveCharakterDaten.inventar : [];
      return inventar
        .filter((eintrag) => eintrag && eintrag.typ === 'waffe')
        .map((eintrag, index) => {
          const name = typeof eintrag.name === 'string' && eintrag.name.trim()
            ? eintrag.name.trim()
            : `Waffe ${index + 1}`;
          const nah = this.parseSchadenswert(eintrag.schadenswertNahkampf);
          const fern = this.parseSchadenswert(eintrag.schadenswertFernkampf);
          return {
            id: `inventar-${eintrag.id || index}`,
            label: name,
            nah,
            fern,
          };
        });
    },
    waffenOptionen() {
      const basis = this.inventarWaffen.map((waffe) => {
        const nah = waffe.nah;
        const fern = waffe.fern;
        const primaer = nah || fern;
        return {
          id: waffe.id,
          label: waffe.label,
          nah,
          fern,
          notation: primaer ? primaer.notation : '1W10',
          quelle:
            nah && fern
              ? `Nahkampf ${nah.original} / Fernkampf ${fern.original}`
              : nah
                ? `Nahkampf ${nah.original}`
                : fern
                  ? `Fernkampf ${fern.original}`
                  : 'Kein Schadenswert hinterlegt (Fallback 1W10)',
        };
      });
      basis.push({
        id: 'fallback-unarmed',
        label: 'Waffenlos / improvisiert',
        nah: { notation: '1W10', bonus: 0, original: '1W10' },
        fern: null,
        notation: '1W10',
        quelle: 'Regelwerk-Richtwert: 1W10',
      });
      return basis;
    },
    ausgewaehlteWaffe() {
      return this.waffenOptionen.find((waffe) => waffe.id === this.ausgewaehlteWaffeId) || this.waffenOptionen[0];
    },
    zeigtSchadensartAuswahl() {
      const w = this.ausgewaehlteWaffe;
      return !!(w && w.nah && w.fern);
    },
    schadensartOptionen() {
      const w = this.ausgewaehlteWaffe;
      if (!w) {
        return [];
      }
      const optionen = [];
      if (w.nah) {
        optionen.push({ id: 'nah', label: 'Nahkampf', parsed: w.nah });
      }
      if (w.fern) {
        optionen.push({ id: 'fern', label: 'Fernkampf', parsed: w.fern });
      }
      return optionen;
    },
    aktiveSchadensart() {
      const optionen = this.schadensartOptionen;
      if (!optionen.length) {
        return null;
      }
      const gewaehlt = optionen.find((o) => o.id === this.ausgewaehlteSchadensart);
      return gewaehlt || optionen[0];
    },
    notation() {
      const art = this.aktiveSchadensart;
      if (art) {
        return art.parsed.notation;
      }
      return this.ausgewaehlteWaffe?.notation || '1W10';
    },
    waffenBonus() {
      const art = this.aktiveSchadensart;
      if (art) {
        return Number(art.parsed.bonus) || 0;
      }
      const w = this.ausgewaehlteWaffe;
      if (w?.nah) {
        return Number(w.nah.bonus) || 0;
      }
      if (w?.fern) {
        return Number(w.fern.bonus) || 0;
      }
      return 0;
    },
    wuerfelSumme() {
      return Array.isArray(this.letzterWurf)
        ? this.letzterWurf.reduce((sum, wert) => sum + (Number(wert) || 0), 0)
        : 0;
    },
    wurfSumme() {
      return this.wuerfelSumme + this.waffenBonus;
    },
    gesamtSchadenVorParade() {
      if (!this.letzterWurf.length) {
        return null;
      }
      return this.kritischerTreffer ? this.wurfSumme * 2 : this.wurfSumme;
    },
    gesamtSchaden() {
      const basis = this.gesamtSchadenVorParade;
      if (basis === null) {
        return null;
      }
      if (this.halbeSchadenWaffenloseParade) {
        return Math.ceil(basis / 2);
      }
      return basis;
    },
    schadenswurfAnzeige() {
      const art = this.aktiveSchadensart;
      if (!art) {
        const bonus = this.waffenBonus;
        return `${this.notation.toUpperCase()}${bonus ? ` + ${bonus}` : ''}`;
      }
      const bonus = Number(art.parsed.bonus) || 0;
      return `${art.parsed.notation.toUpperCase()}${bonus ? ` + ${bonus}` : ''}`;
    },
  },
  watch: {
    ausgewaehlteWaffeId() {
      this.syncSchadensartNachWaffe();
    },
  },
  methods: {
    parseSchadenswert(raw) {
      const text = String(raw == null ? '' : raw).trim();
      if (!text) {
        return null;
      }
      const compact = text.replace(/\s+/g, '');
      const match = compact.match(/^(\d+)w10(?:([+-])(\d+))?$/i);
      if (!match) {
        return null;
      }
      const anzahl = Math.max(1, Math.min(50, Number(match[1]) || 1));
      const operator = match[2] || '';
      const wert = Number(match[3]) || 0;
      const bonus = operator === '-' ? -wert : wert;
      return {
        notation: `${anzahl}W10`,
        bonus,
        original: `${anzahl}W10${operator ? ` ${operator} ${wert}` : ''}`,
      };
    },
    syncSchadensartNachWaffe() {
      const w = this.ausgewaehlteWaffe;
      if (w?.nah) {
        this.ausgewaehlteSchadensart = 'nah';
      } else if (w?.fern) {
        this.ausgewaehlteSchadensart = 'fern';
      }
    },
    oeffnen(payload) {
      const el = this.$refs.modalElement;
      if (!el) {
        return;
      }
      const daten =
        payload && payload.charakter && typeof payload.charakter === 'object'
          ? payload.charakter
          : null;
      this.kontextCharakter = daten;
      this.kontextTitel =
        payload && typeof payload.titel === 'string' && payload.titel.trim()
          ? payload.titel.trim()
          : 'Schaden erwürfeln';
      this.halbeSchadenWaffenloseParade = false;
      this.ausgewaehlteWaffeId = this.inventarWaffen.length ? this.inventarWaffen[0].id : 'fallback-unarmed';
      this.syncSchadensartNachWaffe();
      this.ergebnisZuruecksetzen();
      this.modalInstanz = window.bootstrap.Modal.getOrCreateInstance(el);
      this.modalInstanz.show();
    },
    wuerfeln() {
      const gen = this.wurfGeneration;
      const promise = this.$refs.wuerfelbecher?.wuerfeln(this.notation);
      if (!promise || typeof promise.then !== 'function') {
        return;
      }
      promise.then((werte) => {
        if (gen !== this.wurfGeneration) {
          return;
        }
        this.letzterWurf = Array.isArray(werte) ? werte.map((wert) => Number(wert) || 0) : [];
      });
    },
    ergebnisZuruecksetzen() {
      this.wurfGeneration += 1;
      this.letzterWurf = [];
      this.kritischerTreffer = false;
      this.$refs.wuerfelbecher?.anzeigeZuruecksetzen?.();
    },
    onModalVerborgen() {
      this.ergebnisZuruecksetzen();
    },
    schliessenUndZuruecksetzen() {
      this.ergebnisZuruecksetzen();
      if (this.modalInstanz) {
        this.modalInstanz.hide();
      }
    },
  },
  beforeUnmount() {
    const el = this.$refs.modalElement;
    if (el && window.bootstrap && window.bootstrap.Modal) {
      const instanz = window.bootstrap.Modal.getInstance(el);
      if (instanz) {
        instanz.hide();
      }
    }
  },
  template: `
    <div
      class="modal fade"
      :id="modalDomId"
      ref="modalElement"
      tabindex="-1"
      :aria-labelledby="modalTitleId"
      aria-hidden="true"
      v-on="{ 'hidden.bs.modal': onModalVerborgen }">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content shadow">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center gap-2" :id="modalTitleId">
              <span class="material-symbols-outlined" aria-hidden="true">swords</span>
              {{ kontextTitel }}
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Schließen"></button>
          </div>
          <div class="modal-body">
            <p class="small text-body-secondary mb-3">
              Regelwerk/Wiki (Kampf): Schaden wird je nach Waffe mit
              <strong>xW10</strong> gewürfelt. Bei einem <strong>kritischen Treffer</strong>
              wird der Schaden verdoppelt. Erfolgreiche waffenlose Parade: halber Schaden auf den Verteidiger.
            </p>
            <div class="form-floating mb-3">
              <select id="schaden-waffenart" class="form-select" v-model="ausgewaehlteWaffeId">
                <option v-for="waffe in waffenOptionen" :key="waffe.id" :value="waffe.id">
                  {{ waffe.label }}
                </option>
              </select>
              <label for="schaden-waffenart">Waffe</label>
            </div>
            <div v-if="zeigtSchadensartAuswahl" class="form-floating mb-3">
              <select id="schaden-schadensart" class="form-select" v-model="ausgewaehlteSchadensart">
                <option v-for="art in schadensartOptionen" :key="art.id" :value="art.id">
                  {{ art.label }} ({{ art.parsed.original }})
                </option>
              </select>
              <label for="schaden-schadensart">Schadenswert der Waffe</label>
            </div>
            <p class="small text-body-secondary mb-3">
              {{ ausgewaehlteWaffe.quelle }}
            </p>
            <div class="card p-3 mb-3 probe-wurf-ziel-card">
              <div class="d-flex justify-content-between align-items-center">
                <span>Schadenswurf</span>
                <span class="fs-5 fw-bold">{{ schadenswurfAnzeige }}</span>
              </div>
            </div>
            <div class="form-check mb-3">
              <input
                id="schaden-kritisch"
                class="form-check-input"
                type="checkbox"
                v-model="kritischerTreffer" />
              <label class="form-check-label" for="schaden-kritisch">
                Kritischer Treffer (x2 Schaden)
              </label>
            </div>
            <div class="form-check mb-3">
              <input
                id="schaden-waffenlose-parade"
                class="form-check-input"
                type="checkbox"
                v-model="halbeSchadenWaffenloseParade" />
              <label class="form-check-label" for="schaden-waffenlose-parade">
                Erfolgreiche waffenlose Parade (halber Schaden auf Verteidiger)
              </label>
            </div>
            <icon-text-button
              type="button"
              class="btn btn-primary btn-lg w-100"
              icon="casino"
              @click="wuerfeln">
              Schaden würfeln
            </icon-text-button>
            <wuerfelbecher-wurf
              ref="wuerfelbecher"
              class="mt-3"
              :auto-init="false"
              modus="w10" />
            <div
              v-if="letzterWurf.length"
              class="mt-2 p-3 rounded border border-secondary border-opacity-25 initiative-modal-ergebnis">
              <div class="text-center">
                <div class="small text-body-secondary mb-1">Gesamtschaden</div>
                <div class="display-6 fw-bold">{{ gesamtSchaden }}</div>
                <div class="small text-body-secondary mt-2 text-start">
                  <div>Würfel: {{ letzterWurf.join(' + ') }} = {{ wuerfelSumme }}</div>
                  <div v-if="waffenBonus">+ Waffe: {{ waffenBonus }}</div>
                  <div>= Summe: {{ wurfSumme }}</div>
                  <div v-if="kritischerTreffer">× 2 (kritischer Treffer): {{ gesamtSchadenVorParade }}</div>
                  <div v-if="halbeSchadenWaffenloseParade">÷ 2 (waffenlose Parade): {{ gesamtSchaden }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
};
