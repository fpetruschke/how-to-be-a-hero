window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};
const HTBAH_VORLAGEN_MODEL = window.HTBAH_CHARAKTERVORLAGEN_MODEL;

window.HTBAH_KOMPONENTEN.CharakterVorlageModal = {
  props: {
    modus: {
      type: String,
      default: 'erstellung',
      validator: (v) => v === 'erstellung' || v === 'sessionZero',
    },
    inventarUeberschreiben: {
      type: Boolean,
      default: false,
    },
  },
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
    istSessionZeroModus() {
      return this.modus === 'sessionZero';
    },
    modalTitel() {
      return this.istSessionZeroModus ? 'Beispiel-Stereotyp wählen' : 'Charaktervorlage wählen';
    },
    einleitungstext() {
      if (this.istSessionZeroModus) {
        return 'Wähle eine Epoche und einen Heldentyp. Es werden nur die Fähigkeiten (Handeln, Wissen, Soziales) übernommen — Stammdaten und Notizen bleiben erhalten.';
      }
      return 'Wähle eine Epoche und einen Heldentyp. Die Vorlage setzt Fähigkeiten (nur Preset-Namen), Inventar und Stammdaten-Vorschläge (z. B. Name und Beruf). Geistesblitzpunkte werden danach automatisch ermittelt.';
    },
    uebernehmenButtonText() {
      return this.istSessionZeroModus ? 'Stereotyp übernehmen' : 'Vorlage übernehmen';
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
        } else {
          const standardEpoche =
            window.HTBAH && typeof window.HTBAH.standardCharakterEpocheFuerAktivesTheme === 'function'
              ? window.HTBAH.standardCharakterEpocheFuerAktivesTheme()
              : '';
          const epochenIds = this.epochenOptionen.map((e) => e.id);
          if (standardEpoche && epochenIds.includes(standardEpoche)) {
            this.epoche = standardEpoche;
          } else if (this.epochenOptionen.length) {
            this.epoche = this.epochenOptionen[0].id;
          }
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
    vorNachteileVorschau() {
      const v = this.vorlageVorschau;
      if (!v) {
        return { vorteile: [], nachteile: [] };
      }
      const CM = window.HTBAH_CHARAKTER_MODEL;
      if (CM && typeof CM.vorNachteileAusQuelle === 'function') {
        return CM.vorNachteileAusQuelle(v);
      }
      return {
        vorteile: Array.isArray(v.vorteile) ? v.vorteile : [],
        nachteile: Array.isArray(v.nachteile) ? v.nachteile : [],
      };
    },
    vorNachteilText(eintrag) {
      const CM = window.HTBAH_CHARAKTER_MODEL;
      return CM && typeof CM.vorNachteilBeschreibungVorschau === 'function'
        ? CM.vorNachteilBeschreibungVorschau(eintrag && eintrag.beschreibungHtml)
        : '';
    },
    async uebernehmen() {
      if (!this.kannUebernehmen || !this.vorlageVorschau) {
        return;
      }
      const nameTeil = this.vorlageVorschau.name
        ? `„${this.vorlageVorschau.name}“`
        : 'den gewählten Stereotyp';
      let beschreibung;
      if (this.istSessionZeroModus) {
        const faehigkeitenTeil = `Die Fähigkeiten (Handeln, Wissen, Soziales) von ${nameTeil} ersetzen die bisherigen Fähigkeiten. Stammdaten und Notizen bleiben erhalten.`;
        beschreibung = this.inventarUeberschreiben
          ? `${faehigkeitenTeil} Das Inventar wird ebenfalls durch das des Stereotypen ersetzt.`
          : faehigkeitenTeil;
      } else {
        beschreibung = `${nameTeil} übernehmen? Fähigkeiten, Inventar und Stammdaten-Vorschläge werden gesetzt. Bereits eingegebene Werte in diesen Bereichen werden ersetzt.`;
      }
      const bestaetigt = await window.HTBAH.ui.confirm({
        titel: this.istSessionZeroModus ? 'Stereotyp anwenden?' : 'Charaktervorlage anwenden?',
        beschreibung,
        bestaetigenText: this.uebernehmenButtonText,
        bestaetigenButtonClass: this.istSessionZeroModus ? 'btn-danger' : 'btn-primary',
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
        <div class="modal-content shadow-lg">
          <div class="modal-header">
            <h5 class="modal-title" id="charakterVorlageModalLabel">{{ modalTitel }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Schließen"></button>
          </div>
          <div class="modal-body">
            <p class="small text-body-secondary">{{ einleitungstext }}</p>
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
                <div class="small mt-2" v-if="vorNachteileVorschau().vorteile.length || vorNachteileVorschau().nachteile.length">
                  <strong>Vor- &amp; Nachteile:</strong>
                  <div v-if="vorNachteileVorschau().vorteile.length" class="mt-1">
                    <strong>Vorteile:</strong>
                    <ul class="mb-1 ps-3">
                      <li v-for="e in vorNachteileVorschau().vorteile" :key="e.id">
                        <span v-if="e.punkte" class="text-success fw-semibold">+{{ e.punkte }}</span>
                        {{ vorNachteilText(e) }}
                      </li>
                    </ul>
                  </div>
                  <div v-if="vorNachteileVorschau().nachteile.length">
                    <strong>Nachteile:</strong>
                    <ul class="mb-0 ps-3">
                      <li v-for="e in vorNachteileVorschau().nachteile" :key="e.id">
                        <span v-if="e.punkte" class="text-danger fw-semibold">−{{ e.punkte }}</span>
                        {{ vorNachteilText(e) }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </template>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Abbrechen</button>
            <button type="button" class="btn btn-primary" :disabled="!kannUebernehmen" @click="uebernehmen">
              {{ uebernehmenButtonText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
};
