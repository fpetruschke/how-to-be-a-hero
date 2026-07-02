window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

(function registerSpielmattenEditorModal() {
  const EXPORT_API = window.HTBAH_SHARED && window.HTBAH_SHARED.SpielmattenExport;
  const DIN_OPTIONEN = EXPORT_API && Array.isArray(EXPORT_API.DIN_OPTIONEN) ? EXPORT_API.DIN_OPTIONEN : ['A4'];

  function downloadBlob(blobUrl, dateiname) {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = dateiname || 'spielmatte';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function leseDateiAlsDataUrl(datei) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => reject(new Error('Bild konnte nicht geladen werden.'));
      reader.readAsDataURL(datei);
    });
  }

  window.HTBAH_KOMPONENTEN.SpielmattenEditorModal = {
    name: 'SpielmattenEditorModal',
    components: {
      CharakterPdfModal: window.HTBAH_KOMPONENTEN.CharakterPdfModal,
    },
    emits: ['schliessen'],
    data() {
      const format = EXPORT_API && EXPORT_API.DEFAULT_FORMAT ? EXPORT_API.DEFAULT_FORMAT : 'A4';
      return {
        offen: false,
        laedt: false,
        statusText: '',
        format,
        ausrichtung: 'portrait',
        gridLinienbreiteMm: 0.8,
        gridFarbe: '#d9d9d9',
        hintergrundModus: 'farbe',
        hintergrundFarbe: '#ffffff',
        hintergrundBildDataUrl: '',
        randModus: 'auto',
        randObenMm: 0,
        randUntenMm: 0,
        randLinksMm: 0,
        randRechtsMm: 0,
        keineAbgeschnittenenQuadrate: true,
        rasterAuswahl: 'frei',
        freieRasterkanteMm: 10,
        zulaessigeRasterkantenMm: [],
        pdfBlobUrl: '',
        pdfDateiname: '',
        pdfVorschauOffen: false,
      };
    },
    computed: {
      dinOptionen() {
        return DIN_OPTIONEN;
      },
      pdfViewerUrl() {
        if (!this.pdfBlobUrl || !window.HTBAH || typeof window.HTBAH.ermittleAssetUrl !== 'function') {
          return '';
        }
        const basis = window.HTBAH.ermittleAssetUrl('assets/pdfjs/web/viewer.html');
        return `${basis}?file=${encodeURIComponent(this.pdfBlobUrl)}#zoom=page-width`;
      },
      rasterkantePxHinweis() {
        if (!Number.isFinite(Number(this.effektiveRasterkanteMm))) {
          return '';
        }
        const mm = Number(this.effektiveRasterkanteMm);
        const pxBei150 = Math.round((mm * 150) / 25.4);
        return `~ ${pxBei150} px bei 150 DPI`;
      },
      effektiveRasterkanteMm() {
        if (this.rasterAuswahl === 'frei') {
          return Number(this.freieRasterkanteMm);
        }
        return Number(this.rasterAuswahl);
      },
      freieRasterkanteIstGueltig() {
        if (this.rasterAuswahl !== 'frei') {
          return true;
        }
        const frei = Number(this.freieRasterkanteMm);
        if (!Number.isFinite(frei) || frei <= 0) {
          return false;
        }
        return this.zulaessigeRasterkantenMm.some((wert) => Math.abs(Number(wert) - frei) < 0.0001);
      },
      freieRasterkanteErzeugtRestflaeche() {
        if (this.randModus === 'auto') {
          return false;
        }
        if (this.randModus === 'kein' && !this.effektiveKeineAbgeschnittenenQuadrate) {
          return false;
        }
        return this.rasterAuswahl === 'frei' && !this.freieRasterkanteIstGueltig;
      },
      effektiveRaenderMm() {
        if (!EXPORT_API || typeof EXPORT_API.berechneRaenderMm !== 'function') {
          return { oben: 0, unten: 0, links: 0, rechts: 0 };
        }
        return EXPORT_API.berechneRaenderMm(this.aktuelleExportEinstellungen());
      },
      effektiveKeineAbgeschnittenenQuadrate() {
        if (this.randModus === 'auto') {
          return true;
        }
        return this.keineAbgeschnittenenQuadrate !== false;
      },
      rasterAnalyse() {
        if (!EXPORT_API || !EXPORT_API.DIN_FORMATE_MM) {
          return null;
        }
        const fmt = EXPORT_API.DIN_FORMATE_MM[this.format];
        if (!fmt) {
          return null;
        }
        const istQuer = this.ausrichtung === 'landscape';
        const breiteMm = istQuer ? Number(fmt.heightMm) : Number(fmt.widthMm);
        const hoeheMm = istQuer ? Number(fmt.widthMm) : Number(fmt.heightMm);
        const raender = this.effektiveRaenderMm;
        const rasterMm = Number(this.effektiveRasterkanteMm);
        const linieMm = Math.max(0.1, Number(this.gridLinienbreiteMm) || 0.1);
        if (!Number.isFinite(breiteMm) || !Number.isFinite(hoeheMm) || !Number.isFinite(rasterMm) || rasterMm <= 0) {
          return null;
        }
        const nutzBreite = Math.max(0, breiteMm - raender.links - raender.rechts);
        const nutzHoehe = Math.max(0, hoeheMm - raender.oben - raender.unten);
        const raster = EXPORT_API.berechneRasterInhaltMm
          ? EXPORT_API.berechneRasterInhaltMm(
            nutzBreite,
            nutzHoehe,
            rasterMm,
            linieMm,
            this.effektiveKeineAbgeschnittenenQuadrate,
          )
          : null;
        if (!raster) {
          return null;
        }
        const restRechts = Math.max(0, nutzBreite - raster.breiteMm);
        const restUnten = Math.max(0, nutzHoehe - raster.hoeheMm);
        return {
          spalten: raster.spalten,
          zeilen: raster.zeilen,
          restRechts,
          restUnten,
          raender,
        };
      },
      kannExportieren() {
        return (
          !this.laedt &&
          Number.isFinite(Number(this.effektiveRasterkanteMm)) &&
          Number(this.effektiveRasterkanteMm) > 0
        );
      },
    },
    watch: {
      format() {
        this.aktualisiereZulaessigeRasterkanten();
        this.verwerfePdfVorschau();
      },
      ausrichtung() {
        this.aktualisiereZulaessigeRasterkanten();
        this.verwerfePdfVorschau();
      },
      randModus() {
        this.aktualisiereZulaessigeRasterkanten();
        this.verwerfePdfVorschau();
      },
      randObenMm() {
        this.aktualisiereZulaessigeRasterkanten();
        this.verwerfePdfVorschau();
      },
      randUntenMm() {
        this.aktualisiereZulaessigeRasterkanten();
        this.verwerfePdfVorschau();
      },
      randLinksMm() {
        this.aktualisiereZulaessigeRasterkanten();
        this.verwerfePdfVorschau();
      },
      randRechtsMm() {
        this.aktualisiereZulaessigeRasterkanten();
        this.verwerfePdfVorschau();
      },
      keineAbgeschnittenenQuadrate() {
        this.verwerfePdfVorschau();
      },
      rasterAuswahl() {
        this.verwerfePdfVorschau();
      },
      freieRasterkanteMm() {
        this.verwerfePdfVorschau();
      },
      gridLinienbreiteMm() {
        this.verwerfePdfVorschau();
      },
      gridFarbe() {
        this.verwerfePdfVorschau();
      },
      hintergrundFarbe() {
        this.verwerfePdfVorschau();
      },
      hintergrundBildDataUrl() {
        this.verwerfePdfVorschau();
      },
    },
    beforeUnmount() {
      this.revokePdfBlobUrl();
    },
    methods: {
      oeffne() {
        this.format = 'A4';
        this.ausrichtung = 'portrait';
        this.hintergrundModus = 'farbe';
        this.hintergrundFarbe = '#ffffff';
        this.hintergrundBildDataUrl = '';
        this.randModus = 'auto';
        this.randObenMm = 0;
        this.randUntenMm = 0;
        this.randLinksMm = 0;
        this.randRechtsMm = 0;
        this.gridLinienbreiteMm = 0.8;
        this.gridFarbe = '#d9d9d9';
        this.keineAbgeschnittenenQuadrate = true;
        this.rasterAuswahl = 'frei';
        this.freieRasterkanteMm = 10;
        this.offen = true;
        this.statusText = '';
        this.aktualisiereZulaessigeRasterkanten();
      },
      schliessen() {
        this.pdfVorschauOffen = false;
        this.revokePdfBlobUrl();
        this.offen = false;
        this.statusText = '';
        this.$emit('schliessen');
      },
      aktuelleExportEinstellungen() {
        const modus = this.hintergrundModus;
        const hintergrundFarbe =
          modus === 'farbe'
            ? this.hintergrundFarbe
            : modus === 'transparent'
              ? 'transparent'
              : 'transparent';
        const hintergrundBildDataUrl = modus === 'bild' ? this.hintergrundBildDataUrl : '';
        return {
          format: this.format,
          ausrichtung: this.ausrichtung,
          gridLinienbreiteMm: this.gridLinienbreiteMm,
          gridFarbe: this.gridFarbe,
          hintergrundFarbe,
          hintergrundBildDataUrl,
          randModus: this.randModus,
          randObenMm: Number(this.randObenMm),
          randUntenMm: Number(this.randUntenMm),
          randLinksMm: Number(this.randLinksMm),
          randRechtsMm: Number(this.randRechtsMm),
          keineAbgeschnittenenQuadrate: this.effektiveKeineAbgeschnittenenQuadrate,
          rasterkanteMm: Number(this.effektiveRasterkanteMm),
        };
      },
      aktualisiereZulaessigeRasterkanten() {
        if (!EXPORT_API || typeof EXPORT_API.listValidSquareSizesMm !== 'function') {
          this.zulaessigeRasterkantenMm = [5];
          this.rasterAuswahl = '5';
          return;
        }
        const liste = EXPORT_API.listValidSquareSizesMm(this.format, {
          minMm: 2,
          maxMm: 30,
          randModus: this.randModus,
          randObenMm: Number(this.randObenMm) || 0,
          randUntenMm: Number(this.randUntenMm) || 0,
          randLinksMm: Number(this.randLinksMm) || 0,
          randRechtsMm: Number(this.randRechtsMm) || 0,
          ausrichtung: this.ausrichtung,
        });
        this.zulaessigeRasterkantenMm = liste;
        if (!liste.length) {
          this.rasterAuswahl = '';
          return;
        }
        const zielDefault = 10;
        const aktuelle = Number(this.rasterAuswahl);
        if (
          this.rasterAuswahl !== 'frei' &&
          (
            !Number.isFinite(aktuelle) ||
            !liste.some((x) => Math.abs(Number(x) - aktuelle) < 0.0001)
          )
        ) {
          const bevorzugt = liste.find((x) => Math.abs(Number(x) - zielDefault) < 0.0001);
          this.rasterAuswahl = String(bevorzugt || liste[0]);
        }
      },
      formatRasterkanteLabel(mm) {
        if (!EXPORT_API || typeof EXPORT_API.formatiereMm !== 'function') {
          return `${mm} mm`;
        }
        return `${EXPORT_API.formatiereMm(mm)} mm`;
      },
      formatRasterkanteWert(mm) {
        if (!EXPORT_API || typeof EXPORT_API.formatiereMm !== 'function') {
          return `${mm}`;
        }
        return EXPORT_API.formatiereMm(mm);
      },
      revokePdfBlobUrl() {
        if (this.pdfBlobUrl) {
          URL.revokeObjectURL(this.pdfBlobUrl);
          this.pdfBlobUrl = '';
        }
      },
      verwerfePdfVorschau() {
        if (!this.pdfBlobUrl) {
          return;
        }
        this.revokePdfBlobUrl();
        this.pdfDateiname = '';
      },
      async onHintergrundBildGewaehlt(evt) {
        const datei = evt && evt.target && evt.target.files && evt.target.files[0] ? evt.target.files[0] : null;
        if (!datei) {
          return;
        }
        try {
          this.hintergrundBildDataUrl = await leseDateiAlsDataUrl(datei);
        } catch (error) {
          this.statusText = error && error.message ? error.message : 'Hintergrundbild konnte nicht geladen werden.';
        } finally {
          evt.target.value = '';
        }
      },
      hintergrundBildEntfernen() {
        this.hintergrundBildDataUrl = '';
      },
      async pngExportieren() {
        if (!EXPORT_API || typeof EXPORT_API.erzeugeSpielmattenPng !== 'function' || !this.kannExportieren) {
          return;
        }
        this.laedt = true;
        this.statusText = '';
        try {
          const { blob, dateiname } = await EXPORT_API.erzeugeSpielmattenPng(this.aktuelleExportEinstellungen());
          const url = URL.createObjectURL(blob);
          downloadBlob(url, dateiname);
          window.setTimeout(() => URL.revokeObjectURL(url), 0);
          this.statusText = 'PNG exportiert.';
        } catch (error) {
          this.statusText = error && error.message ? error.message : 'PNG-Export fehlgeschlagen.';
        } finally {
          this.laedt = false;
        }
      },
      async pdfExportieren() {
        if (!EXPORT_API || typeof EXPORT_API.erzeugeSpielmattenPdf !== 'function' || !this.kannExportieren) {
          return;
        }
        this.laedt = true;
        this.statusText = '';
        try {
          const { blob, dateiname } = await EXPORT_API.erzeugeSpielmattenPdf(this.aktuelleExportEinstellungen());
          const url = URL.createObjectURL(blob);
          downloadBlob(url, dateiname);
          window.setTimeout(() => URL.revokeObjectURL(url), 0);
          this.statusText = 'PDF exportiert.';
        } catch (error) {
          this.statusText = error && error.message ? error.message : 'PDF-Export fehlgeschlagen.';
        } finally {
          this.laedt = false;
        }
      },
      async pdfVorschauOeffnen() {
        if (!EXPORT_API || typeof EXPORT_API.erzeugeSpielmattenPdf !== 'function' || !this.kannExportieren) {
          return;
        }
        this.laedt = true;
        this.statusText = '';
        try {
          const { blob, dateiname } = await EXPORT_API.erzeugeSpielmattenPdf(this.aktuelleExportEinstellungen());
          const url = URL.createObjectURL(blob);
          this.revokePdfBlobUrl();
          this.pdfBlobUrl = url;
          this.pdfDateiname = dateiname;
          this.pdfVorschauOffen = true;
          this.statusText = 'PDF-Vorschau geöffnet.';
        } catch (error) {
          this.statusText = error && error.message ? error.message : 'PDF-Vorschau fehlgeschlagen.';
        } finally {
          this.laedt = false;
        }
      },
      pdfVorschauSchliessen() {
        this.pdfVorschauOffen = false;
      },
      pdfHerunterladen() {
        if (!this.pdfBlobUrl) {
          return;
        }
        downloadBlob(this.pdfBlobUrl, this.pdfDateiname || 'spielmatte.pdf');
      },
    },
    template: `
      <div v-if="offen" class="regelwerk-modal-layer htbah-sl-pdf-export-modal-layer">
        <div
          class="regelwerk-modal-window card shadow-lg htbah-sl-pdf-export-modal-window htbah-spielmatten-modal-window"
          role="dialog"
          aria-modal="true"
          aria-label="Spielmatten-Editor">
          <div class="regelwerk-modal-header d-flex justify-content-between align-items-center p-2 border-bottom">
            <h6 class="mb-0 d-flex align-items-center gap-2">
              <span aria-hidden="true">🧩</span>
              <span>Spielmatten-Editor</span>
            </h6>
            <button type="button" class="btn-close" aria-label="Schließen" @click="schliessen"></button>
          </div>
          <div class="card-body pt-2 pb-1 overflow-auto">
            <div class="d-flex flex-column gap-3">
              <div class="card p-0 htbah-spielmatten-sektion shadow-sm">
                <div class="card-header py-2">
                  <h6 class="mb-0 small fw-semibold">Blatt</h6>
                </div>
                <div class="card-body py-2">
                  <div class="row g-2">
                    <div class="col-12 col-md-4">
                      <label class="form-label small mb-1">Format</label>
                      <select v-model="format" class="form-select form-select-sm">
                        <option v-for="opt in dinOptionen" :key="opt" :value="opt">DIN {{ opt }}</option>
                      </select>
                    </div>
                    <div class="col-12 col-md-4">
                      <label class="form-label small mb-1 d-block">Ausrichtung</label>
                      <div class="btn-group btn-group-sm w-100" role="group" aria-label="Ausrichtung">
                        <input id="spielmatten-ausrichtung-hoch" v-model="ausrichtung" class="btn-check" type="radio" value="portrait" />
                        <label class="btn btn-outline-secondary" for="spielmatten-ausrichtung-hoch">Hochformat</label>
                        <input id="spielmatten-ausrichtung-quer" v-model="ausrichtung" class="btn-check" type="radio" value="landscape" />
                        <label class="btn btn-outline-secondary" for="spielmatten-ausrichtung-quer">Querformat</label>
                      </div>
                    </div>
                    <div class="col-12 col-md-4">
                      <label class="form-label small mb-1 d-block">Hintergrund</label>
                      <div class="btn-group btn-group-sm w-100 mb-2" role="group" aria-label="Hintergrund-Modus">
                        <input id="spielmatten-bg-farbe" v-model="hintergrundModus" class="btn-check" type="radio" value="farbe" />
                        <label class="btn btn-outline-secondary" for="spielmatten-bg-farbe">Farbe</label>
                        <input id="spielmatten-bg-transparent" v-model="hintergrundModus" class="btn-check" type="radio" value="transparent" />
                        <label class="btn btn-outline-secondary" for="spielmatten-bg-transparent">Transparenz</label>
                        <input id="spielmatten-bg-bild" v-model="hintergrundModus" class="btn-check" type="radio" value="bild" />
                        <label class="btn btn-outline-secondary" for="spielmatten-bg-bild">Bild</label>
                      </div>
                      <div v-if="hintergrundModus === 'farbe'" class="d-flex gap-2">
                        <input v-model="hintergrundFarbe" class="form-control form-control-color form-control-sm" type="color" />
                      </div>
                      <div v-else class="d-flex flex-wrap gap-2">
                        <template v-if="hintergrundModus === 'bild'">
                          <button type="button" class="btn btn-outline-secondary btn-sm" @click="$refs.bgInput.click()">Bild wählen</button>
                          <button v-if="hintergrundBildDataUrl" type="button" class="btn btn-outline-danger btn-sm" @click="hintergrundBildEntfernen">Bild entfernen</button>
                          <span v-if="hintergrundBildDataUrl" class="small text-body-secondary align-self-center">Bild geladen</span>
                        </template>
                        <template v-else>
                          <span class="small text-body-secondary align-self-center">Transparenter Hintergrund aktiv</span>
                        </template>
                      </div>
                      <input ref="bgInput" type="file" class="d-none" accept="image/*" @change="onHintergrundBildGewaehlt" />
                    </div>
                    <div class="col-12">
                      <label class="form-label small mb-1 d-block">Rand</label>
                      <div class="btn-group btn-group-sm mb-2" role="group" aria-label="Rand-Modus">
                        <input id="spielmatten-rand-auto" v-model="randModus" class="btn-check" type="radio" value="auto" />
                        <label class="btn btn-outline-secondary" for="spielmatten-rand-auto">Automatisch</label>
                        <input id="spielmatten-rand-kein" v-model="randModus" class="btn-check" type="radio" value="kein" />
                        <label class="btn btn-outline-secondary" for="spielmatten-rand-kein">Kein Rand</label>
                        <input id="spielmatten-rand-manuell" v-model="randModus" class="btn-check" type="radio" value="manuell" />
                        <label class="btn btn-outline-secondary" for="spielmatten-rand-manuell">Manuell</label>
                      </div>
                      <div v-if="randModus === 'manuell'" class="row g-2 htbah-spielmatten-rand-manuell">
                        <div class="col-6 col-md-3">
                          <label class="form-label small mb-1" for="spielmatten-rand-oben">Oben</label>
                          <div class="input-group input-group-sm">
                            <input id="spielmatten-rand-oben" v-model.number="randObenMm" class="form-control" type="number" min="0" max="40" step="0.1" />
                            <span class="input-group-text">mm</span>
                          </div>
                        </div>
                        <div class="col-6 col-md-3">
                          <label class="form-label small mb-1" for="spielmatten-rand-unten">Unten</label>
                          <div class="input-group input-group-sm">
                            <input id="spielmatten-rand-unten" v-model.number="randUntenMm" class="form-control" type="number" min="0" max="40" step="0.1" />
                            <span class="input-group-text">mm</span>
                          </div>
                        </div>
                        <div class="col-6 col-md-3">
                          <label class="form-label small mb-1" for="spielmatten-rand-links">Links</label>
                          <div class="input-group input-group-sm">
                            <input id="spielmatten-rand-links" v-model.number="randLinksMm" class="form-control" type="number" min="0" max="40" step="0.1" />
                            <span class="input-group-text">mm</span>
                          </div>
                        </div>
                        <div class="col-6 col-md-3">
                          <label class="form-label small mb-1" for="spielmatten-rand-rechts">Rechts</label>
                          <div class="input-group input-group-sm">
                            <input id="spielmatten-rand-rechts" v-model.number="randRechtsMm" class="form-control" type="number" min="0" max="40" step="0.1" />
                            <span class="input-group-text">mm</span>
                          </div>
                        </div>
                      </div>
                      <div v-else-if="randModus === 'auto' && rasterAnalyse" class="small text-body-secondary">
                        Berechneter Rand: oben {{ formatRasterkanteLabel(rasterAnalyse.raender.oben) }},
                        unten {{ formatRasterkanteLabel(rasterAnalyse.raender.unten) }},
                        links {{ formatRasterkanteLabel(rasterAnalyse.raender.links) }},
                        rechts {{ formatRasterkanteLabel(rasterAnalyse.raender.rechts) }}
                      </div>
                      <div v-else-if="randModus === 'kein'" class="small text-body-secondary">
                        Das Raster beginnt am Blattrand.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="card p-0 htbah-spielmatten-sektion shadow-sm">
                <div class="card-header py-2">
                  <h6 class="mb-0 small fw-semibold">Grid</h6>
                </div>
                <div class="card-body py-2">
                  <div class="row g-2 align-items-end htbah-spielmatten-grid-zeile">
                    <div class="col-6 col-md-3">
                      <label class="form-label small mb-1">Linienbreite</label>
                      <div class="input-group input-group-sm">
                        <input v-model.number="gridLinienbreiteMm" class="form-control" type="number" min="0.1" max="3" step="0.1" />
                        <span class="input-group-text">mm</span>
                      </div>
                    </div>
                    <div class="col-6 col-md-auto">
                      <label class="form-label small mb-1">Farbe</label>
                      <input v-model="gridFarbe" class="form-control form-control-color form-control-sm htbah-spielmatten-grid-farbe" type="color" />
                    </div>
                    <div class="col-12 col-md">
                      <label class="form-label small mb-1">Quadrat-Größe</label>
                      <div class="input-group input-group-sm htbah-spielmatten-raster-input-group">
                        <select v-model="rasterAuswahl" class="form-select htbah-spielmatten-raster-select" :disabled="!zulaessigeRasterkantenMm.length">
                          <option v-for="mm in zulaessigeRasterkantenMm" :key="mm" :value="String(mm)">{{ formatRasterkanteWert(mm) }}</option>
                          <option value="frei">Frei angeben</option>
                        </select>
                        <input
                          v-if="rasterAuswahl === 'frei'"
                          v-model.number="freieRasterkanteMm"
                          class="form-control htbah-spielmatten-raster-frei-input"
                          type="number"
                          min="0.001"
                          max="999.999"
                          step="0.001"
                          placeholder="Wert" />
                        <span class="input-group-text htbah-spielmatten-raster-unit">mm</span>
                      </div>
                    </div>
                  </div>
                  <div v-if="rasterAuswahl === 'frei'" class="mt-2">
                    <div v-if="freieRasterkanteErzeugtRestflaeche" class="small text-warning mt-1">
                      Diese freie Größe erzeugt bei diesem DIN-Format und dem gewählten Rand Restfläche bzw. Anschnitt.
                    </div>
                  </div>
                  <div class="small text-body-secondary mt-1" v-if="rasterkantePxHinweis">{{ rasterkantePxHinweis }}</div>
                  <div v-if="!zulaessigeRasterkantenMm.length" class="small text-warning mt-1">
                    Für diese Kombination aus Format und Rand gibt es keine gültigen Rasterkanten.
                  </div>
                  <div v-if="rasterAnalyse" class="small text-body-secondary mt-1">
                    Vollständige Kästchen: {{ rasterAnalyse.spalten }} × {{ rasterAnalyse.zeilen }}
                    <template v-if="randModus !== 'auto' && (rasterAnalyse.restRechts > 0 || rasterAnalyse.restUnten > 0)">
                      · Restfläche im Raster: {{ formatRasterkanteLabel(rasterAnalyse.restRechts) }} rechts,
                      {{ formatRasterkanteLabel(rasterAnalyse.restUnten) }} unten
                    </template>
                  </div>
                  <div v-if="randModus === 'kein' || randModus === 'manuell'" class="form-check mt-2">
                    <input
                      id="spielmatten-kein-anschnitt"
                      v-model="keineAbgeschnittenenQuadrate"
                      class="form-check-input"
                      type="checkbox" />
                    <label class="form-check-label small" for="spielmatten-kein-anschnitt">
                      Keine abgeschnittenen Quadrate
                    </label>
                  </div>
                  <div v-else class="small text-body-secondary mt-2">
                    Vollständige Quadrate werden zentriert; die Restfläche wird gleichmäßig als Rand verteilt.
                  </div>
                </div>
              </div>
            </div>
            <div v-if="statusText" class="small mt-2 text-body-secondary">{{ statusText }}</div>
          </div>
          <div class="regelwerk-modal-header d-flex justify-content-between align-items-center p-2 border-top htbah-spielmatten-footer">
            <button type="button" class="btn btn-outline-secondary btn-sm htbah-spielmatten-footer-btn" @click="schliessen">Schließen</button>
            <div class="d-flex align-items-center gap-2 htbah-spielmatten-footer-actions">
              <button type="button" class="btn btn-outline-primary btn-sm htbah-spielmatten-footer-btn" :disabled="!kannExportieren" @click="pngExportieren">PNG exportieren</button>
              <button type="button" class="btn btn-outline-primary btn-sm htbah-spielmatten-footer-btn" :disabled="!kannExportieren" @click="pdfVorschauOeffnen">PDF-Vorschau</button>
              <button type="button" class="btn btn-primary btn-sm htbah-spielmatten-footer-btn" :disabled="!kannExportieren" @click="pdfExportieren">PDF exportieren</button>
            </div>
          </div>
          <charakter-pdf-modal
            :offen="pdfVorschauOffen"
            :pdf-url="pdfBlobUrl"
            :dateiname="pdfDateiname || 'spielmatte.pdf'"
            titel="Spielmatte"
            @schliessen="pdfVorschauSchliessen" />
        </div>
      </div>
    `,
  };
})();
