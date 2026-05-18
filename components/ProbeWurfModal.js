window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.ProbeWurfModal = {
  components: {
    WuerfelbecherWurf: window.HTBAH_KOMPONENTEN.WuerfelbecherWurf,
    ProbeZielModifikator: window.HTBAH_KOMPONENTEN.ProbeZielModifikator,
  },
  props: {
    modalDomId: { type: String, default: 'probeWurfModal' },
  },
  data() {
    return {
      modalInstanz: null,
      kontext: {
        modus: 'faehigkeit',
        basiswert: 0,
        zielwert: 0,
        titel: '',
        untertitel: '',
        zeigtModifikator: false,
        basisLabel: 'Basiswert',
        zielLabel: 'Zielwert',
      },
      letzterWurf: null,
      wurfGeneration: 0,
    };
  },
  computed: {
    modalTitleId() {
      return this.modalDomId + 'Label';
    },
    zielModifikator() {
      return this.$refs.zielModifikator || null;
    },
    effektiverZielwert() {
      if (this.kontext.zeigtModifikator && this.zielModifikator) {
        return this.zielModifikator.zielwert;
      }
      return Math.max(0, Math.min(100, Math.round(Number(this.kontext.zielwert) || 0)));
    },
    effektiverModifikator() {
      return this.kontext.zeigtModifikator && this.zielModifikator
        ? this.zielModifikator.effektiverModifikator
        : 0;
    },
    auswertung() {
      if (this.letzterWurf === null) {
        return null;
      }
      return window.HTBAH.berechneProbeAuswertung(this.letzterWurf, this.effektiverZielwert, {
        nurBegabung: this.kontext.modus === 'begabung',
      });
    },
    ergebnisKlasse() {
      const a = this.auswertung;
      if (!a) {
        return '';
      }
      return 'probe-wurf-ergebnis--' + a.stufe.replace(/_/g, '-');
    },
    wahrscheinlichkeitKlasse() {
      const z = this.effektiverZielwert;
      if (z >= 75) {
        return 'probe-wurf-ziel-card--sehr-leicht';
      }
      if (z >= 50) {
        return 'probe-wurf-ziel-card--leicht';
      }
      if (z >= 30) {
        return 'probe-wurf-ziel-card--mittel';
      }
      if (z >= 15) {
        return 'probe-wurf-ziel-card--schwer';
      }
      return 'probe-wurf-ziel-card--sehr-schwer';
    },
    kritMissMin() {
      return Math.ceil(90 + this.effektiverZielwert * 0.1);
    },
    probeAnzeigeGesamtwert() {
      if (!this.kontext.zeigtModifikator || !this.zielModifikator) {
        return this.letzterWurf;
      }
      return this.zielModifikator.gesamtwertFuerAnzeige(this.letzterWurf);
    },
    probeModifikatorHatWert() {
      return this.kontext.zeigtModifikator && this.zielModifikator
        ? this.zielModifikator.modifikatorHatWert
        : false;
    },
    probeModifikatorBadgeText() {
      return this.zielModifikator ? this.zielModifikator.modifikatorBadgeText : '';
    },
    probeModifikatorBadgeKlasse() {
      return this.zielModifikator ? this.zielModifikator.modifikatorBadgeKlasse : '';
    },
  },
  methods: {
    /**
     * @param {{
     *   modus: 'begabung'|'faehigkeit'|'angriff',
     *   zielwert?: number,
     *   basiswert?: number,
     *   titel: string,
     *   untertitel?: string,
     *   zeigtModifikator?: boolean,
     *   basisLabel?: string,
     *   zielLabel?: string,
     * }} payload
     */
    oeffnen(payload) {
      const basis =
        payload.basiswert != null
          ? Number(payload.basiswert)
          : Number(payload.zielwert) || 0;
      const basisGekappt = Math.max(0, Math.min(100, Math.round(basis)));
      this.kontext = {
        modus: payload.modus || 'faehigkeit',
        basiswert: basisGekappt,
        zielwert: basisGekappt,
        titel: payload.titel || 'Probe',
        untertitel: payload.untertitel || '',
        zeigtModifikator: !!payload.zeigtModifikator,
        basisLabel: payload.basisLabel || 'Basiswert',
        zielLabel: payload.zielLabel || 'Zielwert (zu unterbieten)',
      };
      this.ergebnisZuruecksetzen();

      this.$nextTick(() => {
        this.$refs.zielModifikator?.zuruecksetzen?.();
        const el = this.$refs.modalElement;
        if (!el) {
          return;
        }
        this.modalInstanz = window.bootstrap.Modal.getOrCreateInstance(el);
        this.modalInstanz.show();
      });
    },
    wuerfeln() {
      const gen = this.wurfGeneration;
      const promise = this.$refs.wuerfelbecher?.wuerfeln('1W100');
      if (!promise || typeof promise.then !== 'function') {
        return;
      }
      promise.then((werte) => {
        if (gen !== this.wurfGeneration) {
          return;
        }
        this.letzterWurf = Array.isArray(werte) && werte.length ? Number(werte[0]) || null : null;
      });
    },
    ergebnisZuruecksetzen() {
      this.wurfGeneration += 1;
      this.letzterWurf = null;
      this.$refs.wuerfelbecher?.anzeigeZuruecksetzen?.();
      this.$refs.zielModifikator?.zuruecksetzen?.();
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
              <span class="material-symbols-outlined" aria-hidden="true">casino</span>
              {{ kontext.titel }}
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Schließen"></button>
          </div>
          <div class="modal-body">
            <p v-if="kontext.untertitel" class="small text-body-secondary mb-3">
              {{ kontext.untertitel }}
            </p>
            <p class="small text-body-secondary mb-2">
              Regelwerk: 1W100 — bestanden, wenn der Wurf <strong>≤ Zielwert</strong>.
              Kritischer Erfolg nur bei Fähigkeit (untere 10 % des Zielwerts).
              Kritischer Misserfolg von <strong>{{ kritMissMin }}</strong> bis 100.
            </p>

            <probe-ziel-modifikator
              v-if="kontext.zeigtModifikator"
              ref="zielModifikator"
              :basiswert="kontext.basiswert"
              id-prefix="probe-wurf-mod"
              :basis-label="kontext.basisLabel"
              :ziel-label="kontext.zielLabel"
              :show-basis-card="true"
              :show-ziel-card="true" />

            <div
              v-else
              class="card p-2 mb-3 probe-wurf-ziel-card"
              :class="wahrscheinlichkeitKlasse">
              <div class="d-flex justify-content-between align-items-center">
                <span class="small">Zielwert (zu unterbieten)</span>
                <span class="fs-6 fw-bold">{{ effektiverZielwert }}</span>
              </div>
            </div>

            <icon-text-button
              type="button"
              class="btn btn-primary btn-lg w-100 htbah-wuerfel-action-btn"
              icon="casino"
              @click="wuerfeln">
              1W100 würfeln
            </icon-text-button>
            <wuerfelbecher-wurf
              ref="wuerfelbecher"
              :auto-init="false"
              :prozentwurf-modifikator="effektiverModifikator"
              modus="w100" />
            <div
              v-if="auswertung"
              class="mt-2 p-3 rounded border probe-wurf-ergebnis"
              :class="ergebnisKlasse">
              <div class="text-center">
                <div class="small text-body-secondary mb-1">
                  {{ kontext.zeigtModifikator && effektiverModifikator !== 0 ? 'W100 (Rohwurf)' : 'W100' }}
                </div>
                <div class="fs-5 fw-semibold mb-2">{{ letzterWurf }}</div>
                <template v-if="kontext.zeigtModifikator">
                  <div class="small text-body-secondary mb-1">
                    Zielwert inkl. Bonus/Malus: <strong>{{ effektiverZielwert }}</strong>
                  </div>
                  <div class="d-flex justify-content-center flex-wrap gap-2 mb-2">
                    <span
                      v-if="probeModifikatorHatWert"
                      class="badge rounded-pill"
                      :class="probeModifikatorBadgeKlasse">
                      {{ probeModifikatorBadgeText }}
                    </span>
                  </div>
                </template>
                <div class="display-6 fw-bold mb-2">{{ probeAnzeigeGesamtwert }}</div>
                <div class="fw-semibold mb-1">{{ auswertung.label }}</div>
                <div class="small probe-wurf-ergebnis-hinweis">{{ auswertung.kurztext }}</div>
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
