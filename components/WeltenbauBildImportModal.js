window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

/** Max. Kantenlänge des exportierten Bildes (JPEG/WebP nach Zuschnitt). */
const WELTENBAU_EXPORT_MAX_KANTE = 2048;
const WELTENBAU_JPEG_QUALITAET = 0.84;
const WELTENBAU_WEBP_QUALITAET = 0.82;

function dateinameOhneEndung(name) {
  const roh = typeof name === 'string' ? name.trim() : '';
  const o = roh.replace(/\.[^/.]+$/, '');
  return o || 'Bild';
}

function canvasZuKomprimiertemDataUrl(canvas) {
  const webpProbe = canvas.toDataURL('image/webp', WELTENBAU_WEBP_QUALITAET);
  if (webpProbe.indexOf('data:image/webp') === 0) {
    return webpProbe;
  }
  return canvas.toDataURL('image/jpeg', WELTENBAU_JPEG_QUALITAET);
}

window.HTBAH_KOMPONENTEN.WeltenbauBildImportModal = {
  emits: ['fertig', 'abgebrochen', 'datei-import-fehler'],
  data() {
    return {
      tempObjectUrl: '',
      aktuellerDateiname: '',
      aktuelleDateigroesseBytes: null,
      cropper: null,
      bootstrapModal: null,
      schliessenOhneAbgebrochenEvent: false,
      bildLaedt: false,
      drehungGrad: 0,
      spiegelX: 1,
      spiegelY: 1,
    };
  },
  methods: {
    oeffnenMitDatei(file) {
      if (!file) {
        return;
      }
      this.schliessenOhneAbgebrochenEvent = false;
      this.cropperAufraeumen();
      this.revokeTempUrl();
      this.aktuellerDateiname = file.name || 'Bild';
      this.aktuelleDateigroesseBytes = Number.isFinite(file.size) && file.size > 0 ? Math.round(file.size) : null;
      this.bildLaedt = true;
      this.drehungGrad = 0;
      this.spiegelX = 1;
      this.spiegelY = 1;
      this.tempObjectUrl = URL.createObjectURL(file);
      const el = this.$refs.modalElement;
      if (!el) {
        return;
      }
      if (!this.bootstrapModal) {
        this.bootstrapModal = window.bootstrap.Modal.getOrCreateInstance(el);
      }
      this.bootstrapModal.show();
      this.$nextTick(() => {
        this.setzeModalEbeneNachOben();
        window.setTimeout(() => this.setzeModalEbeneNachOben(), 80);
      });
    },
    beimModalVersteckt() {
      this.cropperAufraeumen();
      this.revokeTempUrl();
      this.bildLaedt = false;
      this.aktuelleDateigroesseBytes = null;
      this.drehungGrad = 0;
      this.spiegelX = 1;
      this.spiegelY = 1;
      if (!this.schliessenOhneAbgebrochenEvent) {
        this.$emit('abgebrochen');
      }
      this.schliessenOhneAbgebrochenEvent = false;
    },
    onCropperBildGeladen() {
      this.bildLaedt = false;
      this.$nextTick(() => this.cropperInitialisieren());
    },
    async onCropperBildFehler() {
      this.bildLaedt = false;
      await window.HTBAH.ui.alert({
        titel: 'Bild konnte nicht geladen werden',
        beschreibung:
          'Das Bild konnte nicht geladen werden (Datei zu groß oder kein unterstütztes Format).',
      });
      this.schliessenOhneAbgebrochenEvent = true;
      this.$emit('datei-import-fehler');
      if (this.bootstrapModal) {
        this.bootstrapModal.hide();
      }
    },
    cropperInitialisieren() {
      if (this.cropper) {
        this.cropper.destroy();
        this.cropper = null;
      }
      const bildElement = this.$refs.cropperBildElement;
      if (!bildElement || !this.tempObjectUrl || !window.Cropper) {
        return;
      }
      this.cropper = new window.Cropper(bildElement, {
        aspectRatio: NaN,
        viewMode: 1,
        autoCropArea: 1,
        background: false,
        responsive: true,
      });
      this.cropper.rotateTo(this.drehungGrad);
      this.cropper.scaleX(this.spiegelX);
      this.cropper.scaleY(this.spiegelY);
    },
    setzeModalEbeneNachOben() {
      const modalElement = this.$refs.modalElement;
      if (modalElement) {
        modalElement.style.zIndex = '1095';
      }
      const backdrops = Array.from(document.querySelectorAll('.modal-backdrop'));
      const letzterBackdrop = backdrops.length ? backdrops[backdrops.length - 1] : null;
      if (letzterBackdrop) {
        letzterBackdrop.style.zIndex = '1090';
      }
    },
    drehen(delta) {
      if (!this.cropper) {
        return;
      }
      const neu = (this.drehungGrad + delta) % 360;
      this.drehungGrad = neu < 0 ? neu + 360 : neu;
      this.cropper.rotateTo(this.drehungGrad);
    },
    spiegelnHorizontal() {
      if (!this.cropper) {
        return;
      }
      this.spiegelX = this.spiegelX === 1 ? -1 : 1;
      this.cropper.scaleX(this.spiegelX);
    },
    spiegelnVertikal() {
      if (!this.cropper) {
        return;
      }
      this.spiegelY = this.spiegelY === 1 ? -1 : 1;
      this.cropper.scaleY(this.spiegelY);
    },
    async zuschnittSpeichern() {
      if (!this.cropper) {
        return;
      }
      let canvas;
      try {
        canvas = this.cropper.getCroppedCanvas({
          maxWidth: WELTENBAU_EXPORT_MAX_KANTE,
          maxHeight: WELTENBAU_EXPORT_MAX_KANTE,
          imageSmoothingQuality: 'high',
        });
      } catch {
        canvas = null;
      }
      if (!canvas) {
        await window.HTBAH.ui.alert({
          titel: 'Zuschnitt fehlgeschlagen',
          beschreibung:
            'Der Zuschnitt konnte nicht erstellt werden (Bild möglicherweise zu groß für den Browser).',
        });
        return;
      }
      let dataUrl;
      try {
        dataUrl = canvasZuKomprimiertemDataUrl(canvas);
      } catch {
        await window.HTBAH.ui.alert({
          titel: 'Komprimierung fehlgeschlagen',
          beschreibung: 'Das Bild konnte nicht komprimiert werden.',
        });
        return;
      }
      if (!dataUrl || !dataUrl.startsWith('data:image/')) {
        await window.HTBAH.ui.alert({
          titel: 'Ungültiges Bildformat',
          beschreibung: 'Ungültiges Bildformat nach Export.',
        });
        return;
      }
      const name = dateinameOhneEndung(this.aktuellerDateiname);
      this.schliessenOhneAbgebrochenEvent = true;
      this.$emit('fertig', { dataUrl, name, dateigroesseBytes: this.aktuelleDateigroesseBytes });
      if (this.bootstrapModal) {
        this.bootstrapModal.hide();
      }
    },
    abbrechenKlick() {
      if (this.bootstrapModal) {
        this.bootstrapModal.hide();
      }
    },
    cropperAufraeumen() {
      if (this.cropper) {
        this.cropper.destroy();
        this.cropper = null;
      }
    },
    revokeTempUrl() {
      if (this.tempObjectUrl) {
        URL.revokeObjectURL(this.tempObjectUrl);
        this.tempObjectUrl = '';
      }
    },
  },
  mounted() {
    const el = this.$refs.modalElement;
    if (el) {
      el.addEventListener('hidden.bs.modal', this.beimModalVersteckt);
    }
  },
  beforeUnmount() {
    const el = this.$refs.modalElement;
    if (el) {
      el.removeEventListener('hidden.bs.modal', this.beimModalVersteckt);
    }
    this.cropperAufraeumen();
    this.revokeTempUrl();
  },
  template: `
    <div
      class="modal fade"
      id="weltenbauBildImportModal"
      ref="modalElement"
      tabindex="-1"
      aria-labelledby="weltenbauBildImportModalLabel"
      aria-hidden="true">
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content shadow">
          <div class="modal-header">
            <h5 class="modal-title" id="weltenbauBildImportModalLabel">
              Karte zuschneiden und komprimieren
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Schließen"></button>
          </div>
          <div class="modal-body">
            <p class="small text-body-secondary mb-2">
              Wähle den sichtbaren Kartenausschnitt. Gespeichert wird maximal
              ${WELTENBAU_EXPORT_MAX_KANTE} px Kantenlänge als komprimiertes JPEG oder WebP
              (Transparenz geht dabei verloren).
            </p>
            <div class="d-flex flex-wrap gap-2 mb-2">
              <button type="button" class="btn btn-sm btn-outline-secondary" @click="drehen(-90)">
                90° links
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary" @click="drehen(90)">
                90° rechts
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary" @click="spiegelnHorizontal">
                Horizontal spiegeln
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary" @click="spiegelnVertikal">
                Vertikal spiegeln
              </button>
            </div>
            <div
              v-if="bildLaedt"
              class="text-center text-body-secondary small py-5">
              Bild wird geladen …
            </div>
            <div class="text-center mb-2 htbah-weltenbau-import-cropper-wrap">
              <!-- v-if statt v-show: leeres src="" würde sonst sofort @error auslösen -->
              <img
                v-if="tempObjectUrl"
                ref="cropperBildElement"
                :src="tempObjectUrl"
                alt="Karte zuschneiden"
                class="cropper-image"
                @load="onCropperBildGeladen"
                @error="onCropperBildFehler" />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="abbrechenKlick">
              Abbrechen
            </button>
            <button type="button" class="btn btn-primary" @click="zuschnittSpeichern">
              Übernehmen und speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
};
