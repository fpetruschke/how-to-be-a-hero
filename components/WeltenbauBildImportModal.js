window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};
const HTBAH_WB_REFACTOR_UTILS = window.HTBAH_SHARED && window.HTBAH_SHARED.RefactorUtils;

/** Max. Kantenlänge des exportierten Bildes (JPEG/WebP nach Zuschnitt). */
const WELTENBAU_EXPORT_MAX_KANTE = 2048;
const WELTENBAU_JPEG_QUALITAET = 0.84;
const WELTENBAU_WEBP_QUALITAET = 0.82;

function canvasSkalierenMaxKante(inputCanvas, maxKante) {
  if (!inputCanvas || !Number.isFinite(maxKante) || maxKante <= 0) {
    return inputCanvas;
  }
  const breite = Number(inputCanvas.width) || 0;
  const hoehe = Number(inputCanvas.height) || 0;
  if (breite <= 0 || hoehe <= 0) {
    return inputCanvas;
  }
  const groessteKante = Math.max(breite, hoehe);
  if (groessteKante <= maxKante) {
    return inputCanvas;
  }
  const faktor = maxKante / groessteKante;
  const zielBreite = Math.max(1, Math.round(breite * faktor));
  const zielHoehe = Math.max(1, Math.round(hoehe * faktor));
  const canvas = document.createElement('canvas');
  canvas.width = zielBreite;
  canvas.height = zielHoehe;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return inputCanvas;
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(inputCanvas, 0, 0, zielBreite, zielHoehe);
  return canvas;
}

function canvasZuKomprimiertemDataUrl(canvas) {
  const webpProbe = canvas.toDataURL('image/webp', WELTENBAU_WEBP_QUALITAET);
  if (webpProbe.indexOf('data:image/webp') === 0) {
    return webpProbe;
  }
  return canvas.toDataURL('image/jpeg', WELTENBAU_JPEG_QUALITAET);
}

window.HTBAH_KOMPONENTEN.WeltenbauBildImportModal = {
  components: {
    BildCropperModal: window.HTBAH_KOMPONENTEN.BildCropperModal,
  },
  emits: ['fertig', 'abgebrochen', 'datei-import-fehler'],
  data() {
    return {
      aktuellerDateiname: '',
      aktuelleDateigroesseBytes: null,
    };
  },
  computed: {
    beschreibungText() {
      return `Wähle den sichtbaren Bildausschnitt. Gespeichert wird maximal ${WELTENBAU_EXPORT_MAX_KANTE} px Kantenlänge als komprimiertes JPEG oder WebP (Transparenz geht dabei verloren).`;
    },
  },
  methods: {
    oeffnenMitDatei(file) {
      if (!file) {
        return;
      }
      this.aktuellerDateiname = file.name || 'Bild';
      this.aktuelleDateigroesseBytes = Number.isFinite(file.size) && file.size > 0 ? Math.round(file.size) : null;
      const modal = this.$refs.cropperModal;
      if (!modal || typeof modal.oeffnenMitDatei !== 'function') {
        return;
      }
      modal.oeffnenMitDatei(file);
    },
    async onBildFehler() {
      this.$emit('datei-import-fehler');
      return false;
    },
    onAbgebrochen() {
      this.aktuelleDateigroesseBytes = null;
      this.$emit('abgebrochen');
    },
    async onSpeichern(canvas) {
      let exportCanvas = canvasSkalierenMaxKante(canvas, WELTENBAU_EXPORT_MAX_KANTE);
      if (!exportCanvas) {
        await window.HTBAH.ui.alert({
          titel: 'Zuschnitt fehlgeschlagen',
          beschreibung:
            'Der Zuschnitt konnte nicht erstellt werden (Bild möglicherweise zu groß für den Browser).',
        });
        return false;
      }
      let dataUrl;
      try {
        dataUrl = canvasZuKomprimiertemDataUrl(exportCanvas);
      } catch {
        await window.HTBAH.ui.alert({
          titel: 'Komprimierung fehlgeschlagen',
          beschreibung: 'Das Bild konnte nicht komprimiert werden.',
        });
        return false;
      }
      if (!dataUrl || !dataUrl.startsWith('data:image/')) {
        await window.HTBAH.ui.alert({
          titel: 'Ungültiges Bildformat',
          beschreibung: 'Ungültiges Bildformat nach Export.',
        });
        return false;
      }
      const name = HTBAH_WB_REFACTOR_UTILS
        ? HTBAH_WB_REFACTOR_UTILS.dateinameOhneEndung(this.aktuellerDateiname, 'Bild')
        : ((typeof this.aktuellerDateiname === 'string' ? this.aktuellerDateiname.trim() : '').replace(/\.[^/.]+$/, '') || 'Bild');
      this.$emit('fertig', { dataUrl, name, dateigroesseBytes: this.aktuelleDateigroesseBytes });
      this.aktuelleDateigroesseBytes = null;
      return true;
    },
  },
  template: `
    <bild-cropper-modal
      ref="cropperModal"
      modal-id="weltenbauBildImportModal"
      modal-class="htbah-weltenbau-bild-import-modal"
      titel="Bild zuschneiden und komprimieren"
      :beschreibung="beschreibungText"
      speichern-text="Übernehmen und speichern"
      bild-alt-text="Bild zuschneiden"
      dialog-class="modal-lg"
      :on-speichern="onSpeichern"
      :on-bild-fehler="onBildFehler"
      @abgebrochen="onAbgebrochen" />
  `,
};
