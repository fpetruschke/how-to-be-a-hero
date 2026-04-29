window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};
const CHARAKTERBILD_EXPORT_MAX_KANTE = 1600;

function charakterCanvasZuDataUrl(canvas) {
  if (!canvas) {
    return '';
  }
  const breite = Number(canvas.width) || 0;
  const hoehe = Number(canvas.height) || 0;
  if (breite <= 0 || hoehe <= 0) {
    return '';
  }
  const groessteKante = Math.max(breite, hoehe);
  if (groessteKante <= CHARAKTERBILD_EXPORT_MAX_KANTE) {
    return canvas.toDataURL('image/jpeg', 0.9);
  }
  const faktor = CHARAKTERBILD_EXPORT_MAX_KANTE / groessteKante;
  const zielBreite = Math.max(1, Math.round(breite * faktor));
  const zielHoehe = Math.max(1, Math.round(hoehe * faktor));
  const skaliert = document.createElement('canvas');
  skaliert.width = zielBreite;
  skaliert.height = zielHoehe;
  const ctx = skaliert.getContext('2d');
  if (!ctx) {
    return canvas.toDataURL('image/jpeg', 0.9);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, 0, 0, zielBreite, zielHoehe);
  return skaliert.toDataURL('image/jpeg', 0.9);
}

window.HTBAH_KOMPONENTEN.CharakterBildModal = {
  components: {
    BildCropperModal: window.HTBAH_KOMPONENTEN.BildCropperModal,
  },
  props: {
    charakterBild: { type: String, default: '' },
  },
  emits: ['update:charakterBild'],
  data() {
    return {
      bildVerwaltungModal: null,
    };
  },
  methods: {
    oeffnen() {
      const modalElement = this.$refs.bildVerwaltungModalElement;
      if (!modalElement) {
        return;
      }
      this.bildVerwaltungModal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
      this.bildVerwaltungModal.show();
    },
    async bildDateiAusgewaehlt(event) {
      const datei = event.target.files && event.target.files[0];
      if (!datei) {
        return;
      }
      await this.oeffnenCropperMitDatei(datei);
      event.target.value = '';
    },
    async oeffnenMitDatei(datei) {
      this.oeffnen();
      await this.oeffnenCropperMitDatei(datei);
    },
    async oeffnenCropperMitDatei(datei) {
      if (!datei || typeof datei !== 'object' || !String(datei.type || '').startsWith('image/')) {
        await window.HTBAH.ui.alert({
          titel: 'Ungültige Datei',
          beschreibung: 'Bitte wähle eine Bilddatei aus.',
        });
        return false;
      }
      const cropperModal = this.$refs.cropperModal;
      if (!cropperModal || typeof cropperModal.oeffnenMitDatei !== 'function') {
        return false;
      }
      cropperModal.oeffnenMitDatei(datei);
      return true;
    },
    zuschnittMitAktuellemBildStarten() {
      if (!this.charakterBild) {
        return;
      }
      const cropperModal = this.$refs.cropperModal;
      if (!cropperModal || typeof cropperModal.oeffnenMitQuelle !== 'function') {
        return;
      }
      cropperModal.oeffnenMitQuelle({ src: this.charakterBild });
    },
    async zugeschnittenesBildSpeichern(canvas) {
      const dataUrl = charakterCanvasZuDataUrl(canvas);
      if (!dataUrl) {
        await window.HTBAH.ui.alert({
          titel: 'Zuschnitt fehlgeschlagen',
          beschreibung: 'Das Bild konnte nicht zugeschnitten werden.',
        });
        return false;
      }
      this.$emit('update:charakterBild', dataUrl);
      return true;
    },
    async charakterBildEntfernen() {
      if (!this.charakterBild) {
        return;
      }
      const bestaetigt = await window.HTBAH.ui.confirm({
        titel: 'Charakterbild entfernen?',
        beschreibung: 'Charakterbild wirklich entfernen?',
        bestaetigenText: 'Entfernen',
        bestaetigenButtonClass: 'btn-danger',
        warnhinweisAnzeigen: true,
      });
      if (!bestaetigt) {
        return;
      }
      this.$emit('update:charakterBild', '');
    },
  },
  template: `
    <div>
      <div
        class="modal fade"
        id="charakterBildVerwaltungModal"
        ref="bildVerwaltungModalElement"
        tabindex="-1"
        aria-labelledby="charakterBildVerwaltungLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content shadow">
            <div class="modal-header">
              <h5 class="modal-title" id="charakterBildVerwaltungLabel">
                Charakterbild verwalten
              </h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Schließen"></button>
            </div>
            <div class="modal-body">
              <div class="text-center mb-3 charakterbild-modal-bildbereich">
                <img
                  v-if="charakterBild"
                  :src="charakterBild"
                  alt="Charakterbild Vorschau"
                  class="charakterbild-vorschau" />
                <div v-else class="charakterbild-platzhalter">
                  <span class="material-symbols-outlined" aria-hidden="true">person</span>
                </div>
              </div>

              <div class="form-floating mb-2">
                <input
                  id="ce-charakterbild-datei"
                  ref="bildInputElement"
                  class="form-control"
                  type="file"
                  accept="image/*"
                  @change="bildDateiAusgewaehlt" />
                <label for="ce-charakterbild-datei">Bilddatei wählen</label>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-outline-primary"
                :disabled="!charakterBild"
                @click="zuschnittMitAktuellemBildStarten">
                Aktuelles Bild zuschneiden
              </button>
              <button
                type="button"
                class="btn btn-outline-danger"
                :disabled="!charakterBild"
                @click="charakterBildEntfernen">
                Bild entfernen
              </button>
              <button
                type="button"
                class="btn btn-secondary"
                data-bs-dismiss="modal">
                Schließen
              </button>
            </div>
          </div>
        </div>
      </div>

      <bild-cropper-modal
        ref="cropperModal"
        modal-id="charakterBildCropperModal"
        modal-class="htbah-charakter-bild-cropper-modal"
        titel="Bild zuschneiden"
        speichern-text="Zuschnitt speichern"
        bild-alt-text="Bild zuschneiden"
        dialog-class="modal-lg"
        :on-speichern="zugeschnittenesBildSpeichern" />
    </div>
  `,
};
