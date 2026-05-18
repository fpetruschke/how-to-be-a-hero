window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.ParadeModal = {
  components: {
    WuerfelbecherWurf: window.HTBAH_KOMPONENTEN.WuerfelbecherWurf,
    ProbeZielModifikator: window.HTBAH_KOMPONENTEN.ProbeZielModifikator,
  },
  props: {
    modalDomId: { type: String, default: 'paradeModal' },
  },
  data() {
    return {
      modalInstanz: null,
      kontext: {
        titel: 'Parade-Probe',
        basiswert: 0,
        ruestungen: [],
        waffenlosParade: false,
      },
      letzterWurf: null,
      wurfGeneration: 0,
    };
  },
  computed: {
    modalTitleId() {
      return this.modalDomId + 'Label';
    },
    ruestungenListe() {
      return Array.isArray(this.kontext.ruestungen) ? this.kontext.ruestungen : [];
    },
    hatRuestungenImInventar() {
      return this.ruestungenListe.length > 0;
    },
    zielModifikator() {
      return this.$refs.zielModifikator || null;
    },
    effektiverModifikator() {
      return this.zielModifikator ? this.zielModifikator.effektiverModifikator : 0;
    },
    zielwert() {
      return this.zielModifikator
        ? this.zielModifikator.zielwert
        : Math.max(0, Math.min(100, Math.round(Number(this.kontext.basiswert) || 0)));
    },
    auswertung() {
      if (this.letzterWurf === null) {
        return null;
      }
      return window.HTBAH.berechneProbeAuswertung(this.letzterWurf, this.zielwert, {
        nurBegabung: true,
      });
    },
    ergebnisKlasse() {
      const a = this.auswertung;
      if (!a) {
        return '';
      }
      return 'probe-wurf-ergebnis--' + a.stufe.replace(/_/g, '-');
    },
    paradeAnzeigeGesamtwert() {
      if (!this.zielModifikator) {
        return this.letzterWurf;
      }
      return this.zielModifikator.gesamtwertFuerAnzeige(this.letzterWurf);
    },
    paradeModifikatorHatWert() {
      return this.zielModifikator ? this.zielModifikator.modifikatorHatWert : false;
    },
    paradeModifikatorBadgeText() {
      return this.zielModifikator ? this.zielModifikator.modifikatorBadgeText : '';
    },
    paradeModifikatorBadgeKlasse() {
      return this.zielModifikator ? this.zielModifikator.modifikatorBadgeKlasse : '';
    },
    paradeErfolg() {
      const a = this.auswertung;
      if (!a) {
        return false;
      }
      return a.stufe === 'kritischer_erfolg' || a.stufe === 'erfolg';
    },
    zeigtHalberSchadenHinweis() {
      return this.kontext.waffenlosParade && this.paradeErfolg;
    },
  },
  methods: {
    /**
     * @param {{ titel?: string, basiswert: number, ruestungen?: Array, waffenlosParade?: boolean }} payload
     */
    oeffnen(payload) {
      const basiswert = Math.max(0, Math.min(100, Math.round(Number(payload?.basiswert) || 0)));
      const ruestungen = Array.isArray(payload?.ruestungen)
        ? payload.ruestungen
            .map((eintrag) => {
              const name = typeof eintrag?.name === 'string' ? eintrag.name.trim() : '';
              const rustwertRoh = eintrag?.rustwert;
              const rustwertText =
                rustwertRoh === null || rustwertRoh === undefined || String(rustwertRoh).trim() === ''
                  ? ''
                  : String(rustwertRoh).trim();
              return {
                name: name || 'Rüstung',
                rustwertText,
              };
            })
            .filter(Boolean)
        : [];
      this.kontext = {
        titel: typeof payload?.titel === 'string' && payload.titel.trim() ? payload.titel.trim() : 'Parade-Probe',
        basiswert,
        ruestungen,
        waffenlosParade: !!payload?.waffenlosParade,
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
              <span class="material-symbols-outlined" aria-hidden="true">security</span>
              {{ kontext.titel }}
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Schließen"></button>
          </div>
          <div class="modal-body">
            <p class="small text-body-secondary mb-2">
              Regelwerk: Parade ist eine <strong>W100-Probe auf Handeln</strong> (waffenlos / mit bloßen Händen).
              Kritische Angriffe können nicht pariert werden.
              <template v-if="kontext.waffenlosParade">
                Bei erfolgreicher waffenloser Parade wird <strong>halber Schaden</strong> eingesteckt.
              </template>
            </p>

            <div class="card p-3 mb-3 parade-ruestung-info-card">
              <div v-if="hatRuestungenImInventar" class="small text-body-secondary mb-2">
                Rüstungsgegenstände:
              </div>
              <ul v-if="hatRuestungenImInventar" class="small mb-0">
                <li v-for="(ruestung, index) in ruestungenListe" :key="'parade-ruestung-' + index">
                  {{ ruestung.name }}<span v-if="ruestung.rustwertText"> (Rüstwert {{ ruestung.rustwertText }})</span>
                </li>
              </ul>
              <p v-else class="small mb-0">
                Charakter trägt keine Rüstung oder Schutzkleidung.
              </p>
            </div>

            <probe-ziel-modifikator
              ref="zielModifikator"
              :basiswert="kontext.basiswert"
              id-prefix="parade-mod"
              basis-label="Basiswert Handeln"
              ziel-label="Zielwert Parade"
              :show-basis-card="true"
              :show-ziel-card="true" />

            <icon-text-button
              type="button"
              class="btn btn-primary btn-lg w-100"
              icon="casino"
              @click="wuerfeln">
              Parade würfeln (1W100)
            </icon-text-button>

            <wuerfelbecher-wurf
              ref="wuerfelbecher"
              class="mt-3"
              :auto-init="false"
              :prozentwurf-modifikator="effektiverModifikator"
              modus="w100" />
            <div
              v-if="auswertung"
              class="mt-2 p-3 rounded border probe-wurf-ergebnis"
              :class="ergebnisKlasse">
              <div class="text-center">
                <div class="small text-body-secondary mb-1">
                  {{ effektiverModifikator === 0 ? 'W100' : 'W100 (Rohwurf)' }}
                </div>
                <div class="fs-5 fw-semibold mb-2">{{ letzterWurf }}</div>
                <div class="small text-body-secondary mb-1">
                  Zielwert inkl. Bonus/Malus: <strong>{{ zielwert }}</strong>
                </div>
                <div class="d-flex justify-content-center flex-wrap gap-2 mb-2">
                  <span
                    v-if="paradeModifikatorHatWert"
                    class="badge rounded-pill"
                    :class="paradeModifikatorBadgeKlasse">
                    {{ paradeModifikatorBadgeText }}
                  </span>
                  <span class="badge rounded-pill text-bg-primary">
                    Summe: {{ paradeAnzeigeGesamtwert }}
                  </span>
                </div>
                <div class="display-6 fw-bold mb-2">{{ paradeAnzeigeGesamtwert }}</div>
                <div class="fw-semibold mb-1">{{ auswertung.label }}</div>
                <div class="small probe-wurf-ergebnis-hinweis">{{ auswertung.kurztext }}</div>
                <div
                  v-if="zeigtHalberSchadenHinweis"
                  class="alert alert-info py-2 px-3 small mt-3 mb-0 text-start">
                  Waffenlose Parade erfolgreich: Der Verteidiger steckt <strong>halben Schaden</strong> ein
                  (im Modal „Schaden würfeln“ anwenden).
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
