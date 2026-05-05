window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

/** Schaden laut Regelwerk (Kampf): xW10 je Waffenart; kritischer Treffer verdoppelt den Schaden. */
window.HTBAH_KOMPONENTEN.SchadenModal = {
  components: {
    WuerfelbecherWurf: window.HTBAH_KOMPONENTEN.WuerfelbecherWurf,
  },
  props: {
    charakter: { type: Object, default: null },
  },
  data() {
    return {
      modalInstanz: null,
      kontextTitel: 'Schaden erwürfeln',
      kontextCharakter: null,
      letzterWurf: [],
      kritischerTreffer: false,
      ausgewaehlteWaffeId: 'fallback-unarmed',
      manuellerBonus: 0,
    };
  },
  computed: {
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
          const primaer = nah || fern;
          return {
            id: `inventar-${eintrag.id || index}`,
            label: name,
            notation: primaer ? primaer.notation : '1W10',
            bonus: primaer ? primaer.bonus : 0,
            quelle:
              nah && fern
                ? `Inventar: Nahkampf ${nah.original} / Fernkampf ${fern.original}`
                : nah
                  ? `Inventar: Nahkampf ${nah.original}`
                  : fern
                    ? `Inventar: Fernkampf ${fern.original}`
                    : 'Inventar: kein Schadenswert hinterlegt (Fallback 1W10)',
          };
        });
    },
    waffenOptionen() {
      const basis = [...this.inventarWaffen];
      basis.push({
        id: 'fallback-unarmed',
        label: 'Waffenlos / improvisiert',
        notation: '1W10',
        bonus: 0,
        quelle: 'Regelwerk-Richtwert: 1W10',
      });
      return basis;
    },
    ausgewaehlteWaffe() {
      return this.waffenOptionen.find((waffe) => waffe.id === this.ausgewaehlteWaffeId) || this.waffenOptionen[0];
    },
    notation() {
      return this.ausgewaehlteWaffe?.notation || '1W10';
    },
    wurfSumme() {
      const summe = Array.isArray(this.letzterWurf)
        ? this.letzterWurf.reduce((sum, wert) => sum + (Number(wert) || 0), 0)
        : 0;
      const bonus = Number(this.ausgewaehlteWaffe?.bonus) || 0;
      const manuell = Math.round(Number(this.manuellerBonus) || 0);
      return summe + bonus + manuell;
    },
    gesamtSchaden() {
      if (!this.letzterWurf.length) {
        return null;
      }
      return this.kritischerTreffer ? this.wurfSumme * 2 : this.wurfSumme;
    },
    faehigkeitenMitPotenziellerSchadenswirkung() {
      const handeln = Array.isArray(this.aktiveCharakterDaten?.handeln) ? this.aktiveCharakterDaten.handeln : [];
      const muster = /(waffenlos|faust|fauskampf|faustkampf|nahkampf|steinwurf|wurf)/i;
      return handeln
        .filter((eintrag) => {
          const name = typeof eintrag?.name === 'string' ? eintrag.name.trim() : '';
          return !!name && muster.test(name);
        })
        .map((eintrag) => ({
          name: eintrag.name.trim(),
          wert: Number(eintrag.value) || 0,
        }))
        .sort((a, b) => b.wert - a.wert);
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
      this.letzterWurf = [];
      this.kritischerTreffer = false;
      this.manuellerBonus = 0;
      this.ausgewaehlteWaffeId = this.inventarWaffen.length ? this.inventarWaffen[0].id : 'fallback-unarmed';
      this.modalInstanz = window.bootstrap.Modal.getOrCreateInstance(el);
      this.modalInstanz.show();
    },
    wuerfeln() {
      this.$refs.wuerfelbecher?.wuerfeln(this.notation).then((werte) => {
        this.letzterWurf = Array.isArray(werte) ? werte.map((wert) => Number(wert) || 0) : [];
      });
    },
  },
  template: `
    <div
      class="modal fade"
      id="schadenModal"
      ref="modalElement"
      tabindex="-1"
      aria-labelledby="schadenModalLabel"
      aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content shadow">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center gap-2" id="schadenModalLabel">
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
              wird der ausgewürfelte Schaden verdoppelt.
            </p>
            <div class="form-floating mb-3">
              <select id="schaden-waffenart" class="form-select" v-model="ausgewaehlteWaffeId">
                <option v-for="waffe in waffenOptionen" :key="waffe.id" :value="waffe.id">
                  {{ waffe.label }}
                </option>
              </select>
              <label for="schaden-waffenart">Waffe aus Inventar</label>
            </div>
            <p class="small text-body-secondary mb-3">
              {{ ausgewaehlteWaffe.quelle }}
            </p>
            <div class="card p-3 mb-3 probe-wurf-ziel-card">
              <div class="d-flex justify-content-between align-items-center">
                <span>Schadenswurf</span>
                <span class="fs-5 fw-bold">
                  {{ notation.toUpperCase() }}<template v-if="ausgewaehlteWaffe.bonus"> + {{ ausgewaehlteWaffe.bonus }}</template>
                </span>
              </div>
            </div>
            <div class="form-floating mb-2">
              <input
                id="schaden-manueller-bonus"
                type="number"
                class="form-control"
                v-model.number="manuellerBonus"
                step="1"
                placeholder=" " />
              <label for="schaden-manueller-bonus">Optionaler SL-/Fähigkeitsbonus (absolut)</label>
            </div>
            <p class="small text-body-secondary mb-3">
              Das Regelwerk definiert keinen festen Bonus aus einzelnen Fähigkeiten auf Schaden.
              Trage hier bei Bedarf einen SL-entschiedenen Bonus/Malus ein.
            </p>
            <div v-if="faehigkeitenMitPotenziellerSchadenswirkung.length" class="card p-2 mb-3">
              <div class="small text-body-secondary mb-1">
                Potenziell passende Handeln-Fähigkeiten (Hinweis):
              </div>
              <div class="small">
                <span v-for="(eintrag, idx) in faehigkeitenMitPotenziellerSchadenswirkung" :key="'fhint-' + idx">
                  {{ eintrag.name }} ({{ eintrag.wert }})<span v-if="idx < faehigkeitenMitPotenziellerSchadenswirkung.length - 1"> · </span>
                </span>
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
                <div class="small text-body-secondary mt-1">
                  Basis {{ wurfSumme }}<template v-if="kritischerTreffer"> x 2</template>
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
