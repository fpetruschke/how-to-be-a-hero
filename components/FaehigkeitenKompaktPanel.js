window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.FaehigkeitenKompaktPanel = {
  name: 'FaehigkeitenKompaktPanel',
  props: {
    entitaet: { type: Object, required: true },
    /** Section-Überschrift anzeigen */
    zeigeUeberschrift: { type: Boolean, default: true },
    /** Geistesblitz-Badges (nur Helden) */
    zeigeGeistesblitz: { type: Boolean, default: false },
    geistesblitzVerbleibend: {
      type: Object,
      default: null,
    },
  },
  emits: ['probe'],
  computed: {
    kategorien() {
      return ['handeln', 'wissen', 'soziales'];
    },
    summen() {
      const EF = window.HTBAH_ENTITAET_FAEHIGKEITEN_MODEL;
      if (EF && typeof EF.summenAusEntitaet === 'function') {
        return EF.summenAusEntitaet(this.entitaet);
      }
      const sum = (kat) =>
        (Array.isArray(this.entitaet[kat]) ? this.entitaet[kat] : []).reduce(
          (s, e) => s + (Number(e && e.value) || 0),
          0,
        );
      return { handeln: sum('handeln'), wissen: sum('wissen'), soziales: sum('soziales') };
    },
    begabungen() {
      const EF = window.HTBAH_ENTITAET_FAEHIGKEITEN_MODEL;
      if (EF && typeof EF.begabungenAusEntitaet === 'function') {
        return EF.begabungenAusEntitaet(this.entitaet);
      }
      return {
        handeln: Math.round(this.summen.handeln / 10),
        wissen: Math.round(this.summen.wissen / 10),
        soziales: Math.round(this.summen.soziales / 10),
      };
    },
    gbMax() {
      return {
        handeln: Math.round(this.begabungen.handeln / 10),
        wissen: Math.round(this.begabungen.wissen / 10),
        soziales: Math.round(this.begabungen.soziales / 10),
      };
    },
    gbVerbleibendAnzeige() {
      const roh =
        this.geistesblitzVerbleibend && typeof this.geistesblitzVerbleibend === 'object'
          ? this.geistesblitzVerbleibend
          : this.entitaet && this.entitaet.geistesblitzVerbleibend;
      const g = roh && typeof roh === 'object' ? roh : {};
      return {
        handeln: Number.isFinite(Number(g.handeln)) ? Number(g.handeln) : 0,
        wissen: Number.isFinite(Number(g.wissen)) ? Number(g.wissen) : 0,
        soziales: Number.isFinite(Number(g.soziales)) ? Number(g.soziales) : 0,
      };
    },
  },
  methods: {
    kategorieLabel(kategorie) {
      if (kategorie === 'handeln') {
        return 'Handeln';
      }
      if (kategorie === 'wissen') {
        return 'Wissen';
      }
      if (kategorie === 'soziales') {
        return 'Soziales';
      }
      return kategorie;
    },
    sortierteFaehigkeiten(kategorie) {
      const arr = Array.isArray(this.entitaet[kategorie]) ? this.entitaet[kategorie] : [];
      return [...arr].sort((a, b) =>
        String((a && a.name) || '').localeCompare(String((b && b.name) || ''), 'de'),
      );
    },
    basiswert(faehigkeit) {
      const v = Number(faehigkeit && faehigkeit.value);
      return Number.isFinite(v) ? v : 0;
    },
    sichtbareFaehigkeiten(kategorie) {
      return this.sortierteFaehigkeiten(kategorie).filter((f) => this.basiswert(f) > 0);
    },
    effektivwert(kategorie, faehigkeit) {
      const b = this.begabungen[kategorie] || 0;
      const v = Number(faehigkeit && faehigkeit.value);
      if (Number.isNaN(v)) {
        return 0;
      }
      return Math.min(100, v + b);
    },
    probeBegabung(kategorie) {
      const zielwert = this.begabungen[kategorie] || 0;
      this.$emit('probe', {
        typ: 'begabung',
        kategorie,
        zielwert,
        titel: 'Probe: Begabung ' + this.kategorieLabel(kategorie),
        untertitel:
          'Nur der Begabungswert — ohne einzelne Fähigkeit. Keine kritischen Erfolge (Regelwerk).',
      });
    },
    probeFaehigkeit(kategorie, faehigkeit) {
      const b = this.begabungen[kategorie] || 0;
      const fWert = Number(faehigkeit.value) || 0;
      const z = this.effektivwert(kategorie, faehigkeit);
      let untertitel =
        'Effektivwert ' +
        z +
        ' (' +
        fWert +
        ' + ' +
        b +
        ' Begabung, ' +
        this.kategorieLabel(kategorie) +
        ')';
      if (fWert + b > 100) {
        untertitel += '. Überzählige Punkte zählen für die Probe nicht (Regelwerk 3.4, Ziel 100).';
      }
      this.$emit('probe', {
        typ: 'faehigkeit',
        kategorie,
        faehigkeit,
        zielwert: z,
        titel: 'Probe: ' + (faehigkeit.name || 'Fähigkeit'),
        untertitel,
      });
    },
  },
  template: `
    <div
      class="htbah-iw-faehigkeiten-stats"
      role="region"
      aria-label="Begabungen und Fähigkeiten">
      <p v-if="zeigeUeberschrift" class="form-label small text-secondary mb-1">
        Fähigkeiten &amp; Begabungen
      </p>
      <div class="htbah-faehigkeit-kat-spalten">
        <div class="htbah-faehigkeit-kat-spalten-inner">
        <div
          v-for="kategorie in kategorien"
          :key="'iw-kompakt-' + kategorie"
          class="htbah-faehigkeit-kat-spalte">
          <div class="card h-100 htbah-iw-charakter-begabung-karte">
            <div class="card-body py-2 px-2">
              <h6 class="card-title small text-uppercase fw-bold mb-1">
                {{ kategorieLabel(kategorie) }}
              </h6>
              <div class="d-flex align-items-center gap-1 mb-2 htbah-faehigkeit-kat-zeilen-scroll">
                <span class="badge rounded-pill faehigkeiten-stat-badge faehigkeiten-stat-badge-begabung">
                  Begabung {{ begabungen[kategorie] }}
                </span>
                <button
                  type="button"
                  class="faehigkeiten-stat-info-btn faehigkeiten-probe-wuerfel-btn"
                  :aria-label="'W100-Probe auf Begabung ' + kategorieLabel(kategorie)"
                  @click="probeBegabung(kategorie)">
                  <span class="faehigkeiten-wuerfel-emoji" aria-hidden="true">🎲</span>
                </button>
                <span class="badge rounded-pill faehigkeiten-stat-badge faehigkeiten-stat-badge-summe">
                  Summe {{ summen[kategorie] }}
                </span>
                <span
                  v-if="zeigeGeistesblitz"
                  class="badge rounded-pill faehigkeiten-stat-badge faehigkeiten-stat-badge-geistesblitz">
                  GB {{ gbVerbleibendAnzeige[kategorie] }} / {{ gbMax[kategorie] }}
                </span>
              </div>
              <ul
                v-if="sichtbareFaehigkeiten(kategorie).length"
                class="list-unstyled mb-0 htbah-iw-faehigkeiten-kompakt">
                <li
                  v-for="faehigkeit in sichtbareFaehigkeiten(kategorie)"
                  :key="kategorie + '-' + (faehigkeit.name || '')"
                  class="htbah-iw-faehigkeit-zeile">
                  <span class="htbah-iw-faehigkeit-name" :title="faehigkeit.name">{{ faehigkeit.name }}</span>
                  <span class="d-inline-flex align-items-center gap-1 flex-shrink-0">
                    <span
                      class="htbah-iw-faehigkeit-werte"
                      :title="'Basis ' + basiswert(faehigkeit) + ', effektiv ' + effektivwert(kategorie, faehigkeit)">
                      <span class="text-muted">{{ basiswert(faehigkeit) }}</span>
                      <span class="text-body-secondary mx-1" aria-hidden="true">→</span>
                      <span>{{ effektivwert(kategorie, faehigkeit) }}</span>
                    </span>
                    <button
                      type="button"
                      class="faehigkeiten-stat-info-btn faehigkeiten-probe-wuerfel-btn py-0 px-1"
                      :aria-label="'W100-Probe: ' + faehigkeit.name"
                      @click="probeFaehigkeit(kategorie, faehigkeit)">
                      <span class="faehigkeiten-wuerfel-emoji" aria-hidden="true">🎲</span>
                    </button>
                  </span>
                </li>
              </ul>
              <p v-else class="small text-body-secondary mb-0">
                Keine Fähigkeiten mit Punkten.
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  `,
};
