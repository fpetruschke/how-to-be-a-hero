window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.ProbeWurfModal = {
  components: {
    WuerfelbecherWurf: window.HTBAH_KOMPONENTEN.WuerfelbecherWurf,
  },
  data() {
    return {
      modalInstanz: null,
      kontext: {
        modus: 'faehigkeit',
        zielwert: 0,
        titel: '',
        untertitel: '',
      },
      letzterWurf: null,
    };
  },
  computed: {
    auswertung() {
      if (this.letzterWurf === null) {
        return null;
      }
      return window.HTBAH.berechneProbeAuswertung(this.letzterWurf, this.kontext.zielwert, {
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
      const z = Math.max(0, Math.min(100, Math.round(Number(this.kontext.zielwert) || 0)));
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
      const z = Math.max(0, Math.round(Number(this.kontext.zielwert) || 0));
      return Math.ceil(90 + z * 0.1);
    },
  },
  methods: {
    /**
     * @param {{ modus: 'begabung'|'faehigkeit', zielwert: number, titel: string, untertitel?: string }} payload
     */
    oeffnen(payload) {
      this.kontext = {
        modus: payload.modus,
        zielwert: Math.max(0, Number(payload.zielwert) || 0),
        titel: payload.titel || 'Probe',
        untertitel: payload.untertitel || '',
      };
      this.letzterWurf = null;

      this.$nextTick(() => {
        const el = this.$refs.modalElement;
        if (!el) {
          return;
        }
        this.modalInstanz = window.bootstrap.Modal.getOrCreateInstance(el);
        this.modalInstanz.show();
      });
    },
    wuerfeln() {
      this.$refs.wuerfelbecher?.wuerfeln('1W100').then((werte) => {
        this.letzterWurf = Array.isArray(werte) && werte.length ? Number(werte[0]) || null : null;
      });
    },
  },
  template: `
    <div
      class="modal fade"
      id="probeWurfModal"
      ref="modalElement"
      tabindex="-1"
      aria-labelledby="probeWurfModalLabel"
      aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content shadow">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center gap-2" id="probeWurfModalLabel">
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
            <div class="card p-2 mb-3 probe-wurf-ziel-card" :class="wahrscheinlichkeitKlasse">
              <div class="d-flex justify-content-between align-items-center">
                <span class="small">Zielwert (zu unterbieten)</span>
                <span class="fs-6 fw-bold">{{ kontext.zielwert }}</span>
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
              modus="w100" />
            <div
              v-if="auswertung"
              class="mt-2 p-3 rounded border probe-wurf-ergebnis"
              :class="ergebnisKlasse">
              <div class="text-center">
                <div class="small text-body-secondary mb-1">W100</div>
                <div class="display-6 fw-bold mb-2">{{ letzterWurf }}</div>
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
