window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};
const HTBAH_VORLAGEN_MODEL = window.HTBAH_CHARAKTERVORLAGEN_MODEL;

window.HTBAH_KOMPONENTEN.CharakterVorlageModal = {
  emits: ['angewendet'],
  data() {
    return {
      modalInstanz: null,
      katalog: [],
      laedt: false,
      fehler: '',
      epoche: '',
      ausgewaehlteDatei: '',
      vorlageVorschau: null,
    };
  },
  computed: {
    epochenOptionen() {
      if (window.HTBAH && typeof window.HTBAH.listeCharaktervorlagenEpochen === 'function') {
        return window.HTBAH.listeCharaktervorlagenEpochen();
      }
      return HTBAH_VORLAGEN_MODEL && Array.isArray(HTBAH_VORLAGEN_MODEL.EPOCHEN)
        ? HTBAH_VORLAGEN_MODEL.EPOCHEN
        : [];
    },
    eintraegeDerEpoche() {
      if (!this.epoche) {
        return [];
      }
      return this.katalog.filter((e) => e.meta && e.meta.epoche === this.epoche);
    },
    ausgewaehlterEintrag() {
      return this.eintraegeDerEpoche.find((e) => e.meta.datei === this.ausgewaehlteDatei) || null;
    },
    vorschauBegabungen() {
      if (!this.vorlageVorschau || !HTBAH_VORLAGEN_MODEL) {
        return null;
      }
      return HTBAH_VORLAGEN_MODEL.begabungenAusVorlage(this.vorlageVorschau);
    },
    vorschauPunkte() {
      if (!this.vorlageVorschau || !HTBAH_VORLAGEN_MODEL) {
        return 0;
      }
      const s = HTBAH_VORLAGEN_MODEL.summenAusVorlage(this.vorlageVorschau);
      return s.handeln + s.wissen + s.soziales;
    },
    kannUebernehmen() {
      return Boolean(this.vorlageVorschau) && this.vorschauPunkte <= 400;
    },
  },
  methods: {
    async oeffnen() {
      this.fehler = '';
      this.laedt = true;
      this.epoche = '';
      this.ausgewaehlteDatei = '';
      this.vorlageVorschau = null;
      this.$nextTick(() => {
        const el = this.$refs.modalElement;
        if (el && window.bootstrap) {
          this.modalInstanz = window.bootstrap.Modal.getOrCreateInstance(el);
          this.modalInstanz.show();
        }
      });
      try {
        if (window.HTBAH && typeof window.HTBAH.ladeCharaktervorlagenKatalog === 'function') {
          this.katalog = await window.HTBAH.ladeCharaktervorlagenKatalog();
        } else {
          this.katalog = [];
        }
        if (!this.katalog.length) {
          this.fehler = 'Keine Charaktervorlagen gefunden.';
        } else if (this.epochenOptionen.length) {
          this.epoche = this.epochenOptionen[0].id;
        }
      } catch {
        this.fehler = 'Vorlagen konnten nicht geladen werden.';
        this.katalog = [];
      } finally {
        this.laedt = false;
      }
    },
    schliessen() {
      if (this.modalInstanz) {
        this.modalInstanz.hide();
      }
    },
    epocheGewaehlt() {
      this.ausgewaehlteDatei = '';
      this.vorlageVorschau = null;
      const erste = this.eintraegeDerEpoche[0];
      if (erste) {
        this.vorlageAuswahlAendern(erste.meta.datei);
      }
    },
    async vorlageAuswahlAendern(datei) {
      this.ausgewaehlteDatei = datei;
      this.vorlageVorschau = null;
      if (!datei) {
        return;
      }
      const eintrag = this.katalog.find((e) => e.meta.datei === datei);
      if (eintrag && eintrag.vorlage) {
        this.vorlageVorschau = eintrag.vorlage;
        return;
      }
      if (window.HTBAH && typeof window.HTBAH.ladeCharaktervorlageInhalt === 'function') {
        this.vorlageVorschau = await window.HTBAH.ladeCharaktervorlageInhalt(datei);
      }
    },
    faehigkeitenZeilen(kategorie) {
      const arr = this.vorlageVorschau && Array.isArray(this.vorlageVorschau[kategorie])
        ? this.vorlageVorschau[kategorie]
        : [];
      return arr.map((f) => `${f.name} (${f.value})`).join(', ');
    },
    vorNachteileZeilen() {
      const paare =
        this.vorlageVorschau && Array.isArray(this.vorlageVorschau.vorNachteilePaare)
          ? this.vorlageVorschau.vorNachteilePaare
          : [];
      return paare.filter((paar) => paar && (paar.vorteilHtml || paar.nachteilHtml));
    },
    async uebernehmen() {
      if (!this.kannUebernehmen || !this.vorlageVorschau) {
        return;
      }
      const titel = this.vorlageVorschau.name
        ? `„${this.vorlageVorschau.name}“ übernehmen?`
        : 'Vorlage übernehmen?';
      const bestaetigt = await window.HTBAH.ui.confirm({
        titel: 'Charaktervorlage anwenden?',
        beschreibung: `${titel} Fähigkeiten, Inventar und Stammdaten-Vorschläge werden gesetzt. Bereits eingegebene Werte in diesen Bereichen werden ersetzt.`,
        bestaetigenText: 'Vorlage übernehmen',
        bestaetigenButtonClass: 'btn-primary',
        warnhinweisAnzeigen: false,
      });
      if (!bestaetigt) {
        return;
      }
      this.$emit('angewendet', JSON.parse(JSON.stringify(this.vorlageVorschau)));
      this.schliessen();
    },
  },
  template: `
    <div
      class="modal fade"
      ref="modalElement"
      tabindex="-1"
      aria-labelledby="charakterVorlageModalLabel"
      aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content shadow">
          <div class="modal-header">
            <h5 class="modal-title" id="charakterVorlageModalLabel">Charaktervorlage wählen</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Schließen"></button>
          </div>
          <div class="modal-body">
            <p class="small text-body-secondary">
              Wähle eine Epoche und einen Heldentyp. Die Vorlage setzt Fähigkeiten (nur Preset-Namen),
              Inventar und einen Berufs-Vorschlag. Geistesblitzpunkte werden danach automatisch ermittelt.
            </p>
            <div v-if="laedt" class="text-center py-3 text-body-secondary">Vorlagen werden geladen …</div>
            <div v-else-if="fehler" class="alert alert-warning py-2">{{ fehler }}</div>
            <template v-else>
              <div class="row g-2 mb-3">
                <div class="col-12 col-md-5">
                  <label class="form-label small text-body-secondary mb-1">Epoche</label>
                  <select class="form-select" v-model="epoche" @change="epocheGewaehlt">
                    <option v-for="ep in epochenOptionen" :key="ep.id" :value="ep.id">{{ ep.label }}</option>
                  </select>
                </div>
                <div class="col-12 col-md-7">
                  <label class="form-label small text-body-secondary mb-1">Heldentyp</label>
                  <select
                    class="form-select"
                    v-model="ausgewaehlteDatei"
                    @change="vorlageAuswahlAendern(ausgewaehlteDatei)">
                    <option value="">Bitte wählen …</option>
                    <option v-for="e in eintraegeDerEpoche" :key="e.meta.datei" :value="e.meta.datei">
                      {{ e.vorlage.name }}{{ e.vorlage.untertitel ? ' — ' + e.vorlage.untertitel : '' }}
                    </option>
                  </select>
                </div>
              </div>
              <div v-if="vorlageVorschau" class="card p-2 bg-body-tertiary border-0">
                <h6 class="mb-2">{{ vorlageVorschau.name }}</h6>
                <p v-if="vorlageVorschau.untertitel" class="small text-body-secondary mb-2">{{ vorlageVorschau.untertitel }}</p>
                <p v-if="vorlageVorschau.beruf" class="small mb-2"><strong>Beruf:</strong> {{ vorlageVorschau.beruf }}</p>
                <p class="small mb-1" v-if="vorschauBegabungen">
                  <strong>Begabungen:</strong>
                  Handeln {{ vorschauBegabungen.handeln }},
                  Wissen {{ vorschauBegabungen.wissen }},
                  Soziales {{ vorschauBegabungen.soziales }}
                  ({{ vorschauPunkte }} Fähigkeitspunkte)
                </p>
                <p v-if="vorschauPunkte > 400" class="small text-danger mb-2">
                  Diese Vorlage überschreitet 400 Punkte und kann nicht übernommen werden.
                </p>
                <div class="small mb-1" v-if="faehigkeitenZeilen('handeln')">
                  <strong>Handeln:</strong> {{ faehigkeitenZeilen('handeln') }}
                </div>
                <div class="small mb-1" v-if="faehigkeitenZeilen('wissen')">
                  <strong>Wissen:</strong> {{ faehigkeitenZeilen('wissen') }}
                </div>
                <div class="small mb-1" v-if="faehigkeitenZeilen('soziales')">
                  <strong>Soziales:</strong> {{ faehigkeitenZeilen('soziales') }}
                </div>
                <div class="small mb-0" v-if="vorlageVorschau.inventar && vorlageVorschau.inventar.length">
                  <strong>Inventar:</strong>
                  {{ vorlageVorschau.inventar.map(i => i.name).filter(Boolean).join(', ') }}
                </div>
                <div class="small mt-2" v-if="vorNachteileZeilen().length">
                  <strong>Vor- &amp; Nachteile:</strong>
                  <div
                    v-for="paar in vorNachteileZeilen()"
                    :key="paar.id || (paar.vorteilHtml + '-' + paar.nachteilHtml)"
                    class="border rounded p-2 mt-1 bg-body">
                    <div v-if="paar.vorteilHtml"><strong>Vorteil:</strong> <span v-html="paar.vorteilHtml"></span></div>
                    <div v-if="paar.nachteilHtml" class="mt-1"><strong>Nachteil:</strong> <span v-html="paar.nachteilHtml"></span></div>
                  </div>
                </div>
              </div>
            </template>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Abbrechen</button>
            <button type="button" class="btn btn-primary" :disabled="!kannUebernehmen" @click="uebernehmen">
              Vorlage übernehmen
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
};
