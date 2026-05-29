window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

(function () {
  const STANDARD =
    window.HTBAH && window.HTBAH.SPIELLEITER_PDF_STANDARD_AUSWAHL
      ? { ...window.HTBAH.SPIELLEITER_PDF_STANDARD_AUSWAHL }
      : {
          gruppe: true,
          orte: true,
          fraktionen: true,
          npcs: true,
          bestien: true,
          gegenstaende: true,
          raetsel: true,
          abenteuerbuch: true,
          entitaetsBilder: true,
          galerie: true,
          interaktiveWelt: true,
        };

  const PDF_STIL_OPTIONEN =
    window.HTBAH && Array.isArray(window.HTBAH.CHARAKTER_PDF_STIL_OPTIONEN)
      ? window.HTBAH.CHARAKTER_PDF_STIL_OPTIONEN
      : [
          { value: 'fantasy-mittelalter', label: 'Fantasy / Mittelalter' },
          { value: 'gegenwart', label: 'Gegenwart' },
          { value: 'modern-futuristisch', label: 'Modern / Futuristisch' },
          { value: 'einfach', label: 'Einfach' },
        ];

  const SEKTION_KEYS = [
    'gruppe',
    'orte',
    'fraktionen',
    'npcs',
    'bestien',
    'gegenstaende',
    'raetsel',
    'abenteuerbuch',
    'galerie',
    'interaktiveWelt',
  ];

  const LEER_VERFUEGBAR = {
    gruppe: false,
    orte: false,
    fraktionen: false,
    npcs: false,
    bestien: false,
    gegenstaende: false,
    raetsel: false,
    abenteuerbuch: false,
    entitaetsBilder: false,
    galerie: false,
    interaktiveWelt: false,
  };

  function ermittleVerfuegbarkeit(kampagneId) {
    const fn =
      window.HTBAH && typeof window.HTBAH.ermittleSpielleiterPdfVerfuegbarkeit === 'function'
        ? window.HTBAH.ermittleSpielleiterPdfVerfuegbarkeit
        : null;
    if (!fn || !kampagneId) {
      return { ...LEER_VERFUEGBAR };
    }
    return { ...LEER_VERFUEGBAR, ...fn(kampagneId) };
  }

  function standardAuswahlFuerVerfuegbar(verfuegbar) {
    const auswahl = { ...STANDARD };
    Object.keys(auswahl).forEach((key) => {
      if (verfuegbar[key] === false) {
        auswahl[key] = false;
      }
    });
    return auswahl;
  }

  window.HTBAH_KOMPONENTEN.SpielleiterPdfExportModal = {
    components: {
      CharakterPdfModal: window.HTBAH_KOMPONENTEN.CharakterPdfModal,
    },
    props: {
      kampagneId: { type: String, default: '' },
      kampagneName: { type: String, default: '' },
    },
    emits: ['schliessen', 'fertig'],
    data() {
      return {
        offen: false,
        laedt: false,
        statusText: '',
        auswahl: { ...STANDARD },
        charakterDarstellung: 'kompakt',
        weltSeiten: 1,
        weltQuerformat: true,
        pdfStil: 'fantasy-mittelalter',
        kapitelSeitenumbruch: false,
        cheatSheet: false,
        sicherheitsmechanismen: false,
        pdfBlobUrl: '',
        pdfDateiname: '',
        pdfVorschauOffen: false,
        verfuegbar: { ...LEER_VERFUEGBAR },
        progressProzent: 0,
        progressSchritt: 0,
        progressSchritteGesamt: 0,
      };
    },
    computed: {
      auswahlToggleKeys() {
        return Object.keys(this.auswahl).filter((key) => this.verfuegbar[key] !== false);
      },
      alleSektionenAusgewaehlt() {
        const keys = this.auswahlToggleKeys;
        if (!keys.length) {
          return false;
        }
        return keys.every((key) => this.auswahl[key]);
      },
      teilweiseSektionenAusgewaehlt() {
        const keys = this.auswahlToggleKeys;
        if (!keys.length) {
          return false;
        }
        const anzahl = keys.filter((key) => this.auswahl[key]).length;
        return anzahl > 0 && anzahl < keys.length;
      },
      pdfStilOptionen() {
        return PDF_STIL_OPTIONEN;
      },
      hatExportierbareInhalte() {
        return SEKTION_KEYS.some((key) => this.verfuegbar[key]);
      },
      hatAuswahl() {
        return SEKTION_KEYS.some((key) => this.auswahl[key]);
      },
      kannExportieren() {
        const hatInhalt = this.hatAuswahl || this.cheatSheet || this.sicherheitsmechanismen;
        const erlaubt = this.hatExportierbareInhalte || this.cheatSheet || this.sicherheitsmechanismen;
        return hatInhalt && !this.laedt && !!this.kampagneId && erlaubt;
      },
    },
    watch: {
      teilweiseSektionenAusgewaehlt() {
        this.$nextTick(() => this.aktualisiereAlleCheckboxIndeterminate());
      },
      alleSektionenAusgewaehlt() {
        this.$nextTick(() => this.aktualisiereAlleCheckboxIndeterminate());
      },
      offen(neu) {
        if (neu) {
          this.$nextTick(() => this.aktualisiereAlleCheckboxIndeterminate());
        }
      },
      pdfStil() {
        this.onExportEinstellungGeaendert();
      },
      charakterDarstellung() {
        this.onExportEinstellungGeaendert();
      },
      weltSeiten() {
        this.onExportEinstellungGeaendert();
      },
      weltQuerformat() {
        this.onExportEinstellungGeaendert();
      },
      kapitelSeitenumbruch() {
        this.onExportEinstellungGeaendert();
      },
      cheatSheet() {
        this.onExportEinstellungGeaendert();
      },
      sicherheitsmechanismen() {
        this.onExportEinstellungGeaendert();
      },
      auswahl: {
        deep: true,
        handler() {
          this.onExportEinstellungGeaendert();
        },
      },
    },
    beforeUnmount() {
      this.revokeBlobUrl();
    },
    methods: {
      revokeBlobUrl() {
        if (this.pdfBlobUrl) {
          URL.revokeObjectURL(this.pdfBlobUrl);
          this.pdfBlobUrl = '';
        }
      },
      onExportEinstellungGeaendert() {
        if (this.laedt || !this.pdfBlobUrl) {
          return;
        }
        this.pdfVorschauSchliessen();
        this.revokeBlobUrl();
        this.pdfDateiname = '';
        this.statusText = '';
        this.progressProzent = 0;
        this.progressSchritt = 0;
        this.progressSchritteGesamt = 0;
      },
      oeffnen() {
        this.verfuegbar = ermittleVerfuegbarkeit(this.kampagneId);
        this.auswahl = standardAuswahlFuerVerfuegbar(this.verfuegbar);
        this.charakterDarstellung = 'kompakt';
        this.weltSeiten = 1;
        this.weltQuerformat = true;
        this.pdfStil = 'fantasy-mittelalter';
        this.kapitelSeitenumbruch = false;
        this.cheatSheet = false;
        this.sicherheitsmechanismen = false;
        this.statusText = '';
        this.revokeBlobUrl();
        this.pdfDateiname = '';
        this.pdfVorschauOffen = false;
        this.progressProzent = 0;
        this.progressSchritt = 0;
        this.progressSchritteGesamt = 0;
        this.offen = true;
        this.$nextTick(() => this.aktualisiereAlleCheckboxIndeterminate());
      },
      aktualisiereAlleCheckboxIndeterminate() {
        const el = this.$refs.alleAuswahlCheckbox;
        if (el) {
          el.indeterminate = this.teilweiseSektionenAusgewaehlt;
        }
      },
      onAlleSektionenAendern(event) {
        this.alleAuswahl(!!(event && event.target && event.target.checked));
        this.$nextTick(() => this.aktualisiereAlleCheckboxIndeterminate());
      },
      scrollZuFortschritt() {
        this.$nextTick(() => {
          const body = this.$refs.modalBody;
          if (body && typeof body.scrollTop === 'number') {
            body.scrollTop = body.scrollHeight;
          }
          const anker = this.$refs.fortschrittAnker;
          if (anker && typeof anker.scrollIntoView === 'function') {
            anker.scrollIntoView({ block: 'end', behavior: 'smooth' });
          }
        });
      },
      setzeProgress(info) {
        if (info && typeof info === 'object') {
          this.statusText = typeof info.text === 'string' ? info.text : '';
          this.progressProzent =
            typeof info.percent === 'number' ? Math.min(100, Math.max(0, info.percent)) : 0;
          this.progressSchritt = typeof info.current === 'number' ? info.current : 0;
          this.progressSchritteGesamt = typeof info.total === 'number' ? info.total : 0;
          return;
        }
        if (typeof info === 'string') {
          this.statusText = info;
        }
      },
      schliessen() {
        if (this.laedt) {
          return;
        }
        this.pdfVorschauOffen = false;
        this.offen = false;
        this.$emit('schliessen');
      },
      pdfVorschauSchliessen() {
        this.pdfVorschauOffen = false;
      },
      alleAuswahl(setzen) {
        Object.keys(this.auswahl).forEach((key) => {
          if (this.verfuegbar[key] !== false) {
            this.auswahl[key] = setzen;
          }
        });
      },
      async exportStarten() {
        const fn =
          window.HTBAH && typeof window.HTBAH.erzeugeSpielleiterPdfBlob === 'function'
            ? window.HTBAH.erzeugeSpielleiterPdfBlob
            : null;
        if (!fn || !this.kannExportieren) {
          return;
        }
        this.laedt = true;
        this.statusText = 'PDF wird erstellt …';
        this.progressProzent = 0;
        this.progressSchritt = 0;
        this.progressSchritteGesamt = 0;
        this.pdfVorschauOffen = false;
        this.revokeBlobUrl();
        this.scrollZuFortschritt();
        try {
          const { blob, dateiname } = await fn(this.kampagneId, {
            auswahl: { ...this.auswahl },
            charakterDarstellung: this.charakterDarstellung,
            weltSeiten: this.weltSeiten,
            weltQuerformat: this.weltQuerformat,
            pdfStil: this.pdfStil,
            kapitelSeitenumbruch: this.kapitelSeitenumbruch,
            cheatSheet: this.cheatSheet,
            sicherheitsmechanismen: this.sicherheitsmechanismen,
            onProgress: (info) => {
              this.setzeProgress(info);
              this.scrollZuFortschritt();
            },
          });
          this.pdfBlobUrl = URL.createObjectURL(blob);
          this.pdfDateiname = dateiname;
          this.progressProzent = 100;
          this.statusText = 'Fertig — Vorschau, Download oder Modal schließen.';
          this.scrollZuFortschritt();
          this.$emit('fertig', { dateiname });
        } catch (e) {
          console.error(e);
          this.statusText = '';
          this.progressProzent = 0;
          this.progressSchritt = 0;
          this.progressSchritteGesamt = 0;
          await window.HTBAH.ui.alert({
            titel: 'PDF-Export fehlgeschlagen',
            beschreibung: e && e.message ? e.message : 'Das PDF konnte nicht erzeugt werden.',
          });
        } finally {
          this.laedt = false;
        }
      },
      vorschauOeffnen() {
        if (!this.pdfBlobUrl) {
          return;
        }
        this.pdfVorschauOffen = true;
      },
      downloadPdf() {
        if (!this.pdfBlobUrl) {
          return;
        }
        const a = document.createElement('a');
        a.href = this.pdfBlobUrl;
        a.download = this.pdfDateiname || 'htbah-spielleiter.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },
    },
    template: `
      <div
        v-if="offen"
        class="regelwerk-modal-layer htbah-sl-pdf-export-modal-layer"
        @click.self="schliessen">
        <div
          class="regelwerk-modal-window htbah-sl-pdf-export-modal-window card shadow"
          role="dialog"
          aria-modal="true"
          aria-labelledby="htbah-sl-pdf-export-titel">
          <div class="regelwerk-modal-header d-flex justify-content-between align-items-center p-2 border-bottom">
            <strong id="htbah-sl-pdf-export-titel">Kampagnen-PDF exportieren</strong>
            <button type="button" class="btn-close" aria-label="Schließen" :disabled="laedt" @click="schliessen"></button>
          </div>
          <div ref="modalBody" class="card-body py-3 overflow-auto htbah-sl-pdf-export-modal-body">
            <p class="small text-body-secondary mb-3">
              Wähle die Inhalte für <strong>{{ kampagneName || 'diese Kampagne' }}</strong>.
              Der Export kann bei vielen Einträgen etwas dauern.
            </p>

            <div class="mb-3">
              <label class="form-label small text-secondary mb-1" for="sl-pdf-stil">PDF-Theme</label>
              <select id="sl-pdf-stil" v-model="pdfStil" class="form-select form-select-sm" :disabled="laedt">
                <option v-for="opt in pdfStilOptionen" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
              <p class="form-text mb-0 mt-1">
                Gilt für Titelseite, Entitätskarten und kompakte Charakterübersichten. Volle Charakterbögen nutzen dasselbe Theme.
              </p>
            </div>

            <div class="mb-3 pb-3 border-bottom">
              <div class="form-check form-switch mb-2">
                <input
                  id="sl-pdf-cheat-sheet"
                  v-model="cheatSheet"
                  class="form-check-input"
                  type="checkbox"
                  role="switch"
                  :disabled="laedt" />
                <label class="form-check-label" for="sl-pdf-cheat-sheet">Cheat-Sheet (Regelkurzreferenz)</label>
              </div>
              <p class="form-text mb-2 mt-0">
                Direkt nach dem Deckblatt: Fähigkeiten, Geistesblitz, Status, Proben, Kampf, Waffen und Gegner-Balancing.
              </p>
              <div class="form-check form-switch mb-2">
                <input
                  id="sl-pdf-sicherheitsmechanismen"
                  v-model="sicherheitsmechanismen"
                  class="form-check-input"
                  type="checkbox"
                  role="switch"
                  :disabled="laedt" />
                <label class="form-check-label" for="sl-pdf-sicherheitsmechanismen">Sicherheitsmechanismen (Session Zero)</label>
              </div>
              <p class="form-text mb-2 mt-0">
                Nach Deckblatt bzw. Cheat-Sheet: Tabu, Schleier und X-Karte — wie im Sicherheitsmechanismen-Modal.
                Ohne Einträge werden Linienfelder zum handschriftlichen Ausfüllen exportiert.
              </p>
              <div class="form-check form-switch mb-0">
                <input
                  id="sl-pdf-kapitel-umbruch"
                  v-model="kapitelSeitenumbruch"
                  class="form-check-input"
                  type="checkbox"
                  role="switch"
                  :disabled="laedt" />
                <label class="form-check-label" for="sl-pdf-kapitel-umbruch">Neue Seite vor jedem Kapitel</label>
              </div>
              <p class="form-text mb-0 mt-1">
                Aus: kompakte Darstellung — Kapitel (z. B. NPCs, Orte) fließen ohne festen Seitenumbruch hintereinander.
              </p>
            </div>

            <p v-if="!hatExportierbareInhalte && !cheatSheet && !sicherheitsmechanismen" class="small text-body-secondary mb-3">
              In dieser Kampagne gibt es noch keine exportierbaren Inhalte (z. B. Charaktere, Weltenbau-Einträge oder Abenteuerbuch-Text).
            </p>

            <template v-else>
            <div class="form-check mb-3">
              <input
                id="sl-pdf-alle"
                ref="alleAuswahlCheckbox"
                class="form-check-input"
                type="checkbox"
                :checked="alleSektionenAusgewaehlt"
                :disabled="laedt || !auswahlToggleKeys.length"
                @change="onAlleSektionenAendern" />
              <label class="form-check-label" for="sl-pdf-alle">Alle auswählen</label>
            </div>

            <div class="row g-2 mb-3">
              <div v-if="verfuegbar.gruppe" class="col-12 col-sm-6">
                <div class="form-check">
                  <input id="sl-pdf-gruppe" v-model="auswahl.gruppe" class="form-check-input" type="checkbox" :disabled="laedt" />
                  <label class="form-check-label" for="sl-pdf-gruppe">Gruppe / Charaktere</label>
                </div>
              </div>
              <div v-if="verfuegbar.orte" class="col-12 col-sm-6">
                <div class="form-check">
                  <input id="sl-pdf-orte" v-model="auswahl.orte" class="form-check-input" type="checkbox" :disabled="laedt" />
                  <label class="form-check-label" for="sl-pdf-orte">Orte</label>
                </div>
              </div>
              <div v-if="verfuegbar.fraktionen" class="col-12 col-sm-6">
                <div class="form-check">
                  <input id="sl-pdf-fraktionen" v-model="auswahl.fraktionen" class="form-check-input" type="checkbox" :disabled="laedt" />
                  <label class="form-check-label" for="sl-pdf-fraktionen">Fraktionen</label>
                </div>
              </div>
              <div v-if="verfuegbar.npcs" class="col-12 col-sm-6">
                <div class="form-check">
                  <input id="sl-pdf-npcs" v-model="auswahl.npcs" class="form-check-input" type="checkbox" :disabled="laedt" />
                  <label class="form-check-label" for="sl-pdf-npcs">NPCs</label>
                </div>
              </div>
              <div v-if="verfuegbar.bestien" class="col-12 col-sm-6">
                <div class="form-check">
                  <input id="sl-pdf-bestien" v-model="auswahl.bestien" class="form-check-input" type="checkbox" :disabled="laedt" />
                  <label class="form-check-label" for="sl-pdf-bestien">Bestien</label>
                </div>
              </div>
              <div v-if="verfuegbar.gegenstaende" class="col-12 col-sm-6">
                <div class="form-check">
                  <input id="sl-pdf-gegenstaende" v-model="auswahl.gegenstaende" class="form-check-input" type="checkbox" :disabled="laedt" />
                  <label class="form-check-label" for="sl-pdf-gegenstaende">Gegenstände</label>
                </div>
              </div>
              <div v-if="verfuegbar.raetsel" class="col-12 col-sm-6">
                <div class="form-check">
                  <input id="sl-pdf-raetsel" v-model="auswahl.raetsel" class="form-check-input" type="checkbox" :disabled="laedt" />
                  <label class="form-check-label" for="sl-pdf-raetsel">Rätsel</label>
                </div>
              </div>
              <div v-if="verfuegbar.abenteuerbuch" class="col-12 col-sm-6">
                <div class="form-check">
                  <input id="sl-pdf-abenteuerbuch" v-model="auswahl.abenteuerbuch" class="form-check-input" type="checkbox" :disabled="laedt" />
                  <label class="form-check-label" for="sl-pdf-abenteuerbuch">Abenteuerbuch</label>
                </div>
              </div>
              <div v-if="verfuegbar.entitaetsBilder" class="col-12 col-sm-6">
                <div class="form-check">
                  <input id="sl-pdf-bilder" v-model="auswahl.entitaetsBilder" class="form-check-input" type="checkbox" :disabled="laedt" />
                  <label class="form-check-label" for="sl-pdf-bilder">Bilder in Entitäten</label>
                </div>
              </div>
              <div v-if="verfuegbar.galerie" class="col-12 col-sm-6">
                <div class="form-check">
                  <input id="sl-pdf-galerie" v-model="auswahl.galerie" class="form-check-input" type="checkbox" :disabled="laedt" />
                  <label class="form-check-label" for="sl-pdf-galerie">Importierte Galerie</label>
                </div>
              </div>
              <div v-if="verfuegbar.interaktiveWelt" class="col-12">
                <div class="form-check">
                  <input id="sl-pdf-welt" v-model="auswahl.interaktiveWelt" class="form-check-input" type="checkbox" :disabled="laedt" />
                  <label class="form-check-label" for="sl-pdf-welt">Interaktive Welt</label>
                </div>
              </div>
            </div>

            <div v-if="verfuegbar.gruppe && auswahl.gruppe" class="mb-3">
              <label class="form-label small text-secondary mb-1">Charakterdarstellung</label>
              <select v-model="charakterDarstellung" class="form-select form-select-sm" :disabled="laedt">
                <option value="kompakt">Kompakte Übersicht pro Charakter</option>
                <option value="voller_bogen">Voller Charakterbogen (3 DIN-A4 pro Mitglied)</option>
              </select>
            </div>

            <div v-if="verfuegbar.interaktiveWelt && auswahl.interaktiveWelt" class="mb-3">
              <label class="form-label small text-secondary mb-1" for="sl-pdf-welt-seiten">Interaktive Welt — Seiten im PDF</label>
              <select id="sl-pdf-welt-seiten" v-model.number="weltSeiten" class="form-select form-select-sm mb-2" :disabled="laedt">
                <option :value="1">1 Seite (gesamte Karte)</option>
                <option :value="2">2 Seiten (1×2)</option>
                <option :value="4">4 Seiten (2×2)</option>
                <option :value="8">8 Seiten (2×4)</option>
              </select>
              <label class="form-label small text-secondary mb-1" for="sl-pdf-welt-ausrichtung">Interaktive Welt — Seitenausrichtung</label>
              <select id="sl-pdf-welt-ausrichtung" v-model="weltQuerformat" class="form-select form-select-sm" :disabled="laedt">
                <option :value="false">Hochformat (DIN A4)</option>
                <option :value="true">Querformat (DIN A4)</option>
              </select>
              <p class="form-text mb-0 mt-1">Gilt nur für die Welt-Karten im PDF, nicht für den restlichen Export.</p>
            </div>
            </template>

            <div
              v-if="laedt || statusText"
              ref="fortschrittAnker"
              class="htbah-sl-pdf-export-fortschritt border-top pt-3 mt-2">
              <div v-if="laedt" class="d-flex justify-content-between align-items-center small mb-1">
                <span class="text-body-secondary">{{ statusText || 'PDF wird erstellt …' }}</span>
                <span class="fw-semibold tabular-nums">{{ progressProzent }}%</span>
              </div>
              <p v-else-if="statusText" class="small text-body-secondary mb-2">{{ statusText }}</p>
              <div
                v-if="laedt"
                class="progress mb-0"
                style="height:8px;"
                role="progressbar"
                :aria-valuenow="progressProzent"
                aria-valuemin="0"
                aria-valuemax="100"
                :aria-label="'Export-Fortschritt ' + progressProzent + ' Prozent'">
                <div
                  class="progress-bar progress-bar-striped progress-bar-animated"
                  :style="{ width: progressProzent + '%' }"></div>
              </div>
              <p v-if="laedt && progressSchritteGesamt > 0" class="small text-body-secondary mb-0 mt-1">
                Schritt {{ progressSchritt }} von {{ progressSchritteGesamt }}
              </p>
            </div>
          </div>
          <div class="card-footer htbah-sl-pdf-export-modal-footer py-2">
            <div class="d-flex flex-wrap justify-content-end align-items-center gap-2">
              <button type="button" class="btn btn-outline-secondary" :disabled="laedt" @click="schliessen">
                Abbrechen
              </button>
              <template v-if="pdfBlobUrl">
                <button type="button" class="btn btn-outline-primary d-inline-flex align-items-center gap-1" @click="vorschauOeffnen">
                  <span class="material-symbols-outlined" aria-hidden="true" style="font-size:1.15rem;line-height:1;">visibility</span>
                  Vorschau
                </button>
                <button
                  type="button"
                  class="btn btn-success d-inline-flex align-items-center gap-1"
                  @click="downloadPdf">
                  <span class="material-symbols-outlined" aria-hidden="true" style="font-size:1.15rem;line-height:1;">download</span>
                  Herunterladen
                </button>
              </template>
              <button
                v-else
                type="button"
                class="btn btn-primary"
                :disabled="!kannExportieren"
                @click="exportStarten">
                {{ laedt ? 'Erstellt …' : 'PDF erstellen' }}
              </button>
            </div>
          </div>
        </div>

        <charakter-pdf-modal
          :offen="pdfVorschauOffen"
          :pdf-url="pdfBlobUrl"
          :dateiname="pdfDateiname"
          @schliessen="pdfVorschauSchliessen" />
      </div>
    `,
  };
})();
