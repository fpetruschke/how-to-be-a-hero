window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.RastBerechnungPanel = {
  components: {
    WuerfelbecherWurf: window.HTBAH_KOMPONENTEN.WuerfelbecherWurf,
    ProbeZielModifikator: window.HTBAH_KOMPONENTEN.ProbeZielModifikator,
  },
  props: {
    /** 'einzeln' = ein Charakter; 'gruppe' = alle Mitglieder der Kampagne */
    modus: { type: String, default: 'einzeln' },
    charakter: { type: Object, default: null },
    kampagneId: { type: String, default: '' },
    idPrefix: { type: String, default: 'rast' },
    kompakt: { type: Boolean, default: false },
  },
  emits: ['angewendet'],
  data() {
    return {
      rastKomfort: 'komfortabel',
      letzterWurf: [],
      wurfGeneration: 0,
      spielleitungTick: 0,
    };
  },
  computed: {
    api() {
      return window.HTBAH_SHARED && window.HTBAH_SHARED.RastBerechnung;
    },
    komfortOptionen() {
      return this.api && Array.isArray(this.api.KOMFORT_OPTIONEN) ? this.api.KOMFORT_OPTIONEN : [];
    },
    slModifikator() {
      return this.$refs.slModifikator || null;
    },
    slModifikatorWert() {
      return this.slModifikator ? this.slModifikator.effektiverModifikator : 0;
    },
    slModifikatorHatWert() {
      return this.slModifikator ? this.slModifikator.modifikatorHatWert : false;
    },
    slModifikatorBadgeText() {
      return this.slModifikator ? this.slModifikator.modifikatorBadgeText : '';
    },
    slModifikatorBadgeKlasse() {
      return this.slModifikator ? this.slModifikator.modifikatorBadgeKlasse : '';
    },
    wuerfelWert() {
      return Array.isArray(this.letzterWurf) && this.letzterWurf.length
        ? Number(this.letzterWurf[0]) || 0
        : null;
    },
    regeneration() {
      if (this.wuerfelWert === null || !this.api) {
        return null;
      }
      return this.api.berechneRastRegeneration(this.wuerfelWert, this.slModifikatorWert);
    },
    istGruppenModus() {
      return this.modus === 'gruppe';
    },
    kampagneMitglieder() {
      void this.spielleitungTick;
      const kid = typeof this.kampagneId === 'string' ? this.kampagneId.trim() : '';
      if (!kid || !window.HTBAH || typeof window.HTBAH.ladeSpielleitungZustand !== 'function') {
        return [];
      }
      const sl =
        typeof window.HTBAH.ladeSpielleitungZustandLeicht === 'function'
          ? window.HTBAH.ladeSpielleitungZustandLeicht()
          : window.HTBAH.ladeSpielleitungZustand();
      const kampagne = (sl.kampagnen || []).find((k) => k && k.id === kid);
      if (!kampagne || !Array.isArray(kampagne.mitglieder)) {
        return [];
      }
      return kampagne.mitglieder.filter((m) => m && m.charakter);
    },
    mitgliederVorschau() {
      if (!this.api || this.regeneration === null) {
        return [];
      }
      return this.kampagneMitglieder.map((m) => {
        const char = m.charakter || {};
        const name =
          typeof char.name === 'string' && char.name.trim() ? char.name.trim() : 'Unbenannt';
        const vorher = this.api.normalisiereLp(char.lebenspunkte);
        const tot = vorher === 0 || char.lpStatusTot === true;
        return {
          id: m.id,
          name,
          vorher,
          nach: tot ? vorher : this.api.berechneLpNachRast(vorher, this.regeneration),
          tot,
        };
      });
    },
    aktuellerCharakterName() {
      const c = this.charakter;
      if (!c || typeof c !== 'object') {
        return '';
      }
      return typeof c.name === 'string' && c.name.trim() ? c.name.trim() : 'Charakter';
    },
    aktuellerCharakterLp() {
      if (!this.api || !this.charakter) {
        return 0;
      }
      return this.api.normalisiereLp(this.charakter.lebenspunkte);
    },
    aktuellerCharakterLpNachRast() {
      if (!this.api || this.regeneration === null) {
        return this.aktuellerCharakterLp;
      }
      return this.api.berechneLpNachRast(this.aktuellerCharakterLp, this.regeneration);
    },
    kannAnwenden() {
      if (this.regeneration === null || this.regeneration <= 0) {
        return false;
      }
      if (this.istGruppenModus) {
        return this.mitgliederVorschau.some((m) => !m.tot);
      }
      const c = this.charakter;
      if (!c) {
        return false;
      }
      const lp = this.api ? this.api.normalisiereLp(c.lebenspunkte) : 0;
      return lp > 0 && c.lpStatusTot !== true;
    },
    anwendenLabel() {
      if (this.istGruppenModus) {
        const n = this.kampagneMitglieder.length;
        return n
          ? `Regeneration auf ${n} Spielende anwenden (+${this.regeneration} LP)`
          : 'Regeneration anwenden';
      }
      return `Regeneration anwenden (+${this.regeneration} LP)`;
    },
  },
  mounted() {
    this.$nextTick(() => this.wendeKomfortVoreinstellungAn());
    this._spielleitungSpeicherHandler = (event) => {
      if (!event || !event.detail) {
        return;
      }
      const d = event.detail;
      if (d.art === 'spielleitung' || d.art === 'charakter') {
        if (d.kampagneId && this.kampagneId && d.kampagneId !== this.kampagneId) {
          return;
        }
        this.spielleitungTick += 1;
      }
    };
    window.addEventListener('htbah:kampagne-daten-geaendert', this._spielleitungSpeicherHandler);
  },
  beforeUnmount() {
    if (this._spielleitungSpeicherHandler) {
      window.removeEventListener('htbah:kampagne-daten-geaendert', this._spielleitungSpeicherHandler);
    }
  },
  methods: {
    wendeKomfortVoreinstellungAn() {
      if (!this.api) {
        return;
      }
      const opt = this.api.komfortOption(this.rastKomfort);
      this.$refs.slModifikator?.setzeModifikator?.(opt.voreinstellung);
    },
    onKomfortGeaendert() {
      this.wendeKomfortVoreinstellungAn();
    },
    wuerfeln() {
      const gen = this.wurfGeneration;
      const promise = this.$refs.wuerfelbecher?.wuerfeln('1W10');
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
      this.$refs.wuerfelbecher?.anzeigeZuruecksetzen?.();
    },
    zuruecksetzen() {
      this.rastKomfort = 'komfortabel';
      this.ergebnisZuruecksetzen();
      this.$refs.slModifikator?.zuruecksetzen?.();
      this.$nextTick(() => this.wendeKomfortVoreinstellungAn());
    },
    anwenden() {
      if (!this.api || !this.kannAnwenden) {
        return;
      }
      if (this.istGruppenModus) {
        const kid = typeof this.kampagneId === 'string' ? this.kampagneId.trim() : '';
        if (!kid) {
          return;
        }
        const sl = window.HTBAH.ladeSpielleitungZustand();
        const kampagne = (sl.kampagnen || []).find((k) => k && k.id === kid);
        if (!kampagne || !Array.isArray(kampagne.mitglieder)) {
          return;
        }
        const ergebnisse = [];
        kampagne.mitglieder.forEach((m) => {
          if (!m || !m.charakter) {
            return;
          }
          const ergebnis = this.api.wendeRastAufCharakterAn(m.charakter, this.regeneration);
          if (ergebnis.angewendet) {
            ergebnisse.push({ id: m.id, vorher: ergebnis.vorher, nach: ergebnis.nach });
          }
        });
        window.HTBAH.speichereSpielleitungZustand(sl);
        this.spielleitungTick += 1;
        this.$emit('angewendet', { modus: 'gruppe', regeneration: this.regeneration, ergebnisse });
        return;
      }
      if (!this.charakter) {
        return;
      }
      const { vorher, nach } = this.api.wendeRastAufCharakterAn(this.charakter, this.regeneration);
      this.$emit('angewendet', {
        modus: 'einzeln',
        regeneration: this.regeneration,
        vorher,
        nach,
      });
    },
  },
  template: `
    <div class="htbah-rast-berechnung">
      <p v-if="!kompakt" class="small text-body-secondary mb-3">
        Regelwerk: Nach einer Rast werden Lebenspunkte mit <strong>1W10</strong> plus SL-Modifikator
        (Komfort der Unterkunft, −5 bis +5) wiederhergestellt. Ist die Summe negativ, zählt 0.
      </p>

      <fieldset class="mb-3">
        <legend class="form-label small text-secondary mb-2">Art der Rast</legend>
        <div class="btn-group w-100" role="group" :aria-label="'Art der Rast (' + idPrefix + ')'">
          <template v-for="opt in komfortOptionen" :key="idPrefix + '-komfort-' + opt.id">
            <input
              :id="idPrefix + '-komfort-' + opt.id"
              class="btn-check"
              type="radio"
              name="rast-komfort-{{ idPrefix }}"
              :value="opt.id"
              v-model="rastKomfort"
              @change="onKomfortGeaendert" />
            <label
              class="btn btn-outline-secondary text-start"
              :for="idPrefix + '-komfort-' + opt.id">
              <span class="d-block fw-semibold">{{ opt.label }}</span>
              <span class="d-block small opacity-75">{{ opt.beispiel }}</span>
            </label>
          </template>
        </div>
      </fieldset>

      <probe-ziel-modifikator
        ref="slModifikator"
        :basiswert="0"
        :id-prefix="idPrefix + '-mod'"
        :show-basis-card="false"
        :show-ziel-card="false"
        :show-krit-miss="false"
        slider-modus="symmetrisch"
        :symmetrisch-max="5"
        label-suffix="−5 bis +5"
        modifikator-titel="SL-Modifikator (Rast, −5 bis +5)" />

      <icon-text-button
        type="button"
        class="btn btn-primary btn-lg w-100"
        icon="casino"
        @click="wuerfeln">
        1W10 würfeln
      </icon-text-button>
      <wuerfelbecher-wurf
        ref="wuerfelbecher"
        class="mt-3"
        :auto-init="false"
        modus="w10"
        notation="1W10" />

      <div
        v-if="letzterWurf.length"
        class="mt-2 p-3 rounded border border-secondary border-opacity-25 initiative-modal-ergebnis">
        <div class="text-center">
          <div class="small text-body-secondary mb-1">Lebenspunkte durch Rast</div>
          <div class="display-6 fw-bold">{{ regeneration }}</div>
          <div class="small text-body-secondary mt-2 text-start">
            <div>Würfel (1W10): {{ wuerfelWert }}</div>
            <div v-if="slModifikatorHatWert">
              + SL-Modifikator: {{ slModifikatorWert > 0 ? '+' : '' }}{{ slModifikatorWert }}
            </div>
            <div>= Summe: {{ regeneration }} (Minimum 0)</div>
          </div>
          <div
            v-if="slModifikatorHatWert"
            class="d-flex justify-content-center flex-wrap gap-2 mt-2">
            <span class="badge rounded-pill" :class="slModifikatorBadgeKlasse">
              {{ slModifikatorBadgeText }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="kannAnwenden" class="mt-3">
        <template v-if="istGruppenModus">
          <p v-if="!kampagneMitglieder.length" class="small text-body-secondary mb-2">
            Keine Spielenden in der aktiven Kampagne — Regeneration kann nicht angewendet werden.
          </p>
          <ul v-else class="list-group list-group-flush mb-3 small">
            <li
              v-for="m in mitgliederVorschau"
              :key="idPrefix + '-prev-' + m.id"
              class="list-group-item px-0 d-flex justify-content-between gap-2">
              <span>{{ m.name }}<span v-if="m.tot" class="text-body-secondary"> (tot)</span></span>
              <span class="tabular-nums text-body-secondary">
                <template v-if="m.tot">{{ m.vorher }} LP — keine Regeneration</template>
                <template v-else>{{ m.vorher }} → {{ m.nach }} LP</template>
              </span>
            </li>
          </ul>
          <icon-text-button
            type="button"
            class="btn btn-success w-100"
            icon="healing"
            :disabled="!mitgliederVorschau.some((m) => !m.tot)"
            @click="anwenden">
            {{ anwendenLabel }}
          </icon-text-button>
        </template>
        <template v-else>
          <p
            v-if="aktuellerCharakterLp === 0 || charakter?.lpStatusTot"
            class="small text-danger mb-2">
            Tot (0 LP) — keine Regeneration möglich.
          </p>
          <p v-else class="small text-body-secondary mb-2">
            {{ aktuellerCharakterName }}: {{ aktuellerCharakterLp }} →
            {{ aktuellerCharakterLpNachRast }} LP
          </p>
          <icon-text-button
            type="button"
            class="btn btn-success w-100"
            icon="healing"
            @click="anwenden">
            {{ anwendenLabel }}
          </icon-text-button>
        </template>
      </div>
    </div>
  `,
};
