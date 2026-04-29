window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.ParadeModal = {
  data() {
    return {
      modalInstanz: null,
      kontext: {
        titel: 'Parade-Probe',
        basiswert: 0,
        ruestungen: [],
      },
      modifikatorArt: 'kein',
      bonusWert: 1,
      malusWert: -1,
      letzterWurf: null,
    };
  },
  computed: {
    ruestungenListe() {
      return Array.isArray(this.kontext.ruestungen) ? this.kontext.ruestungen : [];
    },
    hatRuestungenImInventar() {
      return this.ruestungenListe.length > 0;
    },
    effektiverModifikator() {
      if (!this.hatRuestungenImInventar || this.modifikatorArt === 'kein') {
        return 0;
      }
      if (this.modifikatorArt === 'bonus') {
        const b = Math.round(Number(this.bonusWert) || 0);
        return Math.max(1, Math.min(100, b));
      }
      const m = Math.round(Number(this.malusWert) || 0);
      return Math.max(-100, Math.min(-1, m));
    },
    zielwert() {
      const basis = Math.max(0, Math.round(Number(this.kontext.basiswert) || 0));
      const mod = this.effektiverModifikator;
      return Math.max(0, Math.min(100, basis + mod));
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
    kritMissMin() {
      return Math.ceil(90 + this.zielwert * 0.1);
    },
  },
  methods: {
    /**
     * @param {{ titel?: string, basiswert: number, ruestungen?: Array<{name?: string, rustwert?: string|number}> }} payload
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
      };
      this.modifikatorArt = 'kein';
      this.bonusWert = 1;
      this.malusWert = -1;
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
      this.letzterWurf = window.HTBAH.wuerfelW100();
      window.HTBAH.spieleWuerfelSounds(1);
    },
  },
  template: `
    <div
      class="modal fade"
      id="paradeModal"
      ref="modalElement"
      tabindex="-1"
      aria-labelledby="paradeModalLabel"
      aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content shadow">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center gap-2" id="paradeModalLabel">
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
              Regelwerk: Parade ist eine <strong>W100-Probe auf Handeln</strong>. Kritische Angriffe können nicht pariert werden.
            </p>
            <div class="card p-3 mb-3 probe-wurf-ziel-card">
              <div class="d-flex justify-content-between align-items-center">
                <span>Basiswert Handeln</span>
                <span class="fs-5 fw-bold">{{ kontext.basiswert }}</span>
              </div>
            </div>

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

            <div class="mb-3">
              <label class="form-label small text-secondary mb-1">SL-Modifikator</label>
              <div class="d-flex flex-wrap gap-3">
                <div class="form-check">
                  <input
                    id="parade-mod-kein"
                    class="form-check-input"
                    type="radio"
                    value="kein"
                    v-model="modifikatorArt" />
                  <label class="form-check-label" for="parade-mod-kein">Kein Modifikator</label>
                </div>
                <div class="form-check">
                  <input
                    id="parade-mod-bonus"
                    class="form-check-input"
                    type="radio"
                    value="bonus"
                    v-model="modifikatorArt" />
                  <label class="form-check-label" for="parade-mod-bonus">Bonus</label>
                </div>
                <div class="form-check">
                  <input
                    id="parade-mod-malus"
                    class="form-check-input"
                    type="radio"
                    value="malus"
                    v-model="modifikatorArt" />
                  <label class="form-check-label" for="parade-mod-malus">Malus</label>
                </div>
              </div>
            </div>

            <div class="row g-2 mb-3">
              <div class="col-12 col-md-6" v-if="modifikatorArt === 'bonus'">
                <div class="form-floating">
                  <input
                    id="parade-bonus"
                    type="number"
                    class="form-control"
                    v-model.number="bonusWert"
                    :disabled="modifikatorArt !== 'bonus'"
                    min="1"
                    max="100"
                    step="1"
                    placeholder=" " />
                  <label for="parade-bonus">Bonus (1 bis 100)</label>
                </div>
              </div>
              <div class="col-12 col-md-6" v-if="modifikatorArt === 'malus'">
                <div class="form-floating">
                  <input
                    id="parade-malus"
                    type="number"
                    class="form-control"
                    v-model.number="malusWert"
                    :disabled="modifikatorArt !== 'malus'"
                    min="-100"
                    max="-1"
                    step="1"
                    placeholder=" " />
                  <label for="parade-malus">Malus (-1 bis -100)</label>
                </div>
              </div>
            </div>

            <div class="card p-3 mb-3 probe-wurf-ziel-card">
              <div class="d-flex justify-content-between align-items-center">
                <span>Zielwert Parade</span>
                <span class="fs-5 fw-bold">{{ zielwert }}</span>
              </div>
              <div class="small text-body-secondary mt-1">
                Kritischer Misserfolg: {{ kritMissMin }} bis 100
              </div>
            </div>

            <icon-text-button
              type="button"
              class="btn btn-primary btn-lg w-100"
              icon="casino"
              @click="wuerfeln">
              Parade würfeln (1W100)
            </icon-text-button>

            <div
              v-if="auswertung"
              class="mt-3 p-3 rounded border probe-wurf-ergebnis"
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
